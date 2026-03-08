export interface LanguageDist {
  name: string;
  percentage: number;
  color: string;
}

export interface RepoRefactor {
  id: string;
  type: "Complexity" | "Modernization";
  description: string;
  target: string;
}
