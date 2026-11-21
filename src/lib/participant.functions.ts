import { createServerFn } from "@tanstack/react-start";
import { activitySchema, loginSchema, participantSchema, storedReportSchema, submissionSchema } from "./participant";

// Custom participant identity is intentionally not Cloud Auth. All tables/RPCs
// deny direct browser access; service access is limited to validated cookie hashes.
export const checkParticipant = createServerFn({ method: "POST" }).handler(async () => {
  const session = await import("./participant.server");
  session.privateResponse();
  const token = session.sessionToken();
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("participant_identity", { p_hash: await session.hashToken(token) });
  if (error) { console.error("Participant session check failed", error.code); throw new Error("Unable to check your session. Please try again."); }
  if (!data) { session.clearSession(); return null; }
  session.writeSession(token);
  return participantSchema.parse(data);
});

export const loginParticipant = createServerFn({ method: "POST" }).inputValidator(input => loginSchema.parse(input)).handler(async ({ data }) => {
  const session = await import("./participant.server");
  session.privateResponse();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const token = session.createToken();
  const { data: participant, error } = await supabaseAdmin.rpc("participant_login", { p_username: data.username, p_hash: await session.hashToken(token) });
  if (error) { console.error("Participant login failed", error.code); throw new Error("Unable to log in. Please try again."); }
  // Revoke a previous session when switching usernames on the same browser.
  const oldToken = session.sessionToken();
  if (oldToken) {
    const { error: revokeError } = await supabaseAdmin.from("participant_sessions").update({ revoked_at: new Date().toISOString() }).eq("session_token_hash", await session.hashToken(oldToken));
    if (revokeError) throw new Error("Unable to switch accounts. Please try again.");
  }
  const result = participantSchema.parse(participant);
  session.writeSession(token);
  return result;
});

export const logoutParticipant = createServerFn({ method: "POST" }).handler(async () => {
  const session = await import("./participant.server");
  session.privateResponse();
  const token = session.sessionToken();
  if (token) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("participant_sessions").update({ revoked_at: new Date().toISOString() }).eq("session_token_hash", await session.hashToken(token));
    if (error) throw new Error("Unable to log out. Please try again.");
  }
  session.clearSession();
  return { success: true };
});

export const getParticipantActivity = createServerFn({ method: "POST" }).handler(async () => {
  const session = await import("./participant.server");
  const hash = await session.requireSessionHash();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("participant_activity", { p_hash: hash });
  if (error) throw new Error("Unable to load your reporting activity. Please log in again if your session has expired.");
  return activitySchema.parse(data);
});

export const saveParticipantReport = createServerFn({ method: "POST" }).inputValidator(input => submissionSchema.parse(input)).handler(async ({ data }) => {
  const session = await import("./participant.server");
  const hash = await session.requireSessionHash();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: saved, error } = await supabaseAdmin.rpc("submit_participant_report", {
    p_hash: hash, p_request_id: data.requestId, p_building: data.building, p_type: data.type,
    p_machine: data.machine, p_issue: data.issue, p_description: data.customDescription.trim(),
  });
  if (error) { console.error("Report submission failed", error.code); throw new Error("Your report could not be saved. Please retry, or log in again if your session has expired."); }
  const report = storedReportSchema.parse(saved);
  return { id: report.id, userId: report.user_id, building: report.building, type: report.machine_type, machine: report.machine_id,
    issue: report.issue, customDescription: report.custom_description, submittedAt: report.created_at };
});