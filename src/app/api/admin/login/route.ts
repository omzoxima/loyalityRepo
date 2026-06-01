import { NextRequest, NextResponse } from "next/server";
import { signAdminToken, hashPassword } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // Query database for admin user
    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (admin) {
      const inputHash = await hashPassword(password);
      if (admin.passwordHash === inputHash) {
        const token = await signAdminToken(username);
        const response = NextResponse.json({ ok: true });
        
        // Set the session cookie
        response.cookies.set("admin_session", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24, // 1 day
        });
        
        return response;
      }
    }

    return NextResponse.json({ ok: false, error: "Invalid username or password" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

