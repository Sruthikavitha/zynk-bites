/**
 * Meal Recommendation Service
 * Provides AI-powered meal recommendations based on user preferences, health goals, and allergies
 */

import type { Dish } from "../types/index.js";

export interface UserPreferences {
  dietType: "vegetarian" | "non-vegetarian" | "vegan" | "keto" | "gluten-free";
  healthGoal: "weight-loss" | "muscle-gain" | "maintenance" | "energy" | "balanced";
  allergies: string[];
  dislikedFoods: string[];
  mealHistory: string[]; // Past 5 meal names to avoid repetition
}

export interface MealRecommendationRequest {
  userPreferences: UserPreferences;
  availableMeals: Dish[];
}

export interface MealRecommendation {
  breakfast: {
    mealId: string;
    mealName: string;
    reason: string;
  };
  lunch: {
    mealId: string;
    mealName: string;
    reason: string;
  };
  dinner: {
    mealId: string;
    mealName: string;
    reason: string;
  };
  shortReason: string;
}

/**
 * Get meal recommendations based on user preferences
 */
export const getMealRecommendations = (
  request: MealRecommendationRequest
): MealRecommendation => {
  const { userPreferences, availableMeals } = request;

  // Filter meals based on preferences
  const filteredMeals = filterMealsByPreferences(availableMeals, userPreferences);

  if (filteredMeals.length < 3) {
    throw new Error("Not enough meals available that match your preferences");
  }

  // Get recommendations for each meal time
  const breakfast = recommendMealForTime(
    filteredMeals,
    "breakfast",
    userPreferences,
    []
  );

  const lunch = recommendMealForTime(
    filteredMeals,
    "lunch",
    userPreferences,
    [breakfast.mealId]
  );

  const dinner = recommendMealForTime(
    filteredMeals,
    "dinner",
    userPreferences,
    [breakfast.mealId, lunch.mealId]
  );

  return {
    breakfast,
    lunch,
    dinner,
    shortReason: generateShortReason(userPreferences),
  };
};

/**
 * Filter meals based on user preferences
 */
const filterMealsByPreferences = (
  meals: Dish[],
  preferences: UserPreferences
): Dish[] => {
  return meals.filter((meal) => {
    // Check diet type
    if (preferences.dietType === "vegetarian" && meal.category === "non-veg") {
      return false;
    }
    if (preferences.dietType === "vegan" && meal.category === "non-veg") {
      return false;
    }

    // Check allergies
    const mealLower = meal.name.toLowerCase();
    for (const allergen of preferences.allergies) {
      if (mealLower.includes(allergen.toLowerCase())) {
        return false;
      }
    }

    // Check disliked foods
    for (const dislike of preferences.dislikedFoods) {
      if (mealLower.includes(dislike.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Recommend a meal for a specific time of day
 */
const recommendMealForTime = (
  meals: Dish[],
  mealTime: "breakfast" | "lunch" | "dinner",
  preferences: UserPreferences,
  excludeIds: string[]
): { mealId: string; mealName: string; reason: string } => {
  const availableMeals = meals.filter((m) => !excludeIds.includes(m.id));

  // Score meals based on nutritional goals and meal time
  const scoredMeals = availableMeals.map((meal) => {
    let score = 0;

    // Health goal alignment
    if (preferences.healthGoal === "weight-loss") {
      // Prefer lower calorie meals
      if (meal.nutritionalInfo.calories < 450) score += 3;
      if (meal.nutritionalInfo.protein > 25) score += 2; // High protein helps satiety
      if (meal.nutritionalInfo.fat < 12) score += 2;
    } else if (preferences.healthGoal === "muscle-gain") {
      // Prefer high protein meals
      if (meal.nutritionalInfo.protein > 35) score += 3;
      if (meal.nutritionalInfo.carbs > 45) score += 2;
      if (meal.nutritionalInfo.calories > 500) score += 1;
    } else if (preferences.healthGoal === "energy") {
      // Prefer balanced meals with good carbs
      if (meal.nutritionalInfo.calories > 450) score += 2;
      if (meal.nutritionalInfo.carbs > 45) score += 2;
      if (meal.nutritionalInfo.protein > 20) score += 1;
    } else {
      // Balanced - prefer well-rounded meals
      score +=
        meal.nutritionalInfo.protein > 18 ? 1 : 0;
      score +=
        meal.nutritionalInfo.carbs > 40 ? 1 : 0;
      score +=
        meal.nutritionalInfo.fat > 10 && meal.nutritionalInfo.fat < 20
          ? 1
          : 0;
    }

    // Meal time preferences
    if (mealTime === "breakfast") {
      // Breakfast should be lighter, quick energy
      if (meal.nutritionalInfo.calories < 500) score += 2;
      if (meal.nutritionalInfo.carbs > 40) score += 1; // Energy boost
    } else if (mealTime === "lunch") {
      // Lunch should be filling and nutritious
      if (meal.nutritionalInfo.protein > 25) score += 1;
      if (meal.nutritionalInfo.calories > 400 && meal.nutritionalInfo.calories < 600) score += 2;
    } else if (mealTime === "dinner") {
      // Dinner should be lighter, easier to digest
      if (meal.nutritionalInfo.calories < 500) score += 1;
      if (meal.nutritionalInfo.protein > 20) score += 2; // Protein for overnight recovery
    }

    // Bonus for diversity (avoid meals in recent history)
    const mealNameLower = meal.name.toLowerCase();
    const inHistory = preferences.mealHistory.some((h) =>
      mealNameLower.includes(h.toLowerCase()) ||
      h.toLowerCase().includes(mealNameLower)
    );
    if (!inHistory) score += 2;

    return { meal, score };
  });

  // Sort by score and pick the best one
  const bestMeal = scoredMeals.sort((a, b) => b.score - a.score)[0];

  return {
    mealId: bestMeal.meal.id,
    mealName: bestMeal.meal.name,
    reason: generateMealReason(bestMeal.meal, preferences, mealTime),
  };
};

/**
 * Generate a reason for the meal recommendation
 */
const generateMealReason = (
  meal: Dish,
  preferences: UserPreferences,
  mealTime: string
): string => {
  const reasons: string[] = [];

  if (preferences.healthGoal === "weight-loss") {
    if (meal.nutritionalInfo.calories < 450) {
      reasons.push("low in calories");
    }
    if (meal.nutritionalInfo.protein > 25) {
      reasons.push("high in protein for satiety");
    }
  } else if (preferences.healthGoal === "muscle-gain") {
    if (meal.nutritionalInfo.protein > 35) {
      reasons.push("excellent protein source");
    }
    if (meal.nutritionalInfo.carbs > 45) {
      reasons.push("good carbs for energy");
    }
  } else if (preferences.healthGoal === "energy") {
    if (meal.nutritionalInfo.carbs > 45) {
      reasons.push("provides sustained energy");
    }
  }

  if (mealTime === "breakfast") {
    reasons.push("perfect for breakfast energy");
  } else if (mealTime === "lunch") {
    reasons.push("nutritious lunch option");
  } else if (mealTime === "dinner") {
    reasons.push("light and satisfying dinner");
  }

  if (meal.allowsCustomization) {
    reasons.push("can be customized to your preference");
  }

  return reasons.join(" • ");
};

/**
 * Generate a short overall recommendation reason
 */
const generateShortReason = (preferences: UserPreferences): string => {
  const parts: string[] = [];

  if (preferences.healthGoal === "weight-loss") {
    parts.push("Recommended for weight loss goals");
  } else if (preferences.healthGoal === "muscle-gain") {
    parts.push("Recommended for muscle building");
  } else if (preferences.healthGoal === "energy") {
    parts.push("Recommended for sustained energy");
  } else {
    parts.push("Recommended for balanced nutrition");
  }

  if (preferences.dietType === "vegetarian") {
    parts.push("Vegetarian options selected");
  } else if (preferences.dietType === "vegan") {
    parts.push("Vegan options selected");
  } else if (preferences.dietType === "keto") {
    parts.push("Low-carb keto-friendly meals selected");
  }

  return parts.join(" • ");
};

/**
 * Validate meal preferences
 */
export const validateUserPreferences = (
  preferences: UserPreferences
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const validDietTypes = ["vegetarian", "non-vegetarian", "vegan", "keto", "gluten-free"];
  if (!validDietTypes.includes(preferences.dietType)) {
    errors.push(`Invalid diet type. Must be one of: ${validDietTypes.join(", ")}`);
  }

  const validGoals = ["weight-loss", "muscle-gain", "maintenance", "energy", "balanced"];
  if (!validGoals.includes(preferences.healthGoal)) {
    errors.push(`Invalid health goal. Must be one of: ${validGoals.join(", ")}`);
  }

  if (!Array.isArray(preferences.allergies)) {
    errors.push("Allergies must be an array");
  }

  if (!Array.isArray(preferences.dislikedFoods)) {
    errors.push("Disliked foods must be an array");
  }

  if (!Array.isArray(preferences.mealHistory)) {
    errors.push("Meal history must be an array");
  }

  return { valid: errors.length === 0, errors };
};
