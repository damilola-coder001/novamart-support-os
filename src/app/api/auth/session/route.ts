// GET & POST /api/auth/session
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, DEMO_USERS } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const userCookie = req.cookies.get("novamart_user_email")?.value;
    const user = await getSessionUser(userCookie || DEMO_USERS.SARAH_JOHNSON.email);
    return NextResponse.json({ success: true, user, demoUsers: DEMO_USERS });
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    const user = await getSessionUser(email);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const res = NextResponse.json({ success: true, user });
    res.cookies.set("novamart_user_email", user.email, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: false,
    });

    return res;
  } catch (error) {
    console.error("Session switch error:", error);
    return NextResponse.json({ success: false, error: "Failed to switch user" }, { status: 500 });
  }
}
