import Database from "better-sqlite3";
import path from "path";
import { hashSync } from "bcryptjs";

const DB_PATH = path.join(process.cwd(), "judge.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initializeDb(_db);
  }
  return _db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
      display_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS problems (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'medium' CHECK(difficulty IN ('easy', 'medium', 'hard')),
      time_limit_ms INTEGER NOT NULL DEFAULT 2000,
      memory_limit_mb INTEGER NOT NULL DEFAULT 256,
      tags TEXT DEFAULT '[]',
      starter_code TEXT DEFAULT '{}',
      is_published INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS test_cases (
      id TEXT PRIMARY KEY,
      problem_id TEXT NOT NULL,
      input TEXT NOT NULL,
      expected_output TEXT NOT NULL,
      is_sample INTEGER NOT NULL DEFAULT 0,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      problem_id TEXT NOT NULL,
      code TEXT NOT NULL,
      language TEXT NOT NULL CHECK(language IN ('python', 'cpp', 'javascript')),
      verdict TEXT NOT NULL DEFAULT 'pending' CHECK(verdict IN ('pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error')),
      runtime_ms INTEGER,
      memory_kb INTEGER,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (problem_id) REFERENCES problems(id)
    );

    CREATE TABLE IF NOT EXISTS submission_results (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      test_case_id TEXT NOT NULL,
      verdict TEXT NOT NULL DEFAULT 'pending',
      actual_output TEXT,
      runtime_ms INTEGER,
      memory_kb INTEGER,
      error_message TEXT,
      FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
      FOREIGN KEY (test_case_id) REFERENCES test_cases(id)
    );

    CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_problem ON submissions(problem_id);
    CREATE INDEX IF NOT EXISTS idx_test_cases_problem ON test_cases(problem_id);
    CREATE INDEX IF NOT EXISTS idx_submission_results_submission ON submission_results(submission_id);
  `);

  // Seed default admin if none exists
  let adminId = "";
  const adminRow = db
    .prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
    .get() as { id: string } | undefined;
  if (!adminRow) {
    const { v4: uuidv4 } = require("uuid");
    adminId = uuidv4();
    db.prepare(
      `INSERT INTO users (id, email, username, password, role, display_name) VALUES (?, ?, ?, ?, 'admin', ?)`
    ).run(
      adminId,
      "admin@aijudge.local",
      "admin",
      hashSync("admin123", 10),
      "Administrator"
    );
  } else {
    adminId = adminRow.id;
  }

  // Seed starter problems if none exist
  const problemCount = (
    db.prepare("SELECT COUNT(*) as count FROM problems").get() as { count: number }
  ).count;
  if (problemCount === 0) {
    const { v4: uuidv4 } = require("uuid");

    // 1. Two Sum
    const p1Id = uuidv4();
    db.prepare(`
      INSERT INTO problems (id, title, slug, description, difficulty, time_limit_ms, memory_limit_mb, tags, starter_code, is_published, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      p1Id,
      "Two Sum",
      "two-sum",
      `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\n### Input Format\n- First line: integer \`n\` (number of elements)\n- Second line: \`n\` space-separated integers representing \`nums\`\n- Third line: integer \`target\`\n\n### Output Format\n- Print two space-separated integers representing the 0-based indices in ascending order.\n\n### Constraints\n- \`2 <= n <= 10^4\`\n- \`-10^9 <= nums[i] <= 10^9\`\n- \`-10^9 <= target <= 10^9\``,
      "easy",
      2000,
      256,
      JSON.stringify(["arrays", "hash-table"]),
      JSON.stringify({
        python: `import sys\n\ndef solve():\n    data = sys.stdin.read().split()\n    if not data:\n        return\n    n = int(data[0])\n    nums = [int(x) for x in data[1:n+1]]\n    target = int(data[n+1])\n    \n    seen = {}\n    for i, x in enumerate(nums):\n        diff = target - x\n        if diff in seen:\n            print(f"{seen[diff]} {i}")\n            return\n        seen[x] = i\n\nsolve()\n`,
        cpp: `#include <iostream>\n#include <vector>\n#include <unordered_map>\n\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    int target;\n    cin >> target;\n    \n    unordered_map<int, int> seen;\n    for (int i = 0; i < n; i++) {\n        int complement = target - nums[i];\n        if (seen.count(complement)) {\n            cout << seen[complement] << " " << i << "\\n";\n            return 0;\n        }\n        seen[nums[i]] = i;\n    }\n    return 0;\n}\n`,
        javascript: `const fs = require('fs');\n\nfunction main() {\n    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    if (input.length < 2) return;\n    const n = parseInt(input[0], 10);\n    const nums = input.slice(1, n + 1).map(Number);\n    const target = parseInt(input[n + 1], 10);\n    \n    const seen = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (seen.has(complement)) {\n            console.log(seen.get(complement) + " " + i);\n            return;\n        }\n        seen.set(nums[i], i);\n    }\n}\n\nmain();\n`
      }),
      adminId
    );

    // Test cases for Two Sum
    db.prepare(`INSERT INTO test_cases (id, problem_id, input, expected_output, is_sample, order_index) VALUES (?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), p1Id, "4\n2 7 11 15\n9", "0 1", 1, 0
    );
    db.prepare(`INSERT INTO test_cases (id, problem_id, input, expected_output, is_sample, order_index) VALUES (?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), p1Id, "3\n3 2 4\n6", "1 2", 1, 1
    );
    // Hidden test cases
    db.prepare(`INSERT INTO test_cases (id, problem_id, input, expected_output, is_sample, order_index) VALUES (?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), p1Id, "2\n3 3\n6", "0 1", 0, 2
    );
    db.prepare(`INSERT INTO test_cases (id, problem_id, input, expected_output, is_sample, order_index) VALUES (?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), p1Id, "5\n100 -50 20 30 -10\n-60", "1 4", 0, 3
    );

    // 2. Palindrome Number
    const p2Id = uuidv4();
    db.prepare(`
      INSERT INTO problems (id, title, slug, description, difficulty, time_limit_ms, memory_limit_mb, tags, starter_code, is_published, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      p2Id,
      "Palindrome Number",
      "palindrome-number",
      `Given an integer \`x\`, return \`true\` if \`x\` is a palindrome, and \`false\` otherwise.\n\nAn integer is a palindrome when it reads the same forward and backward.\n\n### Input Format\n- A single line containing an integer \`x\`\n\n### Output Format\n- Print \`true\` or \`false\` (all lowercase)\n\n### Constraints\n- \`-2^31 <= x <= 2^31 - 1\``,
      "easy",
      1500,
      128,
      JSON.stringify(["math", "string"]),
      JSON.stringify({
        python: `import sys\n\ndef solve():\n    s = sys.stdin.read().strip()\n    if not s:\n        return\n    if s == s[::-1]:\n        print("true")\n    else:\n        print("false")\n\nsolve()\n`,
        cpp: `#include <iostream>\n#include <string>\n#include <algorithm>\n\nusing namespace std;\n\nint main() {\n    string s;\n    if (!(cin >> s)) return 0;\n    string r = s;\n    reverse(r.begin(), r.end());\n    if (s == r) cout << "true\\n";\n    else cout << "false\\n";\n    return 0;\n}\n`,
        javascript: `const fs = require('fs');\nconst s = fs.readFileSync(0, 'utf-8').trim();\nif (s) {\n    const r = s.split('').reverse().join('');\n    console.log(s === r ? 'true' : 'false');\n}\n`
      }),
      adminId
    );

    db.prepare(`INSERT INTO test_cases (id, problem_id, input, expected_output, is_sample, order_index) VALUES (?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), p2Id, "121", "true", 1, 0
    );
    db.prepare(`INSERT INTO test_cases (id, problem_id, input, expected_output, is_sample, order_index) VALUES (?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), p2Id, "-121", "false", 1, 1
    );
    db.prepare(`INSERT INTO test_cases (id, problem_id, input, expected_output, is_sample, order_index) VALUES (?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), p2Id, "10", "false", 0, 2
    );
    db.prepare(`INSERT INTO test_cases (id, problem_id, input, expected_output, is_sample, order_index) VALUES (?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), p2Id, "1234321", "true", 0, 3
    );
  }
}

// ─── User helpers ──────────────────────────────────────────
export function getUserByEmail(email: string) {
  return getDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | UserRow
    | undefined;
}

export function getUserByUsername(username: string) {
  return getDb()
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as UserRow | undefined;
}

export function getUserById(id: string) {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | UserRow
    | undefined;
}

export function createUser(data: {
  id: string;
  email: string;
  username: string;
  password: string;
  display_name: string;
  role?: string;
}) {
  return getDb()
    .prepare(
      `INSERT INTO users (id, email, username, password, display_name, role) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.id,
      data.email,
      data.username,
      data.password,
      data.display_name,
      data.role || "user"
    );
}

// ─── Problem helpers ───────────────────────────────────────
export function getAllProblems(publishedOnly = false) {
  const where = publishedOnly ? "WHERE is_published = 1" : "";
  return getDb()
    .prepare(`SELECT * FROM problems ${where} ORDER BY created_at DESC`)
    .all() as ProblemRow[];
}

export function getProblemById(id: string) {
  return getDb().prepare("SELECT * FROM problems WHERE id = ?").get(id) as
    | ProblemRow
    | undefined;
}

export function getProblemBySlug(slug: string) {
  return getDb()
    .prepare("SELECT * FROM problems WHERE slug = ?")
    .get(slug) as ProblemRow | undefined;
}

export function createProblem(data: {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  time_limit_ms: number;
  memory_limit_mb: number;
  tags: string;
  starter_code: string;
  created_by: string;
}) {
  return getDb()
    .prepare(
      `INSERT INTO problems (id, title, slug, description, difficulty, time_limit_ms, memory_limit_mb, tags, starter_code, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.id,
      data.title,
      data.slug,
      data.description,
      data.difficulty,
      data.time_limit_ms,
      data.memory_limit_mb,
      data.tags,
      data.starter_code,
      data.created_by
    );
}

export function updateProblem(
  id: string,
  data: Partial<{
    title: string;
    slug: string;
    description: string;
    difficulty: string;
    time_limit_ms: number;
    memory_limit_mb: number;
    tags: string;
    starter_code: string;
    is_published: number;
  }>
) {
  const fields = Object.keys(data)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = Object.values(data);
  return getDb()
    .prepare(
      `UPDATE problems SET ${fields}, updated_at = datetime('now') WHERE id = ?`
    )
    .run(...values, id);
}

export function deleteProblem(id: string) {
  return getDb().prepare("DELETE FROM problems WHERE id = ?").run(id);
}

// ─── Test case helpers ─────────────────────────────────────
export function getTestCasesForProblem(problemId: string, sampleOnly = false) {
  const where = sampleOnly
    ? "WHERE problem_id = ? AND is_sample = 1"
    : "WHERE problem_id = ?";
  return getDb()
    .prepare(`SELECT * FROM test_cases ${where} ORDER BY order_index ASC`)
    .all(problemId) as TestCaseRow[];
}

export function createTestCase(data: {
  id: string;
  problem_id: string;
  input: string;
  expected_output: string;
  is_sample: number;
  order_index: number;
}) {
  return getDb()
    .prepare(
      `INSERT INTO test_cases (id, problem_id, input, expected_output, is_sample, order_index) VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.id,
      data.problem_id,
      data.input,
      data.expected_output,
      data.is_sample,
      data.order_index
    );
}

export function updateTestCase(
  id: string,
  data: Partial<{
    input: string;
    expected_output: string;
    is_sample: number;
    order_index: number;
  }>
) {
  const fields = Object.keys(data)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = Object.values(data);
  return getDb()
    .prepare(`UPDATE test_cases SET ${fields} WHERE id = ?`)
    .run(...values, id);
}

export function deleteTestCase(id: string) {
  return getDb().prepare("DELETE FROM test_cases WHERE id = ?").run(id);
}

// ─── Submission helpers ────────────────────────────────────
export function createSubmission(data: {
  id: string;
  user_id: string;
  problem_id: string;
  code: string;
  language: string;
}) {
  return getDb()
    .prepare(
      `INSERT INTO submissions (id, user_id, problem_id, code, language) VALUES (?, ?, ?, ?, ?)`
    )
    .run(data.id, data.user_id, data.problem_id, data.code, data.language);
}

export function updateSubmission(
  id: string,
  data: Partial<{
    verdict: string;
    runtime_ms: number;
    memory_kb: number;
    error_message: string;
  }>
) {
  const fields = Object.keys(data)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = Object.values(data);
  return getDb()
    .prepare(`UPDATE submissions SET ${fields} WHERE id = ?`)
    .run(...values, id);
}

export function getSubmissionById(id: string) {
  return getDb()
    .prepare(
      `SELECT s.*, u.username, p.title as problem_title 
       FROM submissions s 
       JOIN users u ON s.user_id = u.id 
       JOIN problems p ON s.problem_id = p.id 
       WHERE s.id = ?`
    )
    .get(id) as (SubmissionRow & { username: string; problem_title: string }) | undefined;
}

export function getSubmissionsForUser(userId: string) {
  return getDb()
    .prepare(
      `SELECT s.*, p.title as problem_title, p.slug as problem_slug 
       FROM submissions s 
       JOIN problems p ON s.problem_id = p.id 
       WHERE s.user_id = ? 
       ORDER BY s.created_at DESC`
    )
    .all(userId) as (SubmissionRow & {
    problem_title: string;
    problem_slug: string;
  })[];
}

export function getAllSubmissions() {
  return getDb()
    .prepare(
      `SELECT s.*, u.username, p.title as problem_title 
       FROM submissions s 
       JOIN users u ON s.user_id = u.id 
       JOIN problems p ON s.problem_id = p.id 
       ORDER BY s.created_at DESC`
    )
    .all() as (SubmissionRow & { username: string; problem_title: string })[];
}

export function getPendingSubmissions() {
  return getDb()
    .prepare(
      `SELECT s.*, p.time_limit_ms, p.memory_limit_mb 
       FROM submissions s 
       JOIN problems p ON s.problem_id = p.id 
       WHERE s.verdict = 'pending' 
       ORDER BY s.created_at ASC 
       LIMIT 5`
    )
    .all() as (SubmissionRow & {
    time_limit_ms: number;
    memory_limit_mb: number;
  })[];
}

// ─── Submission result helpers ─────────────────────────────
export function createSubmissionResult(data: {
  id: string;
  submission_id: string;
  test_case_id: string;
  verdict: string;
  actual_output?: string;
  runtime_ms?: number;
  memory_kb?: number;
  error_message?: string;
}) {
  return getDb()
    .prepare(
      `INSERT INTO submission_results (id, submission_id, test_case_id, verdict, actual_output, runtime_ms, memory_kb, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.id,
      data.submission_id,
      data.test_case_id,
      data.verdict,
      data.actual_output || null,
      data.runtime_ms || null,
      data.memory_kb || null,
      data.error_message || null
    );
}

export function getResultsForSubmission(submissionId: string) {
  return getDb()
    .prepare(
      `SELECT sr.*, tc.input, tc.expected_output, tc.is_sample 
       FROM submission_results sr 
       JOIN test_cases tc ON sr.test_case_id = tc.id 
       WHERE sr.submission_id = ? 
       ORDER BY tc.order_index ASC`
    )
    .all(submissionId) as (SubmissionResultRow & {
    input: string;
    expected_output: string;
    is_sample: number;
  })[];
}

// ─── Leaderboard ───────────────────────────────────────────
export function getLeaderboard() {
  return getDb()
    .prepare(
      `SELECT 
        u.id, u.username, u.display_name,
        COUNT(DISTINCT CASE WHEN s.verdict = 'accepted' THEN s.problem_id END) as solved_count,
        COUNT(s.id) as total_submissions
       FROM users u
       LEFT JOIN submissions s ON u.id = s.user_id
       WHERE u.role = 'user'
       GROUP BY u.id
       ORDER BY solved_count DESC, total_submissions ASC
       LIMIT 50`
    )
    .all() as LeaderboardRow[];
}

// ─── Stats ─────────────────────────────────────────────────
export function getAdminStats() {
  const db = getDb();
  const userCount = (
    db
      .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'")
      .get() as { count: number }
  ).count;
  const problemCount = (
    db.prepare("SELECT COUNT(*) as count FROM problems").get() as {
      count: number;
    }
  ).count;
  const submissionCount = (
    db.prepare("SELECT COUNT(*) as count FROM submissions").get() as {
      count: number;
    }
  ).count;
  const acceptedCount = (
    db
      .prepare(
        "SELECT COUNT(*) as count FROM submissions WHERE verdict = 'accepted'"
      )
      .get() as { count: number }
  ).count;
  const recentSubmissions = db
    .prepare(
      `SELECT s.*, u.username, p.title as problem_title 
       FROM submissions s 
       JOIN users u ON s.user_id = u.id 
       JOIN problems p ON s.problem_id = p.id 
       ORDER BY s.created_at DESC LIMIT 10`
    )
    .all() as (SubmissionRow & { username: string; problem_title: string })[];

  return {
    userCount,
    problemCount,
    submissionCount,
    acceptedCount,
    recentSubmissions,
  };
}

// ─── Types ─────────────────────────────────────────────────
export interface UserRow {
  id: string;
  email: string;
  username: string;
  password: string;
  role: "admin" | "user";
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface ProblemRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  time_limit_ms: number;
  memory_limit_mb: number;
  tags: string;
  starter_code: string;
  is_published: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TestCaseRow {
  id: string;
  problem_id: string;
  input: string;
  expected_output: string;
  is_sample: number;
  order_index: number;
  created_at: string;
}

export interface SubmissionRow {
  id: string;
  user_id: string;
  problem_id: string;
  code: string;
  language: string;
  verdict: string;
  runtime_ms: number | null;
  memory_kb: number | null;
  error_message: string | null;
  created_at: string;
}

export interface SubmissionResultRow {
  id: string;
  submission_id: string;
  test_case_id: string;
  verdict: string;
  actual_output: string | null;
  runtime_ms: number | null;
  memory_kb: number | null;
  error_message: string | null;
}

export interface LeaderboardRow {
  id: string;
  username: string;
  display_name: string;
  solved_count: number;
  total_submissions: number;
}
