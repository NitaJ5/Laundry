import { describe, expect, it } from "vitest";
import { buildings, changeMachineType, issues, machines, otherProblem, simulateReport, validateReport } from "@/lib/laundry-report";

describe("Simulated laundry reports", () => {
  const valid = { building: "Building F", type: "Dryer" as const, machine: "D2(R)", issue: "Clothes remained wet", customDescription: "" };
  it("preserves Building F, Dryer, D2(R), Clothes remained wet and the submission time", () => {
    const time = new Date("2026-11-21T14:41:00Z");
    expect(simulateReport(valid, time)).toEqual({ ...valid, submittedAt: time });
  });
  it("rejects an empty submission", () => {
    expect(simulateReport({ building: "", type: "", machine: "", issue: "", customDescription: "" })).toBeNull();
  });
  it("requires a machine", () => {
    expect(simulateReport({ ...valid, machine: "" })).toBeNull();
    expect(validateReport({ ...valid, machine: "" }).machine).toBeTruthy();
  });
  it("requires an experienced issue", () => {
    expect(simulateReport({ ...valid, issue: "" })).toBeNull();
  });
  it("does not accept a washer label for a dryer", () => {
    expect(simulateReport({ ...valid, machine: "W1(L)" })).toBeNull();
  });
  it("allows both specified dryer issues", () => {
    expect(issues.Dryer).toEqual(["Clothes remained wet", "Stopped unexpectedly"]);
    expect(simulateReport({ ...valid, issue: "Stopped unexpectedly" })?.issue).toBe("Stopped unexpectedly");
  });
  it("allows both specified washer issues", () => {
    expect(issues.Washer).toEqual(["Did not drain/spin correctly", "Detergent foam remained"]);
    for (const issue of issues.Washer) expect(simulateReport({ ...valid, type: "Washer", machine: "W1(L)", issue })?.issue).toBe(issue);
  });
  it("rejects an issue belonging to the other machine type", () => {
    expect(simulateReport({ ...valid, issue: "Detergent foam remained" })).toBeNull();
  });
  it("accepts exactly the three specified buildings", () => {
    expect(buildings).toEqual(["Building F", "Building E", "Building G"]);
    for (const building of buildings) expect(simulateReport({ ...valid, building })?.building).toBe(building);
    expect(simulateReport({ ...valid, building: "Building A" })).toBeNull();
  });
  it("requires a building", () => {
    expect(simulateReport({ ...valid, building: "" })).toBeNull();
  });
  it("requires a machine type", () => {
    expect(simulateReport({ ...valid, type: "" })).toBeNull();
  });
  it("uses all six left-side washer identifiers", () => {
    expect(machines.Washer).toEqual(["W1(L)", "W2(L)", "W3(L)", "W4(L)", "W5(L)", "W6(L)"]);
    for (const machine of machines.Washer) expect(simulateReport({ ...valid, type: "Washer", machine, issue: "Detergent foam remained" })?.machine).toBe(machine);
  });
  it("uses all seven right-side dryer identifiers", () => {
    expect(machines.Dryer).toEqual(["D1(R)", "D2(R)", "D3(R)", "D4(R)", "D5(R)", "D6(R)", "D7(R)"]);
    for (const machine of machines.Dryer) expect(simulateReport({ ...valid, machine })?.machine).toBe(machine);
    expect(simulateReport({ ...valid, machine: "D2" })).toBeNull();
  });
  it("resets the machine when switching type while preserving the building", () => {
    expect(changeMachineType(valid, "Washer")).toEqual({ ...valid, type: "Washer", machine: "", issue: "", customDescription: "" });
    expect(changeMachineType({ ...valid, type: "Washer", machine: "W6(L)" }, "Dryer").machine).toBe("");
  });
  it("accepts a custom problem description", () => {
    const selection = { ...valid, issue: otherProblem, customDescription: "The door would not open after the cycle." };
    expect(simulateReport(selection)?.customDescription).toBe("The door would not open after the cycle.");
  });
  it("blocks Other problem without a non-empty description", () => {
    for (const customDescription of ["", "  \n "]) expect(simulateReport({ ...valid, issue: otherProblem, customDescription })).toBeNull();
  });
  it("does not require custom text for a predefined problem", () => {
    expect(simulateReport({ ...valid, customDescription: "" })?.issue).toBe("Clothes remained wet");
  });
});