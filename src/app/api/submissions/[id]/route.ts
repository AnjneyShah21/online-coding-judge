import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSubmissionById, getResultsForSubmission } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const submission = getSubmissionById(id);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (session.role !== "admin" && submission.user_id !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const results = getResultsForSubmission(id);
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching submission";
    const status = message.includes("Authentication") || message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
