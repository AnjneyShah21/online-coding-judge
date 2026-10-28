"use client";
import { useEffect, useState } from "react";
import UserNav from "@/components/UserNav";

interface LeaderboardUser {
  id: string;
  username: string;
  display_name: string;
  solved_count: number;
  total_submissions: number;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.leaderboard) {
          setUsers(data.leaderboard);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span style={{ fontSize: 20 }}>🥇</span>;
    if (rank === 2) return <span style={{ fontSize: 20 }}>🥈</span>;
    if (rank === 3) return <span style={{ fontSize: 20 }}>🥉</span>;
    return (
      <span
        style={{
          width: 24,
          height: 24,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
          background: "var(--bg-elevated)",
          fontSize: 12,
          fontWeight: 700,
          color: "var(--text-muted)",
        }}
      >
        {rank}
      </span>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <UserNav />

      <main className="page-container">
        <div className="page-header">
          <h1 className="page-title">Global Leaderboard</h1>
          <p className="page-subtitle">
            Top algorithmic programmers ranked by verified problem submissions.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div className="spinner spinner-lg" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-muted)" }}>Calculating rankings...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state glass-card" style={{ padding: 60 }}>
            <div className="empty-icon">🏆</div>
            <h3>Leaderboard Empty</h3>
            <p style={{ color: "var(--text-muted)" }}>
              Solve challenges to claim the top spot on the leaderboard!
            </p>
          </div>
        ) : (
          <div className="table-container glass-card">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Rank</th>
                  <th>Coder</th>
                  <th style={{ textAlign: "center" }}>Problems Solved</th>
                  <th style={{ textAlign: "center" }}>Total Submissions</th>
                  <th style={{ textAlign: "right" }}>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => {
                  const rank = index + 1;
                  const rate =
                    u.total_submissions > 0
                      ? Math.round((u.solved_count / u.total_submissions) * 100)
                      : 0;
                  return (
                    <tr key={u.id}>
                      <td style={{ verticalAlign: "middle" }}>{getRankBadge(rank)}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                          {u.display_name || u.username}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          @{u.username}
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: 6,
                            background: "rgba(34, 197, 94, 0.15)",
                            color: "var(--accent-green)",
                            fontWeight: 700,
                            fontSize: 14,
                          }}
                        >
                          {u.solved_count}
                        </span>
                      </td>
                      <td style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                        {u.total_submissions}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        <span style={{ color: rate >= 60 ? "var(--accent-green)" : "var(--accent-amber)" }}>
                          {rate}%
                        </span>
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
