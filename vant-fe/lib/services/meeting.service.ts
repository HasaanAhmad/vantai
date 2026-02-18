/**
 * Meeting service - API calls for meeting operations.
 */

import { api } from "@/lib/api";

export interface JoinMeetingRequest {
  meetingLink: string;
  name: string;
}

export interface JoinMeetingResponse {
  message: string;
  meetingLink: string;
  botName: string;
}

export interface MeetingHealthResponse {
  status: string;
  service: string;
}

/**
 * Join a meeting - triggers the meeting bot on backend.
 */
export async function joinMeeting(
  data: JoinMeetingRequest
): Promise<JoinMeetingResponse> {
  const { data: response } = await api.post<JoinMeetingResponse>(
    "/api/meetings/join",
    data
  );
  return response;
}

/**
 * Health check for meeting service.
 */
export async function getMeetingHealth(): Promise<MeetingHealthResponse> {
  const { data } = await api.get<MeetingHealthResponse>("/api/meetings/health");
  return data;
}

