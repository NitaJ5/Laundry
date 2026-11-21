import { z } from "zod";
import { validateReport, type ReportSelection } from "./laundry-report";

export const usernameSchema = z.string().trim().toLowerCase().min(1, "Enter a username.").max(40, "Use 40 characters or fewer.").regex(/^[a-z0-9_.-]+$/, "Use letters, numbers, dots, underscores or hyphens.");
export const loginSchema = z.object({ username: usernameSchema });
export const submissionSchema = z.object({
  requestId: z.string().uuid(),
  building: z.string(), type: z.enum(["Washer", "Dryer"]), machine: z.string(),
  issue: z.string(), customDescription: z.string().max(4000),
}).superRefine((selection, ctx) => {
  for (const [key, message] of Object.entries(validateReport(selection))) {
    if (message) ctx.addIssue({ code: "custom", path: [key], message });
  }
});
export interface Participant { id: string; username: string }
export interface Activity {
  currentWeek: number; currentYear: number; currentCount: number; total: number;
  weeks: { iso_year: number; iso_week: number; report_count: number }[];
}
export interface SavedReport extends ReportSelection { id: string; userId: string; submittedAt: string }
export const participantSchema = z.object({ id: z.string().uuid(), username: z.string() });
export const activitySchema = z.object({
  currentWeek: z.number(), currentYear: z.number(), currentCount: z.number(), total: z.number(),
  weeks: z.array(z.object({ iso_year: z.number(), iso_week: z.number(), report_count: z.number() })),
});
export const storedReportSchema = z.object({
  id: z.string().uuid(), user_id: z.string().uuid(), created_at: z.string(),
  building: z.string(), machine_type: z.enum(["Washer", "Dryer"]), machine_id: z.string(), issue: z.string(), custom_description: z.string(),
});
export const SESSION_SECONDS = 365 * 24 * 60 * 60;