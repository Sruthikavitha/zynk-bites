import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: number;
  email: string;
  role: 'customer' | 'chef' | 'delivery' | 'admin';
}

// Short-lived access token (15 minutes)
export const signToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET || 'your_secret_key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

// Long-lived refresh token (7 days)
export const signRefreshToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your_refresh_secret_key';
  return jwt.sign(payload, secret, { expiresIn: '7d' } as jwt.SignOptions);
};

// Verify access token
export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET || 'your_secret_key';
  return jwt.verify(token, secret) as JwtPayload;
};

// Verify refresh token
export const verifyRefreshToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your_refresh_secret_key';
  return jwt.verify(token, secret) as JwtPayload;
};

// Extract token from Authorization header
export const extractToken = (authHeader?: string): string | null => {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  return null;
};
