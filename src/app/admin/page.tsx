"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import VerdictBadge from "@/components/VerdictBadge";

interface AdminStats {
  userCount: number;
  problemCount: number;
  submissionCount: number;
  acceptedCount: number;
  recentSubmissions: Array<{
    id: string;
    username: string;
    problem_title: string;
    language: string;
    verdict: string;
    runtime_ms: number | null;
    created_at: string;
  }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== "admin") {
          router.push("/admin/login");
          return;
        }
        return fetch("/api/admin/stats");
      })
      .then((res) => (res ? res.json() : null))
      .then((data) => {
        if (data && !data.error) {
          setStats(data);
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/admin/login");
      });
  }, [router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  const acceptanceRate =
    stats && stats.submissionCount > 0
      ? Math.round((stats.acceptedCount / stats.submissionCount) * 100)
      : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0c0817" }}>
      <AdminSidebar />
      <main className="main-with-sidebar">
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="page-title" style={{ color: "#f3e8ff" }}>
              Admin Overview
            </h1>
            <p className="page-subtitle">
              Monitor submissions, publish challenges, and supervise platform execution.
            </p>
          </div>
          <Link href="/admin/problems/new" className="btn btn-admin">
            ➕ Create New Problem
          </Link>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
            marginBottom: 36,
          }}
        >
          <div className="stat-card" style={{ background: "rgba(25, 17, 46, 0.6)", borderColor: "rgba(139, 92, 246, 0.2)" }}>
            <div className="stat-icon" style={{ background: "rgba(139, 92, 246, 0.2)", color: "#c084fc" }}>
              📝
            </div>
            <div className="stat-value" style={{ color: "#f3e8ff" }}>
              {stats?.problemCount || 0}
            </div>
            <div className="stat-label">Published Problems</div>
          </div>

          <div className="stat-card" style={{ background: "rgba(25, 17, 46, 0.6)", borderColor: "rgba(139, 92, 246, 0.2)" }}>
            <div className="stat-icon" style={{ background: "rgba(79, 143, 255, 0.2)", color: "#60a5fa" }}>
              👥
            </div>
            <div className="stat-value" style={{ color: "#f3e8ff" }}>
              {stats?.userCount || 0}
            </div>
            <div className="stat-label">Registered Users</div>
          </div>

          <div className="stat-card" style={{ background: "rgba(25, 17, 46, 0.6)", borderColor: "rgba(139, 92, 246, 0.2)" }}>
            <div className="stat-icon" style={{ background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24" }}>
              ⚡
            </div>
            <div className="stat-value" style={{ color: "#f3e8ff" }}>
              {stats?.submissionCount || 0}
            </div>
            <div className="stat-label">Total Submissions</div>
          </div>

          <div className="stat-card" style={{ background: "rgba(25, 17, 46, 0.6)", borderColor: "rgba(139, 92, 246, 0.2)" }}>
            <div className="stat-icon" style={{ background: "rgba(34, 197, 94, 0.2)", color: "#4ade80" }}>
              🎯
            </div>
            <div className="stat-value" style={{ color: "#4ade80" }}>
              {acceptanceRate}%
            </div>
            <div className="stat-label">Acceptance Rate</div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          {/* Recent Submissions */}
          <div
            className="glass-card"
            style={{
              padding: 24,
              background: "rgba(20, 14, 38, 0.8)",
              borderColor: "rgba(139, 92, 246, 0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f3e8ff" }}>
                Recent Submissions
              </h2>
              <Link
                href="/admin/submissions"
                style={{ fontSize: 13, color: "#c084fc", textDecoration: "none" }}
              >
                View all →
              </Link>
            </div>

            {(!stats?.recentSubmissions || stats.recentSubmissions.length === 0) ? (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <h3>No Submissions Yet</h3>
                <p>User submissions will appear here live as they code.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Problem</th>
                      <th>Language</th>
                      <th>Verdict</th>
                      <th>Runtime</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentSubmissions.map((sub) => (
                      <tr key={sub.id}>
                        <td style={{ fontWeight: 600, color: "#f3e8ff" }}>{sub.username}</td>
                        <td>{sub.problem_title}</td>
                        <td>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 4,
                              fontSize: 11,
                              background: "rgba(255,255,255,0.06)",
                            }}
                          >
                            {sub.language}
                          </span>
                        </td>
                        <td>
                          <VerdictBadge verdict={sub.verdict} />
                        </td>
                        <td className="mono">{sub.runtime_ms != null ? `${sub.runtime_ms} ms` : "—"}</td>
                        <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Admin Control Center */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              className="glass-card"
              style={{
                padding: 24,
                background: "rgba(20, 14, 38, 0.8)",
                borderColor: "rgba(139, 92, 246, 0.2)",
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f3e8ff", marginBottom: 12 }}>
                ⚙️ Quick Controls
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link
                  href="/admin/problems/new"
                  className="btn btn-secondary"
                  style={{ justifyContent: "flex-start", width: "100%" }}
                >
                  📝 Publish New Problem
                </Link>
                <Link
                  href="/admin/problems"
                  className="btn btn-secondary"
                  style={{ justifyContent: "flex-start", width: "100%" }}
                >
                  📂 Manage Problem Test Cases
                </Link>
                <Link
                  href="/admin/submissions"
                  className="btn btn-secondary"
                  style={{ justifyContent: "flex-start", width: "100%" }}
                >
                  🔍 Inspect Execution Verdicts
                </Link>
              </div>
            </div>

            <div
              className="glass-card"
              style={{
                padding: 24,
                background: "rgba(20, 14, 38, 0.8)",
                borderColor: "rgba(139, 92, 246, 0.2)",
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f3e8ff", marginBottom: 8 }}>
                🛡️ Sandbox Status
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
                Kernel sandboxing active using bubblewrap (<code>bwrap</code>). Network unshared, memory capped, timeouts enforced.
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: "#4ade80",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#4ade80",
                    display: "inline-block",
                  }}
                />
                bwrap sandbox isolated & ready
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
