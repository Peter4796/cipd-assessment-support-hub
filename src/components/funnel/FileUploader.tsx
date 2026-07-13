"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Icon } from "@/components/Icon";
import { trackEvent } from "@/lib/analytics";
import {
  ACCEPT_ATTRIBUTE,
  MAX_FILES,
  buildBlobPathname,
  humanFileSize,
  sanitiseFileName,
  uploadErrorMessage,
  validateFile,
} from "@/lib/leads/uploads";
import {
  ATTACHMENT_CATEGORIES,
  type AttachmentCategory,
  type LeadAttachment,
} from "@/lib/leads/types";

/**
 * Category-slotted document uploader for the assessment funnel.
 *
 * Honesty rules enforced here:
 *  - a file is only shown as "Uploaded" after the Blob upload succeeds;
 *  - failed uploads stay visible with a Retry action and never join the lead;
 *  - when Blob is not configured (GET /api/uploads → available:false) the
 *    whole step degrades to an honest "share documents after submitting" note.
 */

type UploadingFile = {
  localId: string;
  file: File;
  category: AttachmentCategory;
  status: "uploading" | "done" | "error";
  progress: number; // 0–100
  errorCode?: string;
  attachment?: LeadAttachment;
};

const SLOTS: { category: AttachmentCategory; hint: string; resubOnly?: boolean }[] = [
  { category: "ASSESSMENT_BRIEF", hint: "The brief or task document from your centre" },
  { category: "EXISTING_DRAFT", hint: "Your current draft, if you have one" },
  { category: "TUTOR_FEEDBACK", hint: "Assessor or tutor feedback (screenshots welcome)" },
  { category: "SUPPORTING_DOCUMENT", hint: "Any other instructions or materials" },
];

export function FileUploader({
  onChange,
  isResubmission,
}: {
  onChange: (files: LeadAttachment[]) => void;
  isResubmission: boolean;
}) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [items, setItems] = useState<UploadingFile[]>([]);
  const [slotError, setSlotError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCategory = useRef<AttachmentCategory>("SUPPORTING_DOCUMENT");

  // Availability probe — degrade honestly when Blob is unconfigured.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/uploads")
      .then((r) => r.json())
      .then((d: { available?: boolean }) => {
        if (!cancelled) setAvailable(Boolean(d.available));
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const doneAttachments = (list: UploadingFile[]) =>
    list.filter((i) => i.status === "done" && i.attachment).map((i) => i.attachment!) ;

  const startUpload = async (localId: string, file: File, category: AttachmentCategory) => {
    trackEvent("brief_upload_started", { file_category: category });
    try {
      const pathname = buildBlobPathname(file.name, category);
      const result = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/uploads",
        contentType: file.type || undefined,
        onUploadProgress: ({ percentage }) => {
          setItems((prev) =>
            prev.map((i) => (i.localId === localId ? { ...i, progress: Math.round(percentage) } : i))
          );
        },
      });
      const attachment: LeadAttachment = {
        id: localId,
        originalFileName: sanitiseFileName(file.name),
        pathname: result.pathname,
        mimeType: file.type || result.contentType || "application/octet-stream",
        sizeBytes: file.size,
        uploadStatus: "uploaded",
        url: result.url,
        uploadedAt: new Date().toISOString(),
        category,
      };
      setItems((prev) => {
        const next = prev.map((i) =>
          i.localId === localId ? { ...i, status: "done" as const, progress: 100, attachment } : i
        );
        onChange(doneAttachments(next));
        return next;
      });
      trackEvent("brief_upload_completed", { file_category: category });
    } catch {
      setItems((prev) =>
        prev.map((i) =>
          i.localId === localId ? { ...i, status: "error" as const, errorCode: "upload_failed" } : i
        )
      );
      trackEvent("brief_upload_failed", { file_category: category, error: "upload_failed" });
    }
  };

  const addFiles = (fileList: FileList | null, category: AttachmentCategory) => {
    setSlotError(null);
    if (!fileList || fileList.length === 0) return;
    const currentCount = items.filter((i) => i.status !== "error").length;
    for (const file of Array.from(fileList)) {
      if (currentCount + 1 > MAX_FILES) {
        setSlotError(uploadErrorMessage("too_many_files"));
        trackEvent("brief_upload_failed", { file_category: category, error: "too_many_files" });
        return;
      }
      const check = validateFile(file);
      if (!check.ok) {
        setSlotError(uploadErrorMessage(check.error));
        trackEvent("brief_upload_failed", { file_category: category, error: check.error });
        return;
      }
      const localId = `att_${Math.random().toString(36).slice(2, 9)}`;
      setItems((prev) => [
        ...prev,
        { localId, file, category, status: "uploading", progress: 0 },
      ]);
      void startUpload(localId, file, category);
    }
  };

  const removeItem = (localId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.localId !== localId);
      onChange(doneAttachments(next));
      return next;
    });
  };

  const retryItem = (localId: string) => {
    const item = items.find((i) => i.localId === localId);
    if (!item) return;
    setItems((prev) =>
      prev.map((i) =>
        i.localId === localId ? { ...i, status: "uploading", progress: 0, errorCode: undefined } : i
      )
    );
    void startUpload(localId, item.file, item.category);
  };

  const openPicker = (category: AttachmentCategory) => {
    pendingCategory.current = category;
    inputRef.current?.click();
  };

  // ─── Blob not configured: honest degradation, never a broken uploader ───
  if (available === false) {
    return (
      <div className="rounded-2xl border border-gold-200 bg-gold-50 p-5">
        <p className="text-sm font-medium text-navy-800">
          Document upload isn&apos;t available right now.
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-navy-600">
          You can still send your enquiry. After it&apos;s received, we&apos;ll invite you to share
          your assessment brief and any feedback directly on WhatsApp or by email.
        </p>
      </div>
    );
  }

  const totalActive = items.filter((i) => i.status !== "error").length;
  const visibleSlots = isResubmission
    ? [SLOTS[2], SLOTS[0], SLOTS[1], SLOTS[3]] // feedback first for resubmissions
    : SLOTS;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ACCEPT_ATTRIBUTE}
        onChange={(e) => {
          addFiles(e.target.files, pendingCategory.current);
          e.target.value = "";
        }}
      />

      <div className="grid gap-2.5 sm:grid-cols-2">
        {visibleSlots.map((slot) => (
          <button
            key={slot.category}
            type="button"
            onClick={() => openPicker(slot.category)}
            disabled={available === null || totalActive >= MAX_FILES}
            className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-mist-300 bg-mist-50 p-4 text-left transition-colors hover:border-teal-400 hover:bg-teal-50/40 disabled:opacity-50"
          >
            <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-white text-teal-600 shadow-soft">
              <Icon name="brief" className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-navy-900">
                Add {ATTACHMENT_CATEGORIES[slot.category].toLowerCase()}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-navy-500">{slot.hint}</span>
            </span>
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-navy-500">
        PDF, DOC, DOCX, TXT, PNG or JPG · up to 10&nbsp;MB each · maximum {MAX_FILES} files.
      </p>

      {slotError && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
          {slotError}
        </p>
      )}

      {items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.localId}
              className="rounded-xl border border-mist-200 bg-white p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy-800">
                    {sanitiseFileName(item.file.name)}
                  </p>
                  <p className="text-xs text-navy-400">
                    {ATTACHMENT_CATEGORIES[item.category]} · {humanFileSize(item.file.size)}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  {item.status === "done" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-700">
                      <Icon name="check" className="h-3 w-3" /> Uploaded
                    </span>
                  )}
                  {item.status === "error" && (
                    <button
                      type="button"
                      onClick={() => retryItem(item.localId)}
                      className="rounded-full border border-mist-300 px-3 py-1 text-xs font-semibold text-navy-700 hover:bg-mist-100"
                    >
                      Retry
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(item.localId)}
                    aria-label={`Remove ${item.file.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-navy-400 hover:bg-mist-100 hover:text-navy-700"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                      <path d="M6 6 18 18M18 6 6 18" />
                    </svg>
                  </button>
                </div>
              </div>
              {item.status === "uploading" && (
                <div className="mt-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-mist-200">
                    <div
                      className="h-full rounded-full bg-teal-500 transition-all"
                      style={{ width: `${Math.max(6, item.progress)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-navy-400">Uploading… {item.progress}%</p>
                </div>
              )}
              {item.status === "error" && (
                <p className="mt-2 text-xs text-red-600">
                  {uploadErrorMessage(item.errorCode ?? "upload_failed")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
