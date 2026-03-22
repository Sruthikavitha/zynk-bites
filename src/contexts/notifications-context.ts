import { createContext } from 'react';
import type { AppNotification } from '@/types';

export type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

export const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);
