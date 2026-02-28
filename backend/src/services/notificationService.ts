import { getDb } from '../config/database.js';
import { notifications } from '../models/schema.js';
import { APP_EVENTS, NotificationEvent, eventBus } from './eventBus.js';

const saveNotification = async (payload: NotificationEvent) => {
  const db = getDb();
  await db.insert(notifications).values({
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    metadata: payload.metadata ?? null,
  });
};

export const initializeNotificationService = () => {
  eventBus.removeAllListeners(APP_EVENTS.notificationCreated);

  eventBus.on(APP_EVENTS.notificationCreated, async (payload: NotificationEvent) => {
    try {
      await saveNotification(payload);
    } catch (error) {
      console.error('Failed to persist notification event:', error);
    }
  });
};

export const emitNotification = (payload: NotificationEvent) => {
  eventBus.emit(APP_EVENTS.notificationCreated, payload);
};
