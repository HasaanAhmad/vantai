/**
 * Meeting routes - protected by auth (except health check).
 */

import { Router, type IRouter } from "express";
import { joinMeeting, meetingHealth } from "@/controllers/meeting.controller";
import { requireAuth } from "@/middleware/requireAuth";

const router: IRouter = Router();

router.get("/health", meetingHealth);
router.post("/join", requireAuth, joinMeeting);

export default router;
