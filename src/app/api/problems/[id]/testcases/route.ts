import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "@/lib/auth";
import {
  getTestCasesForProblem,
  createTestCase,
  updateTestCase,
  deleteTestCase,
  getProblemById,
} from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAuth("admin");
    const testCases = getTestCasesForProblem(id);
    return NextResponse.json({ testCases });
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

export async function POST(
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

    const existingCases = getTestCasesForProblem(id);
    const tcId = uuidv4();

    createTestCase({
      id: tcId,
      problem_id: id,
      input: body.input || "",
      expected_output: body.expected_output || "",
      is_sample: body.is_sample ? 1 : 0,
      order_index: body.order_index ?? existingCases.length,
    });

    return NextResponse.json({ success: true, id: tcId });
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

export async function PUT(request: NextRequest) {
  try {
    await requireAuth("admin");
    const body = await request.json();

    if (!body.test_case_id) {
      return NextResponse.json(
        { error: "test_case_id is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.input !== undefined) updateData.input = body.input;
    if (body.expected_output !== undefined)
      updateData.expected_output = body.expected_output;
    if (body.is_sample !== undefined) updateData.is_sample = body.is_sample ? 1 : 0;
    if (body.order_index !== undefined) updateData.order_index = body.order_index;

    updateTestCase(body.test_case_id, updateData as Parameters<typeof updateTestCase>[1]);

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

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth("admin");
    const { searchParams } = new URL(request.url);
    const testCaseId = searchParams.get("test_case_id");

    if (!testCaseId) {
      return NextResponse.json(
        { error: "test_case_id is required" },
        { status: 400 }
      );
    }

    deleteTestCase(testCaseId);
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
