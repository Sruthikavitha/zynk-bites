import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationsContext, type NotificationsContextValue } from '@/contexts/notifications-context';
import { useToast } from '@/hooks/use-toast';
import {
  getApiToken,
  getMyNotifications,
  markAllMyNotificationsAsRead,
  markMyNotificationAsRead,
} from '@/services/backend';
import type { AppNotification } from '@/types';

const POLL_INTERVAL_MS = 30_000;

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const hasHydratedRef = useRef(false);

  const resetState = () => {
    setNotifications([]);
    setUnreadCount(0);
    setIsLoading(false);
    knownIdsRef.current = new Set();
    hasHydratedRef.current = false;
  };

  const refreshNotifications = useCallback(async () => {
    const token = getApiToken();
    if (!isAuthenticated || !user || !token) {
      resetState();
      return;
    }

    const result = await getMyNotifications(token, 25);
    if (!result.success) return;

    const nextNotifications = result.notifications || [];

    if (hasHydratedRef.current) {
      const criticalNewItems = nextNotifications
        .filter((item) => !knownIdsRef.current.has(item.id) && !item.readAt && item.priority === 'critical')
        .slice(0, 2);

      for (const item of criticalNewItems) {
        toast({
          title: item.title,
          description: item.message,
        });
      }
    }

    knownIdsRef.current = new Set(nextNotifications.map((item) => item.id));
    hasHydratedRef.current = true;
    setNotifications(nextNotifications);
    setUnreadCount(result.unreadCount || 0);
  }, [isAuthenticated, toast, user]);

  useEffect(() => {
    let isCancelled = false;
    let intervalId: number | undefined;

    const bootstrap = async () => {
      if (!isAuthenticated || !user) {
        resetState();
        return;
      }

      setIsLoading(true);
      await refreshNotifications();
      if (!isCancelled) {
        setIsLoading(false);
      }
    };

    void bootstrap();

    if (isAuthenticated && user) {
      intervalId = window.setInterval(() => {
        void refreshNotifications();
      }, POLL_INTERVAL_MS);
    }

    return () => {
      isCancelled = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [isAuthenticated, refreshNotifications, user]);

  const markAsRead = async (notificationId: string) => {
    const token = getApiToken();
    if (!token) return;

    setNotifications((current) =>
      current.map((item) => (item.id === notificationId ? { ...item, readAt: item.readAt || new Date().toISOString() } : item))
    );
    setUnreadCount((current) => Math.max(0, current - 1));

    const result = await markMyNotificationAsRead(token, notificationId);
    if (!result.success) {
      await refreshNotifications();
    }
  };

  const markAllAsRead = async () => {
    const token = getApiToken();
    if (!token) return;

    setNotifications((current) => {
      const now = new Date().toISOString();
      return current.map((item) => ({ ...item, readAt: item.readAt || now }));
    });
    setUnreadCount(0);

    const result = await markAllMyNotificationsAsRead(token);
    if (!result.success) {
      await refreshNotifications();
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
