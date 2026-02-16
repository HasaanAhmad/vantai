/**
 * Meeting routes
 */

import { Router, type IRouter } from "express";
import { joinMeeting, meetingHealth } from "../controllers/meeting.controller.js";

const router: IRouter = Router();

router.get("/health", meetingHealth);
router.post("/join", joinMeeting);

export default router;
