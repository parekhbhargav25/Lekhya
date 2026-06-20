import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectRecurringExpenses } from "@/lib/recurring";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const receipts = await prisma.receipt.findMany({
      where: { userId, status: "parsed" },
      orderBy: { createdAt: "asc" },
    });

    const recurring = detectRecurringExpenses(
      receipts.map((r: { id: string; createdAt: Date; extractedJson: unknown }) => ({
        id: r.id,
        createdAt: r.createdAt,
        extractedJson: r.extractedJson as {
          merchant?: string | null;
          date?: string | null;
          total?: number | null;
        } | null,
      }))
    );

    return NextResponse.json({ recurring }, { status: 200 });
  } catch (err) {
    console.error("Recurring detection error", err);
    return NextResponse.json(
      { error: "Failed to detect recurring expenses" },
      { status: 500 }
    );
  }
}
