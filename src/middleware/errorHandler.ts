/**
 * Global error handler middleware.
 * Must be registered last, after all routes.
 */

import type { Request, Response, NextFunction } from "express";

export interface HttpError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message = statusCode >= 500 ? "Internal server error" : err.message ?? "Something went wrong";

  if (statusCode >= 500) {
    console.error("[Error]", err);
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
