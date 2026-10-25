"use client";

import { useRef, useState, type DragEvent } from "react";
import clsx from "clsx";
import { FileText, Upload, X } from "lucide-react";
import { CV_ACCEPT, CV_MAX_BYTES, CV_TYPES } from "@/lib/constants";

type Props = { file: File | null; onChange: (file: File | null) => void; error?: string };

// Drag-and-drop CV picker with type/size validation.
export default function FileDrop({ file, onChange, error }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");

  function pick(f: File | undefined) {
    if (!f) return;
    if (!CV_TYPES.includes(f.type)) return setLocalError("Please upload a PDF or Word document.");
    if (f.size > CV_MAX_BYTES) return setLocalError("That file is over 5 MB.");
    setLocalError("");
    onChange(f);
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files[0]);
  };

  const shownError = localError || error;
  const ext = file?.name.split(".").pop()?.toUpperCase();

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={clsx(
          "flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-[18px] border-2 border-dashed px-5 py-9 text-center transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-violet-glow",
          dragging ? "scale-[1.01] border-violet bg-violet-soft" : "border-[#c9c2ff] bg-[#f7f5ff]",
          shownError && "border-danger",
        )}
      >
        <span className="grid size-13 place-items-center rounded-2xl bg-violet">
          <Upload className="size-6 text-white" />
        </span>
        <span className="font-bold">
          Drop your CV here or <span className="text-violet">browse</span>
        </span>
        <span className="text-[13px] text-muted">PDF or DOCX · up to 5 MB</span>
        <input ref={input} type="file" accept={CV_ACCEPT} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
      </label>
      {shownError && <p className="mt-2 text-sm font-medium text-danger-ink">{shownError}</p>}
      {file && (
        <div className="mt-3.5 flex items-center gap-3.5 rounded-2xl border border-line p-3.5">
          <span className="grid size-10 place-items-center rounded-[10px] bg-danger-soft text-[11px] font-bold text-danger-ink">{ext === "PDF" ? "PDF" : <FileText className="size-5" />}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{file.name}</div>
            <div className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB · ready to upload</div>
          </div>
          <button
            type="button"
            aria-label="Remove file"
            onClick={() => {
              onChange(null);
              if (input.current) input.current.value = "";
            }}
            className="grid size-10 place-items-center rounded-[10px] bg-[#f0f1f6] hover:bg-line"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
