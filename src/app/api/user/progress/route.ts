import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getUserProgressStats } from "@/lib/db";

export async function GET() {
  try {
    const session = await requireAuth();
    const stats = getUserProgressStats(session.userId);
    return NextResponse.json({ stats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
