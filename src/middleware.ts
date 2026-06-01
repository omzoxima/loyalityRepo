import { NextRequest, NextResponse } from "next/server";
import { checkAdminToken } from "@/lib/adminAuth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Exclude login/logout from auth checks
  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout"
  ) {
    return NextResponse.next();
  }

  // Check the admin session cookie
  const token = req.cookies.get("admin_session")?.value;
  const username = process.env.ADMIN_USER || "admin";

  if (token && await checkAdminToken(token, username)) {
    return NextResponse.next();
  }

  // Auth failed
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Redirect to login page for admin UI routes
  const loginUrl = new URL("/admin/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
