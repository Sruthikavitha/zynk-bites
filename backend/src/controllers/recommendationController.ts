/**
 * Recommendation Controller
 * Handles meal recommendation logic
 */

import { Request, Response } from "express";
import {
  getMealRecommendations as generateRecommendations,
  validateUserPreferences,
} from "../services/mealRecommendationService.js";
import { getAllDishes } from "../models/dishModel.js";

/**
 * POST /api/recommendations
 * Get personalized meal recommendations for a user
 */
export const getMealRecommendations = (req: Request, res: Response) => {
  try {
    const { userPreferences } = req.body;

    // Validate user preferences
    const validation = validateUserPreferences(userPreferences);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: "Invalid user preferences",
        details: validation.errors,
      });
    }

    // Get all available meals/dishes
    const availableMeals = getAllDishes();

    if (availableMeals.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No meals available for recommendation",
      });
    }

    // Generate recommendations
    const recommendations = generateRecommendations({
      userPreferences,
      availableMeals,
    });

    return res.status(200).json({
      success: true,
      data: recommendations,
      message: "Meal recommendations generated successfully",
    });
  } catch (error: any) {
    console.error("Error generating meal recommendations:", error);
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to generate meal recommendations",
    });
  }
};
