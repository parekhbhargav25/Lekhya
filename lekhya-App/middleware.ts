import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const email = (req.nextauth.token?.email || "").toString().toLowerCase();
    const admins = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!admins.includes(email)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token?.email),
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};
