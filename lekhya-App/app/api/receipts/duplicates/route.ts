import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectDuplicateCharges } from "@/lib/duplicates";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [receipts, dismissals] = await Promise.all([
      prisma.receipt.findMany({
        where: { userId, status: "parsed" },
        orderBy: { createdAt: "asc" },
      }),
      prisma.receiptDuplicateDismissal.findMany({
        where: { userId },
        select: { fingerprint: true },
      }),
    ]);

    const dismissedFingerprints = new Set<string>(
      dismissals.map((d: { fingerprint: string }) => d.fingerprint)
    );

    const duplicates = detectDuplicateCharges(
      receipts.map((r: { id: string; createdAt: Date; extractedJson: unknown }) => ({
        id: r.id,
        createdAt: r.createdAt,
        extractedJson: r.extractedJson as {
          merchant?: string | null;
          date?: string | null;
          total?: number | null;
        } | null,
      })),
      { dismissedFingerprints }
    );

    return NextResponse.json({ duplicates }, { status: 200 });
  } catch (err) {
    console.error("Duplicate detection error", err);
    return NextResponse.json(
      { error: "Failed to detect duplicate charges" },
      { status: 500 }
    );
  }
}
