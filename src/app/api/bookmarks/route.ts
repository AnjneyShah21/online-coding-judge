import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAuth } from "@/lib/auth";
import { toggleBookmark, getUserBookmarks, isProblemBookmarked } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ bookmarks: [], bookmarked: false });
    }
    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get("problem_id");

    if (problemId) {
      const bookmarked = isProblemBookmarked(session.userId, problemId);
      return NextResponse.json({ bookmarked });
    }

    const bookmarks = getUserBookmarks(session.userId);
    return NextResponse.json({
      bookmarks: bookmarks.map((b) => ({
        ...b,
        tags: JSON.parse(b.tags || "[]"),
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching bookmarks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { problem_id } = body;

    if (!problem_id) {
      return NextResponse.json({ error: "problem_id is required" }, { status: 400 });
    }

    const result = toggleBookmark(session.userId, problem_id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
