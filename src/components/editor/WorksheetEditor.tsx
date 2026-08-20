"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EditorField,
  EditorPage,
  FieldType,
  FIELD_TYPE_LABELS,
  defaultAnswerFor,
  defaultOptionsFor,
  defaultSizeFor,
} from "./types";
import FieldOverlay from "./FieldOverlay";
import FieldPropertiesPanel from "./FieldPropertiesPanel";
import UploadPanel from "./UploadPanel";

let tempIdCounter = 0;
function newTempId() {
  tempIdCounter += 1;
  return `temp-${Date.now()}-${tempIdCounter}`;
}

export default function WorksheetEditor({
  worksheetId,
  title: initialTitle,
  description: initialDescription,
  published: initialPublished,
  pages: initialPages,
  initialFields,
}: {
  worksheetId: string;
  title: string;
  description: string;
  published: boolean;
  pages: EditorPage[];
  initialFields: EditorField[];
}) {
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [published, setPublished] = useState(initialPublished);
  const [fields, setFields] = useState<EditorField[]>(initialFields);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activePage = pages[activePageIndex];
  const pageFields = useMemo(
    () => fields.filter((f) => f.pageId === activePage?.id),
    [fields, activePage]
  );
  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null;

  function addField(type: FieldType) {
    if (!activePage) return;
    const size = defaultSizeFor(type);
    const field: EditorField = {
      id: newTempId(),
      pageId: activePage.id,
      type,
      x: 40 - size.width / 2,
      y: 40 - size.height / 2,
      width: size.width,
      height: size.height,
      label: "",
      options: defaultOptionsFor(type),
      answer: defaultAnswerFor(type),
      points: 1,
      order: fields.length,
    };
    setFields((prev) => [...prev, field]);
    setSelectedFieldId(field.id);
  }

  function updateField(id: string, patch: Partial<EditorField>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function deleteField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  }

  const clampPercent = (v: number) => Math.min(100, Math.max(0, v));

  const handleDrag = useCallback(
    (id: string, deltaXPercent: number, deltaYPercent: number) => {
      setFields((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          return {
            ...f,
            x: clampPercent(f.x + deltaXPercent),
            y: clampPercent(f.y + deltaYPercent),
          };
        })
      );
    },
    []
  );

  const handleResize = useCallback(
    (id: string, deltaWPercent: number, deltaHPercent: number) => {
      setFields((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          return {
            ...f,
            width: Math.max(4, Math.min(100 - f.x, f.width + deltaWPercent)),
            height: Math.max(3, Math.min(100 - f.y, f.height + deltaHPercent)),
          };
        })
      );
    },
    []
  );

  async function handleUploadDone(newPages: EditorPage[]) {
    setPages(newPages);
    setFields([]);
    setActivePageIndex(0);
    router.refresh();
  }

  async function saveMeta() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/worksheets/${worksheetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMessage({ type: "ok", text: "تم حفظ بيانات الورقة" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "فشل الحفظ" });
    } finally {
      setSaving(false);
    }
  }

  async function saveFields() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/worksheets/${worksheetId}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: fields.map((f) => ({
            pageId: f.pageId,
            type: f.type,
            x: f.x,
            y: f.y,
            width: f.width,
            height: f.height,
            label: f.label,
            options: f.options,
            answer: f.answer,
            points: f.points,
            order: f.order,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const mapped: EditorField[] = data.fields.map(
        (f: {
          id: string;
          pageId: string;
          type: FieldType;
          x: number;
          y: number;
          width: number;
          height: number;
          label: string | null;
          optionsJson: string | null;
          answerJson: string;
          points: number;
          order: number;
        }) => ({
          id: f.id,
          pageId: f.pageId,
          type: f.type,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          label: f.label ?? "",
          options: f.optionsJson ? JSON.parse(f.optionsJson) : undefined,
          answer: JSON.parse(f.answerJson),
          points: f.points,
          order: f.order,
        })
      );
      setFields(mapped);
      setSelectedFieldId(null);
      setMessage({ type: "ok", text: "تم حفظ جميع الأسئلة بنجاح" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "فشل الحفظ" });
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/worksheets/${worksheetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPublished(data.worksheet.published);
      setMessage({
        type: "ok",
        text: data.worksheet.published ? "تم نشر الورقة، يمكنك الآن تعيينها لطلابك" : "تم إلغاء نشر الورقة",
      });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "فشل التحديث" });
    } finally {
      setSaving(false);
    }
  }

  if (pages.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          ارفع ملف PDF لورقة العمل ليتم تحويله تلقائياً إلى صفحات تفاعلية.
        </p>
        <UploadPanel worksheetId={worksheetId} onDone={handleUploadDone} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-lg font-bold focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف مختصر للورقة (اختياري)"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={saveMeta}
            disabled={saving}
            className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            حفظ العنوان والوصف
          </button>
          <button
            onClick={togglePublish}
            disabled={saving}
            className={`rounded-md px-3 py-2 text-sm font-semibold text-white ${
              published ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {published ? "إلغاء النشر" : "نشر الورقة"}
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-md px-3 py-2 text-sm ${
              message.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {pages.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePageIndex(idx);
                setSelectedFieldId(null);
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                idx === activePageIndex
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              صفحة {p.index}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((type) => (
            <button
              key={type}
              onClick={() => addField(type)}
              className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              + {FIELD_TYPE_LABELS[type]}
            </button>
          ))}
          <button
            onClick={saveFields}
            disabled={saving}
            className="mr-auto rounded-md bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : "حفظ جميع الأسئلة"}
          </button>
        </div>

        {activePage && (
          <div
            ref={containerRef}
            className="relative mx-auto w-full max-w-3xl select-none overflow-hidden rounded-lg border border-slate-300 bg-white shadow"
            style={{ aspectRatio: `${activePage.width} / ${activePage.height}` }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedFieldId(null);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePage.imagePath}
              alt={`صفحة ${activePage.index}`}
              className="pointer-events-none absolute inset-0 h-full w-full"
              draggable={false}
            />
            {pageFields.map((field) => (
              <FieldOverlay
                key={field.id}
                field={field}
                selected={field.id === selectedFieldId}
                containerRef={containerRef}
                onSelect={() => setSelectedFieldId(field.id)}
                onDrag={(dx, dy) => handleDrag(field.id, dx, dy)}
                onResize={(dw, dh) => handleResize(field.id, dw, dh)}
              />
            ))}
          </div>
        )}
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-slate-400">
          انقر على أي عنصر لتحديده وتعديل إجابته من اللوحة الجانبية، اسحبه لتحريكه، واستخدم
          المقبض في الزاوية لتغيير حجمه.
        </p>
      </div>

      <div>
        <FieldPropertiesPanel
          field={selectedField}
          onChange={(patch) => selectedField && updateField(selectedField.id, patch)}
          onDelete={() => selectedField && deleteField(selectedField.id)}
        />
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          <p className="font-semibold text-slate-700">إجمالي الأسئلة: {fields.length}</p>
          <p className="mt-1">
            إجمالي الدرجات: {fields.reduce((sum, f) => sum + (f.points || 0), 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
