import { NextRequest, NextResponse } from "next/server";
import { findOrCreateGoogleUser, getUserByEmail } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, google_id, avatar_url, portal } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required for Google Sign-In" }, { status: 400 });
    }

    const targetRole = portal === "admin" ? "admin" : "user";

    // If admin portal, verify admin authorization
    if (targetRole === "admin") {
      const existingUser = getUserByEmail(email);
      const isAllowedAdmin =
        email === "admin@aijudge.local" ||
        (process.env.ADMIN_EMAILS && process.env.ADMIN_EMAILS.split(",").map(e => e.trim().toLowerCase()).includes(email.toLowerCase())) ||
        (existingUser && existingUser.role === "admin");

      if (!isAllowedAdmin) {
        return NextResponse.json(
          { error: "Access Denied: This Google account is not authorized for Administrator access." },
          { status: 403 }
        );
      }
    }

    // Check if user is banned
    const existing = getUserByEmail(email);
    if (existing && existing.is_banned) {
      return NextResponse.json(
        {
          error: `Account Banned: You have been suspended from AI Judge. Reason: ${existing.ban_reason || "Violation of competitive integrity / cheating."}`,
          is_banned: true,
          ban_reason: existing.ban_reason,
        },
        { status: 403 }
      );
    }

    // Upsert Google user
    const user = findOrCreateGoogleUser({
      email,
      google_id: google_id || `g_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      display_name: name || email.split("@")[0],
      avatar_url: avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      role: targetRole,
    });

    if (user.is_banned) {
      return NextResponse.json(
        {
          error: `Account Banned: You have been suspended from AI Judge. Reason: ${user.ban_reason || "Violation of competitive integrity / cheating."}`,
          is_banned: true,
        },
        { status: 403 }
      );
    }

    const token = await signToken({
      userId: user.id,
      role: user.role,
      username: user.username,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
      },
      redirectTo: user.role === "admin" ? "/admin" : "/problems",
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    console.error("Google Auth Error:", error);
    return NextResponse.json({ error: "Failed to authenticate with Google." }, { status: 500 });
  }
}

// GET endpoint redirects to official Google OAuth if configured, or returns config status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const portal = searchParams.get("portal") || "user";
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (clientId) {
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=openid%20email%20profile&state=${encodeURIComponent(
      JSON.stringify({ portal })
    )}`;
    return NextResponse.redirect(googleAuthUrl);
  }

  return NextResponse.json({
    configured: false,
    message: "Google OAuth Client ID not configured. Using interactive Google Sign-In modal.",
  });
}
