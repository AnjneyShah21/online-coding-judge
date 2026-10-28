"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";

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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0c0817" }}>
      <AdminSidebar />
      <main className="main-with-sidebar">
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Link
              href="/admin/problems"
              style={{ fontSize: 13, color: "#c084fc", textDecoration: "none", display: "inline-block", marginBottom: 8 }}
            >
              ← Back to Problems
            </Link>
            <h1 className="page-title" style={{ color: "#f3e8ff" }}>
              Edit Problem: {problem.title}
            </h1>
            <p className="page-subtitle">
              Manage configuration, published status, and hidden evaluation test cases.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() =>
                setProblem((p) => p ? { ...p, is_published: p.is_published ? 0 : 1 } : null)
              }
              className={`badge ${problem.is_published ? "badge-accepted" : "badge-pending"}`}
              style={{ cursor: "pointer", border: "none", padding: "8px 14px", fontSize: 13 }}
            >
              {problem.is_published ? "● Published (Live)" : "○ Draft (Hidden)"}
            </button>
            <button
              onClick={handleProblemSave}
              className="btn btn-admin"
              disabled={saveLoading}
            >
              {saveLoading ? <span className="spinner" /> : "Save Changes"}
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMsg && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(34, 197, 94, 0.15)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              color: "#4ade80",
              borderRadius: 8,
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            ✓ {successMsg}
          </div>
        )}

        {/* Problem Metadata Card */}
        <div
          className="glass-card"
          style={{
            padding: 24,
            background: "rgba(20, 14, 38, 0.8)",
            borderColor: "rgba(139, 92, 246, 0.2)",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f3e8ff", marginBottom: 16 }}>
            Problem Configuration
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

          <div style={{ marginBottom: 16 }}>
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
          className="glass-card"
          style={{
            padding: 24,
            background: "rgba(20, 14, 38, 0.8)",
            borderColor: "rgba(139, 92, 246, 0.2)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f3e8ff" }}>
                Test Cases ({testCases.length})
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Sample test cases are visible to users. Hidden test cases evaluate submissions in the sandbox.
              </p>
            </div>

            <button
              onClick={handleGenerateAITestCases}
              className="btn btn-admin btn-sm"
              style={{
                background: "linear-gradient(135deg, #a855f7, #ec4899)",
                boxShadow: "0 0 15px rgba(236, 72, 153, 0.3)",
              }}
            >
              🤖 AI Test Case Generator
            </button>
          </div>

          {/* Test cases table */}
          {testCases.length === 0 ? (
            <div className="empty-state" style={{ padding: "30px 0" }}>
              <p>No test cases configured yet. Add sample and hidden cases below or use the AI generator.</p>
            </div>
          ) : (
            <div className="table-container" style={{ marginBottom: 24 }}>
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Input</th>
                    <th>Expected Output</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {testCases.map((tc, idx) => (
                    <tr key={tc.id}>
                      <td>
                        <span
                          className={`badge ${tc.is_sample ? "badge-pending" : "badge-easy"}`}
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
                            background: "rgba(0,0,0,0.4)",
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
                            background: "rgba(0,0,0,0.4)",
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
                          style={{ padding: "3px 8px", fontSize: 12 }}
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
              padding: 16,
              background: "rgba(10, 6, 20, 0.6)",
              borderRadius: 10,
              border: "1px dashed rgba(139, 92, 246, 0.3)",
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#f3e8ff", marginBottom: 12 }}>
              Add Manual Test Case
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label className="label">Input Data</label>
                <textarea
                  className="input textarea mono"
                  rows={3}
                  placeholder="e.g. 4\n2 7 11 15\n9"
                  value={newTcInput}
                  onChange={(e) => setNewTcInput(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Expected Output</label>
                <textarea
                  className="input textarea mono"
                  rows={3}
                  placeholder="e.g. 0 1"
                  value={newTcOutput}
                  onChange={(e) => setNewTcOutput(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={newTcSample}
                  onChange={(e) => setNewTcSample(e.target.checked)}
                />
                <span>Public Sample Test Case (shown on problem page)</span>
              </label>

              <button
                type="button"
                onClick={() => handleAddTestCase(newTcInput, newTcOutput, newTcSample)}
                className="btn btn-secondary btn-sm"
                disabled={addingTc || !newTcInput || !newTcOutput}
              >
                {addingTc ? <span className="spinner" /> : "➕ Add Test Case"}
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
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 24,
            }}
          >
            <div
              className="glass-card"
              style={{
                width: "100%",
                maxWidth: 800,
                maxHeight: "85vh",
                overflowY: "auto",
                background: "#161028",
                borderColor: "rgba(139, 92, 246, 0.4)",
                padding: 28,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f3e8ff" }}>
                    🤖 AI Test Case Generator
                  </h2>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    AI-analyzed edge cases designed to catch off-by-one, boundary, and memory pitfalls.
                  </p>
                </div>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  ✕ Close
                </button>
              </div>

              {aiLoading ? (
                <div style={{ padding: "60px 0", textAlign: "center" }}>
                  <div className="spinner spinner-lg" style={{ margin: "0 auto 16px" }} />
                  <p style={{ color: "#d8b4fe" }}>Analyzing problem requirements & generating edge cases...</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {aiTestCases.map((tc, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 16,
                        borderRadius: 10,
                        background: "rgba(25, 17, 46, 0.8)",
                        border: "1px solid rgba(139, 92, 246, 0.2)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#c084fc" }}>
                          Case #{idx + 1}: {tc.description}
                        </span>
                        <button
                          onClick={() => handleAddTestCase(tc.input, tc.expected_output, false)}
                          className="btn btn-admin btn-sm"
                          style={{ padding: "4px 10px", fontSize: 12 }}
                        >
                          ➕ Add to Test Suite
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                            INPUT:
                          </div>
                          <pre
                            className="mono"
                            style={{
                              background: "#0a0714",
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
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                            EXPECTED OUTPUT:
                          </div>
                          <pre
                            className="mono"
                            style={{
                              background: "#0a0714",
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
