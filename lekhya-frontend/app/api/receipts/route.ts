import { NextRequest, NextResponse } from "next/server";
import { uploadReceiptToS3 } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

// POST /api/receipts  -> upload + create DB row for this user
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: missing user id" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const { key, url } = await uploadReceiptToS3(file);

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
        url,
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

// GET /api/receipts -> list receipts for this user
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: missing user id" },
        { status: 401 }
      );
    }

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