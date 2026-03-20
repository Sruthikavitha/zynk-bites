import express from 'express';
import {
  getCustomerMeals,
  skipCustomerMeal,
  unskipCustomerMeal,
  swapCustomerMeal,
  updateCustomerMealAddress,
  getCustomerOrdersForReview,
  getCustomerOrdersWithTracking,
  submitCustomerReview,
} from '../controllers/customerController.js';
import { authenticate } from '../middlewares/auth.js';
import { isCustomer } from '../middlewares/authorize.js';

const router = express.Router();

router.use(authenticate);
router.use(isCustomer);

router.get('/meals', getCustomerMeals);
router.post('/meals/:id/skip', skipCustomerMeal);
router.post('/meals/:id/unskip', unskipCustomerMeal);
router.post('/meals/:id/swap', swapCustomerMeal);
router.put('/meals/:id/address', updateCustomerMealAddress);

router.get('/orders/for-review', getCustomerOrdersForReview);
router.get('/orders/tracking', getCustomerOrdersWithTracking);
router.post('/reviews', submitCustomerReview);

export default router;
