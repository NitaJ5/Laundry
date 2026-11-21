import { describe, expect, it } from "vitest";
import { issues, simulateReport, validateReport } from "@/lib/laundry-report";

describe("Simulated laundry reports", () => {
  const valid = { type: "Dryer" as const, machine: "D2", issue: "Clothes remained wet" };
  it("preserves Dryer, D2, Clothes remained wet and the submission time", () => {
    const time = new Date("2026-11-21T14:41:00Z");
    expect(simulateReport(valid, time)).toEqual({ ...valid, submittedAt: time });
  });
  it("rejects an empty submission", () => {
    expect(simulateReport({ type: "", machine: "", issue: "" })).toBeNull();
  });
  it("requires a machine", () => {
    expect(simulateReport({ ...valid, machine: "" })).toBeNull();
    expect(validateReport({ ...valid, machine: "" }).machine).toBeTruthy();
  });
  it("requires an experienced issue", () => {
    expect(simulateReport({ ...valid, issue: "" })).toBeNull();
  });
  it("does not accept a washer label for a dryer", () => {
    expect(simulateReport({ ...valid, machine: "W1" })).toBeNull();
  });
  it("allows both specified dryer issues", () => {
    expect(issues.Dryer).toEqual(["Clothes remained wet", "Stopped unexpectedly"]);
    expect(simulateReport({ ...valid, issue: "Stopped unexpectedly" })?.issue).toBe("Stopped unexpectedly");
  });
  it("allows both specified washer issues", () => {
    expect(issues.Washer).toEqual(["Did not drain/spin correctly", "Detergent foam remained"]);
    for (const issue of issues.Washer) expect(simulateReport({ type: "Washer", machine: "W1", issue })?.issue).toBe(issue);
  });
  it("rejects an issue belonging to the other machine type", () => {
    expect(simulateReport({ ...valid, issue: "Detergent foam remained" })).toBeNull();
  });
});