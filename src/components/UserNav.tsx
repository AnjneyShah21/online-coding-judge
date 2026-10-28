"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UserInfo {
  id: string;
  username: string;
  display_name: string;
  role: string;
}

export default function UserNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setUser(null);
    router.push("/login");
  };

  return (
    <nav className="navbar">
      <Link href="/problems" className="navbar-brand">
        <div className="logo-icon" style={{ background: "var(--user-gradient)" }}>
          ⚡
        </div>
        AI Judge
      </Link>

      <div className="navbar-links">
        <Link
          href="/problems"
          className={pathname?.startsWith("/problems") ? "active" : ""}
        >
          Problems
        </Link>
        <Link
          href="/contests"
          className={pathname?.startsWith("/contests") ? "active" : ""}
        >
          🏆 Contests
        </Link>
        <Link
          href="/dashboard"
          className={pathname === "/dashboard" ? "active" : ""}
        >
          📈 Dashboard
        </Link>
        <Link
          href="/submissions"
          className={pathname === "/submissions" ? "active" : ""}
        >
          My Submissions
        </Link>
        <Link
          href="/leaderboard"
          className={pathname === "/leaderboard" ? "active" : ""}
        >
          Leaderboard
        </Link>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 12 }}>
            <span
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
                padding: "4px 10px",
                borderRadius: 6,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              👤 {user.display_name || user.username}
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              style={{ padding: "5px 12px", fontSize: 12 }}
            >
              Log out
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, marginLeft: 12 }}>
            <Link href="/login" className="btn btn-secondary btn-sm">
              Log in
            </Link>
            <Link href="/register" className="btn btn-primary btn-sm">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
