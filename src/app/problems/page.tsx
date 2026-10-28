"use client";
import { useEffect, useState } from "react";
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
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/problems")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.problems) {
          setProblems(data.problems);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = problems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesDiff =
      difficultyFilter === "all" || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

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
            marginBottom: 36,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: 640 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--accent-blue)",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Algorithm Challenges
            </span>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: "8px 0 10px" }}>
              Explore Problems
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6 }}>
              Solve programming challenges in Python, C++, or JavaScript. Run untrusted code safely against hidden test cases with instant AI debugging assistance.
            </p>
          </div>
        </div>

        {/* Filters and search */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <input
              type="text"
              className="input"
              placeholder="🔍 Search problems by title or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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
            <h3>No Problems Found</h3>
            <p style={{ color: "var(--text-muted)" }}>
              {search || difficultyFilter !== "all"
                ? "Try adjusting your search query or filters."
                : "No problems published yet. Admins can create problems from the Admin Portal."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((problem) => (
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
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <Link
                      href={`/problems/${problem.id}`}
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "var(--accent-blue)")}
                      onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "var(--text-primary)")}
                    >
                      {problem.title}
                    </Link>
                    <span className={`badge badge-${problem.difficulty}`}>
                      {problem.difficulty}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
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

                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
