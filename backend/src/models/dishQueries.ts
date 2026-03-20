import { eq } from 'drizzle-orm';
import { getDb } from '../config/database.js';
import { dishes, Dish, NewDish } from './schema.js';

export const getAllDishes = async (): Promise<Dish[]> => {
  const db = getDb();
  return await db.select().from(dishes);
};

export const getDishesByChefId = async (chefId: number): Promise<Dish[]> => {
  const db = getDb();
  return await db.select().from(dishes).where(eq(dishes.chefId, chefId));
};

export const getDishById = async (id: number): Promise<Dish | undefined> => {
  const db = getDb();
  const result = await db.select().from(dishes).where(eq(dishes.id, id)).limit(1);
  return result[0];
};

export const insertDishes = async (list: NewDish[]): Promise<Dish[]> => {
  const db = getDb();
  const result = await db.insert(dishes).values(list).returning();
  return result;
};
