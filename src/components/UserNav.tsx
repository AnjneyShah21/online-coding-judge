"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconCode, IconTrophy, IconChart, IconTerminal, IconUser } from "@/components/Icons";

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

  const navLinks = [
    { href: "/problems", label: "Problems", icon: IconCode },
    { href: "/contests", label: "Contests", icon: IconTrophy },
    { href: "/submissions", label: "Submissions", icon: IconTerminal },
    { href: "/leaderboard", label: "Leaderboard", icon: IconTrophy },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        background: "rgba(9, 9, 11, 0.8)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 20px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Brand / Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "#ffffff",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "#18181f",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
              color: "#f4f4f5",
            }}
          >
            <IconCode size={15} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>
            AI Judge
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--font-mono, monospace)",
              padding: "2px 6px",
              borderRadius: 4,
              background: "rgba(255, 255, 255, 0.05)",
              color: "var(--text-muted)",
              border: "1px solid rgba(255, 255, 255, 0.07)",
            }}
          >
            v2.4
          </span>
        </Link>

        {/* Navigation Items */}
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/problems"
                ? pathname?.startsWith("/problems")
                : item.href === "/contests"
                ? pathname?.startsWith("/contests")
                : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  color: isActive ? "#ffffff" : "var(--text-muted)",
                  background: isActive ? "rgba(255, 255, 255, 0.07)" : "transparent",
                  border: isActive
                    ? "1px solid rgba(255, 255, 255, 0.1)"
                    : "1px solid transparent",
                }}
              >
                <Icon size={14} style={{ opacity: isActive ? 1 : 0.7 }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right User Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {user.role === "admin" && (
                <Link
                  href="/admin/problems"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: "rgba(99, 102, 241, 0.12)",
                    color: "#a5b4fc",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                    textDecoration: "none",
                  }}
                >
                  Admin Console
                </Link>
              )}

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 10px",
                  borderRadius: 8,
                  background: "#18181f",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  fontSize: 12,
                  color: "var(--text-secondary)",
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    color: "#ffffff",
                    fontWeight: 600,
                  }}
                >
                  {(user.display_name || user.username || "U")[0].toUpperCase()}
                </div>
                <span>{user.display_name || user.username}</span>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                style={{
                  padding: "5px 10px",
                  fontSize: 12,
                  borderRadius: 7,
                  background: "transparent",
                  borderColor: "rgba(255, 255, 255, 0.08)",
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link
                href="/login"
                className="btn btn-secondary btn-sm"
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  borderRadius: 8,
                }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn btn-primary btn-sm"
                style={{
                  padding: "6px 14px",
                  fontSize: 12,
                  borderRadius: 8,
                }}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
