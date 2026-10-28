"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import UserNav from "@/components/UserNav";

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

function ProblemsContent() {
  const searchParams = useSearchParams();
  const initialLang = searchParams.get("lang") || "all";

  const [problems, setProblems] = useState<Problem[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [languageFilter, setLanguageFilter] = useState<string>(initialLang);
  const [bookmarkedOnly, setBookmarkedOnly] = useState<boolean>(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/problems").then((res) => res.json()),
      fetch("/api/bookmarks").then((res) => res.json()).catch(() => ({ bookmarks: [] })),
    ])
      .then(([problemsData, bookmarksData]) => {
        if (problemsData && problemsData.problems) {
          setProblems(problemsData.problems);
        }
        if (bookmarksData && bookmarksData.bookmarks) {
          const ids = new Set<string>(bookmarksData.bookmarks.map((b: { id: string }) => b.id));
          setBookmarkedIds(ids);
        }
      })
      .catch((err) => console.error("Error loading problems:", err))
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

    // Strict Language Isolation:
    // If language is selected, ONLY show questions explicitly targeted for that language!
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
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(139, 92, 246, 0.15)", color: "var(--accent-purple)", border: "1px solid rgba(139, 92, 246, 0.3)" }}>
          ⚡ C++ Track
        </span>
      );
    }
    if (targets.includes("java")) {
      return (
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
          ☕ Java Track
        </span>
      );
    }
    if (targets.includes("python")) {
      return (
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(79, 143, 255, 0.15)", color: "var(--accent-blue)", border: "1px solid rgba(79, 143, 255, 0.3)" }}>
          🐍 Python Track
        </span>
      );
    }
    if (targets.includes("javascript")) {
      return (
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(245, 158, 11, 0.15)", color: "var(--accent-amber)", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
          📜 JavaScript Track
        </span>
      );
    }
    return (
      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
        🌐 Multi-Language
      </span>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <UserNav />

      <main className="page-container">
        {/* Banner */}
        <div
          style={{
            padding: "36px 32px",
            borderRadius: 20,
            background: "linear-gradient(135deg, rgba(79, 143, 255, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)",
            border: "1px solid var(--border-subtle)",
            marginBottom: 32,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: 680 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--accent-blue)",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Language-Specific Challenges
            </span>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: "8px 0 10px" }}>
              {languageFilter === "cpp"
                ? "⚡ C++ Programming Track"
                : languageFilter === "java"
                ? "☕ Java Programming Track"
                : languageFilter === "python"
                ? "🐍 Python Programming Track"
                : languageFilter === "javascript"
                ? "📜 JavaScript Programming Track"
                : "Explore Coding Challenges"}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6 }}>
              {languageFilter !== "all"
                ? `Showing exclusive questions designed specifically for ${languageFilter.toUpperCase()} with tailored idioms, memory constraints, and starter boilerplate.`
                : "Each programming language has its own tailored problem sets. Choose a track below to see language-specific challenges."}
            </p>
          </div>
        </div>

        {/* Filters and search */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          {/* Top row: search + language tracks */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <input
                type="text"
                className="input"
                placeholder="🔍 Search problems by title or tag (e.g. stl, collections, matrix)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Language Track Selector */}
            <div className="tabs">
              {[
                { id: "all", label: "All Languages" },
                { id: "cpp", label: "⚡ C++ (CPP)" },
                { id: "java", label: "☕ Java" },
                { id: "python", label: "🐍 Python" },
                { id: "javascript", label: "📜 JavaScript" },
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div className="tabs">
              {["all", "easy", "medium", "hard"].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={`tab ${difficultyFilter === diff ? "active" : ""}`}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
                className={`btn btn-sm ${bookmarkedOnly ? "btn-primary" : "btn-secondary"}`}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <span>{bookmarkedOnly ? "⭐" : "☆"}</span>
                <span>{bookmarkedOnly ? "Showing Bookmarked" : "Filter Bookmarked"}</span>
              </button>

              <span style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 8 }}>
                {filtered.length} problem{filtered.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        {/* Problem List */}
        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div className="spinner spinner-lg" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-muted)" }}>Loading challenges...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state glass-card" style={{ padding: 60 }}>
            <div className="empty-icon">🔍</div>
            <h3>No Problems Found for this Filter</h3>
            <p style={{ color: "var(--text-muted)" }}>
              {languageFilter !== "all"
                ? `No questions currently found for ${languageFilter.toUpperCase()}. Admins can set questions for this language in the Admin Portal.`
                : "Try adjusting your search query or filters."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((problem) => {
              const isBookmarked = bookmarkedIds.has(problem.id);
              return (
                <div
                  key={problem.id}
                  className="glass-card"
                  style={{
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Bookmark Button */}
                  <button
                    onClick={(e) => handleToggleBookmark(e, problem.id)}
                    title={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: 20,
                      cursor: "pointer",
                      padding: 4,
                      color: isBookmarked ? "#fbbf24" : "var(--text-muted)",
                      transition: "transform 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    {isBookmarked ? "★" : "☆"}
                  </button>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <Link
                        href={`/problems/${problem.id}`}
                        style={{
                          fontSize: 17,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          textDecoration: "none",
                        }}
                      >
                        {problem.title}
                      </Link>
                      <span className={`badge badge-${problem.difficulty}`}>
                        {problem.difficulty}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      {/* Language Availability Pill */}
                      {getLanguageBadge(problem)}

                      <div style={{ display: "flex", gap: 6 }}>
                        {problem.tags?.map((t) => (
                          <span
                            key={t}
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 6,
                              background: "var(--bg-elevated)",
                              color: "var(--text-muted)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
                        ⏱ {problem.time_limit_ms}ms • 💾 {problem.memory_limit_mb}MB
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/problems/${problem.id}`}
                    className="btn btn-primary"
                    style={{ padding: "8px 18px", fontSize: 13 }}
                  >
                    Solve Challenge →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
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
