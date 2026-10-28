"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: "easy" | "medium" | "hard";
  time_limit_ms: number;
  memory_limit_mb: number;
  is_published: number;
  tags: string[];
  created_at: string;
}

export default function AdminProblemsPage() {
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div style={{ minHeight: "100vh", background: "#0c0817" }}>
      <AdminSidebar />
      <main className="main-with-sidebar">
        <div
          className="page-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1 className="page-title" style={{ color: "#f3e8ff" }}>
              Problem Management
            </h1>
            <p className="page-subtitle">
              Create, configure, and manage test cases for programming challenges.
            </p>
          </div>
          <Link href="/admin/problems/new" className="btn btn-admin">
            ➕ Add New Problem
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : problems.length === 0 ? (
          <div className="empty-state glass-card" style={{ padding: 60, background: "rgba(20, 14, 38, 0.8)" }}>
            <div className="empty-icon">📝</div>
            <h3 style={{ color: "#f3e8ff" }}>No Problems Published Yet</h3>
            <p style={{ maxWidth: 400, margin: "8px auto 20px", color: "var(--text-muted)" }}>
              Start building your problem repository. You can generate tricky edge test cases with AI!
            </p>
            <Link href="/admin/problems/new" className="btn btn-admin">
              Create First Problem
            </Link>
          </div>
        ) : (
          <div
            className="table-container glass-card"
            style={{ background: "rgba(20, 14, 38, 0.8)", borderColor: "rgba(139, 92, 246, 0.2)" }}
          >
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Difficulty</th>
                  <th>Time Limit</th>
                  <th>Memory Limit</th>
                  <th>Status</th>
                  <th>Tags</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#f3e8ff" }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.slug}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${p.difficulty}`}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="mono">{p.time_limit_ms} ms</td>
                    <td className="mono">{p.memory_limit_mb} MB</td>
                    <td>
                      <button
                        onClick={() => togglePublish(p)}
                        className={`badge ${p.is_published ? "badge-accepted" : "badge-pending"}`}
                        style={{ cursor: "pointer", border: "none" }}
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
                              fontSize: 11,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "rgba(255,255,255,0.06)",
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <Link
                          href={`/admin/problems/${p.id}/edit`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "4px 10px", fontSize: 12 }}
                        >
                          ✏️ Edit & Tests
                        </Link>
                        <button
                          onClick={() => deleteProblem(p.id, p.title)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: "4px 10px", fontSize: 12 }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
