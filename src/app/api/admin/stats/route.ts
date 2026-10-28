import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAdminStats } from "@/lib/db";

export async function GET() {
  try {
    await requireAuth("admin");
    const stats = getAdminStats();
    return NextResponse.json(stats);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
