"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";

export type ExtractedReceipt = {
  merchant: string;
  date: string;
  total: number;
  tax?: number | null;
  currency?: string | null;
  category?: string | null;
  paymentMethod?: string | null;
  lineItems?: {
    description: string;
    qty?: number | null;
    price?: number | null;
  }[];
  notes?: string | null;
};

export type ReceiptRow = {
  id: string;
  userId: string;
  s3Key: string;
  s3Url: string;
  status: string;
  extractedJson: ExtractedReceipt | null;
  categoryOverride?: string | null;
  createdAt: string;
};

export type UploadLimitInfo = {
  uploadedToday: number;
  remainingToday: number;
  limit: number;
  windowStart: string;
  windowEnd: string;
};

export type RecurringExpense = {
  merchant: string;
  cadence: "weekly" | "monthly" | "yearly";
  typicalAmount: number;
  lastChargeDate: string;
  predictedNextDate: string;
  occurrenceCount: number;
  confidence: number;
};

export type Range = "this-month" | "last-month" | "all-time";

type PreviewType = "image" | "pdf" | "other" | null;

type DashboardContextValue = {
  receipts: ReceiptRow[];
  setReceipts: React.Dispatch<React.SetStateAction<ReceiptRow[]>>;
  recurring: RecurringExpense[];
  loading: boolean;
  error: string | null;
  uploadLimit: UploadLimitInfo | null;
  range: Range;
  setRange: (r: Range) => void;
  refresh: () => void;
  runExtraction: (id: string) => Promise<void>;
  runningId: string | null;
  uploadOpen: boolean;
  setUploadOpen: (b: boolean) => void;
  fixingId: string | null;
  setFixingId: (id: string | null) => void;
  previewUrl: string | null;
  previewType: PreviewType;
  openPreview: (url: string) => void;
  closePreview: () => void;
  downloadCsv: () => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
  isInRange: (createdAt: string) => boolean;
  getCategory: (r: ReceiptRow) => string;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used inside <DashboardProvider>");
  }
  return ctx;
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user?.email;

  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadLimit, setUploadLimit] = useState<UploadLimitInfo | null>(null);
  const [range, setRange] = useState<Range>("this-month");
  const [runningId, setRunningId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<PreviewType>(null);

  const fetchReceipts = useCallback(async (currentUserId: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/receipts", {
        method: "GET",
        headers: { "x-user-id": currentUserId },
        credentials: "include",
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `API returned non-JSON (status ${res.status}): ${text.slice(0, 80)}…`
        );
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to load receipts");
      }

      const mapped: ReceiptRow[] = (data.receipts || []).map((r: any) => ({
        id: r.id,
        userId: r.userId,
        s3Key: r.s3Key,
        s3Url: r.s3Url,
        status: r.status,
        extractedJson: (r.extractedJson ?? null) as ExtractedReceipt | null,
        createdAt: r.createdAt,
        categoryOverride: r.categoryOverride ?? null,
      }));

      setReceipts(mapped);
      setUploadLimit(data.uploadLimit ?? null);
    } catch (err: any) {
      setError(err.message || "Error loading receipts");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecurring = useCallback(async () => {
    try {
      const res = await fetch("/api/receipts/recurring", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setRecurring(data.recurring || []);
    } catch {
      // non-fatal
    }
  }, []);

  const refresh = useCallback(() => {
    if (!userId) return;
    fetchReceipts(userId);
    fetchRecurring();
  }, [userId, fetchReceipts, fetchRecurring]);

  useEffect(() => {
    if (!userId) return;
    fetchReceipts(userId);
    fetchRecurring();
  }, [userId, fetchReceipts, fetchRecurring]);

  const runExtraction = useCallback(async (id: string) => {
    try {
      setRunningId(id);
      setError(null);

      const res = await fetch(`/api/receipts/${id}/extract`, {
        method: "POST",
        credentials: "include",
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Extraction API returned non-JSON (status ${res.status}): ${text.slice(0, 80)}…`
        );
      }

      if (!res.ok) {
        throw new Error(data.error || "Extraction failed");
      }

      const updated = data.receipt as any;

      setReceipts((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: updated.status,
                extractedJson: (updated.extractedJson ?? null) as ExtractedReceipt | null,
              }
            : r
        )
      );
    } catch (err: any) {
      setError(err.message || "Error running extraction");
    } finally {
      setRunningId(null);
    }
  }, []);

  const openPreview = useCallback((url: string) => {
    const lower = url.toLowerCase();
    if (lower.endsWith(".pdf")) {
      setPreviewType("pdf");
    } else if (/\.(png|jpe?g|gif|webp)$/.test(lower)) {
      setPreviewType("image");
    } else {
      setPreviewType("other");
    }
    setPreviewUrl(url);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewUrl(null);
    setPreviewType(null);
  }, []);

  const downloadCsv = useCallback(async () => {
    try {
      const res = await fetch("/api/receipts/export", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenses-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Failed to download expenses spreadsheet");
    }
  }, []);

  const deleteReceipt = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/receipts/${id}`, {
          method: "DELETE",
          headers: userId ? { "x-user-id": userId } : {},
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Delete failed");
        setReceipts((prev) => prev.filter((rec) => rec.id !== id));
      } catch (err) {
        console.error(err);
        alert("Failed to delete receipt");
      }
    },
    [userId]
  );

  const isInRange = useCallback(
    (createdAt: string) => {
      if (range === "all-time") return true;

      const d = new Date(createdAt);
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      if (range === "this-month") {
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      }

      let lastMonth = thisMonth - 1;
      let year = thisYear;
      if (lastMonth < 0) {
        lastMonth = 11;
        year = thisYear - 1;
      }
      return d.getMonth() === lastMonth && d.getFullYear() === year;
    },
    [range]
  );

  const getCategory = useCallback((r: ReceiptRow): string => {
    if (r.categoryOverride) return r.categoryOverride || "Uncategorized";
    return r.extractedJson?.category?.trim() || "Uncategorized";
  }, []);

  const value: DashboardContextValue = {
    receipts,
    setReceipts,
    recurring,
    loading,
    error,
    uploadLimit,
    range,
    setRange,
    refresh,
    runExtraction,
    runningId,
    uploadOpen,
    setUploadOpen,
    fixingId,
    setFixingId,
    previewUrl,
    previewType,
    openPreview,
    closePreview,
    downloadCsv,
    deleteReceipt,
    isInRange,
    getCategory,
  };

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
}
