import { sampleMeals } from '../data/sampleCatalog.js';
import { getAllDishes, getDishesByChefId } from '../models/dishQueries.js';
import { getDailyMealsBySubscriptionId, createDailyMeal, updateDailyMeal } from '../models/dailyMealQueries.js';
import { getOrdersByCustomerId, getOrderByDailyMealId, createOrder, updateOrder } from '../models/orderQueries.js';
import { getActiveSubscription } from '../models/subscriptionQueries.js';
import { notifyDeliveryUpdate } from './notificationService.js';

type MealSlot = 'breakfast' | 'lunch' | 'dinner';

const slotIndexMap: Record<MealSlot, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
};

const normalizePlan = (planName: string): 'basic' | 'standard' | 'premium' => {
  const normalized = (planName || '').toLowerCase();
  if (normalized.includes('basic')) return 'basic';
  if (normalized.includes('premium')) return 'premium';
  return 'standard';
};

export const getMealSlotsForPlan = (planName: string): MealSlot[] => {
  const plan = normalizePlan(planName);
  if (plan === 'basic') return ['lunch'];
  if (plan === 'premium') return ['breakfast', 'lunch', 'dinner'];
  return ['lunch', 'dinner'];
};

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const getUpcomingDates = (days: number): string[] => {
  const list: string[] = [];
  for (let i = 1; i <= days; i += 1) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    list.push(formatDate(date));
  }
  return list;
};

const pickDishForSlot = (dishPool: any[], dateStr: string, slot: MealSlot) => {
  const date = new Date(`${dateStr}T00:00:00`);
  const index = (date.getDate() + slotIndexMap[slot]) % dishPool.length;
  return dishPool[index];
};

const pickAlternatives = (poolIds: string[], primaryId: string, count = 2) => {
  return poolIds.filter((id) => id !== primaryId).slice(0, count);
};

const resolveMealForSlot = (
  dishPool: any[],
  dateStr: string,
  slot: MealSlot
): { mealId: string; mealName: string; alternativeMealIds?: string[] } => {
  if (dishPool.length > 0) {
    const dish = pickDishForSlot(dishPool, dateStr, slot);
    const dishId = String(dish.id);
    return {
      mealId: dishId,
      mealName: dish.name,
      alternativeMealIds: pickAlternatives(
        dishPool.map((item) => String(item.id)),
        dishId
      ),
    };
  }

  const fallback = sampleMeals[Math.floor(Math.random() * sampleMeals.length)];
  return {
    mealId: fallback.id,
    mealName: fallback.name,
    alternativeMealIds: pickAlternatives(sampleMeals.map((meal) => meal.id), fallback.id),
  };
};

const resolveMealName = (mealId: string, dishes: any[]) => {
  const dishMatch = dishes.find((dish) => String(dish.id) === String(mealId));
  if (dishMatch) return dishMatch.name;
  const sample = sampleMeals.find((meal) => meal.id === mealId);
  return sample?.name || 'Chef Special';
};

export const ensureUpcomingMealsForCustomer = async (customerId: number, days = 7) => {
  const subscription = await getActiveSubscription(customerId);
  if (!subscription) return null;

  const mealSlots = getMealSlotsForPlan(subscription.planName);
  const upcomingDates = getUpcomingDates(days);
  const existingMeals = await getDailyMealsBySubscriptionId(subscription.id);
  const existingKey = new Set(existingMeals.map((meal) => `${meal.date}-${meal.mealSlot}`));

  const dishPool = subscription.chefId
    ? await getDishesByChefId(subscription.chefId)
    : [];

  for (const dateStr of upcomingDates) {
    for (const slot of mealSlots) {
      const key = `${dateStr}-${slot}`;
      if (existingKey.has(key)) continue;

      const resolved = resolveMealForSlot(dishPool, dateStr, slot);
      const dailyMeal = await createDailyMeal({
        subscriptionId: subscription.id,
        customerId,
        date: dateStr,
        mealSlot: slot,
        originalMealId: resolved.mealId,
        currentMealId: resolved.mealId,
        isSkipped: false,
        isSwapped: false,
        status: 'scheduled',
        alternativeMealIds: resolved.alternativeMealIds || [],
        deliveryAddressType: 'home',
        deliveryAddressOverride: null,
        isFinalized: false,
      });

      await createOrder({
        dailyMealId: dailyMeal.id,
        customerId,
        chefId: subscription.chefId || null,
        mealId: resolved.mealId,
        mealName: resolved.mealName,
        status: 'scheduled',
        statusHistory: [
          {
            status: 'scheduled',
            timestamp: new Date().toISOString(),
          },
        ],
        date: dateStr,
        mealTime: slot,
        isReviewed: false,
        deliveredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // Ensure every daily meal in the upcoming range has an order
  const allDishes = await getAllDishes();
  const mealsForRange = existingMeals.filter((meal) => upcomingDates.includes(meal.date));
  for (const meal of mealsForRange) {
    const existingOrder = await getOrderByDailyMealId(meal.id);
    if (existingOrder) continue;
    await createOrder({
      dailyMealId: meal.id,
      customerId,
      chefId: subscription.chefId || null,
      mealId: meal.currentMealId,
      mealName: resolveMealName(meal.currentMealId, allDishes),
      status: 'scheduled',
      statusHistory: [
        {
          status: 'scheduled',
          timestamp: new Date().toISOString(),
        },
      ],
      date: meal.date,
      mealTime: meal.mealSlot,
      isReviewed: false,
      deliveredAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return subscription;
};

export const refreshDeliveredOrdersForCustomer = async (customerId: number) => {
  const orders = await getOrdersByCustomerId(customerId);
  const today = formatDate(new Date());

  for (const order of orders) {
    if (order.date < today && order.status !== 'delivered') {
      const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      const nextHistory = [
        ...history,
        { status: 'delivered', timestamp: new Date().toISOString() },
      ];
      await updateOrder(order.id, {
        status: 'delivered',
        statusHistory: nextHistory,
        deliveredAt: new Date(),
      });
      await updateDailyMeal(order.dailyMealId, { status: 'delivered', isFinalized: true });
      await notifyDeliveryUpdate({
        customerId: order.customerId,
        orderId: order.id,
        mealName: order.mealName,
        status: 'delivered',
      });
    }
  }
};
