// // app/api/receipts/[id]/extract/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import {
//   USE_MOCK_AI,
//   extractReceiptFromImageMock,
//   extractReceiptFromImageLLM,
// } from "@/lib/extract";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

// function getUserKey(session: any | null): string | null {
//   if (!session || !session.user) return null;
//   return (session.user as any).id || (session.user as any).email || null;
// }

// export async function POST(
//   _req: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   // 🔹 In this Next.js version, params is a Promise – must await it
//   const { id } = await context.params;

//   if (!id) {
//     console.error("Missing receipt id in URL:", context);
//     return NextResponse.json(
//       { error: "Missing receipt id in URL" },
//       { status: 400 }
//     );
//   }

//   const session = await getServerSession(authOptions);
//   const userKey = getUserKey(session);

//   if (!userKey) {
//     return NextResponse.json(
//       { error: "Unauthorized" },
//       { status: 401 }
//     );
//   }

//   try {
//     // 1) Make sure this receipt belongs to this user
//     const receipt = await prisma.receipt.findFirst({
//       where: { id, userId: userKey },
//     });

//     if (!receipt) {
//       return NextResponse.json(
//         { error: "Receipt not found" },
//         { status: 404 }
//       );
//     }

//     // 2) Run AI extraction
//     const extracted =
//       (await (USE_MOCK_AI
//         ? extractReceiptFromImageMock({ s3Url: receipt.s3Url })
//         : extractReceiptFromImageLLM({ s3Url: receipt.s3Url }))) ?? null;

//     // 3) Save & return
//     const updated = await prisma.receipt.update({
//       where: { id: receipt.id },
//       data: {
//         status: "parsed",
//         extractedJson: extracted,
//       },
//     });

//     return NextResponse.json({ receipt: updated }, { status: 200 });
//   } catch (err) {
//     console.error("AI extraction error", err);

//     // best-effort mark as error
//     try {
//       await prisma.receipt.update({
//         where: { id },
//         data: { status: "error" },
//       });
//     } catch (e) {
//       console.error("Failed to mark receipt as error", e);
//     }

//     return NextResponse.json(
//       { error: "AI extraction failed" },
//       { status: 500 }
//     );
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  USE_MOCK_AI,
  extractReceiptFromImageMock,
  extractReceiptFromImageLLM,
} from "@/lib/extract";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing receipt id in URL" },
      { status: 400 }
    );
  }

  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized: missing user id" },
      { status: 401 }
    );
  }

  try {
    // Only allow acting on receipts owned by this user
    const receipt = await prisma.receipt.findFirst({
      where: { id, userId },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    const extracted =
      (await (USE_MOCK_AI
        ? extractReceiptFromImageMock({ s3Url: receipt.s3Url })
        : extractReceiptFromImageLLM({ s3Url: receipt.s3Url }))) ?? null;

    const updated = await prisma.receipt.update({
      where: { id: receipt.id },
      data: {
        status: "parsed",
        extractedJson: extracted,
      },
    });

    return NextResponse.json({ receipt: updated }, { status: 200 });
  } catch (err) {
    console.error("AI extraction error", err);

    try {
      await prisma.receipt.update({
        where: { id },
        data: { status: "error" },
      });
    } catch (e) {
      console.error("Failed to mark as error", e);
    }

    return NextResponse.json(
      { error: "AI extraction failed" },
      { status: 500 }
    );
  }
}