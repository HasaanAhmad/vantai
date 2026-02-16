/**
 * Meeting controller - handles HTTP requests for meeting operations.
 */

import type { Request, Response } from "express";
import { startMeetingSession } from "../services/meeting.service.js";

/** Basic URL validation for meeting links */
function isValidMeetingUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * POST /api/meetings/join
 * Body: { meetingLink: string, name: string }
 * Triggers the meeting bot. Requires both name and meeting link.
 * Returns 202 immediately; bot runs in background.
 */
export async function joinMeeting(req: Request, res: Response): Promise<void> {
  const { meetingLink, name } = req.body ?? {};

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "name is required and must be non-empty" });
    return;
  }

  if (!meetingLink || typeof meetingLink !== "string" || !meetingLink.trim()) {
    res.status(400).json({ error: "meetingLink is required and must be non-empty" });
    return;
  }

  const meetingUrl = meetingLink.trim();
  if (!isValidMeetingUrl(meetingUrl)) {
    res.status(400).json({ error: "meetingLink must be a valid URL (e.g. https://meet.google.com/xxx-xxxx-xxx)" });
    return;
  }

  const botName = name.trim();

  // Return immediately; run bot in background
  res.status(202).json({
    message: "Meeting bot triggered",
    meetingLink: meetingUrl,
    botName,
  });

  // Run bot asynchronously so the request doesn't block
  startMeetingSession({ meetingUrl, botName }).catch((error) => {
    console.error("[Meeting] Bot error:", error);
  });
}

/**
 * GET /api/meetings/health
 * Health check for meeting service.
 */
export function meetingHealth(_req: Request, res: Response): void {
  res.json({ status: "ok", service: "meeting" });
}
