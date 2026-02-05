/**
 * Meal Skip Decision Service
 * Provides intelligent suggestions for meal skipping based on user health and subscription status
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner';
export type HealthGoal = 'weight-loss' | 'muscle-gain' | 'maintenance' | 'energy' | 'balanced';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
export type SkipAction = 'skip' | 'suggest_light_meal' | 'reschedule';

export interface SkipDecisionRequest {
  mealType: MealType;
  skipCount: number; // meals skipped this week
  healthGoal: HealthGoal;
  subscriptionStatus: SubscriptionStatus;
  consecutiveSkips?: number; // consecutive days of skips
  lastMealTime?: string; // when they last ate
}

export interface SkipDecisionResponse {
  action: SkipAction;
  message: string;
  riskLevel?: 'low' | 'medium' | 'high';
  alternatives?: string[];
  reasoning?: string;
}

/**
 * Decide whether a user should skip a meal
 */
export const getSkipDecision = (
  request: SkipDecisionRequest
): SkipDecisionResponse => {
  const {
    mealType,
    skipCount,
    healthGoal,
    subscriptionStatus,
    consecutiveSkips = 0,
    lastMealTime,
  } = request;

  // Check subscription status
  if (subscriptionStatus !== 'active') {
    return {
      action: 'reschedule',
      message: `Your subscription is ${subscriptionStatus}. Please reactivate to manage meals.`,
      riskLevel: 'high',
    };
  }

  // Calculate skip risk score
  const riskScore = calculateRiskScore({
    skipCount,
    healthGoal,
    mealType,
    consecutiveSkips,
    lastMealTime,
  });

  // Decision logic based on risk level
  if (riskScore >= 7) {
    return {
      action: 'suggest_light_meal',
      message: `We suggest having a light ${mealType} instead of skipping. You've already skipped ${skipCount} meals this week, and your ${healthGoal} goal requires regular nutrition.`,
      riskLevel: 'high',
      alternatives: getSuggestedLightMeals(mealType, healthGoal),
      reasoning: `High skip frequency (${skipCount} meals) combined with ${healthGoal} goals.`,
    };
  }

  if (riskScore >= 4) {
    return {
      action: 'suggest_light_meal',
      message: `Consider having a light meal instead. Missing multiple ${mealType}s can impact your ${healthGoal} progress.`,
      riskLevel: 'medium',
      alternatives: getSuggestedLightMeals(mealType, healthGoal),
      reasoning: `Moderate skip frequency with ${healthGoal} health goal.`,
    };
  }

  // Low risk - skipping is safe
  return {
    action: 'skip',
    message: `It's safe to skip this ${mealType}. Make sure to eat well at your next meal!`,
    riskLevel: 'low',
    reasoning: `Low skip frequency and reasonable health profile.`,
  };
};

/**
 * Calculate skip risk score (0-10)
 */
const calculateRiskScore = (params: {
  skipCount: number;
  healthGoal: HealthGoal;
  mealType: MealType;
  consecutiveSkips: number;
  lastMealTime?: string;
}): number => {
  let score = 0;

  const { skipCount, healthGoal, mealType, consecutiveSkips, lastMealTime } =
    params;

  // Skip frequency scoring
  if (skipCount >= 5) score += 3;
  else if (skipCount >= 3) score += 2;
  else if (skipCount >= 1) score += 1;

  // Consecutive skips scoring
  if (consecutiveSkips >= 2) score += 2;
  else if (consecutiveSkips >= 1) score += 1;

  // Health goal impact
  if (healthGoal === 'muscle-gain') score += 2; // High protein needs
  if (healthGoal === 'energy') score += 1; // Energy needs regular fuel
  if (healthGoal === 'weight-loss') score -= 1; // Controlled skipping is OK

  // Meal type impact
  if (mealType === 'breakfast') score += 1; // Breakfast is important
  if (mealType === 'lunch') score -= 0.5; // Lunch is most flexible

  // Last meal time check
  if (lastMealTime) {
    const hoursSinceLastMeal = getHoursSince(lastMealTime);
    if (hoursSinceLastMeal > 12) score += 1; // Long time without eating
    if (hoursSinceLastMeal > 18) score += 2; // Very long time
  }

  return Math.min(10, Math.max(0, score));
};

/**
 * Get hours since last meal
 */
const getHoursSince = (isoTime: string): number => {
  const lastMealDate = new Date(isoTime);
  const now = new Date();
  const diffMs = now.getTime() - lastMealDate.getTime();
  return diffMs / (1000 * 60 * 60);
};

/**
 * Get suggested light meals for the meal type and health goal
 */
const getSuggestedLightMeals = (
  mealType: MealType,
  healthGoal: HealthGoal
): string[] => {
  const suggestions: { [key in MealType]: { [key in HealthGoal]: string[] } } =
    {
      breakfast: {
        'weight-loss': ['Egg white scramble', 'Greek yogurt with berries', 'Oatmeal with honey'],
        'muscle-gain': ['Protein pancakes', 'Egg breakfast bowl', 'Protein smoothie'],
        maintenance: ['Toast with avocado', 'Cereal with milk', 'Fruit and yogurt'],
        energy: ['Banana with peanut butter', 'Granola with milk', 'Whole grain toast'],
        balanced: ['Mixed fruit bowl', 'Toast with eggs', 'Smoothie bowl'],
      },
      lunch: {
        'weight-loss': ['Grilled chicken salad', 'Veggie soup', 'Turkey wrap'],
        'muscle-gain': ['Chicken rice bowl', 'Protein-packed salad', 'Fish with sweet potato'],
        maintenance: ['Sandwich', 'Pasta salad', 'Stir-fry bowl'],
        energy: ['Whole grain pasta', 'Energy bowl with nuts', 'Whole wheat sandwich'],
        balanced: ['Mixed grain bowl', 'Balanced plate', 'Vegetable curry'],
      },
      dinner: {
        'weight-loss': ['Grilled fish and veggies', 'Lean meat salad', 'Vegetable stir-fry'],
        'muscle-gain': ['Steak with sides', 'Salmon and potatoes', 'Protein pasta'],
        maintenance: ['Light pasta', 'Grilled chicken', 'Vegetable soup'],
        energy: ['Whole grain bowl', 'Nutritious stew', 'Grain and protein bowl'],
        balanced: ['Balanced dinner plate', 'Mixed vegetables with protein', 'Rice and beans'],
      },
    };

  return suggestions[mealType][healthGoal] || ['Light meal'];
};

/**
 * Validate skip decision request
 */
export const validateSkipRequest = (
  request: SkipDecisionRequest
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const validMealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
  if (!validMealTypes.includes(request.mealType)) {
    errors.push(`Invalid meal type. Must be: ${validMealTypes.join(', ')}`);
  }

  const validGoals: HealthGoal[] = [
    'weight-loss',
    'muscle-gain',
    'maintenance',
    'energy',
    'balanced',
  ];
  if (!validGoals.includes(request.healthGoal)) {
    errors.push(`Invalid health goal. Must be: ${validGoals.join(', ')}`);
  }

  const validStatuses: SubscriptionStatus[] = ['active', 'paused', 'cancelled'];
  if (!validStatuses.includes(request.subscriptionStatus)) {
    errors.push(`Invalid subscription status. Must be: ${validStatuses.join(', ')}`);
  }

  if (request.skipCount < 0) {
    errors.push('Skip count cannot be negative');
  }

  if (request.skipCount > 21) {
    errors.push('Skip count seems too high (more than 3 per day)');
  }

  if (request.consecutiveSkips && request.consecutiveSkips < 0) {
    errors.push('Consecutive skips cannot be negative');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Get personalized health tips based on skip pattern
 */
export const getHealthTips = (
  skipCount: number,
  healthGoal: HealthGoal
): string[] => {
  const tips: string[] = [];

  if (skipCount >= 5) {
    tips.push('Consider spreading out your meals more evenly throughout the week');
  }

  if (healthGoal === 'muscle-gain' && skipCount > 2) {
    tips.push('Regular meals are crucial for muscle building - try not to skip');
  }

  if (healthGoal === 'weight-loss' && skipCount === 0) {
    tips.push('Great consistency! Controlled meal skipping combined with light meals can boost results');
  }

  if (healthGoal === 'energy' && skipCount >= 3) {
    tips.push('Skipping meals can reduce energy levels - try eating smaller, frequent meals instead');
  }

  if (tips.length === 0) {
    tips.push('You\'re doing well with meal management!');
  }

  return tips;
};
