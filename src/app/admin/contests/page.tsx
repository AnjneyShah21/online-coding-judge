"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { IconTrophy, IconClock, IconCheck, IconChevronRight } from "@/components/Icons";

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

  // Adjust Schedule & Duration Modal State
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [timeModalLoading, setTimeModalLoading] = useState(false);
  const [timeModalError, setTimeModalError] = useState("");

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

  const handleTogglePublish = async (id: string, currentPublished: number) => {
    try {
      const res = await fetch("/api/contests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          is_published: currentPublished ? 0 : 1,
        }),
      });
      if (res.ok) {
        setContests(
          contests.map((c) => (c.id === id ? { ...c, is_published: currentPublished ? 0 : 1 } : c))
        );
      }
    } catch (err) {
      console.error("Failed to toggle publish status:", err);
    }
  };

  const handleOpenTimeModal = (contest: Contest) => {
    setEditingContest(contest);
    // Format to local datetime-local format
    const s = new Date(contest.start_time);
    const e = new Date(contest.end_time);
    const pad = (n: number) => String(n).padStart(2, "0");
    const toLocalISO = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setEditStartTime(toLocalISO(s));
    setEditEndTime(toLocalISO(e));
    setTimeModalError("");
    setShowTimeModal(true);
  };

  const handleQuickExtend = async (contestId: string, additionalMinutes: number) => {
    const contest = contests.find((c) => c.id === contestId);
    if (!contest) return;

    const currentEnd = new Date(contest.end_time).getTime();
    const now = Date.now();
    // If contest has already passed end time, extend from now; otherwise from current end time
    const baseTime = currentEnd > now ? currentEnd : now;
    const newEndTime = new Date(baseTime + additionalMinutes * 60 * 1000).toISOString();

    try {
      const res = await fetch("/api/contests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contestId,
          end_time: newEndTime,
        }),
      });
      if (res.ok) {
        setContests((prev) =>
          prev.map((c) => (c.id === contestId ? { ...c, end_time: newEndTime } : c))
        );
      }
    } catch (err) {
      console.error("Failed to extend contest duration:", err);
    }
  };

  const handleStartImmediately = async (contest: Contest) => {
    const now = new Date();
    const originalDurationMs = Math.max(
      new Date(contest.end_time).getTime() - new Date(contest.start_time).getTime(),
      60 * 60 * 1000
    );
    const newStartTime = now.toISOString();
    const newEndTime = new Date(now.getTime() + originalDurationMs).toISOString();

    try {
      const res = await fetch("/api/contests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contest.id,
          start_time: newStartTime,
          end_time: newEndTime,
        }),
      });
      if (res.ok) {
        setContests((prev) =>
          prev.map((c) =>
            c.id === contest.id ? { ...c, start_time: newStartTime, end_time: newEndTime } : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to start contest immediately:", err);
    }
  };

  const handleSaveTimeModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContest) return;

    if (!editStartTime || !editEndTime) {
      setTimeModalError("Both start and end time are required.");
      return;
    }

    const s = new Date(editStartTime).getTime();
    const eTime = new Date(editEndTime).getTime();
    if (eTime <= s) {
      setTimeModalError("Contest end time must be strictly after start time.");
      return;
    }

    setTimeModalLoading(true);
    setTimeModalError("");

    try {
      const res = await fetch("/api/contests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingContest.id,
          start_time: new Date(editStartTime).toISOString(),
          end_time: new Date(editEndTime).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTimeModalError(data.error || "Failed to update contest timing");
        return;
      }

      setContests((prev) =>
        prev.map((c) =>
          c.id === editingContest.id
            ? {
                ...c,
                start_time: new Date(editStartTime).toISOString(),
                end_time: new Date(editEndTime).toISOString(),
              }
            : c
        )
      );
      setShowTimeModal(false);
      setEditingContest(null);
    } catch {
      setTimeModalError("Network error saving contest time");
    } finally {
      setTimeModalLoading(false);
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
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <AdminSidebar />

      <main className="main-with-sidebar" style={{ maxWidth: 1200, paddingTop: 96, paddingBottom: 60, paddingLeft: 32, paddingRight: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="hero-pill" style={{ marginBottom: 12 }}>
              <span className="dot-indicator dot-indicator-amber" />
              <span>Contest Tournament Operations</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "#ffffff", marginBottom: 6 }}>
              Weekly Contests Management
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              Schedule competitive coding tournaments, attach score-weighted problems, and supervise real-time leaderboards.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="btn btn-primary"
            style={{ padding: "9px 18px", display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 8 }}
          >
            <IconTrophy size={15} />
            <span>Schedule Weekly Contest</span>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div className="spinner spinner-lg" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading tournament schedules...</p>
          </div>
        ) : contests.length === 0 ? (
          <div
            className="kokonut-card"
            style={{
              padding: 60,
              textAlign: "center",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ color: "#fbbf24", marginBottom: 16, display: "flex", justifyContent: "center" }}>
              <IconTrophy size={36} />
            </div>
            <h3 style={{ fontSize: 18, color: "#ffffff", fontWeight: 700, marginBottom: 8 }}>No Contests Scheduled Yet</h3>
            <p style={{ color: "var(--text-muted)", maxWidth: 460, margin: "0 auto 24px", fontSize: 13 }}>
              Weekly contests allow candidates to compete against time with strict sandboxed execution and real-time leaderboards.
            </p>
            <button onClick={handleOpenCreateModal} className="btn btn-primary">
              Schedule First Contest
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {contests.map((c) => {
              const status = getContestStatus(c.start_time, c.end_time);
              return (
                <div
                  key={c.id}
                  className="kokonut-card"
                  style={{
                    padding: 24,
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 20,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <h2 style={{ fontSize: 17, fontWeight: 700, color: "#ffffff", margin: 0 }}>
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
                          fontFamily: "var(--font-mono, monospace)",
                        }}
                      >
                        {status.label}
                      </span>
                    </div>

                    <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 12px", lineHeight: 1.5 }}>
                      {c.description || "No description provided."}
                    </p>

                    <div style={{ display: "flex", gap: 18, fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap", fontFamily: "var(--font-mono, monospace)" }}>
                      <span>
                        <strong style={{ color: "var(--text-secondary)" }}>Start:</strong> {new Date(c.start_time).toLocaleString()}
                      </span>
                      <span>
                        <strong style={{ color: "var(--text-secondary)" }}>End:</strong> {new Date(c.end_time).toLocaleString()}
                      </span>
                      <span>
                        <strong style={{ color: "var(--text-secondary)" }}>Problems:</strong> {c.problem_count || 0}
                      </span>
                      <span>
                        <strong style={{ color: "var(--text-secondary)" }}>Registered:</strong> {c.participant_count || 0}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {/* Start Now button for upcoming contests */}
                    {status.label === "Upcoming" && (
                      <button
                        onClick={() => handleStartImmediately(c)}
                        className="btn btn-sm"
                        style={{
                          background: "rgba(16, 185, 129, 0.15)",
                          border: "1px solid rgba(16, 185, 129, 0.35)",
                          color: "#34d399",
                          fontSize: 12,
                          padding: "5px 12px",
                        }}
                        title="Start this tournament immediately with current duration"
                      >
                        Start Now
                      </button>
                    )}

                    {/* Quick duration extension chips for live contests */}
                    {status.label === "● LIVE NOW" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button
                          onClick={() => handleQuickExtend(c.id, 15)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 11, padding: "4px 8px", color: "#a5b4fc" }}
                          title="Extend contest by 15 minutes"
                        >
                          +15m
                        </button>
                        <button
                          onClick={() => handleQuickExtend(c.id, 30)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 11, padding: "4px 8px", color: "#a5b4fc" }}
                          title="Extend contest by 30 minutes"
                        >
                          +30m
                        </button>
                      </div>
                    )}

                    {/* Set Schedule & Timing Modal Trigger */}
                    <button
                      onClick={() => handleOpenTimeModal(c)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 12, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 5 }}
                    >
                      <IconClock size={13} />
                      <span>Set Timing</span>
                    </button>

                    <button
                      onClick={() => handleTogglePublish(c.id, c.is_published)}
                      className={`btn btn-sm ${c.is_published ? "btn-secondary" : "btn-primary"}`}
                      style={{ fontSize: 12, padding: "5px 12px" }}
                      title={c.is_published ? "Make contest private to creator only" : "Make contest public to all players"}
                    >
                      {c.is_published ? "Unpublish" : "Publish Live"}
                    </button>

                    <a
                      href={`/contests`}
                      target="_blank"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <span>Arena</span>
                      <IconChevronRight size={12} />
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
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 20,
            }}
          >
            <div
              className="kokonut-card"
              style={{
                width: "100%",
                maxWidth: 680,
                maxHeight: "90vh",
                overflowY: "auto",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
                padding: 28,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", margin: 0 }}>
                  Schedule New Weekly Contest
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 12, padding: "4px 10px" }}
                >
                  Close
                </button>
              </div>

              {error && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "rgba(244, 63, 94, 0.1)",
                    border: "1px solid rgba(244, 63, 94, 0.2)",
                    color: "#fb7185",
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateContest}>
                <div className="form-group" style={{ marginBottom: 16 }}>
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

                <div className="form-group" style={{ marginBottom: 16 }}>
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
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 8,
                      background: "rgba(0, 0, 0, 0.3)",
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
                            borderRadius: 6,
                            background: isSelected ? "rgba(59, 130, 246, 0.1)" : "transparent",
                            border: `1px solid ${isSelected ? "rgba(59, 130, 246, 0.3)" : "rgba(255,255,255,0.04)"}`,
                          }}
                        >
                          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleProblem(prob.id)}
                            />
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>{prob.title}</span>
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
                    className="btn btn-primary"
                    disabled={createLoading}
                  >
                    {createLoading ? <span className="spinner" /> : "Publish Contest"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Adjust Contest Timing & Duration Modal */}
        {showTimeModal && editingContest && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 20,
            }}
          >
            <div
              className="kokonut-card"
              style={{
                width: "100%",
                maxWidth: 540,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
                padding: 28,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", margin: 0 }}>
                    Adjust Contest Timing & Duration
                  </h2>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    {editingContest.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTimeModal(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 12, padding: "4px 10px" }}
                >
                  ✕
                </button>
              </div>

              {timeModalError && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#f87171",
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  {timeModalError}
                </div>
              )}

              {/* Quick Duration Presets from Now */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 8, fontFamily: "var(--font-mono, monospace)" }}>
                  Quick Start & Duration Presets (From Now)
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[30, 45, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const pad = (n: number) => String(n).padStart(2, "0");
                        const toLocalISO = (d: Date) =>
                          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                        const start = toLocalISO(now);
                        const end = toLocalISO(new Date(now.getTime() + mins * 60 * 1000));
                        setEditStartTime(start);
                        setEditEndTime(end);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 12, padding: "5px 12px" }}
                    >
                      {mins} mins
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const pad = (n: number) => String(n).padStart(2, "0");
                      const toLocalISO = (d: Date) =>
                        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                      const curEnd = new Date(editEndTime).getTime();
                      const base = isNaN(curEnd) || curEnd < Date.now() ? Date.now() : curEnd;
                      setEditEndTime(toLocalISO(new Date(base + 30 * 60 * 1000)));
                    }}
                    className="btn btn-sm"
                    style={{ fontSize: 12, padding: "5px 12px", background: "rgba(99, 102, 241, 0.15)", color: "#a5b4fc", border: "1px solid rgba(99, 102, 241, 0.3)" }}
                  >
                    +30m to End
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveTimeModal}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      className="input"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                      End Time (Deadline)
                    </label>
                    <input
                      type="datetime-local"
                      className="input"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setShowTimeModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={timeModalLoading}
                  >
                    {timeModalLoading ? <span className="spinner" /> : "Save New Schedule"}
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

