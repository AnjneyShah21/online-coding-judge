import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "@/lib/auth";
import {
  getAllProblems,
  createProblem,
} from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang");
    const session = await requireAuth().catch(() => null);
    const isAdmin = session?.role === "admin";
    const problems = getAllProblems(!isAdmin);
    
    let parsed = problems.map((p) => {
      let targetLangs: string[] = ["all"];
      try {
        if (p.target_languages) targetLangs = JSON.parse(p.target_languages);
      } catch {}

      let starterCode: Record<string, string> = {};
      try {
        if (p.starter_code) starterCode = JSON.parse(p.starter_code);
      } catch {}

      let tags: string[] = [];
      try {
        if (p.tags) tags = JSON.parse(p.tags);
      } catch {}

      return {
        ...p,
        tags,
        target_languages: targetLangs,
        starter_code: starterCode,
      };
    });

    if (lang && lang !== "all") {
      parsed = parsed.filter((p) => p.target_languages.includes(lang) || p.target_languages.includes("all"));
    }

    return NextResponse.json({ problems: parsed });
  } catch {
    const problems = getAllProblems(true);
    return NextResponse.json({
      problems: problems.map((p) => {
        let targetLangs: string[] = ["all"];
        try {
          if (p.target_languages) targetLangs = JSON.parse(p.target_languages);
        } catch {}

        let starterCode: Record<string, string> = {};
        try {
          if (p.starter_code) starterCode = JSON.parse(p.starter_code);
        } catch {}

        let tags: string[] = [];
        try {
          if (p.tags) tags = JSON.parse(p.tags);
        } catch {}

        return {
          ...p,
          tags,
          target_languages: targetLangs,
          starter_code: starterCode,
        };
      }),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth("admin");
    const body = await request.json();
    const {
      title,
      description,
      difficulty,
      time_limit_ms,
      memory_limit_mb,
      tags,
      starter_code,
      target_languages,
    } = body;

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
      target_languages: JSON.stringify(target_languages || ["all"]),
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
