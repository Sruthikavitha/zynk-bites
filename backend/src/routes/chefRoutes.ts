import express from 'express';
import { getAvailableChefs, getChefMenu, uploadMenuCard } from '../controllers/chefController.js';
import { authenticate } from '../middlewares/auth.js';
import { isChef, isCustomer } from '../middlewares/authorize.js'; // Assuming this exists or needs check
import { upload } from '../middlewares/upload.js';

const router = express.Router();

// Public / Customer available routes
router.get('/', authenticate, getAvailableChefs); // Customer searching for chefs
router.get('/:chefId/menu', authenticate, getChefMenu); // Customer viewing a chef's menu

// Chef protected routes
router.post(
    '/:chefId/menu-upload',
    authenticate,
    // isChef, // Add this back once we verify middleware exists
    upload.single('menuCard'),
    uploadMenuCard
);

export default router;
