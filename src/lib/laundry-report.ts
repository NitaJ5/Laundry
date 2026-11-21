export type MachineType = "Washer" | "Dryer";
export const machines: Record<MachineType, string[]> = {
  Washer: ["W1", "W2", "W3"],
  Dryer: ["D1", "D2", "D3"],
};
export const issues: Record<MachineType, string[]> = {
  Washer: ["Did not drain/spin correctly", "Detergent foam remained"],
  Dryer: ["Clothes remained wet", "Stopped unexpectedly"],
};
export interface ReportSelection {
  type: MachineType | "";
  machine: string;
  issue: string;
}
export interface SimulatedReport extends ReportSelection {
  submittedAt: Date;
}
export function validateReport(selection: ReportSelection) {
  return {
    type: selection.type ? "" : "Select a machine type.",
    machine: selection.type && machines[selection.type].includes(selection.machine) ? "" : "Select a machine.",
    issue: selection.type && issues[selection.type].includes(selection.issue) ? "" : "Select the problem you experienced.",
  };
}
export function simulateReport(selection: ReportSelection, now = new Date()): SimulatedReport | null {
  if (Object.values(validateReport(selection)).some(Boolean)) return null;
  return { ...selection, submittedAt: now };
}