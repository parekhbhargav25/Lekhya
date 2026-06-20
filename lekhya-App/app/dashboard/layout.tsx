"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardProvider, useDashboard, type ExtractedReceipt } from "./DashboardContext";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileBottomNav } from "./MobileBottomNav";
import { ChatbotWidget } from "./ChatbotWidget";
import { UploadReceiptModal } from "../components/UploadReceiptModal";
import { FixExtractionModal } from "../components/FixExtractionModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const {
    error,
    uploadOpen,
    setUploadOpen,
    uploadLimit,
    fixingId,
    setFixingId,
    receipts,
    setReceipts,
    previewUrl,
    previewType,
    closePreview,
    refresh,
  } = useDashboard();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upload") !== "1") return;
    setUploadOpen(true);
    router.replace("/dashboard");
  }, [router, status, setUploadOpen]);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-[#f5ecff] flex items-center justify-center">
        <p className="text-sm text-slate-500">Checking session…</p>
      </main>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-[#f6f0ff] to-[#fdf7ff]">
      <Sidebar />

      <main className="flex-1 min-w-0 px-4 py-6 pb-24 sm:px-8 lg:px-10 lg:pb-6">
        <div className="max-w-6xl mx-auto">
          <TopBar />

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {children}
        </div>
      </main>

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={closePreview}
              className="absolute top-3 right-3 text-slate-600 hover:text-slate-900 text-sm"
            >
              ✕
            </button>

            {previewType === "image" && (
              <div className="bg-slate-50 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="max-h-[80vh] w-auto object-contain"
                />
              </div>
            )}

            {previewType === "pdf" && (
              <iframe src={previewUrl} className="w-full h-[80vh]" />
            )}

            {previewType === "other" && (
              <div className="p-6 text-sm text-slate-700">
                <p className="mb-3">Preview not available for this file type.</p>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-violet-600 underline"
                >
                  Open in new tab
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <MobileBottomNav />

      <ChatbotWidget />

      <UploadReceiptModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={refresh}
        uploadsRemainingToday={uploadLimit?.remainingToday}
        dailyUploadLimit={uploadLimit?.limit}
      />

      <FixExtractionModal
        open={Boolean(fixingId)}
        onClose={() => setFixingId(null)}
        receiptId={fixingId || ""}
        current={receipts.find((r) => r.id === fixingId)?.extractedJson || null}
        onSuccess={(updated) => {
          setReceipts((prev) =>
            prev.map((r) =>
              r.id === fixingId
                ? {
                    ...r,
                    status: updated.status,
                    extractedJson: (updated.extractedJson ?? null) as ExtractedReceipt | null,
                  }
                : r
            )
          );
        }}
      />
    </div>
  );
}
