"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FieldResult, SolveField, SolvePage, SubmissionInfo } from "./types";
import SolveFieldOverlay from "./SolveFieldOverlay";

function defaultAnswers(fields: SolveField[], previous: Record<string, unknown> | null) {
  const answers: Record<string, unknown> = {};
  for (const f of fields) {
    if (previous && f.id in previous) {
      answers[f.id] = previous[f.id];
      continue;
    }
    answers[f.id] = f.type === "CHECKBOX" ? [] : f.type === "TEXT" ? "" : null;
  }
  return answers;
}

export default function WorksheetSolver({
  assignmentId,
  title,
  pages,
  fields,
  initialSubmission,
}: {
  assignmentId: string;
  title: string;
  pages: SolvePage[];
  fields: SolveField[];
  initialSubmission: SubmissionInfo | null;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, unknown>>(() =>
    defaultAnswers(fields, initialSubmission?.answers ?? null)
  );
  const [submission, setSubmission] = useState<SubmissionInfo | null>(initialSubmission);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const results: Record<string, FieldResult> | null = submission?.results ?? null;

  function setAnswer(id: string, value: unknown) {
    if (results) return;
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  const answeredCount = useMemo(
    () =>
      Object.values(answers).filter((v) => {
        if (Array.isArray(v)) return v.length > 0;
        return v !== null && v !== "" && v !== undefined;
      }).length,
    [answers]
  );

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل إرسال الإجابات");
      setSubmission({ ...data.submission, answers });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ ما");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetry() {
    setSubmission(null);
    setAnswers(defaultAnswers(fields, null));
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {submission ? (
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-700">
              الدرجة: {submission.score} / {submission.maxScore}
            </span>
            <button
              onClick={handleRetry}
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <span className="text-sm text-slate-500">
            تمت الإجابة على {answeredCount} من {fields.length}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      <div className="space-y-8">
        {pages.map((page) => (
          <div
            key={page.id}
            className="relative mx-auto w-full max-w-3xl select-none overflow-hidden rounded-lg border border-slate-300 bg-white shadow"
            style={{ aspectRatio: `${page.width} / ${page.height}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.imagePath}
              alt={`صفحة ${page.index}`}
              className="pointer-events-none absolute inset-0 h-full w-full"
              draggable={false}
            />
            {fields
              .filter((f) => f.pageId === page.id)
              .map((field) => (
                <SolveFieldOverlay
                  key={field.id}
                  field={field}
                  value={answers[field.id]}
                  onChange={(v) => setAnswer(field.id, v)}
                  result={results?.[field.id] ?? null}
                  locked={!!results}
                />
              ))}
          </div>
        ))}
      </div>

      {!submission && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mx-auto mt-8 block w-full max-w-3xl rounded-lg bg-emerald-600 px-4 py-3 text-lg font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? "جاري التصحيح..." : "تسليم الإجابات والحصول على الدرجة"}
        </button>
      )}
    </div>
  );
}
