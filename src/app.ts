/**
 * Express app - middleware, routes, error handling.
 * Import app for testing; use server.ts to run.
 */

import express, { type Express } from "express";
import { requestLogger } from "@/middleware/logger";
import { errorHandler } from "@/middleware/errorHandler";
import { authRouter, meetingRouter } from "@/routes/index";
import path from "path";

const app: Express = express();

app.set("trust proxy", true);

// Middleware (logger first so it runs for every request)
app.use(requestLogger);
app.use(express.json());

// Routes
app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "vantai" });
});

// Serve auth pages (avoid conflicts with Auth.js routes)
app.get("/signin", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "src/views/signin.html"));
});

app.get("/auth/error", (req, res) => {
  const error = req.query.error as string;
  const errorDescription = req.query.error_description as string;
  
  res.send(`
    <html>
      <head>
        <title>Authentication Error - Vantai</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .error-container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            width: 100%;
          }
          .error-details {
            background: #fee;
            border: 1px solid #fcc;
            border-radius: 4px;
            padding: 1rem;
            margin: 1rem 0;
            text-align: left;
            font-family: monospace;
            font-size: 14px;
          }
          .back-btn {
            display: inline-block;
            background: #4285f4;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            margin-top: 1rem;
          }
          .back-btn:hover {
            background: #357ae8;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>Authentication Error</h1>
          <p>There was an error signing in. Please try again.</p>
          
          ${error ? `
            <div class="error-details">
              <strong>Error:</strong> ${error}<br>
              ${errorDescription ? `<strong>Description:</strong> ${errorDescription}` : ''}
            </div>
          ` : ''}
          
          <a href="/signin" class="back-btn">Back to sign in</a>
        </div>
      </body>
    </html>
  `);
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
