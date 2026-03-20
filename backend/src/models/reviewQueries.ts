import { asc, eq } from 'drizzle-orm';
import { getDb } from '../config/database.js';
import { reviews, Review, NewReview } from './schema.js';

export const getReviewsByChefId = async (chefId: number): Promise<Review[]> => {
  const db = getDb();
  return await db
    .select()
    .from(reviews)
    .where(eq(reviews.chefId, chefId))
    .orderBy(asc(reviews.createdAt));
};

export const getReviewsByCustomerId = async (customerId: number): Promise<Review[]> => {
  const db = getDb();
  return await db
    .select()
    .from(reviews)
    .where(eq(reviews.customerId, customerId))
    .orderBy(asc(reviews.createdAt));
};

export const getReviewByOrderId = async (orderId: number): Promise<Review | undefined> => {
  const db = getDb();
  const result = await db.select().from(reviews).where(eq(reviews.orderId, orderId)).limit(1);
  return result[0];
};

export const getAllReviews = async (): Promise<Review[]> => {
  const db = getDb();
  return await db.select().from(reviews).orderBy(asc(reviews.createdAt));
};

export const createReview = async (reviewData: NewReview): Promise<Review> => {
  const db = getDb();
  const result = await db.insert(reviews).values(reviewData).returning();
  return result[0];
};

export const updateReview = async (
  id: number,
  updates: Partial<NewReview>
): Promise<Review | undefined> => {
  const db = getDb();
  const result = await db.update(reviews).set(updates).where(eq(reviews.id, id)).returning();
  return result[0];
};
