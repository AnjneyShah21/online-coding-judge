import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, getSession } from "@/lib/auth";
import {
  createSubmission,
  getSubmissionsForUser,
  getAllSubmissions,
  getSubmissionById,
  getResultsForSubmission,
} from "@/lib/db";
import { judgeSubmission } from "@/lib/sandbox";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("id");

    if (submissionId) {
      const submission = getSubmissionById(submissionId);
      if (!submission) {
        return NextResponse.json(
          { error: "Submission not found" },
          { status: 404 }
        );
      }

      // Users can only see their own submissions (unless admin)
      if (session.role !== "admin" && submission.user_id !== session.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const results = getResultsForSubmission(submissionId);

      // Non-admins can only see sample test case details
      const filteredResults =
        session.role === "admin"
          ? results
          : results.map((r) => ({
              ...r,
              input: r.is_sample ? r.input : undefined,
              expected_output: r.is_sample ? r.expected_output : undefined,
              actual_output: r.is_sample ? r.actual_output : undefined,
            }));

      return NextResponse.json({ submission, results: filteredResults });
    }

    // List submissions
    if (session.role === "admin") {
      const submissions = getAllSubmissions();
      return NextResponse.json({ submissions });
    } else {
      const submissions = getSubmissionsForUser(session.userId);
      return NextResponse.json({ submissions });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Submissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.role === "admin") {
      return NextResponse.json(
        { error: "Admins cannot submit solutions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { problem_id, code, language } = body;

    if (!problem_id || !code || !language) {
      return NextResponse.json(
        { error: "problem_id, code, and language are required" },
        { status: 400 }
      );
    }

    if (!["python", "cpp", "javascript"].includes(language)) {
      return NextResponse.json(
        { error: "Unsupported language" },
        { status: 400 }
      );
    }

    const id = uuidv4();
    createSubmission({
      id,
      user_id: session.userId,
      problem_id,
      code,
      language,
    });

    // Judge asynchronously
    judgeSubmission(id).catch((err) => {
      console.error(`Error judging submission ${id}:`, err);
    });

    return NextResponse.json({ success: true, id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
