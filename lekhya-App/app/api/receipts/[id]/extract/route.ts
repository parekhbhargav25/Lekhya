// app/api/receipts/[id]/extract/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import {
  USE_MOCK_AI,
  extractReceiptFromImageLLM,
  extractReceiptFromImageMock,
} from "@/lib/extract";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing receipt id in URL" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const receipt = await prisma.receipt.findFirst({
      where: { id, userId },
      select: { id: true, s3Url: true },
    });

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    const extracted = await (USE_MOCK_AI
      ? extractReceiptFromImageMock({ s3Url: receipt.s3Url })
      : extractReceiptFromImageLLM({ s3Url: receipt.s3Url }));

    const updated = await prisma.receipt.update({
      where: { id: receipt.id },
      data: { status: "parsed", extractedJson: extracted },
    });

    return NextResponse.json({ success: true, receipt: updated }, { status: 200 });
  } catch (err: any) {
    console.error("Extract error", err);

    try {
      await prisma.receipt.update({
        where: { id },
        data: { status: "error" },
      });
    } catch {}

    return NextResponse.json(
      { error: err.message || "AI extraction failed" },
      { status: 500 }
    );
  }
}