export type FieldType = "TEXT" | "MCQ" | "TRUEFALSE" | "CHECKBOX";

export interface EditorPage {
  id: string;
  index: number;
  imagePath: string;
  width: number;
  height: number;
}

export interface EditorField {
  id: string;
  pageId: string;
  type: FieldType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  options?: string[];
  answer: unknown;
  points: number;
  order: number;
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  TEXT: "فراغ نصي",
  MCQ: "اختيار من متعدد",
  TRUEFALSE: "صح / خطأ",
  CHECKBOX: "مربعات اختيار",
};

export function defaultAnswerFor(type: FieldType): unknown {
  switch (type) {
    case "TEXT":
      return [];
    case "MCQ":
      return 0;
    case "TRUEFALSE":
      return true;
    case "CHECKBOX":
      return [];
  }
}

export function defaultOptionsFor(type: FieldType): string[] | undefined {
  if (type === "MCQ" || type === "CHECKBOX") return ["الخيار الأول", "الخيار الثاني"];
  return undefined;
}

export function defaultSizeFor(type: FieldType): { width: number; height: number } {
  switch (type) {
    case "TEXT":
      return { width: 14, height: 4 };
    case "TRUEFALSE":
      return { width: 12, height: 5 };
    case "MCQ":
    case "CHECKBOX":
      return { width: 22, height: 12 };
  }
}
