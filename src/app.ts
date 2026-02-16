
import "dotenv/config";
import express, { type Express } from "express";
import authRouter from "./routes/auth.route.js";
import meetingRouter from "./routes/meeting.route.js";

const app: Express = express();

app.set("trust proxy", true);

// Middleware
app.use(express.json());

// Routes
app.use("/auth", authRouter);
app.use("/api/meetings", meetingRouter);

// Root health check
app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "vantai" });
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`[Vantai] Server listening on http://localhost:${PORT}`);
});

export default app;
