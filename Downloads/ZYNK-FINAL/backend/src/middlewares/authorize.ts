import express from 'express';
import { JwtPayload } from '../utils/jwt.js';

// Role-based access control middleware factory
// Accepts array of allowed roles and returns middleware function
export const authorize = (allowedRoles: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Check if user data exists (should be attached by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if user's role is in allowed roles list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Required roles: ${allowedRoles.join(', ')}` });
    }

    // User has required role, proceed to next middleware
    next();
  };
};

// Convenience functions for specific roles
export const isAdmin = authorize(['admin']);
export const isChef = authorize(['chef']);
export const isDelivery = authorize(['delivery']);
export const isCustomer = authorize(['customer']);
export const isChefOrAdmin = authorize(['chef', 'admin']);
