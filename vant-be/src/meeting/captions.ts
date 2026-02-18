/**
 * Caption scraper for Google Meet.
 *
 * Polls the live captions DOM every 500ms, tracks the current speaker,
 * and logs completed passages when the speaker changes.
 *
 * Structure observed in Meet's captions panel:
 *   div[aria-label="Captions"]          ← root container
 *     div.nMcdL                         ← one block per speaker turn
 *       span.NWpY1d                     ← speaker display name
 *       div.ygicle                      ← live caption text (grows as they speak)
 *
 * When a new speaker block appears, the previous speaker's passage is complete
 * and we emit it to the log (and later: to the socket).
 */

import type { Page } from "puppeteer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CaptionEntry {
  speaker: string;
  text: string;
  timestamp: Date;
}

/** Called whenever a speaker finishes their turn (next speaker starts). */
export type CaptionEmitter = (entry: CaptionEntry) => void;

// ─── Selectors ────────────────────────────────────────────────────────────────

const CAPTIONS_ROOT_SELECTOR = 'div[aria-label="Captions"]';
const CAPTION_BLOCK_SELECTOR = "div.nMcdL";
const SPEAKER_NAME_SELECTOR = "span.NWpY1d";
const CAPTION_TEXT_SELECTOR = "div.ygicle";

// ─── DOM scraping ─────────────────────────────────────────────────────────────

interface ScrapedCaption {
  speaker: string;
  text: string;
}

/**
 * Reads all current caption blocks from the DOM.
 * Returns an array ordered oldest → newest (as rendered by Meet).
 */
async function scrapeCurrentCaptions(
  page: Page
): Promise<ScrapedCaption[]> {
  return page.evaluate(
    (rootSel, blockSel, nameSel, textSel) => {
      const root = document.querySelector(rootSel);
      if (!root) return [];

      const blocks = Array.from(root.querySelectorAll(blockSel));
      return blocks.map((block) => ({
        speaker:
          block.querySelector(nameSel)?.textContent?.trim() ?? "Unknown",
        text: block.querySelector(textSel)?.textContent?.trim() ?? "",
      }));
    },
    CAPTIONS_ROOT_SELECTOR,
    CAPTION_BLOCK_SELECTOR,
    SPEAKER_NAME_SELECTOR,
    CAPTION_TEXT_SELECTOR
  );
}

// ─── Caption tracker ──────────────────────────────────────────────────────────

/**
 * Tracks caption state across polls.
 *
 * Google Meet shows a rolling window of caption blocks. Typically:
 *  - The last block is the currently-speaking person (text grows live)
 *  - When a new person speaks, a new block is appended
 *  - Old blocks may scroll off the top
 *
 * Strategy:
 *  - Track the "active speaker" = speaker of the LAST block
 *  - Track the "active text" = text of the LAST block (grows as they speak)
 *  - When the last block's speaker changes → previous speaker finished → emit
 *  - When the page goes idle (no new blocks for `idleTimeoutMs`) → emit current
 */
export class CaptionTracker {
  private activeSpeaker: string | null = null;
  private activeText: string = "";
  private lastChangeAt: number = Date.now();
  private idleTimeoutMs: number;
  private emitter: CaptionEmitter;
  private running = false;
  private pollIntervalMs: number;

  constructor(
    emitter: CaptionEmitter,
    options: { pollIntervalMs?: number; idleTimeoutMs?: number } = {}
  ) {
    this.emitter = emitter;
    this.pollIntervalMs = options.pollIntervalMs ?? 500;
    this.idleTimeoutMs = options.idleTimeoutMs ?? 5000;
  }

  /**
   * Starts polling the captions DOM on the given page.
   * Returns a stop function — call it to end the scraping loop.
   */
  start(page: Page): () => void {
    this.running = true;
    console.log("[Captions] Scraper started.");

    const loop = async () => {
      while (this.running) {
        try {
          await this.poll(page);
        } catch {
          // Page may have navigated or closed — stop gracefully
          console.warn("[Captions] Poll error — stopping scraper.");
          this.running = false;
          break;
        }
        await new Promise<void>((r) => setTimeout(r, this.pollIntervalMs));
      }

      // Flush any remaining active caption on stop
      this.flush("scraper stopped");
    };

    loop();

    return () => {
      this.running = false;
    };
  }

  private async poll(page: Page): Promise<void> {
    const blocks = await scrapeCurrentCaptions(page);

    if (blocks.length === 0) {
      // No captions visible — check idle flush
      this.checkIdleFlush();
      return;
    }

    // The last block is always the most recent speaker
    const last = blocks[blocks.length - 1];

    if (!last.text) {
      this.checkIdleFlush();
      return;
    }

    if (this.activeSpeaker === null) {
      // First caption ever
      this.activeSpeaker = last.speaker;
      this.activeText = last.text;
      this.lastChangeAt = Date.now();
      return;
    }

    if (last.speaker !== this.activeSpeaker) {
      // Speaker changed → emit the completed passage for the previous speaker
      this.emit();

      // Start tracking the new speaker
      this.activeSpeaker = last.speaker;
      this.activeText = last.text;
      this.lastChangeAt = Date.now();
    } else {
      // Same speaker — update the growing text
      if (last.text !== this.activeText) {
        this.activeText = last.text;
        this.lastChangeAt = Date.now();
      } else {
        // Text hasn't changed — check if they've been idle long enough to flush
        this.checkIdleFlush();
      }
    }
  }

  private checkIdleFlush(): void {
    if (
      this.activeSpeaker &&
      this.activeText &&
      Date.now() - this.lastChangeAt >= this.idleTimeoutMs
    ) {
      console.log(
        `[Captions] Speaker "${this.activeSpeaker}" idle for ${this.idleTimeoutMs / 1000}s — flushing.`
      );
      this.emit();
      this.activeSpeaker = null;
      this.activeText = "";
    }
  }

  private emit(): void {
    if (!this.activeSpeaker || !this.activeText.trim()) return;

    const entry: CaptionEntry = {
      speaker: this.activeSpeaker,
      text: this.activeText.trim(),
      timestamp: new Date(),
    };

    this.emitter(entry);
  }

  private flush(reason: string): void {
    if (this.activeSpeaker && this.activeText.trim()) {
      console.log(`[Captions] Flushing on ${reason}.`);
      this.emit();
    }
  }
}

// ─── Default log emitter ──────────────────────────────────────────────────────

/**
 * Default emitter: logs completed passages to the console.
 * Format: [Captions] Hasaan Ahmad: I am admitted. Okay. Fine. Fair enough.
 *
 * Replace / extend this with a socket emitter later.
 */
export function logCaptionEmitter(entry: CaptionEntry): void {
  const time = entry.timestamp.toLocaleTimeString("en-US", { hour12: false });
  console.log(`[Captions] [${time}] ${entry.speaker}: ${entry.text}`);
}

// ─── Convenience starter ──────────────────────────────────────────────────────

/**
 * Starts the caption scraper on the given page using the default log emitter.
 * Returns a stop function.
 *
 * Usage:
 *   const stopCaptions = startCaptionScraper(page);
 *   // ... later ...
 *   stopCaptions();
 */
export function startCaptionScraper(
  page: Page,
  emitter: CaptionEmitter = logCaptionEmitter
): () => void {
  const tracker = new CaptionTracker(emitter, {
    pollIntervalMs: 500,
    idleTimeoutMs: 5000,
  });
  return tracker.start(page);
}
