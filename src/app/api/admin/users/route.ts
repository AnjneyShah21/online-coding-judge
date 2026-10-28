import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAllUsersWithStats, banUser, unbanUser, getSubmissionsForUser } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await requireAuth("admin");
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (userId) {
      // Get detailed observation data for a specific user
      const submissions = getSubmissionsForUser(userId);
      return NextResponse.json({ submissions });
    }

    const users = getAllUsersWithStats();
    return NextResponse.json({ users });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth("admin");
    const body = await request.json();
    const { action, user_id, reason } = body;

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    if (action === "ban") {
      banUser(user_id, reason || "Disqualified for cheating / violation of platform rules");
      return NextResponse.json({ success: true, status: "banned" });
    }

    if (action === "unban") {
      unbanUser(user_id);
      return NextResponse.json({ success: true, status: "active" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
