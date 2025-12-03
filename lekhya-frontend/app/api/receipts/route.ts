// app/api/receipts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { uploadReceiptToS3 } from "@/lib/s3";

export async function POST(req: NextRequest) {
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

    // TODO: save to DB (userId, key, url, status: "uploaded")

    return NextResponse.json(
      { success: true, key, url },
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
