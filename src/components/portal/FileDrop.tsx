"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/Icon";

/** Human-readable file size. */
function sizeLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * File picker that reports selected file metadata to `onFiles`.
 * In demo mode we capture name + size only (files aren't uploaded anywhere).
 * To go live, POST the File objects to your storage (e.g. Supabase Storage / S3).
 */
export function FileDrop({
  onFiles,
  label = "Upload files",
  hint = "PDF, Word or images",
}: {
  onFiles: (files: { name: string; sizeLabel: string }[]) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).map((f) => ({ name: f.name, sizeLabel: sizeLabel(f.size) }));
    onFiles(files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handle(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
        dragging ? "border-teal-400 bg-teal-50/50" : "border-mist-300 bg-mist-50 hover:border-teal-300"
      }`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-teal-600 shadow-soft">
        <Icon name="brief" className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-navy-800">{label}</p>
      <p className="text-xs text-navy-500">Drag &amp; drop or click · {hint}</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
        onChange={(e) => handle(e.target.files)}
      />
    </div>
  );
}
