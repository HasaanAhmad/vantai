/**
 * Request logger middleware - logs each request in a simple format.
 * Format: status method route duration [ip]
 * e.g. 200 GET / 2ms ::1
 */

import type { Request, Response, NextFunction } from "express";

function logLine(status: number, method: string, route: string, duration: number, ip: string): void {
  const line = `${status} ${method.padEnd(7)} ${route} ${duration}ms ${ip}\n`;
  if (status >= 500) process.stderr.write(line);
  else process.stdout.write(line);
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  let logged = false;

  const doLog = () => {
    if (logged) return;
    logged = true;
    const duration = Date.now() - start;
    const status = res.statusCode || 200;
    const route = req.originalUrl || req.path;
    const ip = req.ip ?? "-";
    logLine(status, req.method, route, duration, ip);
  };

  res.once("finish", doLog);
  res.once("close", doLog);

  next();
}
