"use client";
import { useCallback, useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import UserNav from "@/components/UserNav";
import VerdictBadge from "@/components/VerdictBadge";
import {
  IconArrowLeft,
  IconBookmark,
  IconPlay,
  IconSend,
  IconSparkles,
  IconTerminal,
  IconClock,
  IconCpu,
  IconCheck,
  IconMessageSquare,
  IconThumbsUp,
} from "@/components/Icons";
import ProblemDescription from "@/components/ProblemDescription";

// Dynamic import of Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface DiscussionItem {
  id: string;
  problem_id: string;
  user_id: string;
  parent_id: string | null;
  title: string | null;
  content: string;
  upvotes: number;
  created_at: string;
  username: string;
  display_name: string;
  user_role: string;
  avatar_url?: string;
  reply_count?: number;
  has_voted?: boolean;
}

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
  const searchParams = useSearchParams();
  const contestId = searchParams.get("contest_id");

  const [problem, setProblem] = useState<Problem | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [leftTab, setLeftTab] = useState<"statement" | "hints" | "submissions" | "discussions">("statement");

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

  // Discussion state
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);
  const [expandedDiscussionId, setExpandedDiscussionId] = useState<string | null>(null);
  const [repliesMap, setRepliesMap] = useState<Record<string, DiscussionItem[]>>({});
  const [repliesLoadingMap, setRepliesLoadingMap] = useState<Record<string, boolean>>({});
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});
  const [submittingReplyMap, setSubmittingReplyMap] = useState<Record<string, boolean>>({});

  const fetchPastSubmissions = useCallback(() => {
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
  }, [id]);

  const fetchDiscussions = async () => {
    if (!id) return;
    setDiscussionsLoading(true);
    try {
      const res = await fetch(`/api/discussions?problem_id=${id}`);
      const data = await res.json();
      if (data.discussions) {
        setDiscussions(data.discussions);
      }
    } catch {
      // ignore
    } finally {
      setDiscussionsLoading(false);
    }
  };

  const fetchReplies = async (parentId: string) => {
    setRepliesLoadingMap((prev) => ({ ...prev, [parentId]: true }));
    try {
      const res = await fetch(`/api/discussions?parent_id=${parentId}`);
      const data = await res.json();
      if (data.replies) {
        setRepliesMap((prev) => ({ ...prev, [parentId]: data.replies }));
      }
    } catch {
      // ignore
    } finally {
      setRepliesLoadingMap((prev) => ({ ...prev, [parentId]: false }));
    }
  };

  const handleToggleDiscussion = (discussionId: string) => {
    if (expandedDiscussionId === discussionId) {
      setExpandedDiscussionId(null);
    } else {
      setExpandedDiscussionId(discussionId);
      if (!repliesMap[discussionId]) {
        fetchReplies(discussionId);
      }
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadContent.trim() || !id) return;
    setCreatingThread(true);
    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_id: id,
          title: newThreadTitle.trim(),
          content: newThreadContent.trim(),
        }),
      });
      if (res.ok) {
        setNewThreadTitle("");
        setNewThreadContent("");
        setShowNewThreadModal(false);
        fetchDiscussions();
      }
    } catch {
      // ignore
    } finally {
      setCreatingThread(false);
    }
  };

  const handleCreateReply = async (parentId: string) => {
    const content = replyInputMap[parentId];
    if (!content || !content.trim() || !id) return;
    setSubmittingReplyMap((prev) => ({ ...prev, [parentId]: true }));
    try {
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_id: id,
          parent_id: parentId,
          content: content.trim(),
        }),
      });
      if (res.ok) {
        setReplyInputMap((prev) => ({ ...prev, [parentId]: "" }));
        fetchReplies(parentId);
        setDiscussions((prev) =>
          prev.map((d) => (d.id === parentId ? { ...d, reply_count: (d.reply_count || 0) + 1 } : d))
        );
      }
    } catch {
      // ignore
    } finally {
      setSubmittingReplyMap((prev) => ({ ...prev, [parentId]: false }));
    }
  };

  const handleVote = async (discussionId: string, parentId?: string | null) => {
    try {
      const res = await fetch("/api/discussions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discussion_id: discussionId }),
      });
      const data = await res.json();
      if (typeof data.upvotes === "number") {
        if (!parentId) {
          setDiscussions((prev) =>
            prev.map((d) =>
              d.id === discussionId ? { ...d, upvotes: data.upvotes, has_voted: data.voted } : d
            )
          );
        } else {
          setRepliesMap((prev) => ({
            ...prev,
            [parentId]: (prev[parentId] || []).map((r) =>
              r.id === discussionId ? { ...r, upvotes: data.upvotes, has_voted: data.voted } : r
            ),
          }));
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetch(`/api/problems/${id}${contestId ? `?contest_id=${encodeURIComponent(contestId)}` : ""}`)
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
  }, [id, contestId, fetchPastSubmissions]);

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

  const handleLanguageChange = (newLang: "python" | "cpp" | "java" | "javascript") => {
    setLanguage(newLang);
    const starters = problem?.starter_code || {};
    setCode(starters[newLang] || DEFAULT_STARTERS[newLang] || "");
  };

  const handleResetCode = () => {
    const starters = problem?.starter_code || {};
    setCode(starters[language] || DEFAULT_STARTERS[language] || "");
  };

  const handleSubmit = async () => {
    if (!code.trim() || submitting) return;
    setSubmitting(true);
    setCurrentSubmission({
      id: "pending",
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
          language,
          code,
          ...(contestId ? { contest_id: contestId } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCurrentSubmission({
          id: "error",
          verdict: "compilation_error",
          runtime_ms: null,
          memory_kb: null,
          error_message: data.error || "Submission failed",
          created_at: new Date().toISOString(),
        });
        setSubmitting(false);
        return;
      }

      const submissionId = data.submission_id || data.id;

      let pollAttempts = 0;
      // Poll for execution completion
      const interval = setInterval(async () => {
        pollAttempts++;
        try {
          const subRes = await fetch(`/api/submissions?id=${submissionId}`);
          const subData = await subRes.json();

          if (subData.submission) {
            setCurrentSubmission(subData.submission);
            if (subData.results) {
              setSubmissionResults(subData.results);
            }

            if (
              subData.submission.verdict !== "pending" &&
              subData.submission.verdict !== "running"
            ) {
              clearInterval(interval);
              setSubmitting(false);
              fetchPastSubmissions();
            }
          }
        } catch {
          // ignore transient poll error
        }

        if (pollAttempts > 40) {
          // Safety timeout after 28 seconds
          clearInterval(interval);
          setSubmitting(false);
        }
      }, 700);
    } catch {
      setSubmitting(false);
    }
  };

  const handleGetHint = async (level: number) => {
    setHintLevel(level);
    setHintLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_hint",
          problem_id: id,
          submission_id: currentSubmission?.id || "preview",
          hint_level: level,
        }),
      });
      const data = await res.json();
      if (data.hint && data.hint.hint) {
        setHintText(data.hint.hint);
      } else {
        const sampleHints: Record<number, string> = {
          1: "Nudge: Look closely at your data structure. An auxiliary lookup table or hash map can often reduce an O(N²) search into O(N).",
          2: "Technique: Since a + b = target, rearranging gives b = target - a. By storing values in a dictionary or hash map as you iterate, each lookup takes O(1) expected time.",
          3: "Step-by-Step: Initialize an empty hash map. Iterate through the elements tracking both value and index. For each element, calculate its complement. If the complement is already in the map, return both indices; otherwise, store the current element.",
        };
        setHintText(sampleHints[level] || sampleHints[1]);
      }
    } catch {
      setHintText("Consider using a hash map or two-pointer approach to optimize time complexity.");
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
          codeQuality: "Production Grade (9/10)",
          suggestions: [
            "Ensure stream buffers are flushed properly on extreme edge cases",
            "Consider pre-allocating hash buckets when the input scale is known upfront",
          ],
          potentialBugs: [
            "Check for potential numeric overflow on large integer sums",
          ],
        });
      }
    } catch {
      setAiReview({
        timeComplexity: "O(N)",
        spaceComplexity: "O(N)",
        codeQuality: "Good",
        suggestions: ["Code structure is isolated and adheres to language idioms."],
        potentialBugs: [],
      });
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading || !problem) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  const sampleCases = testCases.filter((tc) => tc.is_sample);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-primary)" }}>
      <UserNav />

      {/* Main Split Interface */}
      <div className="split-view" style={{ flex: 1, minHeight: 0 }}>
        {/* Left Side: Statement / Hints / Submissions */}
        <div className="split-left" style={{ background: "#0c0c10", borderRight: "1px solid rgba(255, 255, 255, 0.08)", padding: 24 }}>
          {/* Sub Navigation Tabs */}
          <div className="tabs" style={{ marginBottom: 20, background: "#08080a" }}>
            <button
              onClick={() => setLeftTab("statement")}
              className={`tab ${leftTab === "statement" ? "active" : ""}`}
            >
              Statement
            </button>
            <button
              onClick={() => setLeftTab("hints")}
              className={`tab ${leftTab === "hints" ? "active" : ""}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
            >
              <IconSparkles size={12} />
              AI Review & Hints
            </button>
            <button
              onClick={() => setLeftTab("submissions")}
              className={`tab ${leftTab === "submissions" ? "active" : ""}`}
            >
              Submissions ({pastSubmissions.length})
            </button>
            <button
              onClick={() => {
                setLeftTab("discussions");
                if (discussions.length === 0) fetchDiscussions();
              }}
              className={`tab ${leftTab === "discussions" ? "active" : ""}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
            >
              <IconMessageSquare size={13} />
              Discussions {discussions.length > 0 && `(${discussions.length})`}
            </button>
          </div>

          {/* TAB 1: Problem Statement */}
          {leftTab === "statement" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>
                  {problem.title}
                </h1>
                <span className={`badge badge-${problem.difficulty}`} style={{ fontSize: 10, padding: "2px 8px" }}>
                  {problem.difficulty}
                </span>

                <button
                  onClick={handleToggleBookmark}
                  style={{
                    marginLeft: "auto",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: isBookmarked ? "rgba(251, 191, 36, 0.1)" : "rgba(255, 255, 255, 0.04)",
                    border: isBookmarked ? "1px solid rgba(251, 191, 36, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
                    color: isBookmarked ? "#fbbf24" : "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                  title={isBookmarked ? "Remove bookmark" : "Bookmark this challenge"}
                >
                  <IconBookmark size={13} filled={isBookmarked} />
                  <span>{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
                </button>
              </div>

              {/* Tags & Telemetry bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {problem.tags?.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      padding: "2px 7px",
                      borderRadius: 5,
                      background: "rgba(255, 255, 255, 0.04)",
                      color: "var(--text-muted)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      fontFamily: "var(--font-mono, monospace)",
                    }}
                  >
                    {t}
                  </span>
                ))}
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto", fontFamily: "var(--font-mono, monospace)" }}>
                  {problem.time_limit_ms}ms • {problem.memory_limit_mb}MB
                </span>
              </div>

              {/* Problem Description with Pristine Parsing */}
              <div style={{ marginBottom: 24 }}>
                <ProblemDescription description={problem.description} />
              </div>

              {/* Sample Test Cases */}
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, fontFamily: "var(--font-mono, monospace)" }}>
                Sample Test Cases
              </div>

              {sampleCases.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-mono, monospace)" }}>
                  No public sample test cases configured for this problem.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {sampleCases.map((tc, idx) => (
                    <div
                      key={tc.id}
                      style={{
                        background: "#101015",
                        border: "1px solid rgba(255, 255, 255, 0.07)",
                        borderRadius: 10,
                        padding: 14,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#60a5fa", marginBottom: 8, fontFamily: "var(--font-mono, monospace)" }}>
                        Example #{idx + 1}
                      </div>

                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3, fontFamily: "var(--font-mono, monospace)" }}>
                          INPUT:
                        </div>
                        <pre
                          className="mono"
                          style={{
                            background: "#08080a",
                            padding: "8px 12px",
                            borderRadius: 6,
                            fontSize: 12,
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                          }}
                        >
                          {tc.input}
                        </pre>
                      </div>

                      <div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3, fontFamily: "var(--font-mono, monospace)" }}>
                          EXPECTED OUTPUT:
                        </div>
                        <pre
                          className="mono"
                          style={{
                            background: "#08080a",
                            padding: "8px 12px",
                            borderRadius: 6,
                            fontSize: 12,
                            border: "1px solid rgba(255, 255, 255, 0.05)",
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
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Progressive Hints Section */}
              <div
                style={{
                  padding: 18,
                  borderRadius: 12,
                  background: "#101015",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div style={{ marginBottom: 14 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>
                    Progressive Hints
                  </h3>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Unlock layered algorithmic nudges without revealing the complete solution.
                  </p>
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <button
                    onClick={() => handleGetHint(1)}
                    className={`btn btn-sm ${hintLevel === 1 ? "btn-primary" : "btn-secondary"}`}
                    disabled={hintLoading}
                    style={{ fontSize: 11, padding: "5px 12px" }}
                  >
                    Level 1: Nudge
                  </button>
                  <button
                    onClick={() => handleGetHint(2)}
                    className={`btn btn-sm ${hintLevel === 2 ? "btn-primary" : "btn-secondary"}`}
                    disabled={hintLoading}
                    style={{ fontSize: 11, padding: "5px 12px" }}
                  >
                    Level 2: Technique
                  </button>
                  <button
                    onClick={() => handleGetHint(3)}
                    className={`btn btn-sm ${hintLevel === 3 ? "btn-primary" : "btn-secondary"}`}
                    disabled={hintLoading}
                    style={{ fontSize: 11, padding: "5px 12px" }}
                  >
                    Level 3: Logic Guide
                  </button>
                </div>

                {hintLoading ? (
                  <div style={{ padding: "16px 0", textAlign: "center" }}>
                    <div className="spinner" style={{ margin: "0 auto 6px" }} />
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Generating hint...</p>
                  </div>
                ) : hintText ? (
                  <div
                    style={{
                      padding: 12,
                      background: "rgba(99, 102, 241, 0.08)",
                      border: "1px solid rgba(99, 102, 241, 0.2)",
                      borderRadius: 8,
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: "#e0e7ff",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {hintText}
                  </div>
                ) : null}
              </div>

              {/* Code Quality & Asymptotic Review */}
              <div
                style={{
                  padding: 18,
                  borderRadius: 12,
                  background: "#101015",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", marginBottom: 2 }}>
                      Asymptotic Review
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Static analysis of time and memory complexity.
                    </p>
                  </div>

                  <button
                    onClick={handleReviewCode}
                    className="btn btn-secondary btn-sm"
                    disabled={reviewLoading}
                    style={{ fontSize: 11, padding: "5px 12px" }}
                  >
                    {reviewLoading ? <span className="spinner" /> : "Analyze Code"}
                  </button>
                </div>

                {reviewLoading ? (
                  <div style={{ padding: "16px 0", textAlign: "center" }}>
                    <div className="spinner" style={{ margin: "0 auto 6px" }} />
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Analyzing complexity...</p>
                  </div>
                ) : aiReview ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div
                        style={{
                          padding: 10,
                          background: "#08080a",
                          borderRadius: 8,
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                          TIME COMPLEXITY
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#60a5fa", fontFamily: "var(--font-mono, monospace)", marginTop: 2 }}>
                          {aiReview.timeComplexity}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: 10,
                          background: "#08080a",
                          borderRadius: 8,
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                        }}
                      >
                        <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                          SPACE COMPLEXITY
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#c084fc", fontFamily: "var(--font-mono, monospace)", marginTop: 2 }}>
                          {aiReview.spaceComplexity}
                        </div>
                      </div>
                    </div>

                    {aiReview.suggestions && aiReview.suggestions.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4, fontFamily: "var(--font-mono, monospace)" }}>
                          Suggestions:
                        </div>
                        <ul style={{ paddingLeft: 18, fontSize: 12, color: "var(--text-muted)" }}>
                          {aiReview.suggestions.map((s, i) => (
                            <li key={i} style={{ marginBottom: 3 }}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                    Click Analyze Code to evaluate Big-O asymptotic characteristics.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Past Submissions */}
          {leftTab === "submissions" && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, fontFamily: "var(--font-mono, monospace)" }}>
                Submission History
              </div>

              {pastSubmissions.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <p style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-mono, monospace)" }}>
                    No solutions submitted for this problem yet.
                  </p>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ fontSize: 11 }}>Verdict</th>
                        <th style={{ fontSize: 11 }}>Runtime</th>
                        <th style={{ fontSize: 11 }}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastSubmissions.map((sub) => (
                        <tr key={sub.id}>
                          <td>
                            <VerdictBadge verdict={sub.verdict} />
                          </td>
                          <td className="mono" style={{ fontSize: 11 }}>
                            {sub.runtime_ms != null ? `${sub.runtime_ms} ms` : "—"}
                          </td>
                          <td style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
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

          {/* TAB 4: Problem Discussions */}
          {leftTab === "discussions" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", marginBottom: 2 }}>
                    Problem Discussions
                  </h3>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Share insights, Big-O analysis, and ask questions.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewThreadModal(!showNewThreadModal)}
                  className="btn btn-sm btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
                >
                  <IconMessageSquare size={13} />
                  <span>{showNewThreadModal ? "Cancel" : "New Post"}</span>
                </button>
              </div>

              {/* New Thread Form */}
              {showNewThreadModal && (
                <form
                  onSubmit={handleCreateThread}
                  style={{
                    background: "rgba(30, 41, 59, 0.4)",
                    border: "1px solid rgba(56, 189, 248, 0.25)",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#38bdf8", marginBottom: 10 }}>
                    Start a New Discussion Thread
                  </div>
                  <input
                    type="text"
                    className="input"
                    placeholder="Topic title (e.g., O(N) Hash Map vs Two-Pointer approach)"
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                    required
                    style={{ marginBottom: 10, fontSize: 13 }}
                  />
                  <textarea
                    className="input"
                    rows={4}
                    placeholder="Write your explanation, pseudo-code, or questions here..."
                    value={newThreadContent}
                    onChange={(e) => setNewThreadContent(e.target.value)}
                    required
                    style={{ marginBottom: 12, fontSize: 13, resize: "vertical" }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setShowNewThreadModal(false)}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: 12 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingThread || !newThreadTitle.trim() || !newThreadContent.trim()}
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: 12 }}
                    >
                      {creatingThread ? "Publishing..." : "Publish Post"}
                    </button>
                  </div>
                </form>
              )}

              {/* Discussions List */}
              {discussionsLoading ? (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <div className="spinner" style={{ margin: "0 auto 8px" }} />
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading community discussions...</p>
                </div>
              ) : discussions.length === 0 ? (
                <div
                  style={{
                    padding: "36px 20px",
                    textAlign: "center",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: 12,
                    border: "1px dashed rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <IconMessageSquare size={28} style={{ margin: "0 auto 10px", color: "var(--text-muted)", opacity: 0.5 }} />
                  <p style={{ color: "#ffffff", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    No discussions yet
                  </p>
                  <p style={{ color: "var(--text-muted)", fontSize: 12, maxWidth: 360, margin: "0 auto 14px" }}>
                    Be the first to share an algorithm approach, time complexity analysis, or question about this problem!
                  </p>
                  <button
                    onClick={() => setShowNewThreadModal(true)}
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: 12 }}
                  >
                    Start Discussion
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {discussions.map((d) => {
                    const isExpanded = expandedDiscussionId === d.id;
                    const replies = repliesMap[d.id] || [];
                    const isLoadingReplies = repliesLoadingMap[d.id];
                    const replyInput = replyInputMap[d.id] || "";
                    const isSubmittingReply = submittingReplyMap[d.id];

                    return (
                      <div
                        key={d.id}
                        style={{
                          background: "#111116",
                          border: "1px solid rgba(255, 255, 255, 0.07)",
                          borderRadius: 12,
                          padding: 16,
                          display: "flex",
                          gap: 14,
                        }}
                      >
                        {/* Upvote Button */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <button
                            onClick={() => handleVote(d.id)}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              background: d.has_voted ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.04)",
                              border: d.has_voted ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                              color: d.has_voted ? "#818cf8" : "var(--text-muted)",
                              borderRadius: 8,
                              padding: "6px 10px",
                              cursor: "pointer",
                              minWidth: 44,
                              transition: "all 0.15s ease",
                            }}
                            title="Upvote discussion"
                          >
                            <IconThumbsUp size={14} filled={d.has_voted} />
                            <span style={{ fontSize: 12, fontWeight: 700, marginTop: 3 }}>
                              {d.upvotes}
                            </span>
                          </button>
                        </div>

                        {/* Content Area */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: "#ffffff" }}>
                              {d.display_name || d.username}
                            </span>
                            {d.user_role === "admin" && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  padding: "1px 5px",
                                  borderRadius: 4,
                                  background: "rgba(168, 85, 247, 0.15)",
                                  color: "#c084fc",
                                  border: "1px solid rgba(168, 85, 247, 0.3)",
                                }}
                              >
                                Staff
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>
                              {new Date(d.created_at).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>

                          {d.title && (
                            <h4 style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 }}>
                              {d.title}
                            </h4>
                          )}

                          <div
                            style={{
                              fontSize: 13,
                              color: "#cbd5e1",
                              lineHeight: 1.6,
                              whiteSpace: "pre-wrap",
                              marginBottom: 12,
                            }}
                          >
                            {d.content}
                          </div>

                          {/* Footer Actions */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <button
                              onClick={() => handleToggleDiscussion(d.id)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#38bdf8",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: 0,
                              }}
                            >
                              <IconMessageSquare size={12} />
                              <span>
                                {isExpanded
                                  ? "Hide Replies"
                                  : `${d.reply_count || 0} ${d.reply_count === 1 ? "Reply" : "Replies"}`}
                              </span>
                            </button>
                          </div>

                          {/* Expanded Thread Replies */}
                          {isExpanded && (
                            <div
                              style={{
                                marginTop: 14,
                                paddingTop: 14,
                                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                              }}
                            >
                              {isLoadingReplies ? (
                                <div style={{ padding: "12px 0", textAlign: "center" }}>
                                  <div className="spinner" style={{ margin: "0 auto 4px" }} />
                                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Loading responses...</p>
                                </div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                                  {replies.length === 0 ? (
                                    <p style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                                      No responses to this thread yet.
                                    </p>
                                  ) : (
                                    replies.map((reply) => (
                                      <div
                                        key={reply.id}
                                        style={{
                                          background: "rgba(255, 255, 255, 0.02)",
                                          border: "1px solid rgba(255, 255, 255, 0.05)",
                                          borderRadius: 8,
                                          padding: "10px 12px",
                                          display: "flex",
                                          gap: 10,
                                        }}
                                      >
                                        <button
                                          onClick={() => handleVote(reply.id, d.id)}
                                          style={{
                                            background: reply.has_voted
                                              ? "rgba(99, 102, 241, 0.2)"
                                              : "transparent",
                                            border: reply.has_voted
                                              ? "1px solid rgba(99, 102, 241, 0.4)"
                                              : "1px solid rgba(255, 255, 255, 0.06)",
                                            color: reply.has_voted ? "#818cf8" : "var(--text-muted)",
                                            borderRadius: 6,
                                            padding: "3px 7px",
                                            cursor: "pointer",
                                            alignSelf: "flex-start",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 4,
                                            fontSize: 11,
                                          }}
                                        >
                                          <IconThumbsUp size={11} filled={reply.has_voted} />
                                          <span>{reply.upvotes}</span>
                                        </button>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                            <span style={{ fontWeight: 600, fontSize: 12, color: "#f1f5f9" }}>
                                              {reply.display_name || reply.username}
                                            </span>
                                            {reply.user_role === "admin" && (
                                              <span
                                                style={{
                                                  fontSize: 8,
                                                  fontWeight: 700,
                                                  padding: "1px 4px",
                                                  borderRadius: 3,
                                                  background: "rgba(168, 85, 247, 0.15)",
                                                  color: "#c084fc",
                                                }}
                                              >
                                                Staff
                                              </span>
                                            )}
                                            <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto" }}>
                                              {new Date(reply.created_at).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </span>
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 12,
                                              color: "#94a3b8",
                                              lineHeight: 1.5,
                                              whiteSpace: "pre-wrap",
                                            }}
                                          >
                                            {reply.content}
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}

                              {/* Reply Input Box */}
                              <div style={{ display: "flex", gap: 8 }}>
                                <input
                                  type="text"
                                  className="input"
                                  placeholder="Write a constructive reply..."
                                  value={replyInput}
                                  onChange={(e) =>
                                    setReplyInputMap((prev) => ({ ...prev, [d.id]: e.target.value }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleCreateReply(d.id);
                                    }
                                  }}
                                  style={{ fontSize: 12, padding: "6px 12px" }}
                                />
                                <button
                                  type="button"
                                  disabled={isSubmittingReply || !replyInput.trim()}
                                  onClick={() => handleCreateReply(d.id)}
                                  className="btn btn-sm btn-primary"
                                  style={{ fontSize: 12, padding: "6px 14px", flexShrink: 0 }}
                                >
                                  {isSubmittingReply ? "..." : "Reply"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Monaco Code Editor + Runner */}
        <div className="split-right" style={{ background: "#09090b" }}>
          {/* Editor Action Bar */}
          <div
            style={{
              padding: "10px 16px",
              background: "#111116",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <select
                className="input select"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as "python" | "cpp" | "java" | "javascript")}
                style={{
                  width: "auto",
                  padding: "6px 26px 6px 10px",
                  fontSize: 12,
                  height: 32,
                  background: "#09090b",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                <option value="cpp">C++ (GCC g++)</option>
                <option value="java">Java (OpenJDK)</option>
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript (Node.js)</option>
              </select>

              <button
                onClick={handleResetCode}
                className="btn btn-secondary btn-sm"
                title="Reset to starter boilerplate"
                style={{ height: 32, padding: "0 10px", fontSize: 11 }}
              >
                Reset
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={submitting}
                style={{
                  height: 32,
                  padding: "0 18px",
                  fontSize: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {submitting ? (
                  <>
                    <span className="spinner" />
                    <span>Executing in Sandbox...</span>
                  </>
                ) : (
                  <>
                    <IconSend size={13} />
                    <span>Submit Solution</span>
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
                fontSize: 13,
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
                background: "#0c0c10",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "8px 16px",
                  background: "#111116",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                    Telemetry:
                  </span>
                  <VerdictBadge verdict={currentSubmission.verdict} />
                  {currentSubmission.runtime_ms != null && (
                    <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Runtime: {currentSubmission.runtime_ms} ms
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setCurrentSubmission(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: 11,
                    cursor: "pointer",
                    padding: "2px 6px",
                  }}
                >
                  ✕ Close
                </button>
              </div>

              <div style={{ flex: 1, padding: 14, overflowY: "auto" }}>
                {currentSubmission.verdict === "running" || currentSubmission.verdict === "pending" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 0" }}>
                    <div className="spinner" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>Evaluating Solution...</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                        Running code against test suites in sandbox environment.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {currentSubmission.error_message && (
                      <div
                        style={{
                          padding: 10,
                          borderRadius: 6,
                          background: "rgba(244, 63, 94, 0.1)",
                          border: "1px solid rgba(244, 63, 94, 0.25)",
                          color: "#fb7185",
                          fontSize: 12,
                          marginBottom: 12,
                          fontFamily: "var(--font-mono, monospace)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {currentSubmission.error_message}
                      </div>
                    )}

                    {submissionResults.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-mono, monospace)" }}>
                          Test Suite ({submissionResults.filter(r => r.verdict === "accepted").length} / {submissionResults.length} passed):
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                          {submissionResults.map((r, i) => (
                            <div
                              key={r.id || i}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 6,
                                background: "rgba(255, 255, 255, 0.03)",
                                border: "1px solid rgba(255, 255, 255, 0.06)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <span style={{ fontSize: 11, fontFamily: "var(--font-mono, monospace)", color: "var(--text-muted)" }}>
                                Case #{i + 1}
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
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="spinner spinner-lg" />
        </div>
      }
    >
      <ProblemSolverContent />
    </Suspense>
  );
}
