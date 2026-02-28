import express from 'express';
import { register, login, getProfile, verifyOtp, resendOtp, completeProfile } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest, customerRegisterSchema, loginSchema, verifyOtpSchema, customerProfileSchema } from '../middlewares/validation.js';

const router = express.Router();

// Public routes
// POST /api/auth/register — Step 1: Create account (no JWT issued)
router.post('/register', validateRequest(customerRegisterSchema), register);

// POST /api/auth/verify — Step 2: Verify OTP
router.post('/verify', validateRequest(verifyOtpSchema), verifyOtp);

// POST /api/auth/resend-otp — Resend OTP
router.post('/resend-otp', resendOtp);

// POST /api/auth/login — Step 3: Login (verified + active customers only)
router.post('/login', validateRequest(loginSchema), login);

// Protected routes
// GET /api/auth/profile — Get current user's profile
router.get('/profile', authenticate, getProfile);

// POST /api/auth/profile — Step 4: Complete/update customer profile (onboarding)
router.post('/profile', authenticate, validateRequest(customerProfileSchema), completeProfile);

export default router;
