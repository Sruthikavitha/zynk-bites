import express from 'express';
import { createMyChefDish, getMyChefDishes } from '../controllers/chefController.js';
import { authenticate } from '../middlewares/auth.js';
import { isChef } from '../middlewares/authorize.js';

const router = express.Router();

router.use(authenticate, isChef);

router.get('/dishes', getMyChefDishes);
router.post('/dishes', createMyChefDish);

export default router;
