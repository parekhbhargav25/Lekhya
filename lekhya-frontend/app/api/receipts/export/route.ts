// app/api/receipts/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type ExtractedReceipt = {
  merchant: string;
  date: string; // YYYY-MM-DD
  total: number;
  tax?: number | null;
  currency?: string | null;
  category?: string | null;
  paymentMethod?: string | null;
  lineItems?: {
    description: string;
    qty?: number | null;
    price?: number | null;
  }[];
  notes?: string | null;
};

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const receipts: Prisma.ReceiptGetPayload<{}>[] = await prisma.receipt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Create CSV content
    const csvHeaders = [
      "Date",
      "Merchant",
      "Category",
      "Total",
      "Tax",
      "Currency",
      "Payment Method",
      "Notes",
      "Line Items",
      "Receipt ID",
      "Created At"
    ];

    const csvRows = receipts.map((receipt: Prisma.ReceiptGetPayload<{}>) => {
      const extracted = receipt.extractedJson as ExtractedReceipt | null;
      const category = receipt.categoryOverride || extracted?.category || "Uncategorized";

      // Format line items as a string
      const lineItems = extracted?.lineItems
        ? extracted.lineItems.map((item) =>
            `${item.description || ""} (Qty: ${item.qty || 1}, Price: $${item.price?.toFixed(2) || "0.00"})`
          ).join("; ")
        : "";

      return [
        extracted?.date || "",
        extracted?.merchant || "",
        category,
        extracted?.total?.toFixed(2) || "",
        extracted?.tax?.toFixed(2) || "",
        extracted?.currency || "",
        extracted?.paymentMethod || "",
        extracted?.notes || "",
        lineItems,
        receipt.id,
        new Date(receipt.createdAt).toISOString()
      ];
    });

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    // Return CSV file
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="expenses-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

    return response;
  } catch (err) {
    console.error("Export error", err);
    return NextResponse.json({ error: "Failed to export receipts" }, { status: 500 });
  }
}