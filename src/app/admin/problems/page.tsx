"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import { IconCode, IconChevronRight, IconCheck, IconSearch } from "@/components/Icons";

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: "easy" | "medium" | "hard";
  time_limit_ms: number;
  memory_limit_mb: number;
  is_published: number;
  tags: string[];
  target_languages?: string[];
  created_at: string;
}

export default function AdminProblemsPage() {
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState<string>("all");

  const fetchProblems = () => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== "admin") {
          router.push("/admin/login");
          return;
        }
        return fetch("/api/problems");
      })
      .then((res) => (res ? res.json() : null))
      .then((data) => {
        if (data && data.problems) {
          setProblems(data.problems);
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/admin/login");
      });
  };

  useEffect(() => {
    fetchProblems();
  }, [router]);

  const togglePublish = async (problem: Problem) => {
    try {
      const res = await fetch(`/api/problems/${problem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: problem.is_published ? 0 : 1 }),
      });
      if (res.ok) {
        setProblems((prev) =>
          prev.map((p) =>
            p.id === problem.id ? { ...p, is_published: p.is_published ? 0 : 1 } : p
          )
        );
      }
    } catch (err) {
      console.error("Failed to toggle publish status:", err);
    }
  };

  const deleteProblem = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete problem "${title}"? This will delete all its test cases and submissions.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/problems/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProblems((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete problem:", err);
    }
  };

  const filteredProblems = problems.filter((p) => {
    if (selectedLang === "all") return true;
    const targets = Array.isArray(p.target_languages) ? p.target_languages : [];
    return targets.includes(selectedLang);
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <AdminSidebar />
      <main className="main-with-sidebar" style={{ maxWidth: 1200, paddingTop: 96, paddingBottom: 60, paddingLeft: 32, paddingRight: 32 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div className="hero-pill" style={{ marginBottom: 10 }}>
              <span className="dot-indicator dot-indicator-emerald" />
              <span>Language Isolation Console</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", marginBottom: 4 }}>
              Problem Registry
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              Manage isolated language tracks, execution constraints, and test suite payloads.
            </p>
          </div>
          <Link
            href="/admin/problems/new"
            className="btn btn-primary"
            style={{ fontSize: 12, padding: "8px 16px", borderRadius: 8 }}
          >
            Provision Problem
          </Link>
        </div>

        {/* Language Filter Tabs */}
        <div className="tabs" style={{ marginBottom: 20, background: "#111116", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          {[
            { id: "all", label: "All Tracks" },
            { id: "cpp", label: "C++ Track" },
            { id: "java", label: "Java Track" },
            { id: "python", label: "Python Track" },
            { id: "javascript", label: "JavaScript Track" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedLang(tab.id)}
              className={`tab ${selectedLang === tab.id ? "active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <div className="spinner spinner-lg" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading problem registry...</p>
          </div>
        ) : filteredProblems.length === 0 ? (
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
              <IconCode size={20} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: "#ffffff" }}>
              No Challenges Found for this Track
            </h3>
            <p style={{ maxWidth: 400, margin: "8px auto 20px", color: "var(--text-muted)", fontSize: 13 }}>
              Provision a new problem specifically configured for this language track.
            </p>
            <Link href="/admin/problems/new" className="btn btn-primary btn-sm">
              Provision Problem
            </Link>
          </div>
        ) : (
          <div
            className="table-container"
            style={{
              background: "#111116",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 12,
            }}
          >
            <table>
              <thead>
                <tr>
                  <th style={{ fontSize: 11 }}>Title & Slug</th>
                  <th style={{ fontSize: 11 }}>Track Target</th>
                  <th style={{ fontSize: 11 }}>Difficulty</th>
                  <th style={{ fontSize: 11 }}>Telemetry Limits</th>
                  <th style={{ fontSize: 11 }}>Status</th>
                  <th style={{ fontSize: 11 }}>Tags</th>
                  <th style={{ textAlign: "right", fontSize: 11 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProblems.map((p) => {
                  const targets = Array.isArray(p.target_languages) ? p.target_languages : [];
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "#f4f4f5", fontSize: 13 }}>{p.title}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                          {p.slug}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {targets.includes("cpp") && (
                            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(168, 85, 247, 0.1)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.2)", fontFamily: "var(--font-mono, monospace)" }}>
                              C++
                            </span>
                          )}
                          {targets.includes("java") && (
                            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(239, 68, 68, 0.1)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.2)", fontFamily: "var(--font-mono, monospace)" }}>
                              Java
                            </span>
                          )}
                          {targets.includes("python") && (
                            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(96, 165, 250, 0.1)", color: "#60a5fa", border: "1px solid rgba(96, 165, 250, 0.2)", fontFamily: "var(--font-mono, monospace)" }}>
                              Python
                            </span>
                          )}
                          {targets.includes("javascript") && (
                            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(245, 158, 11, 0.1)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.2)", fontFamily: "var(--font-mono, monospace)" }}>
                              JS
                            </span>
                          )}
                          {targets.length === 0 && (
                            <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>Multi</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${p.difficulty}`} style={{ fontSize: 10, padding: "2px 6px" }}>
                          {p.difficulty}
                        </span>
                      </td>
                      <td className="mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                        {p.time_limit_ms}ms / {p.memory_limit_mb}MB
                      </td>
                      <td>
                        <button
                          onClick={() => togglePublish(p)}
                          className={`badge ${p.is_published ? "badge-accepted" : "badge-pending"}`}
                          style={{ cursor: "pointer", border: "none", fontSize: 10 }}
                        >
                          {p.is_published ? "Published" : "Draft"}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {p.tags?.map((t) => (
                            <span
                              key={t}
                              style={{
                                fontSize: 10,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: "rgba(255, 255, 255, 0.04)",
                                color: "var(--text-muted)",
                                border: "1px solid rgba(255, 255, 255, 0.06)",
                                fontFamily: "var(--font-mono, monospace)",
                              }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <Link
                            href={`/admin/problems/${p.id}/edit`}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: 11, padding: "4px 10px" }}
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => deleteProblem(p.id, p.title)}
                            className="btn btn-danger btn-sm"
                            style={{ fontSize: 11, padding: "4px 10px" }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
