import express from 'express';
import {
  getMyNotifications,
  markAllMyNotificationsAsRead,
  markMyNotificationAsRead,
} from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getMyNotifications);
router.post('/read-all', markAllMyNotificationsAsRead);
router.post('/:id/read', markMyNotificationAsRead);

export default router;
