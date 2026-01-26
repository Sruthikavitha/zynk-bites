import express from 'express';
import { AppError } from '../utils/errors.js';

// Global error handling middleware: Catches all errors from routes and controllers
export const errorHandler = (
  error: Error | AppError,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // Log error for debugging
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });

  // Handle custom AppError
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.details && { details: error.details }),
      ...(error.statusCode === 423 && error instanceof Error && 'nextAvailableAt' in error && { nextAvailableAt: (error as any).nextAvailableAt }),
    });
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
    });
  }

  // Handle unknown errors
  const statusCode = 'statusCode' in error ? (error as any).statusCode : 500;
  const message = process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

// 404 not found middleware: Catches requests to undefined routes
export const notFoundHandler = (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
};
