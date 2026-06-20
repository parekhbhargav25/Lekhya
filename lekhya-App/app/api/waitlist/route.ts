import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const existing = await prisma.waitlistSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({ success: true, message: "You are already on the waitlist." }, { status: 200 });
    }

    await prisma.waitlistSubscriber.create({
      data: { email },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Waitlist signup failed", error);
    return NextResponse.json({ error: "Unable to join the waitlist at the moment." }, { status: 500 });
  }
}
