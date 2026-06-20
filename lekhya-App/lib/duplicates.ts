export type DuplicateReceipt = {
  id: string;
  date: string;
  amount: number;
  createdAt: string;
};

export type DuplicateGroup = {
  fingerprint: string;
  merchant: string;
  amount: number;
  receipts: DuplicateReceipt[];
  reason: "same-day" | "within-window";
  confidence: number;
};

type ReceiptInput = {
  id: string;
  createdAt: Date;
  extractedJson: {
    merchant?: string | null;
    date?: string | null;
    total?: number | null;
  } | null;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DEFAULT_WINDOW_DAYS = 3;
const RECURRING_GAP_TOLERANCE_DAYS = 4;

function normalizeMerchant(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseReceiptDate(r: ReceiptInput): Date {
  const raw = r.extractedJson?.date;
  if (raw) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
  }
  return r.createdAt;
}

function roundAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fingerprintFor(receiptIds: string[]): string {
  return [...receiptIds].sort().join("|");
}

/**
 * Detects pairs/groups of receipts that look like duplicate charges:
 * same merchant, same amount, dates within `windowDays`. Filters out
 * pairs whose spacing matches a recurring cadence (weekly/monthly/yearly).
 */
export function detectDuplicateCharges(
  receipts: ReceiptInput[],
  options: { windowDays?: number; dismissedFingerprints?: Set<string> } = {}
): DuplicateGroup[] {
  const windowDays = options.windowDays ?? DEFAULT_WINDOW_DAYS;
  const dismissed = options.dismissedFingerprints ?? new Set<string>();

  type Item = { id: string; date: Date; amount: number; createdAt: Date };
  const groups = new Map<string, { merchant: string; amount: number; items: Item[] }>();

  for (const r of receipts) {
    const merchant = r.extractedJson?.merchant;
    const rawAmount = r.extractedJson?.total;
    if (!merchant || typeof rawAmount !== "number" || rawAmount <= 0) continue;

    const key = normalizeMerchant(merchant);
    if (!key) continue;

    const amount = roundAmount(rawAmount);
    const bucketKey = `${key}::${amount.toFixed(2)}`;
    const date = parseReceiptDate(r);

    if (!groups.has(bucketKey)) {
      groups.set(bucketKey, { merchant, amount, items: [] });
    }
    groups.get(bucketKey)!.items.push({
      id: r.id,
      date,
      amount,
      createdAt: r.createdAt,
    });
  }

  const results: DuplicateGroup[] = [];

  for (const { merchant, amount, items } of groups.values()) {
    if (items.length < 2) continue;

    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    const cluster: Item[] = [items[0]];
    const flushCluster = () => {
      if (cluster.length < 2) return;
      const ids = cluster.map((c) => c.id);
      const fp = fingerprintFor(ids);
      if (dismissed.has(fp)) return;

      const gaps: number[] = [];
      for (let i = 1; i < cluster.length; i++) {
        gaps.push(
          (cluster[i].date.getTime() - cluster[i - 1].date.getTime()) / MS_PER_DAY
        );
      }
      const maxGap = Math.max(...gaps);
      const reason: DuplicateGroup["reason"] = maxGap < 1 ? "same-day" : "within-window";

      const sameDayBoost = maxGap < 1 ? 0.25 : 0;
      const tightnessBoost = Math.max(0, (windowDays - maxGap) / windowDays) * 0.2;
      const countBoost = Math.min(0.15, (cluster.length - 2) * 0.05);
      const confidence = Math.min(1, 0.6 + sameDayBoost + tightnessBoost + countBoost);

      results.push({
        fingerprint: fp,
        merchant,
        amount,
        reason,
        confidence: Number(confidence.toFixed(2)),
        receipts: cluster.map((c) => ({
          id: c.id,
          date: toISODate(c.date),
          amount: c.amount,
          createdAt: c.createdAt.toISOString(),
        })),
      });
    };

    for (let i = 1; i < items.length; i++) {
      const prev = cluster[cluster.length - 1];
      const gapDays = (items[i].date.getTime() - prev.date.getTime()) / MS_PER_DAY;

      if (gapDays <= windowDays && !looksLikeRecurringGap(gapDays)) {
        cluster.push(items[i]);
      } else {
        flushCluster();
        cluster.length = 0;
        cluster.push(items[i]);
      }
    }
    flushCluster();
  }

  results.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return b.amount - a.amount;
  });

  return results;
}

function looksLikeRecurringGap(gapDays: number): boolean {
  const tol = RECURRING_GAP_TOLERANCE_DAYS;
  if (Math.abs(gapDays - 7) <= tol) return true;
  if (Math.abs(gapDays - 30) <= tol) return true;
  if (Math.abs(gapDays - 365) <= tol) return true;
  return false;
}

export function fingerprintForReceiptIds(receiptIds: string[]): string {
  return fingerprintFor(receiptIds);
}
