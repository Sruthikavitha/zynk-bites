import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { isAdmin } from '../middlewares/authorize.js';
import { approveChef, getAllChefApprovals, getPendingChefApprovals } from '../controllers/adminController.js';

const router = express.Router();

router.use(authenticate, isAdmin);

router.get('/chefs', getAllChefApprovals);
router.get('/chefs/pending', getPendingChefApprovals);
router.post('/chefs/:id/approve', approveChef);

export default router;
