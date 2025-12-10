// // app/api/receipts/[id]/category/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

// export async function PATCH(
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   const { id } = params;

//   const session = await getServerSession(authOptions);
//   if (!session?.user?.email) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }
//   const userId = session.user.email;

//   try {
//     const body = await req.json();
//     const category: string | null =
//       typeof body.category === "string" && body.category.trim().length > 0
//         ? body.category.trim()
//         : null;

//     // Ensure this receipt belongs to the user
//     const existing = await prisma.receipt.findUnique({
//       where: { id },
//       select: { userId: true },
//     });

//     if (!existing || existing.userId !== userId) {
//       return NextResponse.json({ error: "Not found" }, { status: 404 });
//     }

//     const updated = await prisma.receipt.update({
//       where: { id },
//       data: {
//         categoryOverride: category,
//       },
//     });

//     return NextResponse.json({ receipt: updated }, { status: 200 });
//   } catch (err: any) {
//     console.error("Update category error", err);
//     return NextResponse.json(
//       { error: "Failed to update category" },
//       { status: 500 }
//     );
//   }
// }


// app/api/receipts/[id]/category/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  // ✅ unwrap the Promise
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing receipt id" },
      { status: 400 }
    );
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const category = (body?.category as string | undefined)?.trim();

  if (!category) {
    return NextResponse.json(
      { error: "Missing category" },
      { status: 400 }
    );
  }

  // ensure this receipt belongs to this user
  const receipt = await prisma.receipt.findUnique({
    where: { id },
  });

  if (!receipt || receipt.userId !== userId) {
    return NextResponse.json(
      { error: "Receipt not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.receipt.update({
    where: { id },
    data: {
      categoryOverride: category,
    },
  });

  return NextResponse.json({ receipt: updated }, { status: 200 });
}