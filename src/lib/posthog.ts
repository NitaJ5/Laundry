import posthog from "posthog-js";

let initialized = false;
let currentParticipantId: string | null = null;

function initializePostHog(): boolean {
  if (typeof window === "undefined") return false;
  if (initialized) return true;

  const key = import.meta.env["VITE_POSTHOG_KEY"];
  const host = import.meta.env["VITE_POSTHOG_HOST"];

  if (!key || !host) return false;

  posthog.init(key, {
    api_host: host,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    person_profiles: "identified_only",
    persistence: "memory",
  });

  initialized = true;
  return true;
}

export function captureEvent(
  event: string,
  properties: {
    participant_id: string;
    [key: string]: string | number | boolean;
  },
) {
  try {
    if (!initializePostHog()) return;

    const participantId = properties.participant_id;

    if (currentParticipantId !== participantId) {
      if (currentParticipantId !== null) {
        posthog.reset();
      }

      posthog.identify(participantId);
      currentParticipantId = participantId;
    }

    posthog.capture(event, properties);
  } catch {
    console.warn("Analytics event could not be captured.");
  }
}

export function resetAnalytics() {
  try {
    if (initialized) posthog.reset();
  } catch {
    console.warn("Analytics session could not be reset.");
  } finally {
    currentParticipantId = null;
  }
}
