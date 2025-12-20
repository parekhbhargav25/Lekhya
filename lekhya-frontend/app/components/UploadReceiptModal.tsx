"use client";

import { useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onUploaded?: () => void; // call this to refresh dashboard receipts
};

export function UploadReceiptModal({ open, onClose, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  function pickFile() {
    inputRef.current?.click();
  }

  function onFileSelected(f: File | null) {
    setErr(null);
    setFile(f);
  }

  async function upload() {
    if (!file || uploading) return;
    setUploading(true);
    setErr(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/receipts", {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Upload failed");

      // success
      onUploaded?.();
      setFile(null);
      onClose();
    } catch (e: any) {
      setErr(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Upload a receipt
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              For best results, upload a clear image (PNG/JPG) or a PDF.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Dropzone */}
        <div className="px-6 py-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const dropped = e.dataTransfer.files?.[0] ?? null;
              onFileSelected(dropped);
            }}
            className={[
              "rounded-2xl border-2 border-dashed p-8 text-center transition",
              dragOver
                ? "border-violet-500 bg-violet-50"
                : "border-slate-200 bg-slate-50",
            ].join(" ")}
          >
            <div className="mx-auto h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4">
              <span className="text-xl">📄</span>
            </div>

            <p className="text-sm font-semibold text-slate-900">
              Drag and drop a receipt to upload
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Your file stays private to your account.
            </p>

            <div className="mt-4">
              <button
                type="button"
                onClick={pickFile}
                className="inline-flex items-center justify-center rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100"
              >
                Select file
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
              />
            </div>

            {file && (
              <div className="mt-4 text-xs text-slate-700">
                Selected: <span className="font-medium">{file.name}</span>
              </div>
            )}
          </div>

          {/* Error */}
          {err && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              {err}
            </div>
          )}

          {/* Footer buttons */}
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              disabled={uploading}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={upload}
              disabled={!file || uploading}
              className="px-6 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading…" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}