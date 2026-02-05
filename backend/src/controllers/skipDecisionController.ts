/**
 * Meal Skip Decision Controller
 * Handles meal skipping decision requests
 */

import { Request, Response } from 'express';
import {
  getSkipDecision,
  validateSkipRequest,
  getHealthTips,
} from '../services/mealSkipService.js';

/**
 * POST /api/skip-decision
 * Get a decision on whether to skip a meal
 */
export const getMealSkipDecision = (req: Request, res: Response) => {
  try {
    const { mealType, skipCount, healthGoal, subscriptionStatus, consecutiveSkips, lastMealTime } =
      req.body;

    // Validate request
    const validation = validateSkipRequest({
      mealType,
      skipCount,
      healthGoal,
      subscriptionStatus,
      consecutiveSkips,
      lastMealTime,
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid skip decision request',
        details: validation.errors,
      });
    }

    // Get skip decision
    const decision = getSkipDecision({
      mealType,
      skipCount,
      healthGoal,
      subscriptionStatus,
      consecutiveSkips,
      lastMealTime,
    });

    // Get health tips
    const tips = getHealthTips(skipCount, healthGoal);

    return res.status(200).json({
      success: true,
      data: {
        ...decision,
        tips,
      },
      message: 'Skip decision generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating skip decision:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate skip decision',
    });
  }
};
