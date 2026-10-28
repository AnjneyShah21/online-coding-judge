"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import VerdictBadge from "@/components/VerdictBadge";
import { IconUser, IconSearch, IconShield, IconCheck, IconTerminal } from "@/components/Icons";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  display_name: string;
  role: string;
  is_banned: number;
  ban_reason: string | null;
  created_at: string;
  total_submissions: number;
  solved_count: number;
  accepted_submissions: number;
}

interface UserSubmission {
  id: string;
  problem_title: string;
  language: string;
  verdict: string;
  runtime_ms: number | null;
  code: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Observation state
  const [observingUser, setObservingUser] = useState<UserProfile | null>(null);
  const [userSubmissions, setUserSubmissions] = useState<UserSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [inspectedCode, setInspectedCode] = useState<string | null>(null);

  // Ban modal state
  const [banningUser, setBanningUser] = useState<UserProfile | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banLoading, setBanLoading] = useState(false);

  const fetchUsers = () => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.role !== "admin") {
          router.push("/admin/login");
          return;
        }
        return fetch("/api/admin/users");
      })
      .then((res) => (res ? res.json() : null))
      .then((data) => {
        if (data && data.users) {
          setUsers(data.users);
        }
        setLoading(false);
      })
      .catch(() => router.push("/admin/login"));
  };

  useEffect(() => {
    fetchUsers();
  }, [router]);

  const handleObserveUser = async (user: UserProfile) => {
    setObservingUser(user);
    setLoadingSubmissions(true);
    setInspectedCode(null);

    try {
      const res = await fetch(`/api/admin/users?user_id=${user.id}`);
      const data = await res.json();
      if (data.submissions) {
        setUserSubmissions(data.submissions);
      }
    } catch (err) {
      console.error("Failed to load user submissions:", err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleBanSubmit = async () => {
    if (!banningUser) return;
    setBanLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ban",
          user_id: banningUser.id,
          reason: banReason || "Cheating and violation of competitive programming guidelines",
        }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === banningUser.id
              ? { ...u, is_banned: 1, ban_reason: banReason }
              : u
          )
        );
        if (observingUser && observingUser.id === banningUser.id) {
          setObservingUser({ ...observingUser, is_banned: 1, ban_reason: banReason });
        }
        setBanningUser(null);
        setBanReason("");
      }
    } catch (err) {
      console.error("Ban user failed:", err);
    } finally {
      setBanLoading(false);
    }
  };

  const handleUnban = async (user: UserProfile) => {
    if (!confirm(`Are you sure you want to lift the ban on ${user.username}?`)) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unban", user_id: user.id }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, is_banned: 0, ban_reason: null } : u
          )
        );
        if (observingUser && observingUser.id === user.id) {
          setObservingUser({ ...observingUser, is_banned: 0, ban_reason: null });
        }
      }
    } catch (err) {
      console.error("Unban user failed:", err);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name && u.display_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <AdminSidebar />
      <main className="main-with-sidebar" style={{ maxWidth: 1200, paddingTop: 96, paddingBottom: 60, paddingLeft: 32, paddingRight: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="hero-pill" style={{ marginBottom: 12 }}>
              <span className="dot-indicator dot-indicator-rose" />
              <span>Player Moderation & Integrity</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "#ffffff", marginBottom: 6 }}>
              Player Accounts & Anti-Cheat
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              Inspect candidate activity patterns, review submitted code for plagiarism, and enforce account bans.
            </p>
          </div>

          <div style={{ minWidth: 280 }}>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                }}
              >
                <IconSearch size={14} />
              </span>
              <input
                type="text"
                className="input"
                style={{
                  paddingLeft: 36,
                  fontSize: 13,
                  width: "100%",
                }}
                placeholder="Search candidates by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : (
          <div
            className="kokonut-card"
            style={{
              padding: 24,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div className="table-container" style={{ margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Player</th>
                    <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</th>
                    <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                    <th style={{ textAlign: "center", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Solved / Total</th>
                    <th style={{ textAlign: "center", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Accuracy</th>
                    <th style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Joined</th>
                    <th style={{ textAlign: "right", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const accuracy =
                      u.total_submissions > 0
                        ? Math.round((u.accepted_submissions / u.total_submissions) * 100)
                        : 0;

                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: "#ffffff", fontSize: 13 }}>
                            {u.display_name || u.username}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                            @{u.username} • {u.email}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: u.role === "admin" ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.05)",
                              border: `1px solid ${u.role === "admin" ? "rgba(99, 102, 241, 0.3)" : "rgba(255,255,255,0.06)"}`,
                              color: u.role === "admin" ? "#818cf8" : "var(--text-secondary)",
                              fontWeight: 600,
                              fontFamily: "var(--font-mono, monospace)",
                            }}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {u.is_banned ? (
                            <span
                              className="badge badge-wrong_answer"
                              style={{ background: "rgba(244, 63, 94, 0.15)", color: "#fb7185", border: "1px solid rgba(244, 63, 94, 0.25)" }}
                            >
                              Banned
                            </span>
                          ) : (
                            <span className="badge badge-accepted" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <span className="dot-indicator dot-indicator-emerald" />
                              <span>Active</span>
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "center", color: "#ffffff", fontWeight: 600, fontFamily: "var(--font-mono, monospace)", fontSize: 12 }}>
                          {u.solved_count} <span style={{ opacity: 0.4 }}>/ {u.total_submissions}</span>
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 600, fontFamily: "var(--font-mono, monospace)", fontSize: 12 }}>
                          <span style={{ color: accuracy >= 50 ? "#34d399" : "#fbbf24" }}>
                            {accuracy}%
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button
                              onClick={() => handleObserveUser(u)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "4px 10px", fontSize: 11 }}
                            >
                              Inspect Audit
                            </button>

                            {u.role !== "admin" && (
                              u.is_banned ? (
                                <button
                                  onClick={() => handleUnban(u)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: "4px 10px", fontSize: 11, borderColor: "rgba(52, 211, 153, 0.4)", color: "#34d399" }}
                                >
                                  Unban
                                </button>
                              ) : (
                                <button
                                  onClick={() => setBanningUser(u)}
                                  className="btn btn-danger btn-sm"
                                  style={{ padding: "4px 10px", fontSize: 11 }}
                                >
                                  Ban Player
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Observation & Code Inspector Modal */}
        {observingUser && (
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
                maxWidth: 900,
                maxHeight: "88vh",
                overflowY: "auto",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
                padding: 28,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff" }}>
                      Candidate Audit: {observingUser.display_name || observingUser.username}
                    </h2>
                    {observingUser.is_banned ? (
                      <span className="badge badge-wrong_answer">Banned</span>
                    ) : (
                      <span className="badge badge-accepted">Active</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                    Email: {observingUser.email} • Solved: {observingUser.solved_count} • Submissions: {observingUser.total_submissions}
                  </div>
                  {observingUser.is_banned && observingUser.ban_reason && (
                    <div style={{ marginTop: 8, padding: "6px 12px", background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.2)", borderRadius: 6, color: "#fb7185", fontSize: 12 }}>
                      <strong>Ban Reason:</strong> {observingUser.ban_reason}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  {!observingUser.is_banned && observingUser.role !== "admin" && (
                    <button
                      onClick={() => setBanningUser(observingUser)}
                      className="btn btn-danger btn-sm"
                      style={{ fontSize: 11, padding: "4px 10px" }}
                    >
                      Ban Player
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setObservingUser(null);
                      setInspectedCode(null);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: "4px 10px" }}
                  >
                    Close
                  </button>
                </div>
              </div>

              {loadingSubmissions ? (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <div className="spinner" style={{ margin: "0 auto 12px" }} />
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading candidate submission audit log...</p>
                </div>
              ) : userSubmissions.length === 0 ? (
                <div style={{ padding: "30px 0", textAlign: "center" }}>
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No recorded submissions for this player yet.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: inspectedCode ? "1fr 1fr" : "1fr", gap: 20 }}>
                  <div className="table-container" style={{ margin: 0 }}>
                    <table>
                      <thead>
                        <tr>
                          <th style={{ fontSize: 11 }}>Problem</th>
                          <th style={{ fontSize: 11 }}>Lang</th>
                          <th style={{ fontSize: 11 }}>Verdict</th>
                          <th style={{ fontSize: 11 }}>Time</th>
                          <th style={{ fontSize: 11 }}>Inspect</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userSubmissions.map((sub) => (
                          <tr key={sub.id}>
                            <td style={{ fontWeight: 600, color: "#ffffff", fontSize: 12 }}>{sub.problem_title}</td>
                            <td>
                              <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)", fontFamily: "var(--font-mono, monospace)" }}>
                                {sub.language.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <VerdictBadge verdict={sub.verdict} />
                            </td>
                            <td style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                              {new Date(sub.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td>
                              <button
                                onClick={() => setInspectedCode(sub.code)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: "2px 8px", fontSize: 11 }}
                              >
                                View Code
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {inspectedCode && (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "var(--font-mono, monospace)" }}>
                          Submitted Source Code
                        </span>
                        <button
                          onClick={() => setInspectedCode(null)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "2px 6px", fontSize: 10 }}
                        >
                          Close
                        </button>
                      </div>
                      <pre
                        className="mono"
                        style={{
                          flex: 1,
                          padding: 14,
                          background: "rgba(0, 0, 0, 0.4)",
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                          borderRadius: 8,
                          fontSize: 12,
                          overflowX: "auto",
                          maxHeight: 400,
                          lineHeight: 1.5,
                        }}
                      >
                        {inspectedCode}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ban Confirmation Modal */}
        {banningUser && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1100,
              padding: 24,
            }}
          >
            <div
              className="kokonut-card"
              style={{
                width: "100%",
                maxWidth: 480,
                background: "var(--bg-secondary)",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                padding: 28,
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "rgba(244, 63, 94, 0.15)",
                    color: "#fb7185",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <IconShield size={22} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#ffffff" }}>
                  Ban Candidate: {banningUser.username}
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                  This will immediately revoke their access, block submissions, and disqualify them from tournaments.
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="label" style={{ color: "#fb7185" }}>
                  Reason for Ban (Logged & Disclosed to Candidate)
                </label>
                <textarea
                  className="input textarea"
                  rows={3}
                  placeholder="e.g. Plagiarism detected in Weekly Contest or external collaboration"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  style={{ borderColor: "rgba(244, 63, 94, 0.3)" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setBanningUser(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBanSubmit}
                  className="btn btn-danger"
                  disabled={banLoading}
                >
                  {banLoading ? <span className="spinner" /> : "Confirm Permanent Ban"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
