export type FieldType = "TEXT" | "MCQ" | "TRUEFALSE" | "CHECKBOX";

export interface SolvePage {
  id: string;
  index: number;
  imagePath: string;
  width: number;
  height: number;
}

export interface SolveField {
  id: string;
  pageId: string;
  type: FieldType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  options?: string[];
  points: number;
}

export interface FieldResult {
  correct: boolean;
  points: number;
  earned: number;
  correctAnswer: unknown;
}

export interface SubmissionInfo {
  id: string;
  score: number;
  maxScore: number;
  answers: Record<string, unknown>;
  results: Record<string, FieldResult>;
}
