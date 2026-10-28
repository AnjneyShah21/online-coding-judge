"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import VerdictBadge from "@/components/VerdictBadge";
import { IconCode, IconTerminal, IconCheck } from "@/components/Icons";

interface Submission {
  id: string;
  username: string;
  problem_title: string;
  language: string;
  verdict: string;
  runtime_ms: number | null;
  memory_kb: number | null;
  error_message: string | null;
  code: string;
  created_at: string;
}

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  const fetchSubmissions = () => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== "admin") {
          router.push("/admin/login");
          return;
        }
        return fetch("/api/submissions");
      })
      .then((res) => (res ? res.json() : null))
      .then((data) => {
        if (data && data.submissions) {
          setSubmissions(data.submissions);
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/admin/login");
      });
  };

  useEffect(() => {
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 4000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <AdminSidebar />
      <main className="main-with-sidebar" style={{ maxWidth: 1200, paddingTop: 96, paddingBottom: 60, paddingLeft: 32, paddingRight: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <div className="hero-pill" style={{ marginBottom: 12 }}>
            <span className="dot-indicator dot-indicator-emerald" />
            <span>Real-Time Execution Telemetry</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "#ffffff", marginBottom: 6 }}>
            Platform Submissions & Verdicts
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Live real-time feed of all user code submissions running in isolated bubblewrap sandboxes.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="kokonut-card" style={{ padding: 60, textAlign: "center", background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
            <h3 style={{ color: "#ffffff", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No Submissions Found</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Submissions will stream here automatically as developers submit solutions.</p>
          </div>
        ) : (
          <div
            className="kokonut-card"
            style={{ padding: 24, background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="table-container" style={{ margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Submission ID</th>
                    <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>User</th>
                    <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Problem</th>
                    <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Language</th>
                    <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Verdict</th>
                    <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Runtime</th>
                    <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Submitted At</th>
                    <th style={{ textAlign: "right", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {sub.id.substring(0, 8)}...
                      </td>
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
                      <td className="mono" style={{ fontSize: 12 }}>{sub.runtime_ms != null ? `${sub.runtime_ms}ms` : "—"}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                        {new Date(sub.created_at).toLocaleString()}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedSub(sub)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "3px 10px", fontSize: 11 }}
                        >
                          Inspect Code
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Code Inspection Modal */}
        {selectedSub && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 24,
            }}
          >
            <div
              className="kokonut-card"
              style={{
                width: "100%",
                maxWidth: 820,
                maxHeight: "85vh",
                overflowY: "auto",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
                padding: 28,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", marginBottom: 6 }}>
                    Submission: {selectedSub.id}
                  </h2>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "var(--text-secondary)" }}>
                    <span>Developer: <strong style={{ color: "#ffffff" }}>{selectedSub.username}</strong></span>
                    <span>•</span>
                    <span>Problem: <strong style={{ color: "#ffffff" }}>{selectedSub.problem_title}</strong></span>
                    <span>•</span>
                    <VerdictBadge verdict={selectedSub.verdict} />
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSub(null)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 12, padding: "5px 12px" }}
                >
                  Close
                </button>
              </div>

              {selectedSub.error_message && (
                <div
                  style={{
                    padding: 14,
                    background: "rgba(244, 63, 94, 0.1)",
                    border: "1px solid rgba(244, 63, 94, 0.2)",
                    color: "#fb7185",
                    borderRadius: 8,
                    fontSize: 13,
                    marginBottom: 18,
                  }}
                >
                  <strong style={{ display: "block", marginBottom: 4 }}>Execution Error / Diagnostic Output:</strong>
                  <pre className="mono" style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>
                    {selectedSub.error_message}
                  </pre>
                </div>
              )}

              <div>
                <label className="label" style={{ color: "var(--text-secondary)", marginBottom: 8, display: "block" }}>
                  Submitted Source Code ({selectedSub.language.toUpperCase()})
                </label>
                <pre
                  className="mono"
                  style={{
                    padding: 16,
                    background: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    borderRadius: 8,
                    fontSize: 13,
                    overflowX: "auto",
                    lineHeight: 1.5,
                  }}
                >
                  {selectedSub.code}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
