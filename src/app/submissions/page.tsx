"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import UserNav from "@/components/UserNav";
import VerdictBadge from "@/components/VerdictBadge";

interface UserSubmission {
  id: string;
  problem_id: string;
  problem_title: string;
  problem_slug: string;
  language: string;
  verdict: string;
  runtime_ms: number | null;
  memory_kb: number | null;
  created_at: string;
  code: string;
}

export default function SubmissionsHistoryPage() {
  const [submissions, setSubmissions] = useState<UserSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<UserSubmission | null>(null);

  useEffect(() => {
    fetch("/api/submissions")
      .then((res) => res.json())
      .then((data) => {
        if (data.submissions) {
          setSubmissions(data.submissions);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <UserNav />

      <main className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Submissions</h1>
          <p className="page-subtitle">
            Track your submission history, execution times, and evaluation verdicts.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div className="spinner spinner-lg" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-muted)" }}>Loading your submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="empty-state glass-card" style={{ padding: 60 }}>
            <div className="empty-icon">📂</div>
            <h3>No Submissions Yet</h3>
            <p style={{ maxWidth: 400, margin: "8px auto 20px", color: "var(--text-muted)" }}>
              Pick a challenge from the catalog and submit your first solution!
            </p>
            <Link href="/problems" className="btn btn-primary">
              Browse Problems →
            </Link>
          </div>
        ) : (
          <div className="table-container glass-card">
            <table>
              <thead>
                <tr>
                  <th>Submission ID</th>
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
                    <td>
                      <Link
                        href={`/problems/${sub.problem_id}`}
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          textDecoration: "none",
                        }}
                      >
                        {sub.problem_title}
                      </Link>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          background: "var(--bg-elevated)",
                        }}
                      >
                        {sub.language}
                      </span>
                    </td>
                    <td>
                      <VerdictBadge verdict={sub.verdict} />
                    </td>
                    <td className="mono">
                      {sub.runtime_ms != null ? `${sub.runtime_ms} ms` : "—"}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {new Date(sub.created_at).toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedSub(sub)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "3px 10px", fontSize: 12 }}
                      >
                        View Code
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* View Code Modal */}
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
                maxWidth: 720,
                maxHeight: "85vh",
                overflowY: "auto",
                background: "var(--bg-card)",
                padding: 28,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                    {selectedSub.problem_title}
                  </h2>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <VerdictBadge verdict={selectedSub.verdict} />
                    <span>•</span>
                    <span className="mono" style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {selectedSub.language}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSub(null)}
                  className="btn btn-secondary btn-sm"
                >
                  ✕ Close
                </button>
              </div>

              <pre
                className="mono"
                style={{
                  padding: 16,
                  background: "var(--bg-primary)",
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
        )}
      </main>
    </div>
  );
}
