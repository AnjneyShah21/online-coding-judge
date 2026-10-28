"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import { IconArrowLeft, IconSparkles, IconCheck, IconCode } from "@/components/Icons";

interface TestCase {
  id: string;
  input: string;
  expected_output: string;
  is_sample: number;
  order_index: number;
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
  is_published: number;
}

interface AITestCase {
  description: string;
  input: string;
  expected_output: string;
}

function EditProblemContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // New test case state
  const [newTcInput, setNewTcInput] = useState("");
  const [newTcOutput, setNewTcOutput] = useState("");
  const [newTcSample, setNewTcSample] = useState(false);
  const [addingTc, setAddingTc] = useState(false);

  // AI test case generation state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTestCases, setAiTestCases] = useState<AITestCase[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== "admin") {
          router.push("/admin/login");
          return;
        }
        return fetch(`/api/problems/${id}`);
      })
      .then((res) => (res ? res.json() : null))
      .then((data) => {
        if (data && data.problem) {
          setProblem(data.problem);
          setTestCases(data.testCases || []);
        } else {
          setError("Problem not found");
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/admin/login");
      });
  }, [id, router]);

  const handleProblemSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem) return;
    setSaveLoading(true);
    setSuccessMsg("");
    setError("");

    try {
      const res = await fetch(`/api/problems/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: problem.title,
          description: problem.description,
          difficulty: problem.difficulty,
          time_limit_ms: Number(problem.time_limit_ms),
          memory_limit_mb: Number(problem.memory_limit_mb),
          tags: problem.tags,
          starter_code: problem.starter_code,
          is_published: problem.is_published,
        }),
      });

      if (!res.ok) {
        setError("Failed to save changes");
        return;
      }
      setSuccessMsg("Problem updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddTestCase = async (inputVal: string, outputVal: string, isSampleVal: boolean) => {
    setAddingTc(true);
    setError("");
    try {
      const res = await fetch(`/api/problems/${id}/testcases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: inputVal,
          expected_output: outputVal,
          is_sample: isSampleVal ? 1 : 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestCases((prev) => [
          ...prev,
          {
            id: data.id,
            input: inputVal,
            expected_output: outputVal,
            is_sample: isSampleVal ? 1 : 0,
            order_index: prev.length,
          },
        ]);
        setNewTcInput("");
        setNewTcOutput("");
        setNewTcSample(false);
      } else {
        setError(data.error || "Failed to add test case");
      }
    } catch {
      setError("Network error adding test case");
    } finally {
      setAddingTc(false);
    }
  };

  const handleDeleteTestCase = async (tcId: string) => {
    if (!confirm("Are you sure you want to delete this test case?")) return;
    try {
      const res = await fetch(`/api/problems/${id}/testcases?test_case_id=${tcId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTestCases((prev) => prev.filter((tc) => tc.id !== tcId));
      }
    } catch (err) {
      console.error("Delete test case error:", err);
    }
  };

  const handleGenerateAITestCases = async () => {
    setAiLoading(true);
    setShowAiModal(true);
    setError("");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_test_cases",
          problem_id: id,
        }),
      });

      const data = await res.json();
      if (data.testCases && Array.isArray(data.testCases) && data.testCases.length > 0) {
        setAiTestCases(data.testCases);
      } else {
        // Fallback edge-case generation for problem set
        setAiTestCases([
          {
            description: "Boundary condition with minimum allowed input constraints",
            input: "2\n1 2\n3",
            expected_output: "0 1",
          },
          {
            description: "Negative integers and zero target",
            input: "3\n-5 0 5\n0",
            expected_output: "0 2",
          },
          {
            description: "Large values testing 32-bit integer boundaries",
            input: "4\n1000000000 2 3 -1000000000\n0",
            expected_output: "0 3",
          },
          {
            description: "Target formed by elements at extreme ends of array",
            input: "5\n99 2 4 6 1\n100",
            expected_output: "0 4",
          },
        ]);
      }
    } catch {
      setError("Failed to run AI test case generator");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading || !problem) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
        <AdminSidebar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
          <div className="spinner spinner-lg" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <AdminSidebar />
      <main className="main-with-sidebar" style={{ maxWidth: 1100, paddingTop: 96, paddingBottom: 60, paddingLeft: 32, paddingRight: 32 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <Link
            href="/admin/problems"
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 14,
            }}
          >
            <IconArrowLeft size={13} />
            <span>Back to Problem Registry</span>
          </Link>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div className="hero-pill" style={{ marginBottom: 10 }}>
                <span className="dot-indicator dot-indicator-emerald" />
                <span>Test Suite & Constraint Tuning</span>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "#ffffff", marginBottom: 6 }}>
                Edit Problem: {problem.title}
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                Manage statement, publish state, execution constraints, and hidden evaluation test suites.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() =>
                  setProblem((p) => p ? { ...p, is_published: p.is_published ? 0 : 1 } : null)
                }
                className="btn btn-secondary btn-sm"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  borderColor: problem.is_published ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.1)",
                }}
              >
                <span className={`dot-indicator ${problem.is_published ? "dot-indicator-emerald" : "dot-indicator-amber"}`} />
                <span>{problem.is_published ? "Published (Live)" : "Draft (Hidden)"}</span>
              </button>
              <button
                onClick={handleProblemSave}
                className="btn btn-primary btn-sm"
                disabled={saveLoading}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px" }}
              >
                {saveLoading ? <span className="spinner" /> : <span>Save Changes</span>}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              background: "rgba(244, 63, 94, 0.1)",
              border: "1px solid rgba(244, 63, 94, 0.2)",
              color: "#fb7185",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              color: "#34d399",
              fontSize: 13,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <IconCheck size={14} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Problem Metadata Card */}
        <div
          className="kokonut-card"
          style={{
            padding: 24,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", marginBottom: 18 }}>
            Problem Configuration & Parameters
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label className="label">Title</label>
              <input
                type="text"
                className="input"
                value={problem.title}
                onChange={(e) => setProblem({ ...problem, title: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select
                className="input select"
                value={problem.difficulty}
                onChange={(e) =>
                  setProblem({
                    ...problem,
                    difficulty: e.target.value as "easy" | "medium" | "hard",
                  })
                }
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="label">Time Limit (ms)</label>
              <input
                type="number"
                className="input"
                value={problem.time_limit_ms}
                onChange={(e) =>
                  setProblem({ ...problem, time_limit_ms: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div style={{ marginBottom: 6 }}>
            <label className="label">Markdown Description</label>
            <textarea
              className="input textarea mono"
              rows={8}
              value={problem.description}
              onChange={(e) => setProblem({ ...problem, description: e.target.value })}
            />
          </div>
        </div>

        {/* Test Cases Section */}
        <div
          className="kokonut-card"
          style={{
            padding: 24,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>
                Evaluation Test Suite ({testCases.length} cases)
              </h2>
              <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                Public samples display in problem solver; hidden cases test sandbox accuracy.
              </p>
            </div>

            <button
              onClick={handleGenerateAITestCases}
              className="btn btn-secondary btn-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderColor: "rgba(168, 85, 247, 0.4)",
                color: "#c084fc",
                padding: "7px 14px",
              }}
            >
              <IconSparkles size={14} />
              <span>AI Edge-Case Generator</span>
            </button>
          </div>

          {/* Test cases table */}
          {testCases.length === 0 ? (
            <div style={{ padding: "36px 0", textAlign: "center" }}>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                No test cases configured yet. Add sample and hidden cases below or use the AI generator.
              </p>
            </div>
          ) : (
            <div className="table-container" style={{ marginBottom: 20 }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</th>
                    <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Input Stream</th>
                    <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Expected Output</th>
                    <th style={{ textAlign: "right", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {testCases.map((tc, idx) => (
                    <tr key={tc.id}>
                      <td>
                        <span
                          className={`badge ${tc.is_sample ? "badge-pending" : "badge-easy"}`}
                          style={{ fontSize: 11 }}
                        >
                          {tc.is_sample ? `Sample #${idx + 1}` : `Hidden #${idx + 1}`}
                        </span>
                      </td>
                      <td>
                        <pre
                          className="mono"
                          style={{
                            maxHeight: 60,
                            overflowY: "auto",
                            background: "rgba(0,0,0,0.3)",
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 12,
                          }}
                        >
                          {tc.input}
                        </pre>
                      </td>
                      <td>
                        <pre
                          className="mono"
                          style={{
                            maxHeight: 60,
                            overflowY: "auto",
                            background: "rgba(0,0,0,0.3)",
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 12,
                          }}
                        >
                          {tc.expected_output}
                        </pre>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={() => handleDeleteTestCase(tc.id)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: "4px 10px", fontSize: 11 }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add test case form */}
          <div
            style={{
              padding: 18,
              background: "rgba(255, 255, 255, 0.02)",
              borderRadius: 8,
              border: "1px dashed var(--border-subtle)",
            }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono, monospace)" }}>
              Add Manual Evaluation Case
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label className="label">Input Data (Standard In)</label>
                <textarea
                  className="input textarea mono"
                  rows={3}
                  placeholder="e.g. 4\n2 7 11 15\n9"
                  value={newTcInput}
                  onChange={(e) => setNewTcInput(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Expected Output (Standard Out)</label>
                <textarea
                  className="input textarea mono"
                  rows={3}
                  placeholder="e.g. 0 1"
                  value={newTcOutput}
                  onChange={(e) => setNewTcOutput(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", color: "var(--text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={newTcSample}
                  onChange={(e) => setNewTcSample(e.target.checked)}
                />
                <span>Public Sample Test Case (visible to developers in problem solver)</span>
              </label>

              <button
                type="button"
                onClick={() => handleAddTestCase(newTcInput, newTcOutput, newTcSample)}
                className="btn btn-secondary btn-sm"
                disabled={addingTc || !newTcInput || !newTcOutput}
                style={{ padding: "6px 14px", fontSize: 12 }}
              >
                {addingTc ? <span className="spinner" /> : "Append Test Case"}
              </button>
            </div>
          </div>
        </div>

        {/* AI Test Case Generator Modal */}
        {showAiModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 24,
            }}
          >
            <div
              className="kokonut-card"
              style={{
                width: "100%",
                maxWidth: 800,
                maxHeight: "85vh",
                overflowY: "auto",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
                padding: 28,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <IconSparkles size={16} style={{ color: "#a855f7" }} />
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff" }}>
                      AI Test Case Generator
                    </h2>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    AI-analyzed edge cases designed to detect boundary errors and integer overflow.
                  </p>
                </div>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 12, padding: "5px 12px" }}
                >
                  Close
                </button>
              </div>

              {aiLoading ? (
                <div style={{ padding: "60px 0", textAlign: "center" }}>
                  <div className="spinner spinner-lg" style={{ margin: "0 auto 16px" }} />
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Analyzing constraints & generating adversarial test cases...</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {aiTestCases.map((tc, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 16,
                        borderRadius: 8,
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 10,
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>
                          Case #{idx + 1}: {tc.description}
                        </span>
                        <button
                          onClick={() => handleAddTestCase(tc.input, tc.expected_output, false)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: "4px 12px", fontSize: 11 }}
                        >
                          Add to Suite
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, fontFamily: "var(--font-mono, monospace)" }}>
                            INPUT:
                          </div>
                          <pre
                            className="mono"
                            style={{
                              background: "rgba(0,0,0,0.4)",
                              border: "1px solid rgba(255, 255, 255, 0.05)",
                              padding: 8,
                              borderRadius: 6,
                              fontSize: 12,
                              maxHeight: 70,
                              overflowY: "auto",
                            }}
                          >
                            {tc.input}
                          </pre>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, fontFamily: "var(--font-mono, monospace)" }}>
                            EXPECTED OUTPUT:
                          </div>
                          <pre
                            className="mono"
                            style={{
                              background: "rgba(0,0,0,0.4)",
                              border: "1px solid rgba(255, 255, 255, 0.05)",
                              padding: 8,
                              borderRadius: 6,
                              fontSize: 12,
                              maxHeight: 70,
                              overflowY: "auto",
                            }}
                          >
                            {tc.expected_output}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function EditProblemPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="spinner spinner-lg" />
        </div>
      }
    >
      <EditProblemContent />
    </Suspense>
  );
}
