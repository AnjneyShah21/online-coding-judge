import { NextRequest, NextResponse } from "next/server";
import { compareSync, hashSync } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { getUserByEmail, getUserByUsername, createUser } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, username, password, display_name } = body;

    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password are required" },
          { status: 400 }
        );
      }

      const user = getUserByEmail(email);
      if (!user || !compareSync(password, user.password)) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
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
        },
      });

      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });

      return response;
    }

    if (action === "register") {
      if (!email || !username || !password) {
        return NextResponse.json(
          { error: "Email, username, and password are required" },
          { status: 400 }
        );
      }

      if (getUserByEmail(email)) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 }
        );
      }

      if (getUserByUsername(username)) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 }
        );
      }

      const id = uuidv4();
      createUser({
        id,
        email,
        username,
        password: hashSync(password, 10),
        display_name: display_name || username,
        role: "user",
      });

      const token = await signToken({
        userId: id,
        role: "user",
        username,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id,
          email,
          username,
          role: "user",
          display_name: display_name || username,
        },
      });

      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });

      return response;
    }

    if (action === "logout") {
      const response = NextResponse.json({ success: true });
      response.cookies.delete("token");
      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
