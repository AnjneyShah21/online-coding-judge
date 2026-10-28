import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, getSession } from "@/lib/auth";
import {
  getAllContests,
  getContestById,
  createContest,
  deleteContest,
  getContestProblems,
  addProblemToContest,
  registerForContest,
  isUserRegisteredForContest,
  getContestLeaderboard,
} from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const isAdmin = session?.role === "admin";
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const contest = getContestById(id);
      if (!contest) {
        return NextResponse.json({ error: "Contest not found" }, { status: 404 });
      }
      const problems = getContestProblems(id);
      const isRegistered = session ? isUserRegisteredForContest(id, session.userId) : false;
      const leaderboard = getContestLeaderboard(id);

      return NextResponse.json({
        contest,
        problems,
        isRegistered,
        leaderboard,
      });
    }

    const contests = getAllContests(isAdmin);
    return NextResponse.json({ contests });
  } catch (error) {
    console.error("Get contests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    // Register user for contest
    if (body.action === "register") {
      const { contest_id } = body;
      if (!contest_id) {
        return NextResponse.json({ error: "contest_id is required" }, { status: 400 });
      }
      registerForContest(contest_id, session.userId);
      return NextResponse.json({ success: true, message: "Registered successfully" });
    }

    // Admin contest creation
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { title, description, start_time, end_time, problems } = body;

    if (!title || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Title, start time, and end time are required" },
        { status: 400 }
      );
    }

    const id = uuidv4();
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    createContest({
      id,
      title,
      slug: `${slug}-${id.substring(0, 6)}`,
      description: description || "",
      start_time,
      end_time,
      created_by: session.userId,
    });

    // Add contest problems if provided
    if (problems && Array.isArray(problems)) {
      problems.forEach((p, idx) => {
        addProblemToContest(id, p.problem_id, p.score || 100, idx);
      });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth("admin");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Contest ID is required" }, { status: 400 });
    }

    deleteContest(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Forbidden";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
