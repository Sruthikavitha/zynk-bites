import { EventEmitter } from 'node:events';

export interface NotificationEvent {
  userId: number;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

class AppEventBus extends EventEmitter {}

export const eventBus = new AppEventBus();

export const APP_EVENTS = {
  notificationCreated: 'notification.created',
} as const;
