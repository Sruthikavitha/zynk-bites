import { asc, eq } from 'drizzle-orm';
import { getDb } from '../config/database.js';
import { dailyMeals, DailyMeal, NewDailyMeal } from './schema.js';

export const getDailyMealsByCustomerId = async (customerId: number): Promise<DailyMeal[]> => {
  const db = getDb();
  return await db
    .select()
    .from(dailyMeals)
    .where(eq(dailyMeals.customerId, customerId))
    .orderBy(asc(dailyMeals.date));
};

export const getDailyMealsBySubscriptionId = async (subscriptionId: number): Promise<DailyMeal[]> => {
  const db = getDb();
  return await db
    .select()
    .from(dailyMeals)
    .where(eq(dailyMeals.subscriptionId, subscriptionId))
    .orderBy(asc(dailyMeals.date));
};

export const getDailyMealById = async (id: number): Promise<DailyMeal | undefined> => {
  const db = getDb();
  const result = await db.select().from(dailyMeals).where(eq(dailyMeals.id, id)).limit(1);
  return result[0];
};

export const createDailyMeal = async (meal: NewDailyMeal): Promise<DailyMeal> => {
  const db = getDb();
  const result = await db.insert(dailyMeals).values(meal).returning();
  return result[0];
};

export const createDailyMeals = async (meals: NewDailyMeal[]): Promise<DailyMeal[]> => {
  if (meals.length === 0) return [];
  const db = getDb();
  const result = await db.insert(dailyMeals).values(meals).returning();
  return result;
};

export const updateDailyMeal = async (
  id: number,
  updates: Partial<NewDailyMeal>
): Promise<DailyMeal | undefined> => {
  const db = getDb();
  const result = await db.update(dailyMeals).set(updates).where(eq(dailyMeals.id, id)).returning();
  return result[0];
};
