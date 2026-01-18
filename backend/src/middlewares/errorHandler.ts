import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../types";
import { logger } from "../utils/logger";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response<ApiResponse<null>>,
  _next: NextFunction,
): void => {
  const statusCode = err.statusCode ?? 500;
  const message = err.message || "Internal Server Error";

  logger.error(`Error ${statusCode}: ${message}`, {
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? "Internal Server Error" : message,
    message: statusCode === 500 ? "An unexpected error occurred" : message,
  });
};

export const notFoundHandler = (req: Request, res: Response<ApiResponse<null>>, _next: NextFunction): void => {
  res.status(404).json({
    success: false,
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
  });
};

export const asyncHandler = <T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
