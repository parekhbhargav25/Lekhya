import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import {
  USE_MOCK_AI,
  extractReceiptFromImageLLM,
  extractReceiptFromImageMock,
  type ExtractedReceipt,
} from "@/lib/extract";

export const runtime = "nodejs";

const MAX_CORRECTIONS = 3;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing receipt id" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const feedback = String(body?.feedback || "").trim();
  if (!feedback) {
    return NextResponse.json(
      { error: "Feedback is required" },
      { status: 400 }
    );
  }
  if (feedback.length > 1000) {
    return NextResponse.json(
      { error: "Feedback is too long (max 1000 chars)" },
      { status: 400 }
    );
  }

  const receipt = await prisma.receipt.findFirst({
    where: { id, userId },
    select: {
      id: true,
      s3Url: true,
      extractedJson: true,
      _count: { select: { corrections: true } },
    },
  });

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  if (!receipt.s3Url) {
    return NextResponse.json(
      {
        error:
          "This receipt has no source image — feedback re-extraction is not supported for it yet.",
      },
      { status: 400 }
    );
  }

  if (receipt._count.corrections >= MAX_CORRECTIONS) {
    return NextResponse.json(
      {
        error: `You've already submitted ${MAX_CORRECTIONS} corrections for this receipt. Please verify the image manually or re-upload.`,
      },
      { status: 429 }
    );
  }

  const previous = (receipt.extractedJson || null) as ExtractedReceipt | null;

  try {
    const newExtracted = await (USE_MOCK_AI
      ? extractReceiptFromImageMock({ s3Url: receipt.s3Url })
      : extractReceiptFromImageLLM({
          s3Url: receipt.s3Url,
          previousAttempt: previous,
          userFeedback: feedback,
        }));

    const [updated] = await prisma.$transaction([
      prisma.receipt.update({
        where: { id: receipt.id },
        data: { status: "parsed", extractedJson: newExtracted },
      }),
      prisma.receiptCorrection.create({
        data: {
          receiptId: receipt.id,
          userFeedback: feedback,
          previousJson: (previous as object) ?? {},
          newJson: newExtracted as unknown as object,
        },
      }),
    ]);

    return NextResponse.json({ success: true, receipt: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Re-extraction failed";
    console.error("Re-extract error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
