import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      return null;
    }

    if (!isAuth) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Protect admin routes
    if (req.nextUrl.pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Check account status
    if (token?.accountStatus !== "ACTIVE" && token?.role !== "ADMIN") {
      // Allow them to see a "pending" message if we had a specific route, 
      // but for now redirect to login with a message or just block.
      // NextAuth authorize already blocks sign in if not ACTIVE.
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/", "/admin/:path*", "/api/journey/:path*", "/api/image/:path*"],
};
