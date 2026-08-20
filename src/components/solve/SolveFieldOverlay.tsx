"use client";

import { FieldResult, SolveField } from "./types";

function correctAnswerText(field: SolveField, correctAnswer: unknown): string {
  switch (field.type) {
    case "TEXT":
      return Array.isArray(correctAnswer) ? String(correctAnswer[0] ?? "") : String(correctAnswer ?? "");
    case "MCQ":
      return field.options?.[Number(correctAnswer)] ?? "";
    case "TRUEFALSE":
      return correctAnswer ? "صح" : "خطأ";
    case "CHECKBOX":
      return (Array.isArray(correctAnswer) ? correctAnswer : [])
        .map((i) => field.options?.[Number(i)] ?? "")
        .join("، ");
    default:
      return "";
  }
}

export default function SolveFieldOverlay({
  field,
  value,
  onChange,
  result,
  locked,
}: {
  field: SolveField;
  value: unknown;
  onChange: (value: unknown) => void;
  result: FieldResult | null;
  locked: boolean;
}) {
  const borderClass = result
    ? result.correct
      ? "border-emerald-500 bg-emerald-50/90"
      : "border-red-500 bg-red-50/90"
    : "border-sky-500 bg-white/90";

  return (
    <div
      className={`absolute rounded border-2 p-0.5 ${borderClass}`}
      style={{
        left: `${field.x}%`,
        top: `${field.y}%`,
        width: `${field.width}%`,
        height: `${field.height}%`,
      }}
    >
      {field.type === "TEXT" && (
        <input
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={locked}
          placeholder={field.label}
          className="h-full w-full bg-transparent px-1 text-[11px] outline-none sm:text-sm"
        />
      )}

      {field.type === "TRUEFALSE" && (
        <div className="flex h-full items-center justify-center gap-1">
          <button
            type="button"
            disabled={locked}
            onClick={() => onChange(true)}
            className={`flex-1 h-full rounded text-[10px] font-semibold sm:text-xs ${
              value === true ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            صح
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={() => onChange(false)}
            className={`flex-1 h-full rounded text-[10px] font-semibold sm:text-xs ${
              value === false ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            خطأ
          </button>
        </div>
      )}

      {field.type === "MCQ" && (
        <div className="flex h-full flex-col justify-center gap-0.5 overflow-auto px-1 text-[10px] sm:text-xs">
          {field.options?.map((opt, idx) => (
            <label key={idx} className="flex items-center gap-1">
              <input
                type="radio"
                disabled={locked}
                checked={value === idx}
                onChange={() => onChange(idx)}
              />
              <span className="truncate">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === "CHECKBOX" && (
        <div className="flex h-full flex-col justify-center gap-0.5 overflow-auto px-1 text-[10px] sm:text-xs">
          {field.options?.map((opt, idx) => {
            const arr = Array.isArray(value) ? (value as number[]) : [];
            const checked = arr.includes(idx);
            return (
              <label key={idx} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  disabled={locked}
                  checked={checked}
                  onChange={() =>
                    onChange(checked ? arr.filter((v) => v !== idx) : [...arr, idx])
                  }
                />
                <span className="truncate">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {result && !result.correct && (
        <div className="pointer-events-none absolute -bottom-5 right-0 whitespace-nowrap rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-white">
          الصحيح: {correctAnswerText(field, result.correctAnswer)}
        </div>
      )}
    </div>
  );
}
