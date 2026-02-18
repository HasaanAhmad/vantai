/**
 * Meeting join logic - navigates to meeting URL, enters name, and joins the call.
 * Supports Google Meet pre-join screen.
 *
 * Flow:
 *  1. Navigate to meeting URL
 *  2. Wait for name input, fill it via clipboard paste (avoids React re-render clearing)
 *  3. Click "Ask to join"
 *  4. While in waiting room: mute mic + disable camera (buttons are stable here)
 *  5. Poll every 2s until host admits the bot (verified via meeting code in bottom bar)
 *  6. Turn on captions
 */

import type { ElementHandle, Page } from "puppeteer";
import { startCaptionScraper, type CaptionEmitter } from "@/meeting/captions";

export interface JoinMeetingOptions {
  /** Full meeting URL (e.g., Google Meet link) */
  meetingUrl: string;
  /** Display name for the bot in the meeting */
  displayName?: string;
  /** Optional custom caption emitter (defaults to console logger) */
  onCaption?: CaptionEmitter;
}

// ─── Selectors ────────────────────────────────────────────────────────────────

/** Google Meet name input on the pre-join screen */
const NAME_INPUT_SELECTOR = 'input[aria-label="Your name"]';

/**
 * Text that appears in the waiting room div.
 * We match by text content because it's a plain text node, not an aria-label.
 */
const WAITING_ROOM_TEXT =
  "Please wait until a meeting host brings you into the call";

/** Caption button — aria-label is stable across Meet versions */
const CAPTIONS_BUTTON_SELECTOR = 'button[aria-label="Turn on captions"]';

/**
 * Mic / camera button selectors for the WAITING ROOM screen.
 * These are the bottom-bar buttons visible after "Ask to join" is clicked.
 * aria-label says "Turn off microphone" when mic is currently ON (unmuted).
 * jsname is a stable Google internal identifier as fallback.
 */
const WAITING_ROOM_MIC_SELECTORS = [
  'button[aria-label="Turn off microphone"]',
  'button[jsname="hw0c9"]',
];

const WAITING_ROOM_CAM_SELECTORS = [
  'button[aria-label="Turn off camera"]',
  'button[jsname="psRWwc"]',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Sleep for `ms` milliseconds. */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Sets the value of an input field using clipboard paste technique.
 * This is the most reliable way to fill React-controlled inputs in Google Meet:
 *  - Focuses the element
 *  - Selects all existing text (Ctrl+A)
 *  - Uses execCommand('insertText') which triggers React's synthetic events
 * Falls back to native property setter + event dispatch if execCommand fails.
 */
async function pasteIntoInput(
  page: Page,
  selector: string,
  value: string
): Promise<string> {
  return page.evaluate(
    (sel: string, text: string) => {
      const input = document.querySelector(sel) as HTMLInputElement | null;
      if (!input) return "";

      input.focus();

      // Select all existing content
      input.select();

      // Try execCommand first — this is what React listens to
      const inserted = document.execCommand("insertText", false, text);

      if (!inserted || !input.value) {
        // Fallback: native setter + synthetic events
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set;
        nativeSetter?.call(input, text);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }

      return input.value;
    },
    selector,
    value
  );
}

/**
 * Fills the bot's display name into the Google Meet pre-join name input.
 * Retries up to `maxAttempts` times with a delay between each attempt.
 * Uses clipboard-paste technique to avoid React re-renders clearing the field.
 */
async function fillNameWithRetry(
  page: Page,
  displayName: string,
  maxAttempts = 5,
  retryDelayMs = 2000
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Meeting] Name input attempt ${attempt}/${maxAttempts}…`);

      // Wait for the element to be present AND visible
      const nameInput = await page.waitForSelector(NAME_INPUT_SELECTOR, {
        visible: true,
        timeout: 10000,
      });

      if (!nameInput) throw new Error("waitForSelector returned null");

      // Scroll into view and let the browser settle
      await nameInput.scrollIntoView();
      await sleep(400);

      // Click to focus
      await nameInput.click();
      await sleep(200);

      // Paste the full name atomically via JS
      const result = await pasteIntoInput(page, NAME_INPUT_SELECTOR, displayName);
      await nameInput.dispose();

      if (result.trim()) {
        console.log(`[Meeting] Name entered successfully: "${result}"`);
        return;
      }

      throw new Error(`Input value after paste is empty (got: "${result}")`);
    } catch (err) {
      console.warn(
        `[Meeting] Name input attempt ${attempt} failed:`,
        (err as Error).message
      );
      if (attempt < maxAttempts) {
        console.log(`[Meeting] Retrying in ${retryDelayMs / 1000}s…`);
        await sleep(retryDelayMs);
      } else {
        console.error(
          "[Meeting] All name input attempts exhausted — proceeding without name."
        );
      }
    }
  }
}

/**
 * Finds and clicks the "Ask to join" button by visible text content.
 */
async function clickAskToJoin(page: Page): Promise<void> {
  const handle = await page.waitForFunction(
    () => {
      const clickables = document.querySelectorAll("button, [role='button']");
      for (const el of Array.from(clickables)) {
        if (el.textContent?.trim().includes("Ask to join")) return el;
      }
      return null;
    },
    { timeout: 20000 }
  );

  const btn = handle.asElement() as ElementHandle<Element> | null;
  if (btn) {
    await btn.click();
    console.log("[Meeting] Clicked 'Ask to join'.");
    await btn.dispose();
  } else {
    console.warn("[Meeting] 'Ask to join' button not found.");
  }
}

/**
 * Tries a list of selectors in order and clicks the first visible one found.
 * Each selector gets `timeout` ms before falling through to the next.
 */
async function clickFirstFound(
  page: Page,
  selectors: string[],
  label: string,
  timeout = 4000
): Promise<boolean> {
  for (const selector of selectors) {
    try {
      const btn = await page.waitForSelector(selector, {
        visible: true,
        timeout,
      });
      if (btn) {
        await btn.click();
        console.log(`[Meeting] ${label} toggled off (selector: ${selector}).`);
        await btn.dispose();
        return true;
      }
    } catch {
      // not found with this selector — try next
    }
  }
  console.warn(
    `[Meeting] ${label} button not found in waiting room — skipping.`
  );
  return false;
}

/**
 * Mutes the microphone and disables the camera while in the waiting room.
 * These buttons are reliably present in the bottom bar after "Ask to join".
 * We attempt once immediately, then retry once more after 2s if not found.
 */
async function muteInWaitingRoom(page: Page): Promise<void> {
  console.log("[Meeting] Attempting to mute mic and camera in waiting room…");

  // Give the waiting room UI a moment to fully render its bottom bar
  await sleep(2000);

  const micMuted = await clickFirstFound(
    page,
    WAITING_ROOM_MIC_SELECTORS,
    "Microphone"
  );
  await sleep(500);
  const camOff = await clickFirstFound(
    page,
    WAITING_ROOM_CAM_SELECTORS,
    "Camera"
  );

  // If either failed, retry once after a short wait
  if (!micMuted || !camOff) {
    console.log("[Meeting] Retrying media toggles in 2s…");
    await sleep(2000);
    if (!micMuted) {
      await clickFirstFound(page, WAITING_ROOM_MIC_SELECTORS, "Microphone");
      await sleep(300);
    }
    if (!camOff) {
      await clickFirstFound(page, WAITING_ROOM_CAM_SELECTORS, "Camera");
    }
  }
}

/**
 * Extracts the meeting code from a Google Meet URL.
 * e.g. "https://meet.google.com/abc-defg-hij" → "abc-defg-hij"
 */
function extractMeetingCode(meetingUrl: string): string | null {
  try {
    const url = new URL(meetingUrl);
    const code = url.pathname.replace(/^\//, "").split("?")[0].trim();
    return code.length > 0 ? code : null;
  } catch {
    return null;
  }
}

/**
 * Checks whether the page is currently showing the waiting room screen.
 * Scans all element text content for the waiting room phrase.
 */
async function isInWaitingRoom(page: Page): Promise<boolean> {
  return page.evaluate((waitingText: string) => {
    const allEls = Array.from(document.querySelectorAll("*"));
    for (const el of allEls) {
      if (
        el.children.length <= 2 &&
        (el.textContent ?? "").trim().includes(waitingText)
      ) {
        return true;
      }
    }
    return false;
  }, WAITING_ROOM_TEXT);
}

/**
 * Checks whether the bot has been admitted by verifying:
 *  1. The waiting room text is gone
 *  2. The meeting code is visible in the in-meeting bottom bar
 */
async function isAdmittedToMeeting(
  page: Page,
  meetingCode: string | null
): Promise<boolean> {
  const stillWaiting = await isInWaitingRoom(page);
  if (stillWaiting) return false;

  if (meetingCode) {
    const codeVisible = await page.evaluate((code: string) => {
      const allEls = Array.from(document.querySelectorAll("*"));
      for (const el of allEls) {
        if (
          el.children.length <= 3 &&
          (el.textContent ?? "").trim() === code
        ) {
          return true;
        }
      }
      return false;
    }, meetingCode);

    if (!codeVisible) {
      console.log(
        `[Meeting] Waiting room text gone but meeting code "${meetingCode}" not yet in bottom bar — still waiting…`
      );
      return false;
    }

    console.log(
      `[Meeting] Meeting code "${meetingCode}" confirmed in bottom bar. ✓`
    );
  }

  return true;
}

/**
 * Polls every 2 seconds until the bot is confirmed admitted.
 * Also mutes mic/camera once during the first poll cycle.
 */
async function waitForAdmission(
  page: Page,
  meetingUrl: string,
  timeoutMs = 10 * 60 * 1000
): Promise<void> {
  const meetingCode = extractMeetingCode(meetingUrl);
  console.log(
    `[Meeting] Waiting for host to admit the bot… (meeting code: ${meetingCode ?? "unknown"})`
  );

  const pollInterval = 2000;
  const deadline = Date.now() + timeoutMs;
  let mutedInWaitingRoom = false;

  while (Date.now() < deadline) {
    // Mute mic/camera once as soon as we're in the waiting room
    if (!mutedInWaitingRoom) {
      const inWaiting = await isInWaitingRoom(page);
      if (inWaiting) {
        await muteInWaitingRoom(page);
        mutedInWaitingRoom = true;
      }
    }

    const admitted = await isAdmittedToMeeting(page, meetingCode);
    if (admitted) {
      console.log("[Meeting] Bot has been admitted to the meeting! ✓");
      return;
    }

    console.log("[Meeting] Still in waiting room — checking again in 2s…");
    await sleep(pollInterval);
  }

  throw new Error(
    "[Meeting] Timed out waiting for host admission after " +
      timeoutMs / 1000 +
      "s."
  );
}

/**
 * Turns on live captions after the bot is admitted.
 */
async function enableCaptions(page: Page): Promise<void> {
  try {
    await sleep(2000);

    const captionBtn = await page.waitForSelector(CAPTIONS_BUTTON_SELECTOR, {
      timeout: 15000,
    });

    if (captionBtn) {
      await captionBtn.click();
      console.log("[Meeting] Captions turned on. ✓");
      await captionBtn.dispose();
    } else {
      console.warn("[Meeting] Caption button not found — captions not enabled.");
    }
  } catch (err) {
    console.warn("[Meeting] Could not enable captions:", err);
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Full bot warm-up sequence:
 *  1. Navigate to meeting URL
 *  2. Fill in the bot's display name (clipboard paste, with retries)
 *  3. Click "Ask to join"
 *  4. Mute mic + disable camera in the waiting room
 *  5. Wait until the host admits the bot (verified via meeting code)
 *  6. Turn on captions
 *  7. Start caption scraper → logs speaker passages to console
 *
 * Returns a `stopCaptions` function — call it to stop the scraper when done.
 */
export async function joinMeeting(
  page: Page,
  options: JoinMeetingOptions
): Promise<() => void> {
  const { meetingUrl, displayName = "Meeting Bot", onCaption } = options;

  // ── Step 1: Navigate ───────────────────────────────────────────────────────
  console.log(`[Meeting] Navigating to ${meetingUrl}…`);
  await page.goto(meetingUrl, {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  // ── Step 2: Fill name (clipboard paste, with retries) ─────────────────────
  await fillNameWithRetry(page, displayName);

  // Brief pause so the UI can react before we click "Ask to join"
  await sleep(1500);

  // ── Step 3: Ask to join ────────────────────────────────────────────────────
  await clickAskToJoin(page);

  // ── Step 4 + 5: Mute in waiting room, then wait for admission ─────────────
  await waitForAdmission(page, meetingUrl);

  // ── Step 6: Enable captions ────────────────────────────────────────────────
  await enableCaptions(page);

  // ── Step 7: Start caption scraper ─────────────────────────────────────────
  // Give Meet a moment to render the captions panel after turning them on
  await new Promise<void>((r) => setTimeout(r, 1500));
  const stopCaptions = startCaptionScraper(page, onCaption);
  console.log("[Meeting] Caption scraper running — logging speaker passages.");

  console.log("[Meeting] Bot is fully set up and in the meeting. ✓");
  return stopCaptions;
}
