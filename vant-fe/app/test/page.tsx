"use client";

import { useState } from "react";
import Link from "next/link";
import { joinMeeting } from "@/lib/services/meeting.service";

export default function TestBotPage() {
  const [meetingLink, setMeetingLink] = useState("");
  const [botName, setBotName] = useState("Test Bot");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingLink.trim() || !botName.trim()) {
      setMessage("Please enter both meeting link and bot name.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await joinMeeting({
        meetingLink: meetingLink.trim(),
        name: botName.trim(),
      });
      setMessage(`Bot triggered! ${res.message}`);
      setStatus("success");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error ?? "Failed to join meeting"
          : "Failed to join meeting";
      setMessage(msg);
      setStatus("error");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Test Meeting Bot
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Unprotected page – no sign-in required
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="meetingLink"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Meeting link
            </label>
            <input
              id="meetingLink"
              type="url"
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              disabled={status === "loading"}
            />
          </div>

          <div>
            <label
              htmlFor="botName"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Bot display name
            </label>
            <input
              id="botName"
              type="text"
              placeholder="Test Bot"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              disabled={status === "loading"}
            />
          </div>

          {message && (
            <p
              className={`text-sm ${
                status === "error"
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {status === "loading" ? "Joining..." : "Join Meeting"}
          </button>
        </form>

        <Link
          href="/"
          className="block text-center text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
