import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getSession } from "@/lib/auth";
import { generateTestCases, reviewCode, getSmartHint, huntCounterExample } from "@/lib/ai";
import { getProblemById, getTestCasesForProblem, getSubmissionById } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "hunt_counter_example": {
        const problem = getProblemById(body.problem_id);
        if (!problem) {
          return NextResponse.json({ error: "Problem not found" }, { status: 404 });
        }
        const sampleCases = getTestCasesForProblem(body.problem_id).filter((tc) => tc.is_sample);
        const counterExample = await huntCounterExample(
          body.code,
          body.language,
          problem.description,
          sampleCases.map((tc) => ({ input: tc.input, expected_output: tc.expected_output }))
        );
        return NextResponse.json({ counterExample });
      }

      case "generate_test_cases": {
        // Admin only
        if (session.role !== "admin") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const problem = getProblemById(body.problem_id);
        if (!problem) {
          return NextResponse.json({ error: "Problem not found" }, { status: 404 });
        }
        const existingCases = getTestCasesForProblem(body.problem_id);
        const testCases = await generateTestCases(
          problem.description,
          existingCases.map((tc) => ({
            input: tc.input,
            expected_output: tc.expected_output,
          }))
        );
        return NextResponse.json({ testCases });
      }

      case "review_code": {
        // Any authenticated user
        const problem = getProblemById(body.problem_id);
        if (!problem) {
          return NextResponse.json({ error: "Problem not found" }, { status: 404 });
        }
        const review = await reviewCode(
          body.code,
          body.language,
          problem.description
        );
        return NextResponse.json({ review });
      }

      case "get_hint": {
        // Any authenticated user
        const submission = getSubmissionById(body.submission_id);
        if (!submission) {
          return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }
        // Users can only get hints for their own submissions
        if (session.role !== "admin" && submission.user_id !== session.userId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        const problem = getProblemById(submission.problem_id);
        if (!problem) {
          return NextResponse.json({ error: "Problem not found" }, { status: 404 });
        }
        const hint = await getSmartHint(
          submission.code,
          submission.language,
          problem.description,
          submission.verdict,
          submission.error_message || undefined,
          body.hint_level || 1
        );
        return NextResponse.json({ hint });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error("AI API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
