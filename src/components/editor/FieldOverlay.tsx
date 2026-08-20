"use client";

import { RefObject, useRef } from "react";
import { EditorField, FIELD_TYPE_LABELS } from "./types";

export default function FieldOverlay({
  field,
  selected,
  containerRef,
  onSelect,
  onDrag,
  onResize,
}: {
  field: EditorField;
  selected: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onDrag: (deltaXPercent: number, deltaYPercent: number) => void;
  onResize: (deltaWPercent: number, deltaHPercent: number) => void;
}) {
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  function startDrag(e: React.PointerEvent) {
    e.stopPropagation();
    onSelect();
    lastPos.current = { x: e.clientX, y: e.clientY };
    const move = (ev: PointerEvent) => {
      if (!lastPos.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((ev.clientX - lastPos.current.x) / rect.width) * 100;
      const dy = ((ev.clientY - lastPos.current.y) / rect.height) * 100;
      onDrag(dx, dy);
      lastPos.current = { x: ev.clientX, y: ev.clientY };
    };
    const up = () => {
      lastPos.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function startResize(e: React.PointerEvent) {
    e.stopPropagation();
    onSelect();
    lastPos.current = { x: e.clientX, y: e.clientY };
    const move = (ev: PointerEvent) => {
      if (!lastPos.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dw = ((ev.clientX - lastPos.current.x) / rect.width) * 100;
      const dh = ((ev.clientY - lastPos.current.y) / rect.height) * 100;
      onResize(dw, dh);
      lastPos.current = { x: ev.clientX, y: ev.clientY };
    };
    const up = () => {
      lastPos.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div
      onPointerDown={startDrag}
      className={`absolute flex cursor-move items-center justify-center rounded border-2 text-[10px] font-semibold ${
        selected
          ? "border-emerald-600 bg-emerald-500/20"
          : "border-sky-500/70 bg-sky-400/10 hover:bg-sky-400/20"
      }`}
      style={{
        left: `${field.x}%`,
        top: `${field.y}%`,
        width: `${field.width}%`,
        height: `${field.height}%`,
      }}
    >
      <span className="pointer-events-none px-1 text-center text-slate-700">
        {field.label || FIELD_TYPE_LABELS[field.type]}
      </span>
      {selected && (
        <div
          onPointerDown={startResize}
          className="absolute -bottom-1.5 -left-1.5 h-3 w-3 cursor-nwse-resize rounded-full border border-white bg-emerald-600"
        />
      )}
    </div>
  );
}
