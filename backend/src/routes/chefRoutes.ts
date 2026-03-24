import express from 'express';
import {
  createMyChefDish,
  getMyChefDishes,
  getMyChefOrders,
  updateMyChefOrderStatus,
} from '../controllers/chefController.js';
import { authenticate } from '../middlewares/auth.js';
import { isChef } from '../middlewares/authorize.js';

const router = express.Router();

router.use(authenticate, isChef);

router.get('/dishes', getMyChefDishes);
router.post('/dishes', createMyChefDish);
router.get('/orders', getMyChefOrders);
router.post('/orders/:id/status', updateMyChefOrderStatus);

export default router;
