// app/receipts/page.tsx
"use client";

import { useState } from "react";

export default function ReceiptsUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    setUploading(true);
    setMessage(null);
    setUploadedUrl(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadedUrl(data.url);
      setMessage("Receipt uploaded successfully!");
    } catch (err: any) {
      setMessage(err.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setMessage(null);
      setUploadedUrl(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3ecff] px-4 py-10">
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-md p-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Upload a receipt
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Upload a photo or PDF receipt. We&apos;ll store it securely and soon
          run it through Lekhya&apos;s AI extractor.
        </p>

        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-[#f9f5ff] hover:bg-[#f3ecff] transition">
          <span className="text-sm text-slate-600">
            {file ? `Selected: ${file.name}` : "Click to choose a file"}
          </span>
          <span className="text-xs text-slate-500 mt-1">
            JPG, PNG, or PDF (max ~5MB recommended)
          </span>
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={onFileChange}
          />
        </label>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-6 w-full px-4 py-2.5 rounded-full bg-gradient-to-r from-[#7b61ff] to-[#a58fff] text-white text-sm font-semibold shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : "Upload receipt"}
        </button>

        {message && (
          <p className="mt-4 text-sm text-slate-700">{message}</p>
        )}
      </div>
    </main>
  );
}
