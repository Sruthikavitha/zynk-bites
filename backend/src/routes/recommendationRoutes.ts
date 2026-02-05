/**
 * Recommendation Routes
 * Handles meal recommendation endpoints
 */

import express from "express";
import { getMealRecommendations } from "../controllers/recommendationController.js";
import { authenticate } from "../middlewares/auth.js";
import {
  validateRequest,
  recommendationSchema,
} from "../middlewares/validation.js";

const router = express.Router();

/**
 * POST /api/recommendations
 * Get meal recommendations based on user preferences
 * Body: UserPreferences object
 */
router.post(
  "/",
  authenticate,
  validateRequest(recommendationSchema),
  getMealRecommendations
);

export default router;
