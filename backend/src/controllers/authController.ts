import express from 'express';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { signToken, signRefreshToken } from '../utils/jwt.js';
import { getUserByEmail, getUserById, createUser, emailExists, phoneExists, updateUser, getCustomerProfile, createCustomerProfile, updateCustomerProfile } from '../models/userQueries.js';
import { RegisterRequest, LoginRequest, VerifyOtpRequest, CustomerProfileRequest, AuthResponse } from '../types/auth.js';
import { emitNotification } from '../services/notificationService.js';

const generateOtp = (): string => Math.floor(100000 + Math.random() * 900000).toString();

export const register = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { name, email, phone, password, role } = req.body as RegisterRequest & { role?: 'customer' | 'chef' };
    if (!name || !email || !phone || !password) {
      res.status(400).json({ success: false, message: 'name, email, phone, and password are required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (await emailExists(normalizedEmail)) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }
    if (await phoneExists(phone.trim())) {
      res.status(409).json({ success: false, message: 'Phone number already registered' });
      return;
    }

    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await createUser({
      fullName: name.trim(),
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      role: role === 'chef' ? 'chef' : 'customer',
      phone: phone.trim(),
      isActive: true,
      isVerified: false,
      status: 'pending',
      otpCode,
      otpExpiresAt,
    });

    console.log(`[DEV] OTP for ${normalizedEmail}: ${otpCode}`);
    emitNotification({ userId: user.id, type: 'otp_generated', title: 'Verify your account', message: 'Verify your account to continue' });

    res.status(201).json({ success: true, message: 'Registration successful. Verify OTP to continue.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const verifyOtp = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { email, otp } = req.body as VerifyOtpRequest;
    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'email and otp are required' });
      return;
    }

    const user = await getUserByEmail(email.toLowerCase().trim());
    if (!user || !user.otpCode || user.otpCode !== otp || !user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      return;
    }

    await updateUser(user.id, { isVerified: true, status: 'active', otpCode: null, otpExpiresAt: null });
    emitNotification({ userId: user.id, type: 'account_activated', title: 'Account activated', message: 'Your ZYNK account is activated' });

    res.status(200).json({ success: true, message: 'Account verified successfully.' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const resendOtp = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ success: false, message: 'email is required' });
      return;
    }
    const user = await getUserByEmail(email.toLowerCase().trim());
    if (!user || user.isVerified) {
      res.status(400).json({ success: false, message: 'Invalid request' });
      return;
    }

    const otpCode = generateOtp();
    await updateUser(user.id, { otpCode, otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000) });
    console.log(`[DEV] Resent OTP for ${email}: ${otpCode}`);
    emitNotification({ userId: user.id, type: 'otp_generated', title: 'Verify your account', message: 'Verify your account to continue' });

    res.status(200).json({ success: true, message: 'OTP resent successfully.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const login = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginRequest;
    const user = await getUserByEmail(email.toLowerCase().trim());

    if (!user || !user.isVerified || user.status !== 'active' || !(await comparePassword(password, user.passwordHash))) {
      res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
      return;
    }

    const profile = user.role === 'customer' ? await getCustomerProfile(user.id) : null;
    const payload = { userId: user.id, email: user.email, role: user.role };

    const response: AuthResponse = {
      success: true,
      message: 'Login successful',
      token: signToken(payload),
      refreshToken: signRefreshToken(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
        hasProfile: user.role === 'customer' ? !!profile : true,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const completeProfile = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { address, pincode, lat, lng, preference } = req.body as CustomerProfileRequest;
    const existingProfile = await getCustomerProfile(req.user.userId);

    const profile = existingProfile
      ? await updateCustomerProfile(req.user.userId, { address: address.trim(), pincode: pincode.trim(), lat: lat || null, lng: lng || null, preference: preference.trim() })
      : await createCustomerProfile({ userId: req.user.userId, address: address.trim(), pincode: pincode.trim(), lat: lat || null, lng: lng || null, preference: preference.trim() });

    emitNotification({ userId: req.user.userId, type: 'profile_completed', title: 'Profile completed', message: 'Profile completed successfully' });

    res.status(existingProfile ? 200 : 201).json({
      success: true,
      message: existingProfile ? 'Profile updated successfully' : 'Profile created successfully',
      profile,
      redirectTo: '/customer/home',
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

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
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
