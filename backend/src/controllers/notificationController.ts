import type { Request, Response } from 'express';
import {
  getNotificationsForUser,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../models/notificationQueries.js';

const mapNotification = (notification: any) => ({
  id: String(notification.id),
  type: notification.type,
  priority: notification.priority,
  title: notification.title,
  message: notification.message,
  actionUrl: notification.actionUrl || undefined,
  metadata: notification.metadata || {},
  status: notification.status,
  createdAt: notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString(),
  deliveredAt: notification.deliveredAt ? new Date(notification.deliveredAt).toISOString() : undefined,
  readAt: notification.readAt ? new Date(notification.readAt).toISOString() : undefined,
});

const requireAuthenticatedUser = (req: Request, res: Response) => {
  if (!req.user || typeof req.user.userId !== 'number') {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return null;
  }

  return {
    userId: req.user.userId,
    role: req.user.role,
  };
};

export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const auth = requireAuthenticatedUser(req, res);
    if (!auth) return;

    const requestedLimit = Number(req.query.limit || 25);
    const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(50, requestedLimit)) : 25;

    const [items, unreadCount] = await Promise.all([
      getNotificationsForUser(auth.userId, auth.role, limit),
      getUnreadNotificationCount(auth.userId, auth.role),
    ]);

    res.json({
      success: true,
      notifications: items.map(mapNotification),
      unreadCount,
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to load notifications' });
  }
};

export const markMyNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const auth = requireAuthenticatedUser(req, res);
    if (!auth) return;

    const notificationId = Number(req.params.id);
    if (!Number.isInteger(notificationId) || notificationId < 1) {
      res.status(400).json({ success: false, message: 'Invalid notification id' });
      return;
    }

    const notification = await markNotificationAsRead(auth.userId, auth.role, notificationId);
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.json({ success: true, notification: mapNotification(notification) });
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to update notification' });
  }
};

export const markAllMyNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const auth = requireAuthenticatedUser(req, res);
    if (!auth) return;

    const notifications = await markAllNotificationsAsRead(auth.userId, auth.role);
    res.json({
      success: true,
      updatedCount: notifications.length,
      notifications: notifications.map(mapNotification),
    });
  } catch (error: any) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ success: false, message: error?.message || 'Failed to update notifications' });
  }
};
