export type FieldTypeValue = "TEXT" | "MCQ" | "TRUEFALSE" | "CHECKBOX";

export function normalizeArabicText(input: string) {
  return input
    .trim()
    .replace(/[ً-ٰٟ]/g, "") // إزالة التشكيل
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function isTextCorrect(correctAnswers: unknown, studentAnswer: unknown) {
  const accepted = (Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers])
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map(normalizeArabicText);
  const given = normalizeArabicText(String(studentAnswer ?? ""));
  if (!given) return false;
  return accepted.includes(given);
}

export function gradeField(
  type: FieldTypeValue,
  correctAnswer: unknown,
  studentAnswer: unknown
): boolean {
  switch (type) {
    case "TEXT":
      return isTextCorrect(correctAnswer, studentAnswer);
    case "MCQ":
      return (
        studentAnswer !== null &&
        studentAnswer !== undefined &&
        Number(correctAnswer) === Number(studentAnswer)
      );
    case "TRUEFALSE":
      return (
        typeof studentAnswer === "boolean" && Boolean(correctAnswer) === studentAnswer
      );
    case "CHECKBOX": {
      const correct = (Array.isArray(correctAnswer) ? correctAnswer : [])
        .map(Number)
        .sort((a, b) => a - b);
      const given = (Array.isArray(studentAnswer) ? studentAnswer : [])
        .map(Number)
        .sort((a, b) => a - b);
      return (
        correct.length > 0 &&
        correct.length === given.length &&
        correct.every((v, i) => v === given[i])
      );
    }
    default:
      return false;
  }
}
