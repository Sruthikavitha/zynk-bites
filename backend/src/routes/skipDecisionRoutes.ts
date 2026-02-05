/**
 * Skip Decision Routes
 * Handles meal skip decision endpoints
 */

import express from 'express';
import { getMealSkipDecision } from '../controllers/skipDecisionController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest, skipDecisionSchema } from '../middlewares/validation.js';

const router = express.Router();

/**
 * POST /api/skip-decision
 * Get decision on whether to skip a meal
 * Body: SkipDecisionRequest object
 */
router.post(
  '/',
  authenticate,
  validateRequest(skipDecisionSchema),
  getMealSkipDecision
);

export default router;
