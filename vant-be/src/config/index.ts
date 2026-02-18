/**
 * Bot configuration
 */

export const config = {
  /** Default display name when joining meetings */
  defaultDisplayName: "Meeting Bot",
  /** Browser launch options */
  browser: {
    /** Run with visible browser (needed for real audio in meetings) */
    headed: true,
  },
} as const;
