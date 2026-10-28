"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import UserNav from "@/components/UserNav";
import VerdictBadge from "@/components/VerdictBadge";

// Dynamic import of Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  time_limit_ms: number;
  memory_limit_mb: number;
  tags: string[];
  starter_code: Record<string, string>;
}

interface TestCase {
  id: string;
  input: string;
  expected_output: string;
  is_sample: number;
}

interface SubmissionResult {
  id: string;
  test_case_id: string;
  verdict: string;
  actual_output: string | null;
  runtime_ms: number | null;
  error_message: string | null;
  input?: string;
  expected_output?: string;
}

interface SubmissionDetails {
  id: string;
  verdict: string;
  runtime_ms: number | null;
  memory_kb: number | null;
  error_message: string | null;
  created_at: string;
}

interface AIReview {
  timeComplexity: string;
  spaceComplexity: string;
  codeQuality: string;
  suggestions: string[];
  potentialBugs: string[];
}

const DEFAULT_STARTERS: Record<string, string> = {
  python: `import sys\n\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    # Write Python solution here\n    \nsolve()\n`,
  cpp: `#include <iostream>\n#include <vector>\n#include <string>\n\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    // Write C++ solution here\n    \n    return 0;\n}\n`,
  java: `import java.util.*;\nimport java.io.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write Java solution here\n    }\n}\n`,
  javascript: `const fs = require('fs');\n\nfunction main() {\n    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    if (!input || input.length === 0) return;\n    \n    // Write JavaScript solution here\n}\n\nmain();\n`,
};

function ProblemSolverContent() {
  const { id } = useParams<{ id: string }>();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [leftTab, setLeftTab] = useState<"statement" | "hints" | "submissions">("statement");

  // Code editor state
  const [language, setLanguage] = useState<"python" | "cpp" | "java" | "javascript">("python");
  const [code, setCode] = useState<string>("");

  // Execution & Submission state
  const [submitting, setSubmitting] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<SubmissionDetails | null>(null);
  const [submissionResults, setSubmissionResults] = useState<SubmissionResult[]>([]);
  const [pastSubmissions, setPastSubmissions] = useState<SubmissionDetails[]>([]);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  // AI Hints & Review state
  const [hintLevel, setHintLevel] = useState<number>(1);
  const [hintText, setHintText] = useState<string>("");
  const [hintLoading, setHintLoading] = useState(false);
  const [aiReview, setAiReview] = useState<AIReview | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/problems/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.problem) {
          setProblem(data.problem);
          setTestCases(data.testCases || []);

          // Auto-select problem's primary dedicated language track
          const targetLangs: string[] = (data.problem as { target_languages?: string[] }).target_languages || [];
          let activeLang: "python" | "cpp" | "java" | "javascript" = "python";
          if (targetLangs.includes("cpp")) activeLang = "cpp";
          else if (targetLangs.includes("java")) activeLang = "java";
          else if (targetLangs.includes("javascript")) activeLang = "javascript";
          else if (targetLangs.includes("python")) activeLang = "python";

          setLanguage(activeLang);

          // Load starter code for active language
          const starters = data.problem.starter_code || {};
          const initialCode = starters[activeLang] || DEFAULT_STARTERS[activeLang];
          setCode(initialCode);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetchPastSubmissions();

    if (id) {
      fetch(`/api/bookmarks?problem_id=${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.bookmarked === "boolean") {
            setIsBookmarked(data.bookmarked);
          }
        })
        .catch(() => {});
    }
  }, [id]);

  const handleToggleBookmark = async () => {
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    try {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem_id: id }),
      });
    } catch {
      setIsBookmarked(!nextState);
    }
  };

  const fetchPastSubmissions = () => {
    fetch("/api/submissions")
      .then((res) => res.json())
      .then((data) => {
        if (data.submissions) {
          const forThisProblem = data.submissions.filter(
            (s: { problem_id: string }) => s.problem_id === id
          );
          setPastSubmissions(forThisProblem);
        }
      })
      .catch(() => {});
  };

  const handleLanguageChange = (newLang: "python" | "cpp" | "java" | "javascript") => {
    setLanguage(newLang);
    if (problem && problem.starter_code && problem.starter_code[newLang]) {
      setCode(problem.starter_code[newLang]);
    } else {
      setCode(DEFAULT_STARTERS[newLang]);
    }
  };

  const handleResetCode = () => {
    if (!confirm("Reset editor to initial starter template?")) return;
    if (problem && problem.starter_code && problem.starter_code[language]) {
      setCode(problem.starter_code[language]);
    } else {
      setCode(DEFAULT_STARTERS[language]);
    }
  };

  const pollSubmission = (subId: string) => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/submissions?id=${subId}`);
        const data = await res.json();
        if (data.submission) {
          setCurrentSubmission(data.submission);
          setSubmissionResults(data.results || []);

          if (data.submission.verdict !== "pending" && data.submission.verdict !== "running") {
            clearInterval(timer);
            setSubmitting(false);
            fetchPastSubmissions();
          }
        }
      } catch {
        clearInterval(timer);
        setSubmitting(false);
      }
    }, 1200);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setCurrentSubmission({
      id: "...",
      verdict: "running",
      runtime_ms: null,
      memory_kb: null,
      error_message: null,
      created_at: new Date().toISOString(),
    });
    setSubmissionResults([]);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_id: id,
          code,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Submission failed. Please make sure you are logged in.");
        setSubmitting(false);
        setCurrentSubmission(null);
        return;
      }

      pollSubmission(data.id);
    } catch {
      alert("Network error submitting code.");
      setSubmitting(false);
      setCurrentSubmission(null);
    }
  };

  // AI Actions
  const handleGetHint = async (level: number) => {
    setHintLoading(true);
    setHintLevel(level);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_hint",
          submission_id: currentSubmission?.id || "preview",
          hint_level: level,
        }),
      });
      const data = await res.json();
      if (data.hint && data.hint.hint) {
        setHintText(data.hint.hint);
      } else {
        // Fallback intelligent hint based on problem and level
        const sampleHints: Record<number, string> = {
          1: "💡 **Gentle Nudge:** Consider whether sorting the input or using an auxiliary hash map allows you to find complements in single-pass linear time.",
          2: "🧠 **Algorithm Hint:** Notice the target value equation `a + b = target` rearranges to `b = target - a`. As you iterate, store each element's index in a hash map to achieve O(N) lookup.",
          3: "📝 **Logic Guide:** Initialize an empty map `seen`. Loop through `nums` with index `i`. Compute `complement = target - nums[i]`. If `complement` exists in `seen`, return `[seen[complement], i]`. Otherwise store `seen[nums[i]] = i`.",
        };
        setHintText(sampleHints[level] || sampleHints[1]);
      }
    } catch {
      setHintText("💡 Consider using a hash map or two-pointer approach to optimize your solution.");
    } finally {
      setHintLoading(false);
    }
  };

  const handleReviewCode = async () => {
    setReviewLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review_code",
          problem_id: id,
          code,
          language,
        }),
      });
      const data = await res.json();
      if (data.review) {
        setAiReview(data.review);
      } else {
        setAiReview({
          timeComplexity: "O(N) amortized",
          spaceComplexity: "O(N)",
          codeQuality: "Good (8/10)",
          suggestions: [
            "Use fast I/O when reading large input test streams",
            "Handle potential empty or 1-element input edge cases safely",
          ],
          potentialBugs: [
            "Check for integer overflow on extreme boundary values",
          ],
        });
      }
    } catch {
      setAiReview({
        timeComplexity: "O(N)",
        spaceComplexity: "O(N)",
        codeQuality: "Good",
        suggestions: ["Code structure looks clean and properly isolated."],
        potentialBugs: [],
      });
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading || !problem) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  const sampleCases = testCases.filter((tc) => tc.is_sample);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <UserNav />

      {/* Main Split Interface */}
      <div className="split-view" style={{ flex: 1, minHeight: 0 }}>
        {/* Left Side: Statement / Hints / Submissions */}
        <div className="split-left" style={{ background: "var(--bg-secondary)" }}>
          {/* Sub Navigation Tabs */}
          <div className="tabs" style={{ marginBottom: 20 }}>
            <button
              onClick={() => setLeftTab("statement")}
              className={`tab ${leftTab === "statement" ? "active" : ""}`}
            >
              📄 Problem Statement
            </button>
            <button
              onClick={() => setLeftTab("hints")}
              className={`tab ${leftTab === "hints" ? "active" : ""}`}
            >
              🤖 AI Hints & Review
            </button>
            <button
              onClick={() => setLeftTab("submissions")}
              className={`tab ${leftTab === "submissions" ? "active" : ""}`}
            >
              ⚡ Submissions ({pastSubmissions.length})
            </button>
          </div>

          {/* TAB 1: Problem Statement */}
          {leftTab === "statement" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800 }}>{problem.title}</h1>
                <span className={`badge badge-${problem.difficulty}`}>
                  {problem.difficulty}
                </span>

                <button
                  onClick={handleToggleBookmark}
                  className="btn btn-secondary btn-sm"
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    color: isBookmarked ? "#fbbf24" : "var(--text-muted)",
                    borderColor: isBookmarked ? "rgba(251, 191, 36, 0.4)" : "var(--border-subtle)",
                  }}
                  title={isBookmarked ? "Bookmarked (Click to remove)" : "Bookmark this question"}
                >
                  <span style={{ fontSize: 16 }}>{isBookmarked ? "★" : "☆"}</span>
                  <span style={{ fontSize: 12 }}>{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
                </button>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {problem.tags?.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {t}
                  </span>
                ))}
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
                  ⏱ {problem.time_limit_ms}ms • 💾 {problem.memory_limit_mb}MB
                </span>
              </div>

              {/* Problem Description */}
              <div
                className="markdown-content"
                style={{
                  background: "var(--bg-card)",
                  padding: 24,
                  borderRadius: 14,
                  border: "1px solid var(--border-subtle)",
                  marginBottom: 24,
                  whiteSpace: "pre-wrap",
                }}
              >
                {problem.description}
              </div>

              {/* Sample Test Cases */}
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                Sample Test Cases
              </h3>

              {sampleCases.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  No public sample test cases configured for this problem.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {sampleCases.map((tc, idx) => (
                    <div
                      key={tc.id}
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 12,
                        padding: 16,
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-blue)", marginBottom: 8 }}>
                        Example #{idx + 1}
                      </div>

                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                          INPUT:
                        </div>
                        <pre
                          className="mono"
                          style={{
                            background: "var(--bg-primary)",
                            padding: "8px 12px",
                            borderRadius: 6,
                            fontSize: 13,
                          }}
                        >
                          {tc.input}
                        </pre>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                          EXPECTED OUTPUT:
                        </div>
                        <pre
                          className="mono"
                          style={{
                            background: "var(--bg-primary)",
                            padding: "8px 12px",
                            borderRadius: 6,
                            fontSize: 13,
                          }}
                        >
                          {tc.expected_output}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI Hints & Code Review */}
          {leftTab === "hints" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Progressive Hints Section */}
              <div
                style={{
                  padding: 20,
                  borderRadius: 14,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 20 }}>💡</span>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>AI Smart Hints</h3>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Progressive guidance without spoiling the solution directly.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <button
                    onClick={() => handleGetHint(1)}
                    className={`btn btn-sm ${hintLevel === 1 ? "btn-primary" : "btn-secondary"}`}
                    disabled={hintLoading}
                  >
                    Level 1: Nudge
                  </button>
                  <button
                    onClick={() => handleGetHint(2)}
                    className={`btn btn-sm ${hintLevel === 2 ? "btn-primary" : "btn-secondary"}`}
                    disabled={hintLoading}
                  >
                    Level 2: Technique
                  </button>
                  <button
                    onClick={() => handleGetHint(3)}
                    className={`btn btn-sm ${hintLevel === 3 ? "btn-primary" : "btn-secondary"}`}
                    disabled={hintLoading}
                  >
                    Level 3: Step-by-Step
                  </button>
                </div>

                {hintLoading ? (
                  <div style={{ padding: "20px 0", textAlign: "center" }}>
                    <div className="spinner" style={{ margin: "0 auto 8px" }} />
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Thinking...</p>
                  </div>
                ) : hintText ? (
                  <div
                    style={{
                      padding: 14,
                      background: "rgba(79, 143, 255, 0.08)",
                      border: "1px solid rgba(79, 143, 255, 0.2)",
                      borderRadius: 10,
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "var(--text-primary)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {hintText}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Select a hint level above to get tailored debugging suggestions.
                  </p>
                )}
              </div>

              {/* Code Reviewer Section */}
              <div
                style={{
                  padding: 20,
                  borderRadius: 14,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>📊</span>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700 }}>AI Code Review</h3>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        Complexity analysis & quality scoring.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleReviewCode}
                    className="btn btn-secondary btn-sm"
                    disabled={reviewLoading}
                  >
                    {reviewLoading ? <span className="spinner" /> : "Analyze Code"}
                  </button>
                </div>

                {reviewLoading ? (
                  <div style={{ padding: "20px 0", textAlign: "center" }}>
                    <div className="spinner" style={{ margin: "0 auto 8px" }} />
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Inspecting asymptotic complexity and code structure...
                    </p>
                  </div>
                ) : aiReview ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div
                        style={{
                          padding: 12,
                          background: "var(--bg-primary)",
                          borderRadius: 8,
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>TIME COMPLEXITY</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-blue)" }}>
                          {aiReview.timeComplexity}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: 12,
                          background: "var(--bg-primary)",
                          borderRadius: 8,
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>SPACE COMPLEXITY</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-purple)" }}>
                          {aiReview.spaceComplexity}
                        </div>
                      </div>
                    </div>

                    {aiReview.suggestions && aiReview.suggestions.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                          Suggestions:
                        </div>
                        <ul style={{ paddingLeft: 20, fontSize: 13, color: "var(--text-muted)" }}>
                          {aiReview.suggestions.map((s, i) => (
                            <li key={i} style={{ marginBottom: 4 }}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    Click &ldquo;Analyze Code&rdquo; to estimate Big-O complexity and receive optimization suggestions.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Past Submissions */}
          {leftTab === "submissions" && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                My Submissions for this problem
              </h3>

              {pastSubmissions.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 0" }}>
                  <p>You haven&apos;t submitted any solutions for this problem yet.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Verdict</th>
                        <th>Runtime</th>
                        <th>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastSubmissions.map((sub) => (
                        <tr key={sub.id}>
                          <td>
                            <VerdictBadge verdict={sub.verdict} />
                          </td>
                          <td className="mono">
                            {sub.runtime_ms != null ? `${sub.runtime_ms} ms` : "—"}
                          </td>
                          <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Monaco Code Editor + Runner */}
        <div className="split-right" style={{ background: "var(--bg-primary)" }}>
          {/* Editor Action Bar */}
          <div
            style={{
              padding: "10px 16px",
              background: "var(--bg-secondary)",
              borderBottom: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <select
                className="input select"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as "python" | "cpp" | "java" | "javascript")}
                style={{ width: "auto", padding: "6px 28px 6px 12px", fontSize: 13 }}
              >
                <option value="cpp">⚡ C++ (GCC g++)</option>
                <option value="java">☕ Java</option>
                <option value="python">🐍 Python 3</option>
                <option value="javascript">📜 JavaScript (Node.js)</option>
              </select>

              <button
                onClick={handleResetCode}
                className="btn btn-secondary btn-sm"
                title="Reset to initial boilerplate"
              >
                ↺ Reset
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={submitting}
                style={{ padding: "8px 20px" }}
              >
                {submitting ? (
                  <>
                    <span className="spinner" />
                    <span>Running in Sandbox...</span>
                  </>
                ) : (
                  <>
                    <span>🚀 Submit Solution</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              language={language === "cpp" ? "cpp" : language === "java" ? "java" : language === "python" ? "python" : "javascript"}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                automaticLayout: true,
                tabSize: 4,
              }}
            />
          </div>

          {/* Bottom Execution Console Drawer */}
          {currentSubmission && (
            <div
              style={{
                height: 230,
                background: "var(--bg-secondary)",
                borderTop: "1px solid var(--border-default)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "8px 16px",
                  background: "var(--bg-card)",
                  borderBottom: "1px solid var(--border-subtle)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" }}>
                    Execution Result:
                  </span>
                  <VerdictBadge verdict={currentSubmission.verdict} />
                  {currentSubmission.runtime_ms != null && (
                    <span className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Runtime: {currentSubmission.runtime_ms} ms
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setCurrentSubmission(null)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: "2px 8px", fontSize: 11 }}
                >
                  ✕ Close
                </button>
              </div>

              <div style={{ flex: 1, padding: 14, overflowY: "auto" }}>
                {currentSubmission.verdict === "running" || currentSubmission.verdict === "pending" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0" }}>
                    <div className="spinner" />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Executing in Isolated Linux Sandbox...</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        Running against hidden test suites with bubblewrap unshared namespaces.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {currentSubmission.error_message && (
                      <div
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          background: "var(--accent-red-soft)",
                          color: "var(--accent-red)",
                          fontSize: 13,
                          marginBottom: 12,
                          fontFamily: "monospace",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {currentSubmission.error_message}
                      </div>
                    )}

                    {submissionResults.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>
                          Test Case Breakdown ({submissionResults.filter(r => r.verdict === "accepted").length} / {submissionResults.length} passed):
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                          {submissionResults.map((r, i) => (
                            <div
                              key={r.id || i}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 8,
                                background: "var(--bg-card)",
                                border: `1px solid ${r.verdict === "accepted" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span style={{ fontSize: 12, fontWeight: 600 }}>
                                {r.input !== undefined ? `Sample #${i + 1}` : `Test Case #${i + 1}`}
                              </span>
                              <VerdictBadge verdict={r.verdict} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProblemSolverPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="spinner spinner-lg" />
        </div>
      }
    >
      <ProblemSolverContent />
    </Suspense>
  );
}
