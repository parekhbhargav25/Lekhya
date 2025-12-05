// lib/s3.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

if (!process.env.AWS_REGION || !process.env.AWS_S3_BUCKET) {
  throw new Error("Missing AWS_REGION or AWS_S3_BUCKET env vars");
}

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function uploadReceiptToS3(file: File) {
  const bucket = process.env.AWS_S3_BUCKET!;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const objectKey = `receipts/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    })
  );

  const url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${objectKey}`;

  return { key: objectKey, url };
}


// Delte from s3 bucket

export async function deleteFromS3ByKey(key: string) {
  const client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
      })
    );

    console.log("Deleted from S3:", key);
    return true;
  } catch (err) {
    console.error("S3 delete failed:", err);
    return false;
  }
}
