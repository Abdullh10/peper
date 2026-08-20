"use client";

import { useState } from "react";

type Student = { id: string; name: string; email: string };

export default function AssignPanel({
  worksheetId,
  published,
  students,
  alreadyAssignedIds,
}: {
  worksheetId: string;
  published: boolean;
  students: Student[];
  alreadyAssignedIds: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assigned, setAssigned] = useState<Set<string>>(new Set(alreadyAssignedIds));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const unassigned = students.filter((s) => !assigned.has(s.id));
    if (selected.size === unassigned.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(unassigned.map((s) => s.id)));
    }
  }

  async function handleAssign() {
    if (selected.size === 0) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/worksheets/${worksheetId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAssigned((prev) => new Set([...prev, ...selected]));
      setSelected(new Set());
      setMessage({ type: "ok", text: `تم تعيين الورقة لـ ${data.count} طالب بنجاح` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "فشل التعيين" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={toggleAll} className="text-sm font-medium text-emerald-600 hover:underline">
          تحديد الكل / إلغاء التحديد
        </button>
        <span className="text-sm text-slate-500">{selected.size} محدد</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {students.map((s) => {
          const isAssigned = assigned.has(s.id);
          return (
            <label
              key={s.id}
              className={`flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 ${
                isAssigned ? "bg-slate-50" : ""
              }`}
            >
              <input
                type="checkbox"
                disabled={isAssigned}
                checked={selected.has(s.id) || isAssigned}
                onChange={() => toggle(s.id)}
              />
              <div className="flex-1">
                <p className="font-medium text-slate-800">{s.name}</p>
                <p className="text-xs text-slate-500" dir="ltr">
                  {s.email}
                </p>
              </div>
              {isAssigned && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  معيّنة له
                </span>
              )}
            </label>
          );
        })}
      </div>

      {message && (
        <div
          className={`mt-4 rounded-md px-3 py-2 text-sm ${
            message.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        onClick={handleAssign}
        disabled={saving || selected.size === 0 || !published}
        className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {saving ? "جاري التعيين..." : `تعيين الورقة للطلاب المحددين (${selected.size})`}
      </button>
    </div>
  );
}
