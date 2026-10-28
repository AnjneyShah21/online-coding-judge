"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import VerdictBadge from "@/components/VerdictBadge";

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
    <div style={{ minHeight: "100vh", background: "#0c0817" }}>
      <AdminSidebar />
      <main className="main-with-sidebar">
        <div className="page-header">
          <h1 className="page-title" style={{ color: "#f3e8ff" }}>
            Platform Submissions
          </h1>
          <p className="page-subtitle">
            Live real-time feed of all user code submissions running in isolated sandboxes.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="empty-state glass-card" style={{ padding: 60, background: "rgba(20, 14, 38, 0.8)" }}>
            <div className="empty-icon">⚡</div>
            <h3 style={{ color: "#f3e8ff" }}>No Submissions Found</h3>
            <p style={{ color: "var(--text-muted)" }}>Submissions will stream here automatically.</p>
          </div>
        ) : (
          <div
            className="table-container glass-card"
            style={{ background: "rgba(20, 14, 38, 0.8)", borderColor: "rgba(139, 92, 246, 0.2)" }}
          >
            <table>
              <thead>
                <tr>
                  <th>Submission ID</th>
                  <th>User</th>
                  <th>Problem</th>
                  <th>Language</th>
                  <th>Verdict</th>
                  <th>Runtime</th>
                  <th>Submitted At</th>
                  <th style={{ textAlign: "right" }}>Code</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {sub.id.substring(0, 8)}...
                    </td>
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
                      {new Date(sub.created_at).toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedSub(sub)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "3px 10px", fontSize: 12 }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Code Inspection Modal */}
        {selectedSub && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 24,
            }}
          >
            <div
              className="glass-card"
              style={{
                width: "100%",
                maxWidth: 800,
                maxHeight: "85vh",
                overflowY: "auto",
                background: "#161028",
                borderColor: "rgba(139, 92, 246, 0.4)",
                padding: 28,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f3e8ff" }}>
                    Submission: {selectedSub.id}
                  </h2>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <span>By: <strong>{selectedSub.username}</strong></span>
                    <span>•</span>
                    <span>Problem: <strong>{selectedSub.problem_title}</strong></span>
                    <span>•</span>
                    <VerdictBadge verdict={selectedSub.verdict} />
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSub(null)}
                  className="btn btn-secondary btn-sm"
                >
                  ✕ Close
                </button>
              </div>

              {selectedSub.error_message && (
                <div
                  style={{
                    padding: 12,
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#f87171",
                    borderRadius: 8,
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  <strong>Execution Error:</strong>
                  <pre className="mono" style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>
                    {selectedSub.error_message}
                  </pre>
                </div>
              )}

              <div>
                <label className="label" style={{ color: "#d8b4fe" }}>
                  Submitted Source Code ({selectedSub.language})
                </label>
                <pre
                  className="mono"
                  style={{
                    padding: 16,
                    background: "#0a0714",
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
