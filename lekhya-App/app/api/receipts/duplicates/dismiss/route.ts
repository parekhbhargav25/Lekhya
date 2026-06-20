import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fingerprintForReceiptIds } from "@/lib/duplicates";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const receiptIds = body?.receiptIds;

    if (!Array.isArray(receiptIds) || receiptIds.length < 2) {
      return NextResponse.json(
        { error: "receiptIds must be an array of at least 2 ids" },
        { status: 400 }
      );
    }

    if (!receiptIds.every((id) => typeof id === "string" && id.length > 0)) {
      return NextResponse.json(
        { error: "receiptIds must contain non-empty strings" },
        { status: 400 }
      );
    }

    const owned = await prisma.receipt.findMany({
      where: { id: { in: receiptIds }, userId },
      select: { id: true },
    });

    if (owned.length !== receiptIds.length) {
      return NextResponse.json(
        { error: "One or more receipts not found" },
        { status: 404 }
      );
    }

    const fingerprint = fingerprintForReceiptIds(receiptIds);

    await prisma.receiptDuplicateDismissal.upsert({
      where: { userId_fingerprint: { userId, fingerprint } },
      create: { userId, fingerprint },
      update: {},
    });

    return NextResponse.json({ success: true, fingerprint }, { status: 200 });
  } catch (err) {
    console.error("Dismiss duplicate error", err);
    return NextResponse.json(
      { error: "Failed to dismiss duplicate group" },
      { status: 500 }
    );
  }
}
