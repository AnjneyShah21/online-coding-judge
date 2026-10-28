import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAuth } from "@/lib/auth";
import {
  getProblemDiscussions,
  getDiscussionReplies,
  createDiscussionPost,
  toggleDiscussionVote,
} from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const currentUserId = session?.userId;
    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get("problem_id");
    const parentId = searchParams.get("parent_id");

    if (parentId) {
      const replies = getDiscussionReplies(parentId, currentUserId);
      return NextResponse.json({ replies });
    }

    if (problemId) {
      const discussions = getProblemDiscussions(problemId, currentUserId);
      return NextResponse.json({ discussions });
    }

    return NextResponse.json({ error: "problem_id or parent_id required" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching discussions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { problem_id, title, content, parent_id } = body;

    if (!problem_id || !content || !content.trim()) {
      return NextResponse.json(
        { error: "problem_id and non-empty content are required" },
        { status: 400 }
      );
    }

    const id = randomUUID();
    createDiscussionPost({
      id,
      problem_id,
      user_id: session.userId,
      parent_id: parent_id || null,
      title: title?.trim() || null,
      content: content.trim(),
    });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error creating discussion";
    const status = message.includes("Authentication") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { discussion_id } = body;

    if (!discussion_id) {
      return NextResponse.json({ error: "discussion_id is required" }, { status: 400 });
    }

    const result = toggleDiscussionVote(discussion_id, session.userId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating vote";
    const status = message.includes("Authentication") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
