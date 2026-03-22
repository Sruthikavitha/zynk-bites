import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { getDb } from '../config/database.js';
import { NewNotification, Notification, UserRole, notifications } from './schema.js';

export const findNotificationByDedupeKey = async (dedupeKey: string): Promise<Notification | undefined> => {
  const db = getDb();
  const result = await db
    .select()
    .from(notifications)
    .where(eq(notifications.dedupeKey, dedupeKey))
    .limit(1);

  return result[0];
};

export const createNotification = async (notification: NewNotification): Promise<Notification> => {
  const db = getDb();
  const result = await db
    .insert(notifications)
    .values({
      ...notification,
      updatedAt: notification.updatedAt ?? new Date(),
    })
    .returning();

  return result[0];
};

export const createNotifications = async (items: NewNotification[]): Promise<Notification[]> => {
  if (items.length === 0) return [];

  const db = getDb();
  return await db
    .insert(notifications)
    .values(items.map((item) => ({ ...item, updatedAt: item.updatedAt ?? new Date() })))
    .returning();
};

export const getNotificationsForUser = async (userId: number, role: UserRole, limit = 25): Promise<Notification[]> => {
  const db = getDb();
  return await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientId, userId),
        eq(notifications.recipientRole, role),
        eq(notifications.status, 'delivered')
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
};

export const getUnreadNotificationCount = async (userId: number, role: UserRole): Promise<number> => {
  const db = getDb();
  const result = await db
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientId, userId),
        eq(notifications.recipientRole, role),
        eq(notifications.status, 'delivered'),
        isNull(notifications.readAt)
      )
    );

  return Number(result[0]?.count ?? 0);
};

export const markNotificationAsRead = async (
  userId: number,
  role: UserRole,
  notificationId: number
): Promise<Notification | undefined> => {
  const db = getDb();
  const result = await db
    .update(notifications)
    .set({
      readAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.recipientId, userId),
        eq(notifications.recipientRole, role),
        eq(notifications.status, 'delivered'),
        isNull(notifications.readAt)
      )
    )
    .returning();

  return result[0];
};

export const markAllNotificationsAsRead = async (userId: number, role: UserRole): Promise<Notification[]> => {
  const db = getDb();
  return await db
    .update(notifications)
    .set({
      readAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(notifications.recipientId, userId),
        eq(notifications.recipientRole, role),
        eq(notifications.status, 'delivered'),
        isNull(notifications.readAt)
      )
    )
    .returning();
};
