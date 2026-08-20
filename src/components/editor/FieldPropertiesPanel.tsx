"use client";

import { EditorField, FIELD_TYPE_LABELS } from "./types";

export default function FieldPropertiesPanel({
  field,
  onChange,
  onDelete,
}: {
  field: EditorField | null;
  onChange: (patch: Partial<EditorField>) => void;
  onDelete: () => void;
}) {
  if (!field) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
        اختر عنصراً على الصفحة أو أضف سؤالاً جديداً لتعديل إجابته من هنا.
      </div>
    );
  }

  const options = field.options ?? [];

  function updateOption(idx: number, value: string) {
    const next = [...options];
    next[idx] = value;
    onChange({ options: next });
  }

  function addOption() {
    onChange({ options: [...options, `خيار ${options.length + 1}`] });
  }

  function removeOption(idx: number) {
    const current = field!;
    const next = options.filter((_, i) => i !== idx);
    let answer = current.answer;
    if (current.type === "MCQ" && typeof answer === "number") {
      if (answer === idx) answer = 0;
      else if (answer > idx) answer = answer - 1;
    }
    if (current.type === "CHECKBOX" && Array.isArray(answer)) {
      answer = (answer as number[])
        .filter((v) => v !== idx)
        .map((v) => (v > idx ? v - 1 : v));
    }
    onChange({ options: next, answer });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {FIELD_TYPE_LABELS[field.type]}
        </span>
        <button
          onClick={onDelete}
          className="text-xs font-medium text-red-500 hover:underline"
        >
          حذف السؤال
        </button>
      </div>

      <label className="mb-1 block text-xs font-medium text-slate-600">
        نص توضيحي (اختياري)
      </label>
      <input
        value={field.label}
        onChange={(e) => onChange({ label: e.target.value })}
        className="mb-3 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
        placeholder="مثال: اكتب الإجابة هنا"
      />

      <label className="mb-1 block text-xs font-medium text-slate-600">الدرجة</label>
      <input
        type="number"
        min={1}
        max={100}
        value={field.points}
        onChange={(e) => onChange({ points: Number(e.target.value) || 1 })}
        className="mb-3 w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
      />

      {field.type === "TEXT" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            الإجابات المقبولة (افصل بفاصلة إن وُجد أكثر من إجابة صحيحة)
          </label>
          <textarea
            rows={2}
            value={(Array.isArray(field.answer) ? field.answer : []).join("، ")}
            onChange={(e) =>
              onChange({
                answer: e.target.value
                  .split(/[,،]/)
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="مثال: القاهرة، القاهره"
          />
        </div>
      )}

      {field.type === "TRUEFALSE" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">الإجابة الصحيحة</label>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({ answer: true })}
              className={`flex-1 rounded-md py-1.5 text-sm font-semibold ${
                field.answer === true
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              صح
            </button>
            <button
              onClick={() => onChange({ answer: false })}
              className={`flex-1 rounded-md py-1.5 text-sm font-semibold ${
                field.answer === false ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              خطأ
            </button>
          </div>
        </div>
      )}

      {(field.type === "MCQ" || field.type === "CHECKBOX") && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            الخيارات (حدد الإجابة الصحيحة)
          </label>
          <div className="space-y-2">
            {options.map((opt, idx) => {
              const checked =
                field.type === "MCQ"
                  ? field.answer === idx
                  : Array.isArray(field.answer) && (field.answer as number[]).includes(idx);
              return (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type={field.type === "MCQ" ? "radio" : "checkbox"}
                    checked={checked}
                    onChange={() => {
                      if (field.type === "MCQ") {
                        onChange({ answer: idx });
                      } else {
                        const current = Array.isArray(field.answer)
                          ? (field.answer as number[])
                          : [];
                        onChange({
                          answer: checked
                            ? current.filter((v) => v !== idx)
                            : [...current, idx],
                        });
                      }
                    }}
                  />
                  <input
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={() => removeOption(idx)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    حذف
                  </button>
                </div>
              );
            })}
          </div>
          <button
            onClick={addOption}
            className="mt-2 text-xs font-medium text-emerald-600 hover:underline"
          >
            + إضافة خيار
          </button>
        </div>
      )}
    </div>
  );
}
