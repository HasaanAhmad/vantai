/**
 * Meeting service - handles session launch, joining meetings, and bot lifecycle.
 * Extracted from index.ts for use by CLI and API routes.
 */

import { BrowserSession } from "../browser/session.js";
import { joinMeeting } from "../meeting/join.js";
import { config } from "../config/index.js";

export interface JoinMeetingParams {
  meetingUrl: string;
  botName?: string;
}

export interface MeetingSession {
  session: BrowserSession;
  close: () => Promise<void>;
}

/**
 * Parses meeting URL and bot name from args or env.
 */
export function parseMeetingArgs(args: string[]): JoinMeetingParams {
  const meetingUrl = args[0] ?? process.env.MEETING_URL ?? "https://meet.google.com/new";
  const botName = args[1] ?? process.env.BOT_NAME ?? config.defaultDisplayName;
  return { meetingUrl, botName };
}

/**
 * Launches a browser session and joins a meeting.
 * Returns the session for the caller to manage lifecycle.
 */
export async function startMeetingSession(params: JoinMeetingParams): Promise<MeetingSession> {
  const { meetingUrl, botName = config.defaultDisplayName } = params;

  const session = new BrowserSession();

  const page = await session.launch({
    headed: config.browser.headed,
    meetingUrl,
  });

  await joinMeeting(page, {
    meetingUrl,
    displayName: botName,
  });

  return {
    session,
    close: () => session.close(),
  };
}
