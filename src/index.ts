/**
 * Vantai - Meeting Requirements Bot
 *
 * A bot that joins meetings, listens to conversations, extracts requirements,
 * detects red flags, and converts them to technical requirements.
 *
 * Usage: pnpm dev <meeting_url> <bot_name>
 * Example: pnpm dev "https://meet.google.com/abc-defg-hij" "Vantai Bot"
 */

import { BrowserSession } from "./browser/session.js";
import { joinMeeting } from "./meeting/join.js";
import { config } from "./config/index.js";

function parseArgs(): { meetingUrl: string; botName: string } {
  const args = process.argv.slice(2);
  const meetingUrl = args[0] ?? process.env.MEETING_URL ?? "https://meet.google.com/new";
  const botName = args[1] ?? process.env.BOT_NAME ?? config.defaultDisplayName;
  return { meetingUrl, botName };
}

async function main(): Promise<void> {
  const { meetingUrl, botName } = parseArgs();
  console.log("[Vantai] Starting meeting bot...");
  console.log(`[Vantai] Meeting: ${meetingUrl}`);
  console.log(`[Vantai] Name: ${botName}`);

  const session = new BrowserSession();

  try {
    const page = await session.launch({
      headed: config.browser.headed,
      meetingUrl,
    });

    await joinMeeting(page, {
      meetingUrl,
      displayName: botName,
    });

    console.log("[Vantai] Bot joined meeting. Press Ctrl+C to exit.");

    process.on("SIGINT", async () => {
      console.log("\n[Vantai] Shutting down...");
      await session.close();
      process.exit(0);
    });

    // Keep the process running until SIGINT
    await new Promise<void>(() => {});
  } catch (error) {
    console.error("[Vantai] Error:", error);
    await session.close();
    process.exit(1);
  }
}

main();
