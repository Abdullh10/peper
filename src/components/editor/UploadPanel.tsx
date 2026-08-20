"use client";

import { useRef, useState } from "react";
import { EditorPage } from "./types";

export default function UploadPanel({
  worksheetId,
  onDone,
}: {
  worksheetId: string;
  onDone: (pages: EditorPage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  async function handleFile(file: File) {
    setFileName(file.name);
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/worksheets/${worksheetId}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "فشل رفع الملف");
        return;
      }
      onDone(
        data.worksheet.pages.map(
          (p: { id: string; index: number; imagePath: string; width: number; height: number }) => p
        )
      );
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="mt-6 rounded-xl border-2 border-dashed border-slate-300 bg-white p-10 text-center"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
    >
      <div className="text-4xl">📄</div>
      <p className="mt-3 text-slate-600">اسحب ملف PDF هنا أو اضغط للاختيار</p>
      {fileName && <p className="mt-1 text-xs text-slate-400">{fileName}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="mt-4 rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {uploading ? "جاري رفع ومعالجة الملف..." : "اختيار ملف PDF"}
      </button>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
