export interface AITask {
  id: string;
  taskName: string;
  fileName: string;
  model: string;
  result: "Success" | "Processing" | "Diff Generated";
  timestamp: string;
}

export interface SecurityAlert {
  id: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  vulnerability: string;
  repository: string;
  status: "Open" | "In-Review" | "Fixed";
}
