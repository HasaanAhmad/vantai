/**
 * Meeting join logic - navigates to meeting URL, enters name, and joins the call.
 * Supports Google Meet pre-join screen.
 */

import type { ElementHandle, Page } from "puppeteer";

export interface JoinMeetingOptions {
  /** Full meeting URL (e.g., Google Meet, Zoom, Teams link) */
  meetingUrl: string;
  /** Display name for the bot in the meeting */
  displayName?: string;
}

/** Google Meet name input selector */
const NAME_INPUT_SELECTOR = 'input[aria-label="Your name"]';

/**
 * Joins a meeting via the provided URL.
 * Fills the name field and clicks join. Assumes fake audio/video devices are enabled.
 */
export async function joinMeeting(
  page: Page,
  options: JoinMeetingOptions
): Promise<void> {
  const { meetingUrl, displayName = "Meeting Bot" } = options;

  await page.goto(meetingUrl, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  // Wait for and fill the name input (Google Meet pre-join screen)
  const nameInput = await page.waitForSelector(NAME_INPUT_SELECTOR, {
    timeout: 15000,
  });

  if (nameInput) {
    await nameInput.click({ clickCount: 3 }); // Select any existing text
    await nameInput.type(displayName, { delay: 50 });
    console.log(`[Meeting] Entered name: ${displayName}`);
    await nameInput.dispose();
  }

  // Wait for button to appear (validates name, loads UI)
  await new Promise((r) => setTimeout(r, 1500));

  // Find and click the button that says "Ask to join" (text-based only, no classes)
  const joinButton = await findAskToJoinButton(page);
  if (joinButton) {
    await joinButton.click();
    console.log("[Meeting] Clicked Ask to join.");
  } else {
    console.warn("[Meeting] Ask to join button not found. You may need to click it manually.");
  }

  // Browser stays open - process runs until Ctrl+C
}

async function findAskToJoinButton(page: Page): Promise<ElementHandle<Element> | null> {
  // Find button by visible text "Ask to join" only - no classes, no attributes
  const handle = await page.waitForFunction(
    () => {
      const clickables = document.querySelectorAll("button, [role='button']");
      for (const el of Array.from(clickables)) {
        if (el.textContent?.trim().includes("Ask to join")) return el;
      }
      return null;
    },
    { timeout: 15000 }
  );
  return handle.asElement() as ElementHandle<Element> | null;
}
