"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import UserNav from "@/components/UserNav";

interface Contest {
  id: string;
  title: string;
  slug: string;
  description: string;
  start_time: string;
  end_time: string;
  problem_count?: number;
  participant_count?: number;
}

interface ContestDetails {
  contest: Contest;
  problems: {
    id: string;
    problem_id: string;
    title: string;
    difficulty: string;
    score: number;
    order_index: number;
  }[];
  isRegistered: boolean;
  leaderboard: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    score: number;
    solved_count: number;
  }[];
}

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [contestDetails, setContestDetails] = useState<ContestDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regMsg, setRegMsg] = useState("");

  const fetchContests = async () => {
    try {
      const res = await fetch("/api/contests");
      const data = await res.json();
      if (data && data.contests) {
        setContests(data.contests);
        if (data.contests.length > 0 && !selectedContestId) {
          loadContestDetails(data.contests[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load contests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  const loadContestDetails = async (id: string) => {
    setSelectedContestId(id);
    setDetailsLoading(true);
    setRegMsg("");

    try {
      const res = await fetch(`/api/contests?id=${id}`);
      const data = await res.json();
      if (data.contest) {
        setContestDetails(data);
      }
    } catch (err) {
      console.error("Failed to load contest details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedContestId) return;
    setRegistering(true);
    setRegMsg("");

    try {
      const res = await fetch("/api/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          contest_id: selectedContestId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRegMsg(data.error || "Please log in to register");
      } else {
        setRegMsg("🎉 You are registered for this contest!");
        loadContestDetails(selectedContestId);
      }
    } catch {
      setRegMsg("Network error registering for contest");
    } finally {
      setRegistering(false);
    }
  };

  const getStatus = (start: string, end: string) => {
    const now = new Date().getTime();
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();

    if (now < s) {
      const diffHrs = Math.round((s - now) / (1000 * 60 * 60));
      return { label: `Starts in ${diffHrs > 0 ? diffHrs + "h" : "<1h"}`, isLive: false, isEnded: false, color: "var(--accent-blue)" };
    } else if (now >= s && now <= e) {
      return { label: "● LIVE NOW", isLive: true, isEnded: false, color: "var(--accent-green)" };
    } else {
      return { label: "Ended", isLive: false, isEnded: true, color: "var(--text-muted)" };
    }
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
            background: "linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(139, 92, 246, 0.15) 100%)",
            border: "1px solid var(--border-subtle)",
            marginBottom: 32,
          }}
        >
          <div style={{ maxWidth: 680 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--accent-purple)",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Weekly Arena
            </span>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: "8px 0 10px" }}>
              Weekly Contests
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6 }}>
              Test your algorithmic speed and problem solving under real-time constraints. Compete with participants worldwide on dynamic score leaderboards.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div className="spinner spinner-lg" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-muted)" }}>Loading contests...</p>
          </div>
        ) : contests.length === 0 ? (
          <div className="empty-state glass-card" style={{ padding: 60 }}>
            <div className="empty-icon">🏆</div>
            <h3>No Active Contests</h3>
            <p style={{ color: "var(--text-muted)" }}>
              Weekly contests are scheduled by system admins. Check back soon for the next event!
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 24, alignItems: "start" }}>
            {/* Contest List on Left */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>
                Available Contests
              </h2>

              {contests.map((c) => {
                const status = getStatus(c.start_time, c.end_time);
                const isSelected = selectedContestId === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => loadContestDetails(c.id)}
                    className="glass-card"
                    style={{
                      padding: 18,
                      cursor: "pointer",
                      border: `1px solid ${isSelected ? "var(--accent-blue)" : "var(--border-subtle)"}`,
                      background: isSelected ? "rgba(79, 143, 255, 0.08)" : "var(--bg-card)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                        {c.title}
                      </h3>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: status.color,
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: status.isLive ? "rgba(34, 197, 94, 0.15)" : "var(--bg-elevated)",
                        }}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 12 }}>
                      <span>📅 {new Date(c.start_time).toLocaleDateString()}</span>
                      <span>📝 {c.problem_count || 0} Problems</span>
                      <span>👥 {c.participant_count || 0} Registered</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Contest Details on Right */}
            <div>
              {detailsLoading || !contestDetails ? (
                <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
                  <div className="spinner" style={{ margin: "0 auto 12px" }} />
                  <p style={{ color: "var(--text-muted)" }}>Loading contest overview...</p>
                </div>
              ) : (
                <div className="glass-card" style={{ padding: 28 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
                        {contestDetails.contest.title}
                      </h2>
                      <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
                        {contestDetails.contest.description || "Solve problems against time to climb the leaderboard."}
                      </p>
                    </div>

                    {contestDetails.isRegistered ? (
                      <span
                        style={{
                          padding: "6px 14px",
                          borderRadius: 20,
                          background: "rgba(34, 197, 94, 0.15)",
                          color: "var(--accent-green)",
                          fontSize: 13,
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        ✓ Registered
                      </span>
                    ) : (
                      <button
                        onClick={handleRegister}
                        disabled={registering}
                        className="btn btn-primary"
                        style={{ padding: "8px 18px", fontSize: 13 }}
                      >
                        {registering ? <span className="spinner" /> : "Register Now"}
                      </button>
                    )}
                  </div>

                  {regMsg && (
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: regMsg.includes("🎉") ? "rgba(34, 197, 94, 0.1)" : "var(--accent-red-soft)",
                        color: regMsg.includes("🎉") ? "var(--accent-green)" : "var(--accent-red)",
                        fontSize: 13,
                        marginBottom: 16,
                      }}
                    >
                      {regMsg}
                    </div>
                  )}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      padding: 16,
                      background: "var(--bg-elevated)",
                      borderRadius: 12,
                      marginBottom: 24,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>START TIME</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {new Date(contestDetails.contest.start_time).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>END TIME</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {new Date(contestDetails.contest.end_time).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Contest Problems */}
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                    Contest Problems
                  </h3>

                  {contestDetails.problems.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      Problem set will be unlocked once contest is live.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                      {contestDetails.problems.map((p, idx) => (
                        <div
                          key={p.id || idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            background: "var(--bg-elevated)",
                            borderRadius: 10,
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", width: 20 }}>
                              Q{idx + 1}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{p.title}</span>
                            <span className={`badge badge-${p.difficulty}`} style={{ fontSize: 10 }}>
                              {p.difficulty}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 12, color: "var(--accent-blue)", fontWeight: 700 }}>
                              {p.score} pts
                            </span>
                            <Link
                              href={`/problems/${p.problem_id}`}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "4px 12px", fontSize: 12 }}
                            >
                              Solve →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Contest Leaderboard */}
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                    Contest Standings
                  </h3>

                  {contestDetails.leaderboard.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      No submissions recorded yet for this contest. Be the first to solve!
                    </p>
                  ) : (
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Solved</th>
                            <th>Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contestDetails.leaderboard.map((player, i) => (
                            <tr key={player.id}>
                              <td style={{ fontWeight: 700 }}>#{i + 1}</td>
                              <td>{player.display_name || player.username}</td>
                              <td>{player.solved_count}</td>
                              <td style={{ fontWeight: 700, color: "var(--accent-blue)" }}>
                                {player.score}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
