// Type definitions for authentication requests and responses

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  user?: {
    id: number;
    email: string;
    fullName: string;
    role: 'customer' | 'chef' | 'delivery' | 'admin';
    isVerified: boolean;
    hasProfile: boolean;
  };
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CustomerProfileRequest {
  address: string;
  pincode: string;
  lat?: number;
  lng?: number;
  preference: string;
}
