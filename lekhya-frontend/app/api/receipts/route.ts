// app/api/receipts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadReceiptToS3 } from "@/lib/s3";

export const runtime = "nodejs";

// POST /api/receipts  -> upload file + create DB row
export async function POST(req: NextRequest) {
  // 🔐 Require login
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Upload to S3
    const { key, url } = await uploadReceiptToS3(file);

    // Save in DB
    const receipt = await prisma.receipt.create({
      data: {
        userId,
        s3Key: key,
        s3Url: url,
        status: "uploaded",
      },
    });

    return NextResponse.json(
      {
        success: true,
        receiptId: receipt.id,
        s3Key: key,
        s3Url: url,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Upload error", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

// GET /api/receipts -> list this user's receipts
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const receipts = await prisma.receipt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ receipts }, { status: 200 });
  } catch (err) {
    console.error("List receipts error", err);
    return NextResponse.json(
      { error: "Failed to list receipts" },
      { status: 500 }
    );
  }
}