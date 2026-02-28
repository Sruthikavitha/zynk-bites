import { z, ZodError } from 'zod';
import express from 'express';

// --- Auth Schemas ---

// Customer registration (Step 1)
export const customerRegisterSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().trim().email('Invalid email format').max(255),
  phone: z.string().trim().min(10, 'Phone must be at least 10 digits').max(20),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

// OTP verification (Step 2)
export const verifyOtpSchema = z.object({
  email: z.string().trim().email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// Login (Step 3)
export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Customer profile completion (Step 4)
export const customerProfileSchema = z.object({
  address: z.string().trim().min(5, 'Address must be at least 5 characters').max(500),
  pincode: z.string().trim().min(4, 'Pincode must be at least 4 characters').max(10),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  preference: z.enum(['vegetarian', 'non-vegetarian', 'vegan', 'keto', 'gluten-free']),
});

// Legacy schema kept for backwards compatibility
export const registerSchema = z.object({
  fullName: z.string().min(2, 'fullName must be at least 2 characters').max(255),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'password must be at least 6 characters').max(100),
  role: z.enum(['customer', 'chef']).optional().default('customer'),
  chefBusinessName: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
});

// --- Subscription Schemas ---

export const createSubscriptionSchema = z.object({
  planName: z.string().min(1, 'planName is required').max(100),
  mealsPerWeek: z.number().int().min(1, 'mealsPerWeek must be at least 1'),
  priceInCents: z.number().int().min(0, 'priceInCents must be non-negative'),
  deliveryAddress: z.string().min(5, 'deliveryAddress is required').max(255),
  postalCode: z.string().min(3, 'postalCode is required').max(20),
  city: z.string().min(2, 'city is required').max(100),
});

export const updateAddressSchema = z.object({
  deliveryAddress: z.string().min(5, 'deliveryAddress is required').max(255),
  postalCode: z.string().min(3, 'postalCode is required').max(20),
  city: z.string().min(2, 'city is required').max(100),
});

export const swapMealSchema = z.object({
  newMealId: z.number().int().min(1, 'newMealId must be a valid number'),
});

// --- Recommendation Schemas ---

export const recommendationSchema = z.object({
  userPreferences: z.object({
    dietType: z.enum(['vegetarian', 'non-vegetarian', 'vegan', 'keto', 'gluten-free']),
    healthGoal: z.enum(['weight-loss', 'muscle-gain', 'maintenance', 'energy', 'balanced']),
    allergies: z.array(z.string()).default([]),
    dislikedFoods: z.array(z.string()).default([]),
    mealHistory: z.array(z.string()).default([]),
  }),
});

export const skipDecisionSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner']),
  skipCount: z.number().int().min(0, 'skipCount must be non-negative'),
  healthGoal: z.enum(['weight-loss', 'muscle-gain', 'maintenance', 'energy', 'balanced']),
  subscriptionStatus: z.enum(['active', 'paused', 'cancelled']),
  consecutiveSkips: z.number().int().min(0).optional().default(0),
  lastMealTime: z.string().datetime().optional(),
});

// Validation middleware factory
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors[0]?.message || 'Validation error';
        return res.status(400).json({ success: false, message });
      }
      next(error);
    }
  };
};
