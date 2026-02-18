/**
 * Express app - middleware, routes, error handling.
 * Import app for testing; use server.ts to run.
 */

import express, { type Express } from "express";
import { requestLogger } from "@/middleware/logger";
import { errorHandler } from "@/middleware/errorHandler";
import { authRouter, meetingRouter } from "@/routes/index";

const app: Express = express();

app.set("trust proxy", true);

// CORS - allow frontend origin with credentials for auth cookies
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_URL);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// Middleware (logger first so it runs for every request)
app.use(requestLogger);
app.use(express.json());

// Routes
app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "vantai" });
});
app.use("/auth", authRouter);
app.use("/api/meetings", meetingRouter);

// 404 - no route matched
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
