import { eq, and } from 'drizzle-orm';
import { getDb } from '../config/database.js';
import { subscriptions, NewSubscription, Subscription } from './schema.js';

// Fetch all subscriptions for a user
export const getUserSubscriptions = async (userId: number): Promise<Subscription[]> => {
  const db = getDb();
  return await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
};

// Fetch a specific subscription by ID
export const getSubscriptionById = async (id: number): Promise<Subscription | undefined> => {
  const db = getDb();
  const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
  return result[0];
};

// Fetch active subscription for a user (only one per user)
export const getActiveSubscription = async (userId: number): Promise<Subscription | undefined> => {
  const db = getDb();
  const result = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
    .limit(1);
  return result[0];
};

// Create a new subscription
export const createSubscription = async (subData: NewSubscription): Promise<Subscription> => {
  const db = getDb();
  const result = await db.insert(subscriptions).values(subData).returning();
  return result[0];
};

// Update subscription fields
export const updateSubscription = async (id: number, updates: Partial<NewSubscription>): Promise<Subscription | undefined> => {
  const db = getDb();
  const result = await db.update(subscriptions).set(updates).where(eq(subscriptions.id, id)).returning();
  return result[0];
};

// Update skip/swap lock status
export const updateLockStatus = async (id: number, isLocked: boolean, lockAppliedAt: Date | null): Promise<Subscription | undefined> => {
  const db = getDb();
  const result = await db
    .update(subscriptions)
    .set({ isSkipSwapLocked: isLocked, lockAppliedAt })
    .where(eq(subscriptions.id, id))
    .returning();
  return result[0];
};

// Cancel subscription
export const cancelSubscription = async (id: number): Promise<Subscription | undefined> => {
  const db = getDb();
  const result = await db.update(subscriptions).set({ status: 'cancelled' }).where(eq(subscriptions.id, id)).returning();
  return result[0];
};

// Pause subscription
export const pauseSubscription = async (id: number): Promise<Subscription | undefined> => {
  const db = getDb();
  const result = await db.update(subscriptions).set({ status: 'paused' }).where(eq(subscriptions.id, id)).returning();
  return result[0];
};

// Resume subscription (reactivate paused one)
export const resumeSubscription = async (id: number, nextBillingDate: Date): Promise<Subscription | undefined> => {
  const db = getDb();
  const result = await db
    .update(subscriptions)
    .set({ status: 'active', nextBillingDate })
    .where(eq(subscriptions.id, id))
    .returning();
  return result[0];
};
