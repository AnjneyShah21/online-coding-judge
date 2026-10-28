"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import UserNav from "@/components/UserNav";
import {
  IconSearch,
  IconBookmark,
  IconChevronRight,
  IconClock,
  IconCpu,
  IconCode,
  IconFlame,
  IconCheck,
  IconChart,
  IconTrophy,
} from "@/components/Icons";

interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  time_limit_ms: number;
  memory_limit_mb: number;
  tags: string[];
  target_languages?: string[];
  starter_code?: Record<string, string>;
}

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

function ProblemsContent() {
  const searchParams = useSearchParams();
  const initialLang = searchParams.get("lang") || "all";

  const [problems, setProblems] = useState<Problem[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarksList, setBookmarksList] = useState<BookmarkedProblem[]>([]);
  const [userStats, setUserStats] = useState<ProgressStats | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>(initialLang);
  const [bookmarkedOnly, setBookmarkedOnly] = useState<boolean>(false);
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number; accepted: number } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/problems").then((res) => res.json()),
      fetch("/api/bookmarks").then((res) => res.json()).catch(() => ({ bookmarks: [] })),
      fetch("/api/user/progress").then((res) => res.json()).catch(() => null),
    ])
      .then(([problemsData, bookmarksData, progressData]) => {
        if (problemsData && problemsData.problems) {
          setProblems(problemsData.problems);
        }
        if (bookmarksData && bookmarksData.bookmarks) {
          const ids = new Set<string>(bookmarksData.bookmarks.map((b: { id: string }) => b.id));
          setBookmarkedIds(ids);
          setBookmarksList(bookmarksData.bookmarks);
        }
        if (progressData) {
          if (progressData.authenticated !== undefined) {
            setIsAuthenticated(progressData.authenticated);
          }
          if (progressData.stats) {
            setUserStats(progressData.stats);
          }
        }
      })
      .catch((err) => console.error("Error loading problems & telemetry:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleBookmark = async (e: React.MouseEvent, problemId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic UI update
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(problemId)) next.delete(problemId);
      else next.add(problemId);
      return next;
    });

    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem_id: problemId }),
      });
      if (!res.ok) {
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          if (next.has(problemId)) next.delete(problemId);
          else next.add(problemId);
          return next;
        });
      }
    } catch {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (next.has(problemId)) next.delete(problemId);
        else next.add(problemId);
        return next;
      });
    }
  };

  const getTargetLanguages = (p: Problem): string[] => {
    if (Array.isArray(p.target_languages)) return p.target_languages;
    if (typeof p.target_languages === "string") {
      try {
        return JSON.parse(p.target_languages);
      } catch {
        return [];
      }
    }
    return [];
  };

  const filtered = problems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesDiff =
      difficultyFilter === "all" || p.difficulty === difficultyFilter;

    const matchesBookmark = !bookmarkedOnly || bookmarkedIds.has(p.id);

    // Strict Language Track Isolation:
    let matchesLang = true;
    if (languageFilter !== "all") {
      const targets = getTargetLanguages(p);
      matchesLang = targets.includes(languageFilter) || targets.includes("all");
    }

    return matchesSearch && matchesDiff && matchesBookmark && matchesLang;
  });

  const getLanguageBadge = (p: Problem) => {
    const targets = getTargetLanguages(p);
    if (targets.includes("cpp")) {
      return (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 6,
            background: "rgba(168, 85, 247, 0.1)",
            color: "#c084fc",
            border: "1px solid rgba(168, 85, 247, 0.2)",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          C++ Track
        </span>
      );
    }
    if (targets.includes("java")) {
      return (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 6,
            background: "rgba(239, 68, 68, 0.1)",
            color: "#f87171",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          Java Track
        </span>
      );
    }
    if (targets.includes("python")) {
      return (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 6,
            background: "rgba(96, 165, 250, 0.1)",
            color: "#60a5fa",
            border: "1px solid rgba(96, 165, 250, 0.2)",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          Python Track
        </span>
      );
    }
    if (targets.includes("javascript")) {
      return (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 6,
            background: "rgba(245, 158, 11, 0.1)",
            color: "#fbbf24",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          JavaScript Track
        </span>
      );
    }
    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          padding: "2px 8px",
          borderRadius: 6,
          background: "rgba(255, 255, 255, 0.05)",
          color: "var(--text-muted)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        Multi-Track
      </span>
    );
  };

  const getDifficultyPill = (diff: "easy" | "medium" | "hard") => {
    if (diff === "easy") {
      return (
        <span className="badge badge-easy" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span className="dot-indicator dot-indicator-emerald" />
          Easy
        </span>
      );
    }
    if (diff === "medium") {
      return (
        <span className="badge badge-medium" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span className="dot-indicator dot-indicator-amber" />
          Medium
        </span>
      );
    }
    return (
      <span className="badge badge-hard" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        <span className="dot-indicator dot-indicator-rose" />
        Hard
      </span>
    );
  };

  const generateCompactDays = () => {
    const days: { dateStr: string; dayOfWeek: number }[] = [];
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 16 * 7);

    for (let i = 0; i < 16 * 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({
        dateStr: d.toISOString().split("T")[0],
        dayOfWeek: d.getDay(),
      });
    }
    return days;
  };

  const getHeatmapColor = (count: number) => {
    if (!count || count === 0) return "rgba(255, 255, 255, 0.06)";
    if (count === 1) return "#3730a3"; // dim indigo — barely active
    if (count <= 3) return "#4f46e5"; // indigo — moderate
    if (count <= 6) return "#818cf8"; // light indigo — good activity
    if (count <= 10) return "#a78bfa"; // violet — high activity
    return "#c4b5fd";                  // bright violet — peak
  };

  const compactDays = generateCompactDays();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <UserNav />

      <main className="page-container" style={{ maxWidth: 1340, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28, alignItems: "start" }}>
          {/* Left Column: Problem Registry & Filters */}
          <div style={{ minWidth: 0 }}>
            {/* Kokonut Header Section */}
            <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div className="hero-pill">
              <span className="dot-indicator dot-indicator-emerald" />
              <span>Language Track Isolation Active</span>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
              {problems.length} challenges loaded
            </span>
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              marginBottom: 6,
            }}
          >
            {languageFilter === "cpp"
              ? "C++ Programming Track"
              : languageFilter === "java"
              ? "Java Programming Track"
              : languageFilter === "python"
              ? "Python Programming Track"
              : languageFilter === "javascript"
              ? "JavaScript Programming Track"
              : "Algorithm & Engineering Challenges"}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 720 }}>
            {languageFilter !== "all"
              ? `Exclusive questions architected specifically for ${languageFilter.toUpperCase()} with native idioms, memory constraints, and specialized starter templates.`
              : "Browse language-specific challenges engineered with isolated starter kits, zero network sandboxing, and precision timing limits."}
          </p>
        </div>

        {/* Filter Toolbar */}
        <div
          style={{
            background: "#111116",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 14,
            padding: 14,
            marginBottom: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Top row: search + language tracks */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div
              style={{
                flex: 1,
                minWidth: 260,
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <IconSearch size={15} />
              </div>
              <input
                type="text"
                className="input"
                style={{
                  paddingLeft: 36,
                  paddingRight: 50,
                  height: 38,
                  fontSize: 13,
                  background: "#0a0a0d",
                  borderColor: "rgba(255, 255, 255, 0.08)",
                }}
                placeholder="Search challenges by title, tag or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div
                style={{
                  position: "absolute",
                  right: 12,
                  pointerEvents: "none",
                }}
              >
                <span className="kbd-badge">⌘K</span>
              </div>
            </div>

            {/* Language Track Selector */}
            <div className="tabs" style={{ background: "#0a0a0d" }}>
              {[
                { id: "all", label: "All Tracks" },
                { id: "cpp", label: "C++" },
                { id: "java", label: "Java" },
                { id: "python", label: "Python" },
                { id: "javascript", label: "JavaScript" },
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguageFilter(lang.id)}
                  className={`tab ${languageFilter === lang.id ? "active" : ""}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom row: difficulty + bookmark toggle */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              borderTop: "1px solid rgba(255, 255, 255, 0.05)",
              paddingTop: 10,
            }}
          >
            <div className="tabs" style={{ background: "#0a0a0d" }}>
              {[
                { id: "all", label: "All Difficulties" },
                { id: "easy", label: "Easy" },
                { id: "medium", label: "Medium" },
                { id: "hard", label: "Hard" },
              ].map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => setDifficultyFilter(diff.id)}
                  className={`tab ${difficultyFilter === diff.id ? "active" : ""}`}
                >
                  {diff.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  background: bookmarkedOnly ? "rgba(251, 191, 36, 0.12)" : "rgba(255, 255, 255, 0.04)",
                  border: bookmarkedOnly ? "1px solid rgba(251, 191, 36, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
                  color: bookmarkedOnly ? "#fbbf24" : "var(--text-secondary)",
                  transition: "all 0.15s ease",
                }}
              >
                <IconBookmark size={13} filled={bookmarkedOnly} />
                <span>Bookmarked</span>
              </button>

              <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                Showing {filtered.length} of {problems.length}
              </span>
            </div>
          </div>
        </div>

        {/* Problem List */}
        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div className="spinner spinner-lg" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading challenge registry...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="kokonut-card"
            style={{
              padding: "56px 24px",
              textAlign: "center",
              border: "1px dashed rgba(255, 255, 255, 0.12)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(255, 255, 255, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
                color: "var(--text-muted)",
              }}
            >
              <IconSearch size={20} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: "#ffffff" }}>
              No Challenges Found
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, maxWidth: 440, margin: "0 auto 16px" }}>
              {languageFilter !== "all"
                ? `No questions currently matched the ${languageFilter.toUpperCase()} filter. Additional questions can be provisioned in the Admin Console.`
                : "No questions match your active search terms or difficulty filter."}
            </p>
            <button
              onClick={() => {
                setSearch("");
                setDifficultyFilter("all");
                setLanguageFilter("all");
                setBookmarkedOnly(false);
              }}
              className="btn btn-secondary btn-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((problem) => {
              const isBookmarked = bookmarkedIds.has(problem.id);
              return (
                <div
                  key={problem.id}
                  className="kokonut-card-interactive border-shimmer"
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  {/* Left: Bookmark Toggle */}
                  <button
                    onClick={(e) => handleToggleBookmark(e, problem.id)}
                    title={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                      color: isBookmarked ? "#fbbf24" : "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    <IconBookmark size={16} filled={isBookmarked} />
                  </button>

                  {/* Main Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                      <Link
                        href={`/problems/${problem.id}`}
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#f4f4f5",
                          textDecoration: "none",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {problem.title}
                      </Link>
                      {getDifficultyPill(problem.difficulty)}
                      {getLanguageBadge(problem)}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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

                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 12,
                          marginLeft: "auto",
                          fontSize: 11,
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-mono, monospace)",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <IconClock size={12} />
                          {problem.time_limit_ms}ms
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <IconCpu size={12} />
                          {problem.memory_limit_mb}MB
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action */}
                  <Link
                    href={`/problems/${problem.id}`}
                    className="btn btn-secondary btn-sm"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      padding: "6px 14px",
                      borderRadius: 8,
                      borderColor: "rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <span>Solve</span>
                    <IconChevronRight size={13} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: Live Telemetry & Progress Dashboard */}
      <aside style={{ position: "sticky", top: 80, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Guest Sign-In Banner if Unauthenticated */}
        {!isAuthenticated && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <IconFlame size={16} style={{ color: "#818cf8" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>Track Your Solves</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 12 }}>
              Sign in to save your code, build daily streaks, and compare solutions on the live leaderboard.
            </p>
            <Link
              href="/login"
              className="btn btn-sm btn-primary"
              style={{ width: "100%", textAlign: "center", display: "block", fontSize: 12, padding: "7px 12px" }}
            >
              Sign In to Platform
            </Link>
          </div>
        )}

        {/* Solved Progress Card */}
        <div
          style={{
            background: "#111116",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 14,
            padding: 18,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <IconChart size={15} style={{ color: "#38bdf8" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>Solved Progress</span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono, monospace)",
                color: "#38bdf8",
                background: "rgba(56, 189, 248, 0.1)",
                padding: "2px 7px",
                borderRadius: 6,
                border: "1px solid rgba(56, 189, 248, 0.2)",
              }}
            >
              {Math.round(
                ((userStats?.solvedStats?.totalSolved ?? 0) /
                  (userStats?.solvedStats?.totalProblems || problems.length || 1)) *
                  100
              )}
              % Complete
            </span>
          </div>

          {/* Total Solved Large Count */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 16 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
              {userStats?.solvedStats?.totalSolved ?? 0}
            </span>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
              / {userStats?.solvedStats?.totalProblems || problems.length} Solved
            </span>
          </div>

          {/* Difficulty Breakdown Bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Easy */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: "#34d399", fontWeight: 600 }}>Easy</span>
                <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                  {userStats?.solvedStats?.easy?.solved ?? 0} / {userStats?.solvedStats?.easy?.total ?? 0}
                </span>
              </div>
              <div style={{ height: 6, background: "rgba(255, 255, 255, 0.06)", borderRadius: 3, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${
                      ((userStats?.solvedStats?.easy?.solved ?? 0) /
                        Math.max(userStats?.solvedStats?.easy?.total ?? 1, 1)) *
                      100
                    }%`,
                    background: "#10b981",
                    borderRadius: 3,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* Medium */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: "#fbbf24", fontWeight: 600 }}>Medium</span>
                <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                  {userStats?.solvedStats?.medium?.solved ?? 0} / {userStats?.solvedStats?.medium?.total ?? 0}
                </span>
              </div>
              <div style={{ height: 6, background: "rgba(255, 255, 255, 0.06)", borderRadius: 3, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${
                      ((userStats?.solvedStats?.medium?.solved ?? 0) /
                        Math.max(userStats?.solvedStats?.medium?.total ?? 1, 1)) *
                      100
                    }%`,
                    background: "#f59e0b",
                    borderRadius: 3,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* Hard */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: "#f87171", fontWeight: 600 }}>Hard</span>
                <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                  {userStats?.solvedStats?.hard?.solved ?? 0} / {userStats?.solvedStats?.hard?.total ?? 0}
                </span>
              </div>
              <div style={{ height: 6, background: "rgba(255, 255, 255, 0.06)", borderRadius: 3, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${
                      ((userStats?.solvedStats?.hard?.solved ?? 0) /
                        Math.max(userStats?.solvedStats?.hard?.total ?? 1, 1)) *
                      100
                    }%`,
                    background: "#f43f5e",
                    borderRadius: 3,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Streak & Performance Metrics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          <div
            style={{
              background: "#111116",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              padding: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <IconFlame size={14} style={{ color: "#f97316" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>Streak</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", marginBottom: 2 }}>
              {userStats?.currentStreak ?? 0} <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>days</span>
            </div>
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
              Max: {userStats?.longestStreak ?? 0}d
            </span>
          </div>

          <div
            style={{
              background: "#111116",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              padding: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <IconCheck size={14} style={{ color: "#10b981" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>Acceptance</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", marginBottom: 2 }}>
              {userStats?.acceptanceRate ?? 0}%
            </div>
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
              {userStats?.totalSubmissions ?? 0} subs
            </span>
          </div>
        </div>

        {/* Activity Heatmap (Last 16 Weeks) */}
        <div
          style={{
            background: "#111116",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff" }}>Coding Heatmap</span>
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
              16 weeks
            </span>
          </div>

          {/* Heatmap Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateRows: "repeat(7, 9px)",
              gridAutoFlow: "column",
              gridAutoColumns: "9px",
              gap: 3,
              justifyContent: "space-between",
              padding: "4px 0",
            }}
          >
            {compactDays.map((day) => {
              const act = userStats?.activityMap?.[day.dateStr];
              const count = act?.count ?? 0;
              const accepted = act?.accepted ?? 0;
              return (
                <div
                  key={day.dateStr}
                  onMouseEnter={() => setHoveredDay({ date: day.dateStr, count, accepted })}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 2,
                    background: getHeatmapColor(count),
                    cursor: "pointer",
                    transition: "transform 0.1s ease, box-shadow 0.1s ease",
                    border: count > 0 ? "1px solid rgba(167, 139, 250, 0.2)" : "1px solid rgba(255, 255, 255, 0.06)",
                    boxShadow: count > 6 ? `0 0 4px ${getHeatmapColor(count)}80` : "none",
                  }}
                />
              );
            })}
          </div>

          {/* Hover Tooltip display */}
          <div style={{ marginTop: 8, minHeight: 16 }}>
            {hoveredDay ? (
              <div style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-mono, monospace)" }}>
                {hoveredDay.date}: <span style={{ color: "#34d399", fontWeight: 600 }}>{hoveredDay.accepted} accepted</span> ({hoveredDay.count} total)
              </div>
            ) : (
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                Hover day to inspect activity
              </div>
            )}
          </div>
        </div>

        {/* Quick Bookmarks */}
        {bookmarksList.length > 0 && (
          <div
            style={{
              background: "#111116",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <IconBookmark size={13} filled style={{ color: "#fbbf24" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff" }}>
                Saved Challenges ({bookmarksList.length})
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {bookmarksList.slice(0, 4).map((b) => (
                <Link
                  key={b.id}
                  href={`/problems/${b.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    textDecoration: "none",
                    transition: "background 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#e2e8f0",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 190,
                    }}
                  >
                    {b.title}
                  </span>
                  <span
                    className={`badge badge-${b.difficulty}`}
                    style={{ fontSize: 9, padding: "1px 6px" }}
                  >
                    {b.difficulty}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  </main>
    </div>
  );
}

export default function ProblemsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="spinner spinner-lg" />
        </div>
      }
    >
      <ProblemsContent />
    </Suspense>
  );
}
