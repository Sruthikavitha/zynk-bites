import type { Request, Response } from 'express';
import { getAllDishes } from '../models/dishQueries.js';
import {
  getDailyMealsByCustomerId,
  getDailyMealById,
  updateDailyMeal,
} from '../models/dailyMealQueries.js';
import {
  getOrderByDailyMealId,
  getOrdersByCustomerId,
  getOrderById,
  updateOrder,
} from '../models/orderQueries.js';
import { getActiveSubscription } from '../models/subscriptionQueries.js';
import { getUserById, updateUser } from '../models/userQueries.js';
import {
  createReview,
  getReviewByOrderId,
  getReviewsByChefId,
} from '../models/reviewQueries.js';
import { ensureUpcomingMealsForCustomer, refreshDeliveredOrdersForCustomer } from '../services/mealPlannerService.js';
import { notifyChefMenuUpdate } from '../services/notificationService.js';
import { getCutoffForDate, isBeforeMealCutoff } from '../utils/mealSchedule.js';
import { sampleMeals } from '../data/sampleCatalog.js';

const buildAddressFromSubscription = (subscription: any) => ({
  street: subscription.deliveryAddress,
  city: subscription.city,
  state: '',
  zipCode: subscription.postalCode,
});

const mapDailyMeal = (meal: any) => ({
  id: String(meal.id),
  date: meal.date,
  mealTime: meal.mealSlot,
  mealSlot: meal.mealSlot,
  subscriptionId: String(meal.subscriptionId),
  customerId: String(meal.customerId),
  originalMealId: meal.originalMealId,
  currentMealId: meal.currentMealId,
  isSkipped: meal.isSkipped,
  isSwapped: meal.isSwapped,
  status: meal.status,
  deliveryAddressType: meal.deliveryAddressType || undefined,
  deliveryAddressOverride: meal.deliveryAddressOverride || undefined,
  alternativeMealIds: Array.isArray(meal.alternativeMealIds) ? meal.alternativeMealIds : [],
  isFinalized: meal.isFinalized,
});

const resolveMealName = (mealId: string, dishes: any[]) => {
  const dishMatch = dishes.find((dish) => String(dish.id) === String(mealId));
  if (dishMatch) return dishMatch.name;
  const sample = sampleMeals.find((meal) => meal.id === mealId);
  return sample?.name || 'Chef Special';
};

const mapOrder = (order: any, context: { chefName?: string; customerName?: string; deliveryAddress?: any; deliveryAddressType?: string }) => ({
  id: String(order.id),
  dailyMealId: String(order.dailyMealId),
  customerId: String(order.customerId),
  chefId: order.chefId ? String(order.chefId) : undefined,
  chefName: context.chefName || 'Chef',
  mealId: order.mealId,
  mealName: order.mealName,
  customerName: context.customerName || 'Customer',
  deliveryAddress: context.deliveryAddress || { street: '', city: '', state: '', zipCode: '' },
  deliveryAddressType: context.deliveryAddressType,
  status: order.status,
  statusHistory: Array.isArray(order.statusHistory) ? order.statusHistory : [],
  date: order.date,
  mealTime: order.mealTime,
  deliveredAt: order.deliveredAt ? new Date(order.deliveredAt).toISOString() : undefined,
  isReviewed: order.isReviewed,
});

const mapReview = (review: any) => ({
  id: String(review.id),
  orderId: String(review.orderId),
  customerId: String(review.customerId),
  chefId: String(review.chefId),
  mealId: review.mealId,
  mealName: review.mealName,
  rating: review.rating,
  comment: review.comment || undefined,
  createdAt: review.createdAt ? new Date(review.createdAt).toISOString() : new Date().toISOString(),
  isHidden: review.isHidden,
  hiddenReason: review.hiddenReason || undefined,
});

const requireCustomer = (req: Request, res: Response): number | null => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return null;
  }
  return req.user.userId;
};

const notifyChefOfMealChange = async (
  customerId: number,
  meal: any,
  changeType: 'skip' | 'unskip' | 'swap' | 'address_change',
  mealName?: string | null
) => {
  const [subscription, customerUser, order] = await Promise.all([
    getActiveSubscription(customerId),
    getUserById(customerId),
    getOrderByDailyMealId(meal.id),
  ]);

  const chefId = order?.chefId || subscription?.chefId;
  if (!chefId) return;

  await notifyChefMenuUpdate({
    chefId,
    customerId,
    customerName: customerUser?.fullName,
    date: meal.date,
    changeType,
    mealName: mealName || order?.mealName || null,
  });
};

export const getCustomerMeals = async (req: Request, res: Response) => {
  try {
    const customerId = requireCustomer(req, res);
    if (!customerId) return;

    await ensureUpcomingMealsForCustomer(customerId);
    const meals = await getDailyMealsByCustomerId(customerId);
    res.json({ success: true, meals: meals.map(mapDailyMeal) });
  } catch (error: any) {
    console.error('Get customer meals error:', error);
    res.status(500).json({ success: false, message: 'Failed to load meals' });
  }
};

export const skipCustomerMeal = async (req: Request, res: Response) => {
  try {
    const customerId = requireCustomer(req, res);
    if (!customerId) return;

    const mealId = Number(req.params.id);
    if (!mealId) {
      res.status(400).json({ success: false, message: 'Invalid meal id' });
      return;
    }

    const meal = await getDailyMealById(mealId);
    if (!meal) {
      res.status(404).json({ success: false, message: 'Meal not found' });
      return;
    }
    if (meal.customerId !== customerId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    if (!isBeforeMealCutoff(meal.date)) {
      res.status(423).json({
        success: false,
        message: 'Meal locked. Skip allowed only before 8 PM the day before delivery.',
        nextAvailableAt: getCutoffForDate(meal.date).toISOString(),
      });
      return;
    }

    if (meal.isFinalized) {
      res.status(400).json({ success: false, message: 'Meal is already finalized' });
      return;
    }
    if (meal.isSkipped) {
      res.status(400).json({ success: false, message: 'Meal already skipped' });
      return;
    }

    const updated = await updateDailyMeal(meal.id, { isSkipped: true });

    const order = await getOrderByDailyMealId(meal.id);
    if (order) {
      const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      await updateOrder(order.id, {
        status: 'pending',
        statusHistory: [...history, { status: 'pending', timestamp: new Date().toISOString() }],
      });
    }

    if (!updated) {
      res.status(500).json({ success: false, message: 'Failed to update meal' });
      return;
    }
    await notifyChefOfMealChange(customerId, meal, 'skip');
    res.json({ success: true, message: 'Meal skipped successfully', meal: mapDailyMeal(updated) });
  } catch (error: any) {
    console.error('Skip meal error:', error);
    res.status(500).json({ success: false, message: 'Failed to skip meal' });
  }
};

export const unskipCustomerMeal = async (req: Request, res: Response) => {
  try {
    const customerId = requireCustomer(req, res);
    if (!customerId) return;

    const mealId = Number(req.params.id);
    if (!mealId) {
      res.status(400).json({ success: false, message: 'Invalid meal id' });
      return;
    }

    const meal = await getDailyMealById(mealId);
    if (!meal) {
      res.status(404).json({ success: false, message: 'Meal not found' });
      return;
    }
    if (meal.customerId !== customerId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    if (!isBeforeMealCutoff(meal.date)) {
      res.status(423).json({
        success: false,
        message: 'Meal locked. Changes allowed only before 8 PM the day before delivery.',
        nextAvailableAt: getCutoffForDate(meal.date).toISOString(),
      });
      return;
    }

    if (meal.isFinalized) {
      res.status(400).json({ success: false, message: 'Meal is already finalized' });
      return;
    }
    if (!meal.isSkipped) {
      res.status(400).json({ success: false, message: 'Meal is not skipped' });
      return;
    }

    const updated = await updateDailyMeal(meal.id, { isSkipped: false });
    const order = await getOrderByDailyMealId(meal.id);
    if (order) {
      const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      await updateOrder(order.id, {
        status: 'scheduled',
        statusHistory: [...history, { status: 'scheduled', timestamp: new Date().toISOString() }],
      });
    }

    if (!updated) {
      res.status(500).json({ success: false, message: 'Failed to update meal' });
      return;
    }
    await notifyChefOfMealChange(customerId, meal, 'unskip');
    res.json({ success: true, message: 'Meal restored successfully', meal: mapDailyMeal(updated) });
  } catch (error: any) {
    console.error('Unskip meal error:', error);
    res.status(500).json({ success: false, message: 'Failed to restore meal' });
  }
};

export const swapCustomerMeal = async (req: Request, res: Response) => {
  try {
    const customerId = requireCustomer(req, res);
    if (!customerId) return;

    const mealId = Number(req.params.id);
    const { newMealId } = req.body || {};
    if (!mealId || !newMealId) {
      res.status(400).json({ success: false, message: 'meal id and newMealId are required' });
      return;
    }

    const meal = await getDailyMealById(mealId);
    if (!meal) {
      res.status(404).json({ success: false, message: 'Meal not found' });
      return;
    }
    if (meal.customerId !== customerId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    if (!isBeforeMealCutoff(meal.date)) {
      res.status(423).json({
        success: false,
        message: 'Meal locked. Skip/swap allowed only before 8 PM the day before delivery.',
        nextAvailableAt: getCutoffForDate(meal.date).toISOString(),
      });
      return;
    }

    if (meal.isFinalized) {
      res.status(400).json({ success: false, message: 'Meal is already finalized' });
      return;
    }

    const dishes = await getAllDishes();
    const mealName = resolveMealName(String(newMealId), dishes);

    const updated = await updateDailyMeal(meal.id, {
      currentMealId: String(newMealId),
      isSwapped: true,
    });

    const order = await getOrderByDailyMealId(meal.id);
    if (order) {
      await updateOrder(order.id, { mealId: String(newMealId), mealName });
    }

    if (!updated) {
      res.status(500).json({ success: false, message: 'Failed to update meal' });
      return;
    }
    await notifyChefOfMealChange(customerId, meal, 'swap', mealName);
    res.json({ success: true, message: 'Meal swapped successfully', meal: mapDailyMeal(updated) });
  } catch (error: any) {
    console.error('Swap meal error:', error);
    res.status(500).json({ success: false, message: 'Failed to swap meal' });
  }
};

export const updateCustomerMealAddress = async (req: Request, res: Response) => {
  try {
    const customerId = requireCustomer(req, res);
    if (!customerId) return;

    const mealId = Number(req.params.id);
    const { addressType, customAddress } = req.body || {};
    if (!mealId || !addressType) {
      res.status(400).json({ success: false, message: 'meal id and addressType are required' });
      return;
    }

    const allowedTypes = ['home', 'work', 'custom'];
    if (!allowedTypes.includes(addressType)) {
      res.status(400).json({ success: false, message: 'addressType must be home, work, or custom' });
      return;
    }

    if (addressType === 'custom') {
      if (!customAddress?.street || !customAddress?.city || !customAddress?.state || !customAddress?.zipCode) {
        res.status(400).json({ success: false, message: 'customAddress is incomplete' });
        return;
      }
    }

    const meal = await getDailyMealById(mealId);
    if (!meal) {
      res.status(404).json({ success: false, message: 'Meal not found' });
      return;
    }
    if (meal.customerId !== customerId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    if (!isBeforeMealCutoff(meal.date)) {
      res.status(423).json({
        success: false,
        message: 'Meal locked. Address changes allowed only before 8 PM the day before delivery.',
        nextAvailableAt: getCutoffForDate(meal.date).toISOString(),
      });
      return;
    }

    if (meal.isFinalized) {
      res.status(400).json({ success: false, message: 'Meal is already finalized' });
      return;
    }

    const normalizedType = addressType === 'custom' ? null : addressType;
    const updated = await updateDailyMeal(meal.id, {
      deliveryAddressType: normalizedType,
      deliveryAddressOverride: addressType === 'custom' ? customAddress || null : null,
    });

    if (!updated) {
      res.status(500).json({ success: false, message: 'Failed to update meal' });
      return;
    }
    await notifyChefOfMealChange(customerId, meal, 'address_change');
    res.json({ success: true, message: 'Address updated successfully', meal: mapDailyMeal(updated) });
  } catch (error: any) {
    console.error('Update meal address error:', error);
    res.status(500).json({ success: false, message: 'Failed to update address' });
  }
};

export const getCustomerOrdersForReview = async (req: Request, res: Response) => {
  try {
    const customerId = requireCustomer(req, res);
    if (!customerId) return;

    await ensureUpcomingMealsForCustomer(customerId);
    await refreshDeliveredOrdersForCustomer(customerId);

    const orders = await getOrdersByCustomerId(customerId);
    const subscription = await getActiveSubscription(customerId);
    const customerUser = await getUserById(customerId);
    const deliveryAddress = subscription ? buildAddressFromSubscription(subscription) : undefined;
    const meals = await getDailyMealsByCustomerId(customerId);
    const mealMap = new Map(meals.map((meal) => [meal.id, meal]));
    const filtered = orders.filter(
      (order) => order.status === 'delivered' && !order.isReviewed && !mealMap.get(order.dailyMealId)?.isSkipped
    );
    const chefIds = Array.from(new Set(filtered.map((order) => order.chefId).filter(Boolean))) as number[];
    const chefMap = new Map<number, string>();
    for (const chefId of chefIds) {
      const chef = await getUserById(chefId);
      if (chef) chefMap.set(chefId, chef.fullName);
    }

    res.json({
      success: true,
      orders: filtered.map((order) =>
        mapOrder(order, {
          chefName: order.chefId ? chefMap.get(order.chefId) : undefined,
          customerName: customerUser?.fullName || req.user?.email || 'Customer',
          deliveryAddress: mealMap.get(order.dailyMealId)?.deliveryAddressOverride || deliveryAddress,
          deliveryAddressType: mealMap.get(order.dailyMealId)?.deliveryAddressType || undefined,
        })
      ),
    });
  } catch (error: any) {
    console.error('Get orders for review error:', error);
    res.status(500).json({ success: false, message: 'Failed to load review orders' });
  }
};

export const getCustomerOrdersWithTracking = async (req: Request, res: Response) => {
  try {
    const customerId = requireCustomer(req, res);
    if (!customerId) return;

    await ensureUpcomingMealsForCustomer(customerId);
    await refreshDeliveredOrdersForCustomer(customerId);

    const orders = await getOrdersByCustomerId(customerId);
    const subscription = await getActiveSubscription(customerId);
    const customerUser = await getUserById(customerId);
    const deliveryAddress = subscription ? buildAddressFromSubscription(subscription) : undefined;
    const meals = await getDailyMealsByCustomerId(customerId);
    const mealMap = new Map(meals.map((meal) => [meal.id, meal]));
    const chefIds = Array.from(new Set(orders.map((order) => order.chefId).filter(Boolean))) as number[];
    const chefMap = new Map<number, string>();
    for (const chefId of chefIds) {
      const chef = await getUserById(chefId);
      if (chef) chefMap.set(chefId, chef.fullName);
    }

    res.json({
      success: true,
      orders: orders.map((order) =>
        mapOrder(order, {
          chefName: order.chefId ? chefMap.get(order.chefId) : undefined,
          customerName: customerUser?.fullName || req.user?.email || 'Customer',
          deliveryAddress: mealMap.get(order.dailyMealId)?.deliveryAddressOverride || deliveryAddress,
          deliveryAddressType: mealMap.get(order.dailyMealId)?.deliveryAddressType || undefined,
        })
      ),
    });
  } catch (error: any) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to load orders' });
  }
};

export const submitCustomerReview = async (req: Request, res: Response) => {
  try {
    const customerId = requireCustomer(req, res);
    if (!customerId) return;

    const { orderId, rating, comment } = req.body || {};
    if (!orderId || !rating) {
      res.status(400).json({ success: false, message: 'orderId and rating are required' });
      return;
    }

    const orderIdValue = Number(orderId);
    if (Number.isNaN(orderIdValue)) {
      res.status(400).json({ success: false, message: 'orderId must be a number' });
      return;
    }

    const parsedRating = Number(rating);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      res.status(400).json({ success: false, message: 'rating must be between 1 and 5' });
      return;
    }

    const order = await getOrderById(orderIdValue);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    if (order.customerId !== customerId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }
    if (order.status !== 'delivered') {
      res.status(400).json({ success: false, message: 'Only delivered orders can be reviewed' });
      return;
    }
    if (!order.chefId) {
      res.status(400).json({ success: false, message: 'Chef not assigned for this order' });
      return;
    }

    const existingReview = await getReviewByOrderId(order.id);
    if (existingReview) {
      res.status(409).json({ success: false, message: 'Order already reviewed' });
      return;
    }

    const review = await createReview({
      orderId: order.id,
      customerId,
      chefId: order.chefId,
      mealId: order.mealId,
      mealName: order.mealName,
      rating: parsedRating,
      comment: comment || null,
      createdAt: new Date(),
      isHidden: false,
      hiddenReason: null,
    });

    await updateOrder(order.id, { isReviewed: true });

    if (order.chefId) {
      const chefReviews = await getReviewsByChefId(order.chefId);
      const visible = chefReviews.filter((rev) => !rev.isHidden);
      const total = visible.reduce((sum, rev) => sum + (rev.rating || 0), 0);
      const average = visible.length ? Math.round((total / visible.length) * 10) / 10 : 0;
      await updateUser(order.chefId, { rating: average, reviewCount: visible.length });
    }

    res.json({ success: true, review: mapReview(review) });
  } catch (error: any) {
    console.error('Submit review error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
};
