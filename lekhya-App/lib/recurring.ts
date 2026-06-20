export type RecurringExpense = {
  merchant: string;
  cadence: "weekly" | "monthly" | "yearly";
  typicalAmount: number;
  lastChargeDate: string;
  predictedNextDate: string;
  occurrenceCount: number;
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
const AMOUNT_CV_THRESHOLD = 0.2;

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

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function coefficientOfVariation(nums: number[]): number {
  if (nums.length === 0) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  if (mean === 0) return 0;
  const variance =
    nums.reduce((acc, n) => acc + (n - mean) ** 2, 0) / nums.length;
  return Math.sqrt(variance) / mean;
}

function classifyCadence(
  medianGapDays: number
): { cadence: "weekly" | "monthly" | "yearly"; expected: number } | null {
  if (medianGapDays >= 5 && medianGapDays <= 9) {
    return { cadence: "weekly", expected: 7 };
  }
  if (medianGapDays >= 25 && medianGapDays <= 35) {
    return { cadence: "monthly", expected: 30 };
  }
  if (medianGapDays >= 350 && medianGapDays <= 380) {
    return { cadence: "yearly", expected: 365 };
  }
  return null;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function detectRecurringExpenses(
  receipts: ReceiptInput[]
): RecurringExpense[] {
  const groups = new Map<
    string,
    { displayName: string; items: { date: Date; amount: number }[] }
  >();

  for (const r of receipts) {
    const merchant = r.extractedJson?.merchant;
    const amount = r.extractedJson?.total;
    if (!merchant || typeof amount !== "number" || amount <= 0) continue;

    const key = normalizeMerchant(merchant);
    if (!key) continue;

    const date = parseReceiptDate(r);

    if (!groups.has(key)) {
      groups.set(key, { displayName: merchant, items: [] });
    }
    groups.get(key)!.items.push({ date, amount });
  }

  const results: RecurringExpense[] = [];

  for (const { displayName, items } of groups.values()) {
    if (items.length < 2) continue;

    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    const gaps: number[] = [];
    for (let i = 1; i < items.length; i++) {
      gaps.push(
        (items[i].date.getTime() - items[i - 1].date.getTime()) / MS_PER_DAY
      );
    }

    const classified = classifyCadence(median(gaps));
    if (!classified) continue;

    const amounts = items.map((i) => i.amount);
    const cv = coefficientOfVariation(amounts);
    if (cv > AMOUNT_CV_THRESHOLD) continue;

    const lastItem = items[items.length - 1];
    const consistencyBoost = 1 - cv / AMOUNT_CV_THRESHOLD;
    const occurrenceBoost = Math.min(1, (items.length - 2) / 4);
    const confidence = Math.min(
      1,
      0.4 + 0.3 * consistencyBoost + 0.3 * occurrenceBoost
    );

    results.push({
      merchant: displayName,
      cadence: classified.cadence,
      typicalAmount: median(amounts),
      lastChargeDate: toISODate(lastItem.date),
      predictedNextDate: toISODate(addDays(lastItem.date, classified.expected)),
      occurrenceCount: items.length,
      confidence: Number(confidence.toFixed(2)),
    });
  }

  results.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return a.predictedNextDate.localeCompare(b.predictedNextDate);
  });

  return results;
}
