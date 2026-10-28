import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, getSession } from "@/lib/auth";
import {
  getAllContests,
  getContestById,
  createContest,
  updateContest,
  deleteContest,
  getContestProblems,
  addProblemToContest,
  registerForContest,
  isUserRegisteredForContest,
  getContestLeaderboard,
  exitContest,
  isUserContestEnded,
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

      // If unpublished, only visible to the creator or an admin
      if (!contest.is_published && !isAdmin && session?.userId !== contest.created_by) {
        return NextResponse.json(
          { error: "This contest is private and only visible to its creator." },
          { status: 403 }
        );
      }

      const problems = getContestProblems(id);
      const isRegistered = session ? isUserRegisteredForContest(id, session.userId) : false;
      const hasEnded = session ? isUserContestEnded(id, session.userId) : false;
      const leaderboard = getContestLeaderboard(id);

      return NextResponse.json({
        contest,
        problems,
        isRegistered,
        hasEnded,
        leaderboard,
      });
    }

    // Normal players cannot see unpublished contests; only seen by the one who created it or admin
    const contests = getAllContests(session?.userId, isAdmin);
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

    // Exit contest: auto-ends the participant's session permanently
    if (body.action === "exit" || body.action === "exit_contest") {
      const { contest_id } = body;
      if (!contest_id) {
        return NextResponse.json({ error: "contest_id is required" }, { status: 400 });
      }
      exitContest(contest_id, session.userId);
      return NextResponse.json({
        success: true,
        message: "Contest session ended. Final score recorded.",
      });
    }

    // Admin contest creation
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { title, description, start_time, end_time, problems, is_published } = body;

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

    if (is_published) {
      updateContest(id, { is_published: 1 });
    }

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

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { id, is_published, title, description, start_time, end_time } = body;

    if (!id) {
      return NextResponse.json({ error: "Contest ID is required" }, { status: 400 });
    }

    const contest = getContestById(id);
    if (!contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    // Only creator or admin can update
    if (session.role !== "admin" && contest.created_by !== session.userId) {
      return NextResponse.json({ error: "Forbidden: Only creator or admin can update" }, { status: 403 });
    }

    const updates: Record<string, any> = {};
    if (is_published !== undefined) updates.is_published = Number(is_published);
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;

    updateContest(id, updates);
    return NextResponse.json({ success: true, contest: getContestById(id) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error updating contest";
    return NextResponse.json({ error: message }, { status: 500 });
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

