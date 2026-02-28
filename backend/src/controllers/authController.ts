import express from 'express';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { signToken, signRefreshToken } from '../utils/jwt.js';
import { getUserByEmail, getUserById, createUser, emailExists, phoneExists, updateUser, getCustomerProfile, createCustomerProfile, updateCustomerProfile } from '../models/userQueries.js';
import { RegisterRequest, LoginRequest, VerifyOtpRequest, CustomerProfileRequest, AuthResponse } from '../types/auth.js';

// Generate a 6-digit OTP
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Step 1: Register a new customer
export const register = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { name, email, phone, password } = req.body as RegisterRequest;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      res.status(400).json({ success: false, message: 'name, email, phone, and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      return;
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check email uniqueness
    if (await emailExists(normalizedEmail)) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }

    // Check phone uniqueness
    if (await phoneExists(phone.trim())) {
      res.status(409).json({ success: false, message: 'Phone number already registered' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate OTP
    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user with pending status
    await createUser({
      fullName: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'customer',
      phone: phone.trim(),
      isActive: true,
      isVerified: false,
      status: 'pending',
      otpCode,
      otpExpiresAt,
    });

    // TODO: Send OTP via SMS/email service (e.g., Twilio, SendGrid)
    // For development, log OTP to console
    console.log(`[DEV] OTP for ${normalizedEmail}: ${otpCode}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your account with the OTP sent to your email.',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Step 2: Verify OTP
export const verifyOtp = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { email, otp } = req.body as VerifyOtpRequest;

    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'email and otp are required' });
      return;
    }

    const user = await getUserByEmail(email.toLowerCase().trim());

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ success: false, message: 'Account already verified' });
      return;
    }

    // Check OTP validity
    if (!user.otpCode || user.otpCode !== otp) {
      res.status(400).json({ success: false, message: 'Invalid OTP' });
      return;
    }

    // Check OTP expiration
    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      return;
    }

    // Mark user as verified and active
    await updateUser(user.id, {
      isVerified: true,
      status: 'active',
      otpCode: null,
      otpExpiresAt: null,
    });

    res.status(200).json({
      success: true,
      message: 'Account verified successfully. You can now log in.',
    });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Resend OTP
export const resendOtp = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'email is required' });
      return;
    }

    const user = await getUserByEmail(email.toLowerCase().trim());

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ success: false, message: 'Account already verified' });
      return;
    }

    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await updateUser(user.id, { otpCode, otpExpiresAt });

    // TODO: Send OTP via SMS/email service
    console.log(`[DEV] Resent OTP for ${email}: ${otpCode}`);

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully.',
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Step 3: Login
export const login = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const user = await getUserByEmail(email.toLowerCase().trim());

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    // Must be verified
    if (!user.isVerified) {
      res.status(403).json({ success: false, message: 'Account not verified. Please verify with OTP first.' });
      return;
    }

    // Must be active
    if (user.status !== 'active') {
      res.status(403).json({ success: false, message: 'Account is not active' });
      return;
    }

    // Must be customer for this endpoint
    if (user.role !== 'customer') {
      res.status(403).json({ success: false, message: 'This login is for customers only' });
      return;
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    // Check if profile exists
    const profile = await getCustomerProfile(user.id);

    // Generate tokens
    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const token = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const response: AuthResponse = {
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
        hasProfile: !!profile,
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Step 4: Complete customer profile (onboarding)
export const completeProfile = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { address, pincode, lat, lng, preference } = req.body as CustomerProfileRequest;

    if (!address || !pincode || !preference) {
      res.status(400).json({ success: false, message: 'address, pincode, and preference are required' });
      return;
    }

    // Check if profile already exists
    const existingProfile = await getCustomerProfile(req.user.userId);

    if (existingProfile) {
      // Update existing profile
      const updated = await updateCustomerProfile(req.user.userId, {
        address: address.trim(),
        pincode: pincode.trim(),
        lat: lat || null,
        lng: lng || null,
        preference: preference.trim(),
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        profile: updated,
      });
    } else {
      // Create new profile
      const newProfile = await createCustomerProfile({
        userId: req.user.userId,
        address: address.trim(),
        pincode: pincode.trim(),
        lat: lat || null,
        lng: lng || null,
        preference: preference.trim(),
      });

      res.status(201).json({
        success: true,
        message: 'Profile created successfully',
        profile: newProfile,
      });
    }
  } catch (error: any) {
    console.error('Complete profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get current user profile
export const getProfile = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await getUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const profile = await getCustomerProfile(user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        isVerified: user.isVerified,
        status: user.status,
        hasProfile: !!profile,
        createdAt: user.createdAt,
      },
      profile: profile || null,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
