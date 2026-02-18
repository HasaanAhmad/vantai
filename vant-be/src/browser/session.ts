/**
 * Browser session manager for meeting bot.
 * Launches Puppeteer with audio/video support for joining meetings.
 */

import puppeteer, { type Browser, type Page } from "puppeteer";

export interface BrowserSessionOptions {
  /** Run browser in headed mode (visible) - required for real audio in most meeting platforms */
  headed?: boolean;
  /** Meeting URL to navigate to */
  meetingUrl?: string;
}

/**
 * Chrome args required for audio/video in meetings.
 * Without these, the bot cannot join with microphone/speakers.
 */
const AUDIO_VIDEO_ARGS = [
  // Enable fake media devices (required when no physical mic/camera)
  "--use-fake-device-for-media-stream",
  // Use fake UI for media stream (auto-grants permissions, skips prompts)
  "--use-fake-ui-for-media-stream",
  // Allow autoplay without user gesture (meetings often auto-play audio)
  "--autoplay-policy=no-user-gesture-required",
  // Disable automation detection (some meeting platforms block automated browsers)
  "--disable-blink-features=AutomationControlled",
  // Allow running in background
  "--disable-backgrounding-occluded-windows",
  // Disable GPU (can help with headless stability)
  "--disable-gpu",
  // No sandbox for some environments
  "--no-sandbox",
  // Disable dev shm (Docker/CI compatibility)
  "--disable-dev-shm-usage",
];

export class BrowserSession {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async launch(options: BrowserSessionOptions = {}): Promise<Page> {
    const { headed = true, meetingUrl } = options;

    this.browser = await puppeteer.launch({
      headless: headed ? false : true, // headed=true means visible browser (needed for real audio)
      args: AUDIO_VIDEO_ARGS,
      defaultViewport: null,
      ignoreDefaultArgs: ["--mute-audio"],
    });

    const pages = await this.browser.pages();
    this.page = pages[0] ?? (await this.browser.newPage());

    // Grant microphone and camera permissions (required for meeting platforms)
    const context = this.browser.defaultBrowserContext();
    await context.overridePermissions(meetingUrl ?? "https://meet.google.com", [
      "microphone",
      "camera",
    ]);

    return this.page;
  }

  getPage(): Page | null {
    return this.page;
  }

  getBrowser(): Browser | null {
    return this.browser;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
