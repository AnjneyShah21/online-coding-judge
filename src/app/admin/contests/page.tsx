"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

interface Problem {
  id: string;
  title: string;
  difficulty: string;
}

interface Contest {
  id: string;
  title: string;
  slug: string;
  description: string;
  start_time: string;
  end_time: string;
  is_published: number;
  problem_count?: number;
  participant_count?: number;
}

export default function AdminContestsPage() {
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [availableProblems, setAvailableProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState("");

  // New Contest Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  const [problemScores, setProblemScores] = useState<Record<string, number>>({});

  const fetchData = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (!authData.user || authData.user.role !== "admin") {
        router.push("/admin/login");
        return;
      }

      const [contestsRes, problemsRes] = await Promise.all([
        fetch("/api/contests"),
        fetch("/api/problems"),
      ]);

      const contestsData = await contestsRes.json();
      const problemsData = await problemsRes.json();

      if (contestsData.contests) setContests(contestsData.contests);
      if (problemsData.problems) setAvailableProblems(problemsData.problems);
    } catch {
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const handleOpenCreateModal = () => {
    const now = new Date();
    // Default start time: upcoming Saturday 8:00 PM
    const nextStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextEnd = new Date(nextStart.getTime() + 2 * 60 * 60 * 1000); // 2 hour duration

    setTitle(`Weekly Contest #${contests.length + 1}`);
    setDescription("Compete with fellow coders against time. Solve all challenges with optimal time and memory complexity.");
    setStartTime(nextStart.toISOString().slice(0, 16));
    setEndTime(nextEnd.toISOString().slice(0, 16));
    setSelectedProblemIds([]);
    setProblemScores({});
    setError("");
    setShowModal(true);
  };

  const handleToggleProblem = (probId: string) => {
    if (selectedProblemIds.includes(probId)) {
      setSelectedProblemIds(selectedProblemIds.filter((id) => id !== probId));
    } else {
      setSelectedProblemIds([...selectedProblemIds, probId]);
      if (!problemScores[probId]) {
        setProblemScores((prev) => ({ ...prev, [probId]: 100 }));
      }
    }
  };

  const handleScoreChange = (probId: string, score: number) => {
    setProblemScores((prev) => ({ ...prev, [probId]: score }));
  };

  const handleCreateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) {
      setError("Please fill all required fields");
      return;
    }

    if (new Date(endTime) <= new Date(startTime)) {
      setError("End time must be after start time");
      return;
    }

    setCreateLoading(true);
    setError("");

    try {
      const problemsPayload = selectedProblemIds.map((pId) => ({
        problem_id: pId,
        score: problemScores[pId] || 100,
      }));

      const res = await fetch("/api/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          problems: problemsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create contest");
        return;
      }

      setShowModal(false);
      fetchData();
    } catch {
      setError("Network error creating contest");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteContest = async (id: string, contestTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${contestTitle}"?`)) return;

    try {
      const res = await fetch(`/api/contests?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setContests(contests.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete contest:", err);
    }
  };

  const getContestStatus = (start: string, end: string) => {
    const now = new Date().getTime();
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();

    if (now < s) {
      return { label: "Upcoming", color: "var(--accent-blue)", bg: "var(--accent-blue-soft)" };
    } else if (now >= s && now <= e) {
      return { label: "● LIVE NOW", color: "var(--accent-green)", bg: "rgba(34, 197, 94, 0.15)" };
    } else {
      return { label: "Completed", color: "var(--text-muted)", bg: "var(--bg-elevated)" };
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0c0817" }}>
      <AdminSidebar />

      <main className="main-with-sidebar">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 className="page-title" style={{ color: "#f3e8ff", display: "flex", alignItems: "center", gap: 10 }}>
              <span>🏆</span> Weekly Contests Management
            </h1>
            <p className="page-subtitle">
              Schedule competitive coding contests, assign score-weighted problems, and inspect live participant rankings.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="btn btn-admin"
            style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: 8 }}
          >
            <span>➕</span> Schedule Weekly Contest
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div className="spinner spinner-lg" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "#a855f7" }}>Loading contest schedules...</p>
          </div>
        ) : contests.length === 0 ? (
          <div
            className="glass-card"
            style={{
              padding: 60,
              textAlign: "center",
              background: "rgba(20, 14, 38, 0.6)",
              borderColor: "rgba(139, 92, 246, 0.2)",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
            <h3 style={{ fontSize: 20, color: "#f3e8ff", marginBottom: 8 }}>No Contests Scheduled Yet</h3>
            <p style={{ color: "var(--text-muted)", maxWidth: 460, margin: "0 auto 24px" }}>
              Weekly contests allow candidates to compete against time with strict sandboxed execution and real-time leaderboards.
            </p>
            <button onClick={handleOpenCreateModal} className="btn btn-admin">
              Create First Contest
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {contests.map((c) => {
              const status = getContestStatus(c.start_time, c.end_time);
              return (
                <div
                  key={c.id}
                  className="glass-card"
                  style={{
                    padding: 24,
                    background: "rgba(20, 14, 38, 0.8)",
                    border: "1px solid rgba(139, 92, 246, 0.2)",
                    borderRadius: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 20,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f3e8ff", margin: 0 }}>
                        {c.title}
                      </h2>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: status.bg,
                          color: status.color,
                        }}
                      >
                        {status.label}
                      </span>
                    </div>

                    <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
                      {c.description || "No description provided."}
                    </p>

                    <div style={{ display: "flex", gap: 20, fontSize: 12, color: "var(--text-secondary)", flexWrap: "wrap" }}>
                      <span>
                        📅 <strong>Start:</strong> {new Date(c.start_time).toLocaleString()}
                      </span>
                      <span>
                        🏁 <strong>End:</strong> {new Date(c.end_time).toLocaleString()}
                      </span>
                      <span>
                        📝 <strong>Problems:</strong> {c.problem_count || 0}
                      </span>
                      <span>
                        👥 <strong>Registered:</strong> {c.participant_count || 0}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <a
                      href={`/contests`}
                      target="_blank"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 12, borderColor: "rgba(139, 92, 246, 0.3)" }}
                    >
                      View Live ↗
                    </a>
                    <button
                      onClick={() => handleDeleteContest(c.id, c.title)}
                      className="btn btn-danger btn-sm"
                      style={{ fontSize: 12 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Contest Modal */}
        {showModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 20,
            }}
          >
            <div
              className="glass-card"
              style={{
                width: "100%",
                maxWidth: 680,
                maxHeight: "90vh",
                overflowY: "auto",
                background: "#140e26",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                borderRadius: 18,
                padding: 28,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f3e8ff", margin: 0 }}>
                  Schedule New Weekly Contest
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  ✕
                </button>
              </div>

              {error && <div className="error-message" style={{ marginBottom: 16 }}>{error}</div>}

              <form onSubmit={handleCreateContest}>
                <div className="form-group">
                  <label className="label">Contest Title</label>
                  <input
                    type="text"
                    className="input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Weekly Contest #42"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Description / Instructions</label>
                  <textarea
                    className="input textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div>
                    <label className="label">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      className="input"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">End Date & Time</label>
                    <input
                      type="datetime-local"
                      className="input"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Problem Selection */}
                <div style={{ marginBottom: 20 }}>
                  <label className="label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Select Contest Problems ({selectedProblemIds.length} selected)</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Assign point score for each problem
                    </span>
                  </label>

                  <div
                    style={{
                      maxHeight: 220,
                      overflowY: "auto",
                      border: "1px solid rgba(139, 92, 246, 0.2)",
                      borderRadius: 10,
                      background: "rgba(10, 6, 20, 0.8)",
                      padding: 10,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {availableProblems.map((prob) => {
                      const isSelected = selectedProblemIds.includes(prob.id);
                      return (
                        <div
                          key={prob.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            borderRadius: 8,
                            background: isSelected ? "rgba(139, 92, 246, 0.15)" : "transparent",
                            border: `1px solid ${isSelected ? "rgba(139, 92, 246, 0.4)" : "rgba(255,255,255,0.05)"}`,
                          }}
                        >
                          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleProblem(prob.id)}
                            />
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#f3e8ff" }}>{prob.title}</span>
                            <span className={`badge badge-${prob.difficulty}`} style={{ fontSize: 10 }}>
                              {prob.difficulty}
                            </span>
                          </label>

                          {isSelected && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Points:</span>
                              <input
                                type="number"
                                className="input"
                                style={{ width: 70, padding: "4px 8px", fontSize: 12 }}
                                value={problemScores[prob.id] || 100}
                                onChange={(e) => handleScoreChange(prob.id, Number(e.target.value))}
                                min={10}
                                step={10}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-admin"
                    disabled={createLoading}
                  >
                    {createLoading ? <span className="spinner" /> : "Publish Contest"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
