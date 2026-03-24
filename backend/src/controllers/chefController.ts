import type { Request, Response } from 'express';
import { createDish, getDishesByChefId } from '../models/dishQueries.js';
import { getDailyMealById, updateDailyMeal } from '../models/dailyMealQueries.js';
import { getOrderById, getOrdersByChefAndDate, updateOrder } from '../models/orderQueries.js';
import { getSubscriptionById } from '../models/subscriptionQueries.js';
import { getUserById } from '../models/userQueries.js';
import type { Dish } from '../models/schema.js';
import { notifyDeliveryUpdate } from '../services/notificationService.js';

const mapDish = (dish: Dish) => ({
  id: String(dish.id),
  chefId: String(dish.chefId),
  name: dish.name,
  description: dish.description,
  category: dish.category === 'veg' ? 'veg' : 'non-veg',
  nutritionalInfo: {
    calories: dish.calories,
    protein: dish.protein,
    carbs: dish.carbs,
    fat: dish.fat,
  },
  allowsCustomization: dish.allowsCustomization,
  customizationOptions: [],
  imageUrl: dish.imageUrl || undefined,
  isActive: dish.isActive,
  isSpecial: dish.isSpecial,
});

const requireChefUserId = (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId || typeof userId !== 'number') {
    res.status(401).json({ success: false, message: 'Chef not authenticated' });
    return null;
  }
  return userId;
};

const buildTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

const buildDeliveryAddress = (subscription?: { deliveryAddress: string; city: string; postalCode: string } | null) => ({
  street: subscription?.deliveryAddress || '',
  city: subscription?.city || '',
  state: '',
  zipCode: subscription?.postalCode || '',
});

const mapOrder = (
  order: {
    id: number;
    dailyMealId: number;
    customerId: number;
    chefId: number | null;
    mealId: string;
    mealName: string;
    status: string;
    statusHistory: unknown;
    date: string;
    mealTime: string;
    deliveredAt: Date | null;
    isReviewed: boolean;
  },
  context: {
    customerName?: string;
    deliveryAddress?: { street: string; city: string; state: string; zipCode: string };
    deliveryAddressType?: string | null;
  }
) => ({
  id: String(order.id),
  dailyMealId: String(order.dailyMealId),
  customerId: String(order.customerId),
  chefId: order.chefId ? String(order.chefId) : undefined,
  mealId: order.mealId,
  mealName: order.mealName,
  customerName: context.customerName || 'Customer',
  deliveryAddress: context.deliveryAddress || { street: '', city: '', state: '', zipCode: '' },
  deliveryAddressType: context.deliveryAddressType || undefined,
  status: order.status,
  statusHistory: Array.isArray(order.statusHistory) ? order.statusHistory : [],
  date: order.date,
  mealTime: order.mealTime,
  deliveredAt: order.deliveredAt ? new Date(order.deliveredAt).toISOString() : undefined,
  isReviewed: order.isReviewed,
});

export const getMyChefDishes = async (req: Request, res: Response) => {
  try {
    const chefId = requireChefUserId(req, res);
    if (!chefId) return;

    const chef = await getUserById(chefId);
    if (!chef || chef.role !== 'chef') {
      return res.status(404).json({ success: false, message: 'Chef not found' });
    }

    const dishes = await getDishesByChefId(chefId);
    return res.json({ success: true, data: dishes.map(mapDish) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error?.message || 'Failed to load dishes' });
  }
};

export const createMyChefDish = async (req: Request, res: Response) => {
  try {
    const chefId = requireChefUserId(req, res);
    if (!chefId) return;

    const chef = await getUserById(chefId);
    if (!chef || chef.role !== 'chef') {
      return res.status(404).json({ success: false, message: 'Chef not found' });
    }

    const { name, description, category, nutritionalInfo, allowsCustomization, imageUrl } = req.body || {};

    if (!name?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, message: 'Dish name and description are required' });
    }

    if (!['veg', 'non-veg'].includes(category)) {
      return res.status(400).json({ success: false, message: 'Dish category must be veg or non-veg' });
    }

    const calories = Number(nutritionalInfo?.calories);
    const protein = Number(nutritionalInfo?.protein);
    const carbs = Number(nutritionalInfo?.carbs);
    const fat = Number(nutritionalInfo?.fat);

    if ([calories, protein, carbs, fat].some((value) => Number.isNaN(value) || value < 0)) {
      return res.status(400).json({ success: false, message: 'Valid nutritional info is required' });
    }

    const dish = await createDish({
      chefId,
      name: name.trim(),
      description: description.trim(),
      category,
      calories,
      protein,
      carbs,
      fat,
      allowsCustomization: Boolean(allowsCustomization),
      isSpecial: false,
      imageUrl: imageUrl?.trim() || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      data: mapDish(dish),
      message: 'Dish added successfully',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error?.message || 'Failed to add dish' });
  }
};

export const getMyChefOrders = async (req: Request, res: Response) => {
  try {
    const chefId = requireChefUserId(req, res);
    if (!chefId) return;

    const chef = await getUserById(chefId);
    if (!chef || chef.role !== 'chef') {
      return res.status(404).json({ success: false, message: 'Chef not found' });
    }

    const orders = await getOrdersByChefAndDate(chefId, buildTomorrowDate());
    const payload = await Promise.all(
      orders.map(async (order) => {
        const [customer, meal] = await Promise.all([getUserById(order.customerId), getDailyMealById(order.dailyMealId)]);
        const subscription = meal ? await getSubscriptionById(meal.subscriptionId) : null;
        const deliveryAddress =
          meal?.deliveryAddressOverride && typeof meal.deliveryAddressOverride === 'object'
            ? (meal.deliveryAddressOverride as { street: string; city: string; state: string; zipCode: string })
            : buildDeliveryAddress(subscription);

        return mapOrder(order, {
          customerName: customer?.fullName,
          deliveryAddress,
          deliveryAddressType: meal?.deliveryAddressType || null,
        });
      })
    );

    return res.json({ success: true, data: payload });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error?.message || 'Failed to load chef orders' });
  }
};

export const updateMyChefOrderStatus = async (req: Request, res: Response) => {
  try {
    const chefId = requireChefUserId(req, res);
    if (!chefId) return;

    const orderId = Number(req.params.id);
    const { status } = req.body || {};

    if (!Number.isInteger(orderId) || orderId < 1) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    if (!['preparing', 'ready'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be preparing or ready' });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.chefId !== chefId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const validTransition =
      status === 'preparing'
        ? ['pending', 'scheduled'].includes(order.status)
        : order.status === 'preparing';

    if (!validTransition) {
      return res.status(409).json({ success: false, message: `Cannot mark order as ${status} from ${order.status}` });
    }

    const nextHistory = [
      ...(Array.isArray(order.statusHistory) ? order.statusHistory : []),
      { status, timestamp: new Date().toISOString() },
    ];

    const updatedOrder = await updateOrder(order.id, {
      status,
      statusHistory: nextHistory,
      updatedAt: new Date(),
    });

    const dailyMeal = await getDailyMealById(order.dailyMealId);
    if (dailyMeal) {
      await updateDailyMeal(dailyMeal.id, {
        status,
        updatedAt: new Date(),
      });
    }

    if (!updatedOrder) {
      return res.status(500).json({ success: false, message: 'Failed to update order status' });
    }

    await notifyDeliveryUpdate({
      customerId: updatedOrder.customerId,
      orderId: updatedOrder.id,
      mealName: updatedOrder.mealName,
      status,
    });

    const customer = await getUserById(updatedOrder.customerId);
    const subscription = dailyMeal ? await getSubscriptionById(dailyMeal.subscriptionId) : null;
    const deliveryAddress =
      dailyMeal?.deliveryAddressOverride && typeof dailyMeal.deliveryAddressOverride === 'object'
        ? (dailyMeal.deliveryAddressOverride as { street: string; city: string; state: string; zipCode: string })
        : buildDeliveryAddress(subscription);

    return res.json({
      success: true,
      data: mapOrder(updatedOrder, {
        customerName: customer?.fullName,
        deliveryAddress,
        deliveryAddressType: dailyMeal?.deliveryAddressType || null,
      }),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error?.message || 'Failed to update order status' });
  }
};
