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
