/**
 * Shared types for the meeting bot
 */

export interface MeetingTranscript {
  speaker: string;
  text: string;
  timestamp: Date;
}

export interface Requirement {
  id: string;
  description: string;
  source: string;
  confidence: number;
}

export interface RedFlag {
  type: string;
  description: string;
  severity: "low" | "medium" | "high";
  context: string;
}
