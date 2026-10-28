"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import UserNav from "@/components/UserNav";
import {
  IconChart,
  IconFlame,
  IconCheck,
  IconBookmark,
  IconChevronRight,
  IconClock,
  IconCode,
} from "@/components/Icons";

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number; accepted: number } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/user/progress").then((r) => r.json()),
      fetch("/api/bookmarks").then((r) => r.json()),
    ])
      .then(([progData, bookData]) => {
        if (progData) {
          if (progData.authenticated !== undefined) {
            setIsAuthenticated(progData.authenticated);
          }
          if (progData.stats) setStats(progData.stats);
        }
        if (bookData?.bookmarks) setBookmarks(bookData.bookmarks);
      })
      .catch((err) => console.error("Error loading progress data:", err))
      .finally(() => setLoading(false));
  }, []);

  // Generate 52 weeks (364 days) of dates ending today
  const generateCalendarDays = () => {
    const days: { dateStr: string; dayOfWeek: number }[] = [];
    const now = new Date();
    // Match the UTC calendar dates returned by SQLite's strftime activity query.
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - (52 * 7 - 1));

    for (let i = 0; i < 52 * 7; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      days.push({
        dateStr: d.toISOString().slice(0, 10),
        dayOfWeek: d.getUTCDay(),
      });
    }
    return days;
  };

  const getGreenDotColor = (count: number) => {
    if (!count || count === 0) return "rgba(148, 163, 184, 0.16)";
    if (count === 1) return "#16a34a"; // green — 1 submission
    if (count <= 3) return "#22c55e"; // bright green — 2-3 submissions
    if (count <= 6) return "#4ade80"; // vivid lime — 4-6 submissions
    if (count <= 10) return "#86efac"; // light green — 7-10 submissions
    return "#bbf7d0"; // brightest green — 11+ submissions
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
        <UserNav />
        <div style={{ padding: "100px 0", textAlign: "center" }}>
          <div className="spinner spinner-lg" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading developer telemetry...</p>
        </div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();
  const totalSubmissionsInMap = stats?.activityMap
    ? Object.values(stats.activityMap).reduce((acc, curr) => acc + curr.count, 0)
    : 0;
  const activeDays = stats?.activityMap
    ? Object.values(stats.activityMap).filter((d) => d.count > 0).length
    : 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <UserNav />

      <main className="page-container" style={{ maxWidth: 1160, margin: "0 auto", padding: "36px 20px" }}>
        {/* Guest Banner */}
        {!isAuthenticated && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderRadius: 12,
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              marginBottom: 28,
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="dot-indicator dot-indicator-blue" />
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                You are currently viewing guest telemetry. Sign in with Google to sync your personal solves, streaks, and bookmarks.
              </span>
            </div>
            <a
              href="/api/auth/google"
              className="btn btn-primary btn-sm"
              style={{ fontSize: 12, padding: "6px 14px" }}
            >
              Sign In with Google
            </a>
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="hero-pill" style={{ marginBottom: 12 }}>
              <span className="dot-indicator dot-indicator-emerald" />
              <span>Developer Activity & Streaks</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "#ffffff", marginBottom: 6 }}>
              Execution Metrics & Progress
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              52-week activity heatmap, real-time streaks, and language proficiency breakdown.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href="/problems"
              className="btn btn-primary btn-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
              }}
            >
              <span>Practice Problems</span>
              <IconChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* Top 4 Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 24 }}>
          {/* Streak Card */}
          <div className="kokonut-card-interactive" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono, monospace)" }}>
                Active Streak
              </span>
              <div style={{ color: "#f59e0b" }}>
                <IconFlame size={16} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
                {stats?.currentStreak ?? 0}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>days</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono, monospace)" }}>
              Longest: {stats?.longestStreak ?? 0} days
            </div>
          </div>

          {/* Solved Problems */}
          <div className="kokonut-card-interactive" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono, monospace)" }}>
                Problems Solved
              </span>
              <div style={{ color: "#10b981" }}>
                <IconCheck size={16} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
                {stats?.solvedStats?.totalSolved ?? 0}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                / {stats?.solvedStats?.totalProblems ?? 0}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono, monospace)" }}>
              {stats?.solvedStats?.totalProblems ? Math.round(((stats.solvedStats.totalSolved) / stats.solvedStats.totalProblems) * 100) : 0}% completion
            </div>
          </div>

          {/* Acceptance Rate */}
          <div className="kokonut-card-interactive" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono, monospace)" }}>
                Acceptance Rate
              </span>
              <div style={{ color: "#60a5fa" }}>
                <IconChart size={16} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
                {stats?.acceptanceRate ?? 0}%
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono, monospace)" }}>
              {stats?.totalSubmissions ?? 0} total runs
            </div>
          </div>

          {/* Active Days */}
          <div className="kokonut-card-interactive" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono, monospace)" }}>
                Active Practice Days
              </span>
              <div style={{ color: "#a855f7" }}>
                <IconClock size={16} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
                {activeDays}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>days</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono, monospace)" }}>
              in past 52 weeks
            </div>
          </div>
        </div>

        {/* 52-Week Activity Heatmap */}
        <div
          className="kokonut-card"
          style={{
            padding: 24,
            marginBottom: 24,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>
                Activity Heatmap
              </h2>
              <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                {totalSubmissionsInMap} submission{totalSubmissionsInMap === 1 ? "" : "s"} logged in the past year
              </p>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
              <span>Less</span>
              {[
                "rgba(148, 163, 184, 0.16)",
                "#16a34a",
                "#22c55e",
                "#4ade80",
                "#86efac",
                "#bbf7d0",
              ].map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: c,
                    border: i === 0 ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(196, 181, 253, 0.2)",
                    boxShadow: i > 2 ? `0 0 4px ${c}55` : "none",
                  }}
                />
              ))}
              <span>More</span>
            </div>
          </div>

          {/* Grid Container */}
          <div style={{ overflowX: "auto", paddingBottom: 8 }}>
            <div
              style={{
                display: "grid",
                gridTemplateRows: "repeat(7, 12px)",
                gridAutoFlow: "column",
                gridAutoColumns: "12px",
                gap: 3,
                minWidth: 740,
              }}
            >
              {calendarDays.map((day) => {
                const dayData = stats?.activityMap?.[day.dateStr] || { count: 0, accepted: 0 };
                return (
                  <div
                    key={day.dateStr}
                    title={`${day.dateStr}: ${dayData.count} submission${dayData.count === 1 ? "" : "s"} (${dayData.accepted} accepted)`}
                    onMouseEnter={() => setHoveredDay({ date: day.dateStr, ...dayData })}
                    onMouseLeave={() => setHoveredDay(null)}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: getGreenDotColor(dayData.count),
                      cursor: "pointer",
                      transition: "transform 0.12s ease, filter 0.12s ease, box-shadow 0.12s ease",
                      border: dayData.count > 0 ? "1px solid rgba(255, 255, 255, 0.32)" : "1px solid rgba(203, 213, 225, 0.22)",
                      boxShadow: dayData.count > 0 ? `0 0 7px ${getGreenDotColor(dayData.count)}88` : "none",
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Hover Status Readout */}
          <div
            style={{
              marginTop: 14,
              padding: "8px 12px",
              background: "rgba(255, 255, 255, 0.02)",
              borderRadius: 6,
              border: "1px solid rgba(255, 255, 255, 0.05)",
              fontSize: 12,
              color: "var(--text-secondary)",
              minHeight: 34,
              display: "flex",
              alignItems: "center",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {hoveredDay ? (
              <span>
                <strong style={{ color: "#ffffff" }}>{hoveredDay.date}</strong>: {hoveredDay.count} submission{hoveredDay.count === 1 ? "" : "s"} ({hoveredDay.accepted} accepted)
              </span>
            ) : (
              <span style={{ color: "var(--text-muted)" }}>Hover over any cell to inspect daily execution details</span>
            )}
          </div>
        </div>

        {/* 2-Column Section: Difficulty breakdown & Bookmarks */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
          {/* Difficulty Breakdown */}
          <div
            className="kokonut-card"
            style={{
              padding: 24,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: "#ffffff" }}>
              Difficulty Breakdown
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Easy */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: "#34d399", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span className="dot-indicator dot-indicator-emerald" />
                    Easy
                  </span>
                  <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                    {stats?.solvedStats?.easy?.solved ?? 0} / {stats?.solvedStats?.easy?.total ?? 0}
                  </span>
                </div>
                <div style={{ height: 6, background: "rgba(255, 255, 255, 0.06)", borderRadius: 3, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${stats?.solvedStats?.easy?.total ? ((stats.solvedStats.easy.solved / stats.solvedStats.easy.total) * 100) : 0}%`,
                      background: "#10b981",
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: "#fbbf24", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span className="dot-indicator dot-indicator-amber" />
                    Medium
                  </span>
                  <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                    {stats?.solvedStats?.medium?.solved ?? 0} / {stats?.solvedStats?.medium?.total ?? 0}
                  </span>
                </div>
                <div style={{ height: 6, background: "rgba(255, 255, 255, 0.06)", borderRadius: 3, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${stats?.solvedStats?.medium?.total ? ((stats.solvedStats.medium.solved / stats.solvedStats.medium.total) * 100) : 0}%`,
                      background: "#f59e0b",
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>

              {/* Hard */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: "#fb7185", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span className="dot-indicator dot-indicator-rose" />
                    Hard
                  </span>
                  <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                    {stats?.solvedStats?.hard?.solved ?? 0} / {stats?.solvedStats?.hard?.total ?? 0}
                  </span>
                </div>
                <div style={{ height: 6, background: "rgba(255, 255, 255, 0.06)", borderRadius: 3, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${stats?.solvedStats?.hard?.total ? ((stats.solvedStats.hard.solved / stats.solvedStats.hard.total) * 100) : 0}%`,
                      background: "#f43f5e",
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Language Breakdown */}
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, fontFamily: "var(--font-mono, monospace)" }}>
                Language Submissions
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {Object.entries(stats?.languageBreakdown || {}).map(([lang, count]) => (
                  <div
                    key={lang}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      fontSize: 12,
                      fontFamily: "var(--font-mono, monospace)",
                    }}
                  >
                    <span style={{ color: "#ffffff", fontWeight: 600 }}>{lang.toUpperCase()}</span>:{" "}
                    <span style={{ color: "var(--text-muted)" }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bookmarked Questions */}
          <div
            className="kokonut-card"
            style={{
              padding: 24,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <IconBookmark size={16} filled={true} style={{ color: "#fbbf24" }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff" }}>
                  Saved Bookmarks
                </h3>
              </div>
              <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                {bookmarks.length} saved
              </span>
            </div>

            {bookmarks.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                  No challenges bookmarked yet. Click the bookmark icon on any problem to pin it here.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                {bookmarks.map((b) => (
                  <div
                    key={b.bookmark_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1, marginRight: 12 }}>
                      <Link
                        href={`/problems/${b.id}`}
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#f4f4f5",
                          textDecoration: "none",
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {b.title}
                      </Link>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className={`badge badge-${b.difficulty}`} style={{ fontSize: 10, padding: "2px 6px" }}>
                        {b.difficulty}
                      </span>
                      <Link
                        href={`/problems/${b.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "3px 8px", fontSize: 11 }}
                      >
                        Solve
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
