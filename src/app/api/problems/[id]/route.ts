import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getSession } from "@/lib/auth";
import {
  getProblemById,
  updateProblem,
  deleteProblem,
  getTestCasesForProblem,
} from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const problem = getProblemById(id);
    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const session = await getSession();
    const isAdmin = session?.role === "admin";

    // Non-admins can only see published problems
    if (!isAdmin && !problem.is_published) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const testCases = getTestCasesForProblem(id, !isAdmin);

    return NextResponse.json({
      problem: {
        ...problem,
        tags: JSON.parse(problem.tags || "[]"),
        starter_code: JSON.parse(problem.starter_code || "{}"),
      },
      testCases,
    });
  } catch (error) {
    console.error("Get problem error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    const body = await request.json();

    const problem = getProblemById(id);
    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
    if (body.time_limit_ms !== undefined) updateData.time_limit_ms = body.time_limit_ms;
    if (body.memory_limit_mb !== undefined) updateData.memory_limit_mb = body.memory_limit_mb;
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags);
    if (body.starter_code !== undefined) updateData.starter_code = JSON.stringify(body.starter_code);
    if (body.is_published !== undefined) updateData.is_published = body.is_published ? 1 : 0;

    updateProblem(id, updateData as Parameters<typeof updateProblem>[1]);

    return NextResponse.json({ success: true });
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    deleteProblem(id);
    return NextResponse.json({ success: true });
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
