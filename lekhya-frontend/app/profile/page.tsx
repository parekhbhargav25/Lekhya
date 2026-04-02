"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ReceiptPreview = {
  id: string;
  s3Url: string;
  status: string;
  createdAt: string;
  extractedJson: {
    merchant?: string | null;
    total?: number | null;
    category?: string | null;
  } | null;
  categoryOverride?: string | null;
};

type ProfileData = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  authProvider: string;
  totalReceipts: number;
  parsedReceipts: number;
  uploadLimit: {
    uploadedToday: number;
    remainingToday: number;
    limit: number;
  };
  recentReceipts: ReceiptPreview[];
};

type ReceiptTab = "uploaded" | "parsed";

function getDisplayName(profile: ProfileData | null, fallbackEmail?: string | null) {
  if (profile?.name?.trim()) return profile.name.trim();
  if (fallbackEmail) return fallbackEmail.split("@")[0];
  return "Lekhya user";
}

function getReceiptCategory(receipt: ReceiptPreview) {
  return receipt.categoryOverride || receipt.extractedJson?.category || "Uncategorized";
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReceiptTab>("uploaded");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "pdf" | "other" | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [router, status]);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/profile", {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load profile");
        }

        setProfile(data.profile ?? null);
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [status]);

  const displayName = getDisplayName(profile, session?.user?.email);
  const handle = useMemo(() => {
    const email = profile?.email || session?.user?.email || "user";
    return `@${email.split("@")[0].replace(/[^a-z0-9._-]/gi, "").toLowerCase()}`;
  }, [profile?.email, session?.user?.email]);

  const visibleReceipts = useMemo(() => {
    const allReceipts = profile?.recentReceipts ?? [];
    if (activeTab === "parsed") {
      return allReceipts.filter((receipt) => receipt.status === "parsed");
    }
    return allReceipts;
  }, [activeTab, profile?.recentReceipts]);

  function openPreview(url: string) {
    const lower = url.toLowerCase();

    if (lower.endsWith(".pdf")) {
      setPreviewType("pdf");
    } else if (/\.(png|jpe?g|gif|webp)$/.test(lower)) {
      setPreviewType("image");
    } else {
      setPreviewType("other");
    }

    setPreviewUrl(url);
  }

  function closePreview() {
    setPreviewUrl(null);
    setPreviewType(null);
  }

  async function deleteProfile() {
    const confirmed = window.confirm(
      "Delete your profile permanently? This will remove your account and receipts."
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError(null);

      const res = await fetch("/api/profile", {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete profile");
      }

      await signOut({ callbackUrl: "/" });
    } catch (err: any) {
      setError(err.message || "Failed to delete profile");
      setDeleting(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-[#fcfaf8] flex items-center justify-center">
        <p className="text-sm text-slate-500">Loading profile…</p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#fcfaf8] px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex justify-end gap-3">
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Dashboard
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#8a7bff] via-[#6f86ff] to-[#3ca9ff] text-4xl font-semibold text-white shadow-lg">
            {(profile?.email?.[0] ?? session?.user?.email?.[0] ?? "U").toUpperCase()}
          </div>

          <h1 className="mt-5 text-5xl font-semibold tracking-tight text-slate-950">
            {displayName}
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            {handle} · {profile?.authProvider || "Account"} · member since{" "}
            {profile?.createdAt
              ? new Date(profile.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </p>

          <div className="mt-3 flex items-center justify-center gap-5 text-sm font-semibold text-slate-900">
            <span>{profile?.totalReceipts ?? 0} receipts</span>
            <span>{profile?.parsedReceipts ?? 0} parsed</span>
            <span>{profile?.uploadLimit.remainingToday ?? 0} left today</span>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard?upload=1"
              className="rounded-full bg-[#ece9e4] px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-[#e4e0da]"
            >
              Upload receipt
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-[#ece9e4] px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-[#e4e0da]"
            >
              Open dashboard
            </Link>
            <button
              type="button"
              onClick={deleteProfile}
              disabled={deleting}
              className="rounded-full bg-[#f8dede] px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-[#f3caca] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? "Deleting profile…" : "Delete profile"}
            </button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-10 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("uploaded")}
              className={`border-b-4 px-2 pb-3 text-base font-semibold transition ${
                activeTab === "uploaded"
                  ? "border-slate-900 text-slate-950"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Uploaded
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("parsed")}
              className={`border-b-4 px-2 pb-3 text-base font-semibold transition ${
                activeTab === "parsed"
                  ? "border-slate-900 text-slate-950"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Parsed
            </button>
          </div>
        </section>

        <section className="mt-12">
          {visibleReceipts.length === 0 ? (
            <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
              <p className="text-lg font-semibold text-slate-900">No receipts here yet</p>
              <p className="mt-2 text-sm text-slate-500">
                Upload a receipt and it will appear on your profile.
              </p>
              <Link
                href="/dashboard?upload=1"
                className="mt-6 inline-flex rounded-full bg-gradient-to-r from-[#7b61ff] to-[#a58fff] px-5 py-3 text-sm font-semibold text-white shadow-sm"
              >
                Upload your first receipt
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleReceipts.map((receipt) => {
                const parsed = receipt.extractedJson;
                const isImage = /\.(png|jpe?g|gif|webp)$/i.test(receipt.s3Url);

                return (
                  <article
                    key={receipt.id}
                    className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <button
                      type="button"
                      onClick={() => openPreview(receipt.s3Url)}
                      className="block w-full text-left"
                    >
                    <div className="aspect-[4/3] bg-[#f2efe9]">
                      {isImage ? (
                        <img
                          src={receipt.s3Url}
                          alt={parsed?.merchant || "Receipt"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#ede9ff] to-[#f7f3ff] text-sm font-semibold text-violet-700">
                          Receipt PDF
                        </div>
                      )}
                    </div>
                    </button>

                    <div className="px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="line-clamp-1 text-lg font-semibold text-slate-900">
                            {parsed?.merchant || "Uploaded receipt"}
                          </h2>
                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(receipt.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            receipt.status === "parsed"
                              ? "bg-emerald-50 text-emerald-700"
                              : receipt.status === "error"
                              ? "bg-red-50 text-red-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {receipt.status}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Category
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {getReceiptCategory(receipt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Total
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {parsed?.total != null ? `$${parsed.total.toFixed(2)}` : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-lg">
            <button
              type="button"
              onClick={closePreview}
              className="absolute right-3 top-3 z-10 text-sm text-slate-600 hover:text-slate-900"
            >
              ✕
            </button>

            {previewType === "image" && (
              <div className="flex items-center justify-center bg-slate-50">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="max-h-[80vh] w-auto object-contain"
                />
              </div>
            )}

            {previewType === "pdf" && (
              <iframe
                src={previewUrl}
                className="h-[80vh] w-full"
              />
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
    </main>
  );
}
