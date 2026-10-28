import { execSync, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { v4 as uuidv4 } from "uuid";
import {
  getTestCasesForProblem,
  getPendingSubmissions,
  updateSubmission,
  createSubmissionResult,
  getSubmissionById,
} from "./db";

const SANDBOX_DIR = path.join(os.tmpdir(), "ai-judge-sandbox");

// Ensure sandbox directory exists
if (!fs.existsSync(SANDBOX_DIR)) {
  fs.mkdirSync(SANDBOX_DIR, { recursive: true });
}

interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  runtimeMs: number;
  memoryKb: number;
  timedOut: boolean;
  isCompileError?: boolean;
}

function getLanguageConfig(language: string) {
  switch (language) {
    case "python":
      return {
        fileName: "solution.py",
        compile: null,
        run: ["python3", "solution.py"],
      };
    case "cpp":
      return {
        fileName: "solution.cpp",
        compile: ["g++", "-O2", "-std=c++17", "-o", "solution", "solution.cpp"],
        run: ["./solution"],
      };
    case "javascript":
      return {
        fileName: "solution.js",
        compile: null,
        run: ["node", "solution.js"],
      };
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

async function executeInSandbox(
  code: string,
  language: string,
  input: string,
  timeLimitMs: number,
  memoryLimitMb: number
): Promise<ExecutionResult> {
  const workDir = path.join(SANDBOX_DIR, uuidv4());
  fs.mkdirSync(workDir, { recursive: true });

  const config = getLanguageConfig(language);
  const sourceFile = path.join(workDir, config.fileName);
  fs.writeFileSync(sourceFile, code);

  const inputFile = path.join(workDir, "input.txt");
  fs.writeFileSync(inputFile, input);

  try {
    // Compilation step
    if (config.compile) {
      try {
        execSync(config.compile.join(" "), {
          cwd: workDir,
          timeout: 15000,
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch (err: unknown) {
        const execErr = err as { stderr?: Buffer; message?: string };
        const compileMsg = execErr.stderr ? execErr.stderr.toString() : execErr.message || "Compilation failed";
        return {
          stdout: "",
          stderr: compileMsg,
          exitCode: 1,
          runtimeMs: 0,
          memoryKb: 0,
          timedOut: false,
          isCompileError: true,
        };
      }
    }

    // Run in bwrap sandbox
    const startTime = Date.now();
    const result = await runWithBwrap(
      workDir,
      config.run,
      inputFile,
      timeLimitMs,
      memoryLimitMb
    );
    const runtimeMs = Date.now() - startTime;

    return {
      ...result,
      runtimeMs,
    };
  } finally {
    // Cleanup
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

function runWithBwrap(
  workDir: string,
  command: string[],
  inputFile: string,
  timeLimitMs: number,
  memoryLimitMb: number
): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const timeLimitSec = Math.ceil(timeLimitMs / 1000) + 1;

    // Build bwrap args for secure sandboxed execution
    const bwrapArgs = [
      "--ro-bind", "/usr", "/usr",
      "--ro-bind-try", "/lib", "/lib",
      "--ro-bind-try", "/lib64", "/lib64",
      "--ro-bind-try", "/bin", "/bin",
      "--ro-bind-try", "/sbin", "/sbin",
      "--ro-bind-try", "/etc", "/etc",
      "--proc", "/proc",
      "--dev", "/dev",
      "--bind", workDir, "/sandbox",
      "--chdir", "/sandbox",
      "--unshare-all",
      "--die-with-parent",
      "--new-session",
      ...command,
    ];

    // Use timeout to enforce time limit
    const proc = spawn("timeout", [String(timeLimitSec), "bwrap", ...bwrapArgs], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let memoryKb = 0;
    let timedOut = false;

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
      // Cap output at 1MB
      if (stdout.length > 1024 * 1024) {
        proc.kill("SIGKILL");
      }
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
      if (stderr.length > 1024 * 1024) {
        proc.kill("SIGKILL");
      }
    });

    // Send input via stdin
    const inputData = fs.readFileSync(inputFile, "utf-8");
    proc.stdin.write(inputData);
    proc.stdin.end();

    // Overall timeout safety net
    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGKILL");
    }, timeLimitMs + 2000);

    proc.on("close", (exitCode) => {
      clearTimeout(timer);
      // Exit code 124 from timeout command means TLE
      if (exitCode === 124) timedOut = true;
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: exitCode || 0,
        runtimeMs: 0, // Will be filled in by caller
        memoryKb,
        timedOut,
      });
    });
  });
}

function compareOutput(expected: string, actual: string): boolean {
  // Normalize: trim trailing whitespace from each line, trim trailing newlines
  const normalize = (s: string) =>
    s
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .trimEnd();
  return normalize(expected) === normalize(actual);
}

// ─── Judge a single submission ─────────────────────────────
export async function judgeSubmission(submissionId: string) {
  const submission = getSubmissionById(submissionId);
  if (!submission) return;

  updateSubmission(submissionId, { verdict: "running" });

  const testCases = getTestCasesForProblem(submission.problem_id);
  if (testCases.length === 0) {
    updateSubmission(submissionId, {
      verdict: "accepted",
      runtime_ms: 0,
      memory_kb: 0,
    });
    return;
  }

  // Get problem limits
  const sub = getPendingSubmissions().find((s) => s.id === submissionId) || {
    time_limit_ms: 2000,
    memory_limit_mb: 256,
  };
  const timeLimitMs = (sub as { time_limit_ms: number }).time_limit_ms;
  const memoryLimitMb = (sub as { memory_limit_mb: number }).memory_limit_mb;

  let overallVerdict = "accepted";
  let maxRuntime = 0;
  let maxMemory = 0;

  for (const tc of testCases) {
    const result = await executeInSandbox(
      submission.code,
      submission.language,
      tc.input,
      timeLimitMs,
      memoryLimitMb
    );

    let tcVerdict = "accepted";

    if (result.isCompileError) {
      tcVerdict = "compilation_error";
    } else if (result.timedOut) {
      tcVerdict = "time_limit_exceeded";
    } else if (result.exitCode !== 0) {
      tcVerdict = "runtime_error";
    } else if (!compareOutput(tc.expected_output, result.stdout)) {
      tcVerdict = "wrong_answer";
    }

    createSubmissionResult({
      id: uuidv4(),
      submission_id: submissionId,
      test_case_id: tc.id,
      verdict: tcVerdict,
      actual_output: result.stdout.substring(0, 10000),
      runtime_ms: result.runtimeMs,
      memory_kb: result.memoryKb,
      error_message: result.stderr ? result.stderr.substring(0, 5000) : undefined,
    });

    maxRuntime = Math.max(maxRuntime, result.runtimeMs);
    maxMemory = Math.max(maxMemory, result.memoryKb);

    if (tcVerdict !== "accepted" && overallVerdict === "accepted") {
      overallVerdict = tcVerdict;
    }

    // Short-circuit immediately on compilation error so all tests are not needlessly executed
    if (result.isCompileError) {
      break;
    }
  }

  updateSubmission(submissionId, {
    verdict: overallVerdict,
    runtime_ms: maxRuntime,
    memory_kb: maxMemory,
    error_message:
      overallVerdict !== "accepted" ? `Failed on test cases` : undefined,
  });
}

// ─── Worker loop ───────────────────────────────────────────
export async function processSubmissionQueue() {
  const pending = getPendingSubmissions();
  for (const sub of pending) {
    await judgeSubmission(sub.id);
  }
}
