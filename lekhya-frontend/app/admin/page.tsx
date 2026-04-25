import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { UserActions, ReceiptActions } from "./AdminActions";
import { MetricsStrip, type Metric } from "./MetricsStrip";

export const dynamic = "force-dynamic";

const DAYS = 7;

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/dashboard");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - DAYS);
  windowStart.setHours(0, 0, 0, 0);

  const prevWindowStart = new Date(windowStart);
  prevWindowStart.setDate(prevWindowStart.getDate() - DAYS);

  const [
    totalUsers,
    verifiedUsers,
    totalReceipts,
    receiptsToday,
    gmailUsers,
    users,
    receipts,
    userDates,
    verifiedDates,
    receiptDates,
    gmailDates,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerifiedAt: { not: null } } }),
    prisma.receipt.count(),
    prisma.receipt.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.googleAccount.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        emailVerifiedAt: true,
        _count: { select: { receipts: true } },
      },
    }),
    prisma.receipt.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        status: true,
        source: true,
        createdAt: true,
        extractedJson: true,
        user: { select: { email: true } },
      },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: prevWindowStart } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { emailVerifiedAt: { gte: prevWindowStart } },
      select: { emailVerifiedAt: true },
    }),
    prisma.receipt.findMany({
      where: { createdAt: { gte: prevWindowStart } },
      select: { createdAt: true },
    }),
    prisma.googleAccount.findMany({
      where: { createdAt: { gte: prevWindowStart } },
      select: { createdAt: true },
    }),
  ]);

  const userCreatedDates: Date[] = userDates.map((u: { createdAt: Date }) => u.createdAt);
  const verifiedAtDates: Date[] = verifiedDates
    .map((u: { emailVerifiedAt: Date | null }) => u.emailVerifiedAt)
    .filter((d: Date | null): d is Date => d !== null);
  const receiptCreatedDates: Date[] = receiptDates.map((r: { createdAt: Date }) => r.createdAt);
  const gmailCreatedDates: Date[] = gmailDates.map((g: { createdAt: Date }) => g.createdAt);

  const userSeries = bucketByDay(userCreatedDates, DAYS);
  const verifiedSeries = bucketByDay(verifiedAtDates, DAYS);
  const receiptSeries = bucketByDay(receiptCreatedDates, DAYS);
  const gmailSeries = bucketByDay(gmailCreatedDates, DAYS);

  const userPrev = bucketPrev(userCreatedDates, DAYS);
  const verifiedPrev = bucketPrev(verifiedAtDates, DAYS);
  const receiptPrev = bucketPrev(receiptCreatedDates, DAYS);
  const gmailPrev = bucketPrev(gmailCreatedDates, DAYS);

  const metrics: Metric[] = [
    {
      label: "Total users",
      value: totalUsers,
      series: userSeries,
      deltaPct: deltaPct(sum(userSeries), userPrev),
      color: "#8b5cf6",
      icon: <IconUsers />,
    },
    {
      label: "Verified",
      value: verifiedUsers,
      series: verifiedSeries,
      deltaPct: deltaPct(sum(verifiedSeries), verifiedPrev),
      color: "#22c55e",
      icon: <IconCheck />,
    },
    {
      label: "Total receipts",
      value: totalReceipts,
      series: receiptSeries,
      deltaPct: deltaPct(sum(receiptSeries), receiptPrev),
      color: "#f59e0b",
      icon: <IconReceipt />,
    },
    {
      label: "Receipts today",
      value: receiptsToday,
      series: receiptSeries,
      deltaPct: deltaPct(receiptsToday, receiptSeries[receiptSeries.length - 2] || 0),
      color: "#ec4899",
      icon: <IconClock />,
    },
    {
      label: "Gmail-synced",
      value: gmailUsers,
      series: gmailSeries,
      deltaPct: deltaPct(sum(gmailSeries), gmailPrev),
      color: "#3b82f6",
      icon: <IconMail />,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="relative inline-flex h-7 w-7 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-400 to-amber-300" />
                <span className="relative h-3.5 w-3.5 rounded-full bg-white" />
              </span>
              <span className="text-lg font-semibold text-slate-900">Lekhya</span>
            </Link>
            <span className="ml-2 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-violet-700">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
              ← Back to dashboard
            </Link>
            <span className="text-slate-400">{admin.email}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        <MetricsStrip metrics={metrics} />

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Users</h2>
            <span className="text-xs text-slate-500">
              Showing latest 50 of {totalUsers}
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="max-h-[460px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 shadow-[0_1px_0_0_rgb(226_232_240)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Receipts</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u: (typeof users)[number]) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.email}</td>
                    <td className="px-4 py-3 text-slate-600">{u.name || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      {u.emailVerifiedAt ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {u._count.receipts}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <UserActions
                        id={u.id}
                        email={u.email}
                        verified={Boolean(u.emailVerifiedAt)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Recent receipts</h2>
            <span className="text-xs text-slate-500">
              Showing latest 30 of {totalReceipts}
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="max-h-[460px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 shadow-[0_1px_0_0_rgb(226_232_240)]">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Merchant</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((r: (typeof receipts)[number]) => {
                  const ex = (r.extractedJson || {}) as {
                    merchant?: string;
                    total?: number;
                    currency?: string;
                  };
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-slate-700">{r.user.email}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {ex.merchant || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {typeof ex.total === "number"
                          ? `${ex.currency || "$"}${ex.total.toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{r.source}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {fmtDate(r.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ReceiptActions id={r.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "extracted"
      ? "bg-green-50 text-green-700"
      : status === "failed"
        ? "bg-red-50 text-red-700"
        : "bg-slate-100 text-slate-600";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}
    >
      {status}
    </span>
  );
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function bucketByDay(dates: Date[], days: number): number[] {
  const buckets = Array(days).fill(0);
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  const dayMs = 24 * 60 * 60 * 1000;
  for (const d of dates) {
    const idx = Math.floor((now.getTime() - d.getTime()) / dayMs);
    if (idx >= 0 && idx < days) buckets[days - 1 - idx]++;
  }
  return buckets;
}

function bucketPrev(dates: Date[], days: number): number {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  const dayMs = 24 * 60 * 60 * 1000;
  let count = 0;
  for (const d of dates) {
    const idx = Math.floor((now.getTime() - d.getTime()) / dayMs);
    if (idx >= days && idx < days * 2) count++;
  }
  return count;
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function deltaPct(current: number, prev: number): number | null {
  if (prev === 0) return current === 0 ? 0 : null;
  return ((current - prev) / prev) * 100;
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2Z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </svg>
  );
}
