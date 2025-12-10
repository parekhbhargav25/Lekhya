// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Simple placeholder signup API.
// You can later wire this to a real User table if you want.
export async function POST(req: NextRequest) {
  // We can read the body if you want to log it or validate later
  const body = await req.json().catch(() => null);
  console.log("Signup payload (ignored in this demo):", body);

  // For now, just pretend signup succeeded.
  return NextResponse.json(
    { success: true, message: "Signup endpoint is a placeholder in this demo." },
    { status: 200 }
  );
}

// Disallow GET on this route just to be explicit
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}