import express from 'express';
import { getChefsWithRatings, getChefProfile, getDishes, getMeals } from '../controllers/catalogController.js';

const router = express.Router();

router.get('/chefs', getChefsWithRatings);
router.get('/chefs/:id/profile', getChefProfile);
router.get('/dishes', getDishes);
router.get('/meals', getMeals);

export default router;
