"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import UserNav from "@/components/UserNav";

interface SolvedLevel {
  solved: number;
  total: number;
}

interface ProgressStats {
  activityMap: Record<string, { count: number; accepted: number }>;
  currentStreak: number;
  longestStreak: number;
  solvedStats: {
    easy: SolvedLevel;
    medium: SolvedLevel;
    hard: SolvedLevel;
    totalSolved: number;
    totalProblems: number;
  };
  languageBreakdown: Record<string, number>;
  acceptanceRate: number;
  totalSubmissions: number;
}

interface BookmarkedProblem {
  bookmark_id: string;
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  bookmarked_at: string;
}

export default function ProgressDashboardPage() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkedProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number; accepted: number } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/user/progress").then((r) => r.json()),
      fetch("/api/bookmarks").then((r) => r.json()),
    ])
      .then(([progData, bookData]) => {
        if (progData.stats) setStats(progData.stats);
        if (bookData.bookmarks) setBookmarks(bookData.bookmarks);
      })
      .catch((err) => console.error("Error loading progress data:", err))
      .finally(() => setLoading(false));
  }, []);

  // Generate 52 weeks (364 days) of dates ending today
  const generateCalendarDays = () => {
    const days: { dateStr: string; dayOfWeek: number }[] = [];
    const today = new Date();
    // Start 52 weeks ago, aligned to previous Monday
    const start = new Date(today);
    start.setDate(today.getDate() - 52 * 7);

    for (let i = 0; i < 52 * 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({
        dateStr: d.toISOString().split("T")[0],
        dayOfWeek: d.getDay(),
      });
    }
    return days;
  };

  const getGreenDotColor = (count: number) => {
    if (!count || count === 0) return "rgba(255, 255, 255, 0.05)";
    if (count <= 2) return "#0e4429";
    if (count <= 5) return "#006d32";
    if (count <= 9) return "#26a641";
    return "#39d353";
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
        <UserNav />
        <div style={{ padding: "100px 0", textAlign: "center" }}>
          <div className="spinner spinner-lg" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)" }}>Loading your coding activity...</p>
        </div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();
  const totalSubmissionsInMap = stats
    ? Object.values(stats.activityMap).reduce((acc, curr) => acc + curr.count, 0)
    : 0;
  const activeDays = stats
    ? Object.values(stats.activityMap).filter((d) => d.count > 0).length
    : 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <UserNav />

      <main className="page-container">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span>📈</span> Progress Dashboard
            </h1>
            <p className="page-subtitle">
              Track your daily solving consistency, streaks, and problem completion rates.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/problems" className="btn btn-primary">
              🚀 Continue Practice
            </Link>
          </div>
        </div>

        {/* Top 4 Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 28 }}>
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <span>🔥</span> CURRENT STREAK
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#f59e0b" }}>
              {stats?.currentStreak || 0} <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}>days</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Longest: {stats?.longestStreak || 0} days
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <span>🎯</span> PROBLEMS SOLVED
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent-blue)" }}>
              {stats?.solvedStats.totalSolved || 0}
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}>
                {" "}/ {stats?.solvedStats.totalProblems || 0}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              {stats?.solvedStats.totalProblems
                ? Math.round(((stats.solvedStats.totalSolved) / stats.solvedStats.totalProblems) * 100)
                : 0}
              % Completion rate
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <span>⚡</span> ACCEPTANCE RATE
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent-green)" }}>
              {stats?.acceptanceRate || 0}%
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Across {stats?.totalSubmissions || 0} total submissions
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <span>⭐</span> BOOKMARKED QUESTIONS
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent-purple)" }}>
              {bookmarks.length}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Saved for targeted review
            </div>
          </div>
        </div>

        {/* LeetCode Green Dots Activity Heatmap */}
        <div className="glass-card" style={{ padding: 28, marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <span>🟩</span> {totalSubmissionsInMap} Submissions in the Last Year
              </h2>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Total Active Days: {activeDays} days
              </div>
            </div>

            {/* Hover Tooltip Indicator */}
            {hoveredDay ? (
              <div
                style={{
                  fontSize: 12,
                  padding: "4px 12px",
                  borderRadius: 6,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              >
                <strong>{hoveredDay.count}</strong> submissions ({hoveredDay.accepted} accepted) on {hoveredDay.date}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Hover over squares to inspect activity
              </div>
            )}
          </div>

          {/* Grid of Dots (52 columns x 7 rows) */}
          <div
            style={{
              overflowX: "auto",
              paddingBottom: 8,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateRows: "repeat(7, 12px)",
                gridAutoFlow: "column",
                gridAutoColumns: "12px",
                gap: 3,
                width: "fit-content",
              }}
            >
              {calendarDays.map((day) => {
                const activity = stats?.activityMap[day.dateStr];
                const count = activity?.count || 0;
                const accepted = activity?.accepted || 0;
                const bg = getGreenDotColor(count);

                return (
                  <div
                    key={day.dateStr}
                    onMouseEnter={() =>
                      setHoveredDay({ date: day.dateStr, count, accepted })
                    }
                    onMouseLeave={() => setHoveredDay(null)}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      backgroundColor: bg,
                      cursor: "pointer",
                      transition: "transform 0.1s ease",
                    }}
                    title={`${count} submissions on ${day.dateStr}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Heatmap Legend */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, marginTop: 12, fontSize: 11, color: "var(--text-muted)" }}>
            <span>Less</span>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(255, 255, 255, 0.05)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 2, background: "#0e4429" }} />
            <div style={{ width: 10, height: 10, borderRadius: 2, background: "#006d32" }} />
            <div style={{ width: 10, height: 10, borderRadius: 2, background: "#26a641" }} />
            <div style={{ width: 10, height: 10, borderRadius: 2, background: "#39d353" }} />
            <span>More</span>
          </div>
        </div>

        {/* 2-Column Split: Difficulty Breakdown & Language Breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, marginBottom: 28 }}>
          {/* Difficulty Breakdown */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              Difficulty Breakdown
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Easy */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "var(--accent-green)", fontWeight: 600 }}>Easy</span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {stats?.solvedStats.easy.solved || 0} / {stats?.solvedStats.easy.total || 0}
                  </span>
                </div>
                <div style={{ height: 8, background: "var(--bg-elevated)", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${
                        stats?.solvedStats.easy.total
                          ? ((stats.solvedStats.easy.solved / stats.solvedStats.easy.total) * 100)
                          : 0
                      }%`,
                      background: "var(--accent-green)",
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "var(--accent-amber)", fontWeight: 600 }}>Medium</span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {stats?.solvedStats.medium.solved || 0} / {stats?.solvedStats.medium.total || 0}
                  </span>
                </div>
                <div style={{ height: 8, background: "var(--bg-elevated)", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${
                        stats?.solvedStats.medium.total
                          ? ((stats.solvedStats.medium.solved / stats.solvedStats.medium.total) * 100)
                          : 0
                      }%`,
                      background: "var(--accent-amber)",
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>

              {/* Hard */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "var(--accent-red)", fontWeight: 600 }}>Hard</span>
                  <span style={{ color: "var(--text-muted)" }}>
                    {stats?.solvedStats.hard.solved || 0} / {stats?.solvedStats.hard.total || 0}
                  </span>
                </div>
                <div style={{ height: 8, background: "var(--bg-elevated)", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${
                        stats?.solvedStats.hard.total
                          ? ((stats.solvedStats.hard.solved / stats.solvedStats.hard.total) * 100)
                          : 0
                      }%`,
                      background: "var(--accent-red)",
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Languages Practice Distribution */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              Language Practice Stats
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🐍</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Python 3</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>CP & Data Structures</div>
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-blue)" }}>
                  {stats?.languageBreakdown.python || 0} solved
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>⚡</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>C++ (GCC)</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>High Performance & Graphs</div>
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-purple)" }}>
                  {stats?.languageBreakdown.cpp || 0} solved
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>📜</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>JavaScript (Node)</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Scripting & Algorithms</div>
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent-amber)" }}>
                  {stats?.languageBreakdown.javascript || 0} solved
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bookmarked Questions Section */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span>⭐</span> Bookmarked Questions ({bookmarks.length})
            </h2>
            <Link href="/problems" className="btn btn-secondary btn-sm" style={{ fontSize: 12 }}>
              Explore All Problems →
            </Link>
          </div>

          {bookmarks.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>
              <p>You haven&apos;t bookmarked any questions yet.</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>
                Click the ⭐ icon on any problem to pin it here for focused revision.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    background: "var(--bg-elevated)",
                    borderRadius: 10,
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <Link
                        href={`/problems/${bm.id}`}
                        style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", textDecoration: "none" }}
                      >
                        {bm.title}
                      </Link>
                      <span className={`badge badge-${bm.difficulty}`} style={{ fontSize: 11 }}>
                        {bm.difficulty}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Bookmarked on {new Date(bm.bookmarked_at).toLocaleDateString()}
                    </div>
                  </div>

                  <Link
                    href={`/problems/${bm.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ padding: "6px 14px", fontSize: 12 }}
                  >
                    Solve Now →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
