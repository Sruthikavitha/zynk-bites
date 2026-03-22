import { eq, and } from 'drizzle-orm';
import { getDb } from '../config/database.js';
import { users, User } from './schema.js';

export const getAllChefs = async (): Promise<User[]> => {
  const db = getDb();
  return await db.select().from(users).where(eq(users.role, 'chef'));
};

export const getActiveChefs = async (): Promise<User[]> => {
  const db = getDb();
  return await db
    .select()
    .from(users)
    .where(and(eq(users.role, 'chef'), eq(users.isActive, true)));
};

export const getPendingChefs = async (): Promise<User[]> => {
  const db = getDb();
  return await db
    .select()
    .from(users)
    .where(and(eq(users.role, 'chef'), eq(users.isActive, false)));
};

export const getChefById = async (chefId: number): Promise<User | undefined> => {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.id, chefId)).limit(1);
  return result[0];
};
