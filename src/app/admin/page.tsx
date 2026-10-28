"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import VerdictBadge from "@/components/VerdictBadge";
import {
  IconCode,
  IconUser,
  IconSparkles,
  IconCheck,
  IconClock,
  IconShield,
  IconChevronRight,
  IconTerminal,
  IconChart,
} from "@/components/Icons";

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
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
        <AdminSidebar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
          <div className="spinner spinner-lg" />
        </div>
      </div>
    );
  }

  const acceptanceRate =
    stats && stats.submissionCount > 0
      ? Math.round((stats.acceptedCount / stats.submissionCount) * 100)
      : 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <AdminSidebar />
      <main className="main-with-sidebar" style={{ maxWidth: 1200, paddingTop: 96, paddingBottom: 60, paddingLeft: 32, paddingRight: 32 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div className="hero-pill" style={{ marginBottom: 12 }}>
              <span className="dot-indicator dot-indicator-emerald" />
              <span>Supervisor Control Plane</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "#ffffff", marginBottom: 6 }}>
              System Telemetry & Supercluster
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              Real-time judge telemetry, kernel sandbox execution, and system-wide submissions.
            </p>
          </div>
          <Link
            href="/admin/problems/new"
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 8 }}
          >
            <IconCode size={15} />
            <span>Publish Problem</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div className="kokonut-card-interactive" style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono, monospace)" }}>
                Active Challenges
              </span>
              <div style={{ color: "#38bdf8" }}>
                <IconCode size={18} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
              {stats?.problemCount || 0}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono, monospace)" }}>
              Isolated across language tracks
            </div>
          </div>

          <div className="kokonut-card-interactive" style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono, monospace)" }}>
                Registered Developers
              </span>
              <div style={{ color: "#a855f7" }}>
                <IconUser size={18} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
              {stats?.userCount || 0}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono, monospace)" }}>
              Authenticated players & admins
            </div>
          </div>

          <div className="kokonut-card-interactive" style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono, monospace)" }}>
                Total Submissions
              </span>
              <div style={{ color: "#fbbf24" }}>
                <IconSparkles size={18} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>
              {stats?.submissionCount || 0}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono, monospace)" }}>
              Sandboxed executions completed
            </div>
          </div>

          <div className="kokonut-card-interactive" style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono, monospace)" }}>
                Acceptance Rate
              </span>
              <div style={{ color: "#34d399" }}>
                <IconCheck size={18} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#34d399", letterSpacing: "-0.02em" }}>
              {acceptanceRate}%
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, fontFamily: "var(--font-mono, monospace)" }}>
              {stats?.acceptedCount || 0} accepted verdicts
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>
          {/* Recent Submissions */}
          <div
            className="kokonut-card"
            style={{
              padding: 24,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>
                  Recent Judge Submissions
                </h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                  Live feed of developer code runs
                </p>
              </div>
              <Link
                href="/admin/submissions"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: "5px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <span>View All</span>
                <IconChevronRight size={12} />
              </Link>
            </div>

            {(!stats?.recentSubmissions || stats.recentSubmissions.length === 0) ? (
              <div style={{ padding: "48px 0", textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No submissions logged yet.</p>
              </div>
            ) : (
              <div className="table-container" style={{ margin: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>User</th>
                      <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Problem</th>
                      <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Lang</th>
                      <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Verdict</th>
                      <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Runtime</th>
                      <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentSubmissions.map((sub) => (
                      <tr key={sub.id}>
                        <td style={{ fontWeight: 600, color: "#ffffff", fontSize: 13 }}>{sub.username}</td>
                        <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{sub.problem_title}</td>
                        <td>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontFamily: "var(--font-mono, monospace)",
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {sub.language.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <VerdictBadge verdict={sub.verdict} />
                        </td>
                        <td className="mono" style={{ fontSize: 12 }}>
                          {sub.runtime_ms != null ? `${sub.runtime_ms}ms` : "—"}
                        </td>
                        <td style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                          {new Date(sub.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Admin Control Center & Sandbox Status */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Quick Controls */}
            <div
              className="kokonut-card"
              style={{
                padding: 22,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono, monospace)" }}>
                Quick Operations
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link
                  href="/admin/problems/new"
                  className="btn btn-secondary"
                  style={{ justifyContent: "space-between", width: "100%", padding: "10px 14px", fontSize: 13 }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <IconCode size={14} />
                    <span>Publish Problem</span>
                  </span>
                  <IconChevronRight size={13} />
                </Link>
                <Link
                  href="/admin/problems"
                  className="btn btn-secondary"
                  style={{ justifyContent: "space-between", width: "100%", padding: "10px 14px", fontSize: 13 }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <IconTerminal size={14} />
                    <span>Test Cases & Suites</span>
                  </span>
                  <IconChevronRight size={13} />
                </Link>
                <Link
                  href="/admin/submissions"
                  className="btn btn-secondary"
                  style={{ justifyContent: "space-between", width: "100%", padding: "10px 14px", fontSize: 13 }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <IconChart size={14} />
                    <span>Inspect Verdicts</span>
                  </span>
                  <IconChevronRight size={13} />
                </Link>
              </div>
            </div>

            {/* Sandbox Status */}
            <div
              className="kokonut-card"
              style={{
                padding: 22,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <IconShield size={16} style={{ color: "#34d399" }} />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>
                  Kernel Sandbox Status
                </h3>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 14 }}>
                Linux kernel sandboxing active using Bubblewrap (<code>bwrap</code>). Network unshared, memory capped, timeouts enforced.
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  fontSize: 12,
                  fontFamily: "var(--font-mono, monospace)",
                  color: "#34d399",
                }}
              >
                <span className="dot-indicator dot-indicator-emerald" />
                <span>bwrap cluster ready</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
