export type MachineType = "Washer" | "Dryer";
export const buildings = ["Building F", "Building E", "Building G"];
export const otherProblem = "Other problem (describe it yourself)";
export const machines: Record<MachineType, string[]> = {
  Washer: ["W1(L)", "W2(L)", "W3(L)", "W4(L)", "W5(L)", "W6(L)"],
  Dryer: ["D1(R)", "D2(R)", "D3(R)", "D4(R)", "D5(R)", "D6(R)", "D7(R)"],
};
export const issues: Record<MachineType, string[]> = {
  Washer: ["Did not drain/spin correctly", "Detergent foam remained"],
  Dryer: ["Clothes remained wet", "Stopped unexpectedly"],
};
export interface ReportSelection {
  building: string;
  type: MachineType | "";
  machine: string;
  issue: string;
  customDescription: string;
}
export interface SimulatedReport extends ReportSelection {
  submittedAt: Date;
}
export function changeMachineType(selection: ReportSelection, type: MachineType): ReportSelection {
  return { ...selection, type, machine: "", issue: "", customDescription: "" };
}
export function validateReport(selection: ReportSelection) {
  return {
    building: buildings.includes(selection.building) ? "" : "Select a building.",
    type: selection.type ? "" : "Select a machine type.",
    machine: selection.type && machines[selection.type].includes(selection.machine) ? "" : "Select a machine.",
    issue: selection.type && (issues[selection.type].includes(selection.issue) || selection.issue === otherProblem) ? "" : "Select the problem you experienced.",
    customDescription: selection.issue === otherProblem && !selection.customDescription.trim() ? "Describe the problem you experienced." : "",
  };
}
export function simulateReport(selection: ReportSelection, now = new Date()): SimulatedReport | null {
  if (Object.values(validateReport(selection)).some(Boolean)) return null;
  return { ...selection, submittedAt: now };
}