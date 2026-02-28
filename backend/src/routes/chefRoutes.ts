import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { isAdmin, isChef } from '../middlewares/authorize.js';
import { addMealPlan, approveChef, completeChefProfile, getChefDeliveries } from '../controllers/chefFlowController.js';
import { markDelivered } from '../controllers/customerFlowController.js';

const router = express.Router();

router.post('/chef/profile', authenticate, isChef, completeChefProfile);
router.post('/chef/plans', authenticate, isChef, addMealPlan);
router.get('/chef/deliveries', authenticate, isChef, getChefDeliveries);
router.patch('/chef/delivery/:id/delivered', authenticate, isChef, markDelivered);
router.patch('/admin/chefs/:id/approve', authenticate, isAdmin, approveChef);

export default router;
