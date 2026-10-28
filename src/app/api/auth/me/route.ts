import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        username: session.user.username,
        role: session.user.role,
        display_name: session.user.display_name,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
