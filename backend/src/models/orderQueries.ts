import { asc, and, eq } from 'drizzle-orm';
import { getDb } from '../config/database.js';
import { orders, Order, NewOrder } from './schema.js';

export const getOrdersByCustomerId = async (customerId: number): Promise<Order[]> => {
  const db = getDb();
  return await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(asc(orders.date));
};

export const getOrderById = async (id: number): Promise<Order | undefined> => {
  const db = getDb();
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
};

export const getOrderByDailyMealId = async (dailyMealId: number): Promise<Order | undefined> => {
  const db = getDb();
  const result = await db.select().from(orders).where(eq(orders.dailyMealId, dailyMealId)).limit(1);
  return result[0];
};

export const getOrdersByDate = async (date: string): Promise<Order[]> => {
  const db = getDb();
  return await db.select().from(orders).where(eq(orders.date, date)).orderBy(asc(orders.createdAt));
};

export const getOrdersByChefAndDate = async (chefId: number, date: string): Promise<Order[]> => {
  const db = getDb();
  return await db
    .select()
    .from(orders)
    .where(and(eq(orders.chefId, chefId), eq(orders.date, date)))
    .orderBy(asc(orders.createdAt));
};

export const createOrder = async (orderData: NewOrder): Promise<Order> => {
  const db = getDb();
  const result = await db.insert(orders).values(orderData).returning();
  return result[0];
};

export const createOrders = async (orderData: NewOrder[]): Promise<Order[]> => {
  if (orderData.length === 0) return [];
  const db = getDb();
  const result = await db.insert(orders).values(orderData).returning();
  return result;
};

export const updateOrder = async (
  id: number,
  updates: Partial<NewOrder>
): Promise<Order | undefined> => {
  const db = getDb();
  const result = await db.update(orders).set(updates).where(eq(orders.id, id)).returning();
  return result[0];
};
