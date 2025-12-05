// // // app/api/receipts/[id]/route.ts
// // import { NextRequest, NextResponse } from "next/server";
// // import { prisma } from "@/lib/prisma";

// // // type RouteParams = {
// // //   params: { id: string };
// // // };

// // export async function DELETE(
// //   _req: NextRequest,
// //   context: { params: Promise<{ id: string }> }
// // ) {
// //   // In this Next.js version, params is a Promise – we must await it
// //   const { id } = await context.params;

// //   if (!id) {
// //     console.error("Missing id in route params:", context);
// //     return NextResponse.json(
// //       { error: "Missing receipt id" },
// //       { status: 400 }
// //     );
// //   }

// //   try {
// //     await prisma.receipt.delete({
// //       where: { id },
// //     });

// //     return NextResponse.json({ success: true }, { status: 200 });
// //   } catch (err: any) {
// //     console.error("Delete receipt error", err);
// //     return NextResponse.json(
// //       { error: "Failed to delete receipt" },
// //       { status: 500 }
// //     );
// //   }
// // }

// // app/api/receipts/[id]/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { deleteFromS3ByKey } from "../../../../lib/s3";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

// function getUserKey(session: any | null): string | null {
//   if (!session || !session.user) return null;
//   return (session.user as any).id || (session.user as any).email || null;
// }

// export async function DELETE(
//   req: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   const { id } = await context.params;

//   if (!id) {
//     return NextResponse.json(
//       { error: "Missing receipt id" },
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
//     // Ensure the receipt belongs to this user
//     const receipt = await prisma.receipt.findFirst({
//       where: { id, userId: userKey },
//     });

//     if (!receipt) {
//       return NextResponse.json(
//         { error: "Receipt not found" },
//         { status: 404 }
//       );
//     }

//     // Delete from S3 (optional but nice)
//     try {
//       await deleteFromS3ByKey(receipt.s3Key);
//     } catch (e) {
//       console.error("Failed to delete from S3", e);
//       // we still proceed to delete the DB row
//     }

//     // Delete DB row
//     await prisma.receipt.delete({
//       where: { id: receipt.id },
//     });

//     return NextResponse.json({ success: true }, { status: 200 });
//   } catch (err) {
//     console.error("Delete receipt error", err);
//     return NextResponse.json(
//       { error: "Failed to delete receipt" },
//       { status: 500 }
//     );
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromS3ByKey } from "@/lib/s3";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing receipt id" },
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
    // Only delete if it belongs to this user
    const receipt = await prisma.receipt.findFirst({
      where: { id, userId },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: "Receipt not found" },
        { status: 404 }
      );
    }

    try {
      await deleteFromS3ByKey(receipt.s3Key);
    } catch (e) {
      console.error("Failed to delete from S3", e);
    }

    await prisma.receipt.delete({
      where: { id: receipt.id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Delete receipt error", err);
    return NextResponse.json(
      { error: "Failed to delete receipt" },
      { status: 500 }
    );
  }
}