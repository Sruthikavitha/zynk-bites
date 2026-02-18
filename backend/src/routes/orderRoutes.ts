import express from 'express';
import { createOrder, getCustomerOrders } from '../controllers/orderController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', authenticate, createOrder);
router.get('/customer/:customerId', authenticate, getCustomerOrders);

export default router;
