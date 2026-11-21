import { describe, expect, it } from "vitest";
import { loginSchema, SESSION_SECONDS, submissionSchema } from "@/lib/participant";

describe("Participant rules", () => {
  it("normalizes case and surrounding whitespace into the same username", () => {
    expect(loginSchema.parse({ username: " Alice " }).username).toBe("alice");
    expect(loginSchema.parse({ username: "ALICE" }).username).toBe("alice");
  });
  it("does not accept an empty username", () => { expect(loginSchema.safeParse({ username: "  " }).success).toBe(false); });
  it("uses a 365-day persistent session", () => { expect(SESSION_SECONDS).toBe(31_536_000); });
  it("accepts valid original washer choices", () => {
    expect(submissionSchema.safeParse({ requestId: "11111111-1111-4111-8111-111111111111", building: "Building F", type: "Washer", machine: "W1(L)", issue: "Detergent foam remained", customDescription: "" }).success).toBe(true);
  });
  it("rejects invalid reports before creating a submission", () => {
    expect(submissionSchema.safeParse({ requestId: "11111111-1111-4111-8111-111111111111", building: "Building F", type: "Dryer", machine: "W1(L)", issue: "Clothes remained wet", customDescription: "" }).success).toBe(false);
  });
  it("never accepts a frontend user UUID as participant identity", () => {
    expect(loginSchema.parse({ username: "alice", userId: "11111111-1111-4111-8111-111111111111" })).toEqual({ username: "alice" });
  });
});