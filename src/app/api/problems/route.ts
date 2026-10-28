import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "@/lib/auth";
import {
  getAllProblems,
  createProblem,
} from "@/lib/db";

export async function GET() {
  try {
    const session = await requireAuth().catch(() => null);
    const isAdmin = session?.role === "admin";
    const problems = getAllProblems(!isAdmin);
    
    return NextResponse.json({
      problems: problems.map((p) => ({
        ...p,
        tags: JSON.parse(p.tags || "[]"),
      })),
    });
  } catch {
    // If not logged in, show published only
    const problems = getAllProblems(true);
    return NextResponse.json({
      problems: problems.map((p) => ({
        ...p,
        tags: JSON.parse(p.tags || "[]"),
      })),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth("admin");
    const body = await request.json();
    const { title, description, difficulty, time_limit_ms, memory_limit_mb, tags, starter_code } =
      body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const id = uuidv4();

    createProblem({
      id,
      title,
      slug: `${slug}-${id.substring(0, 8)}`,
      description,
      difficulty: difficulty || "medium",
      time_limit_ms: time_limit_ms || 2000,
      memory_limit_mb: memory_limit_mb || 256,
      tags: JSON.stringify(tags || []),
      starter_code: JSON.stringify(starter_code || {}),
      created_by: session.userId,
    });

    return NextResponse.json({ success: true, id, slug });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized" || message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    console.error("Create problem error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
