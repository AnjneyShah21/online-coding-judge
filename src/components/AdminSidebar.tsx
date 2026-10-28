"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconChart,
  IconCode,
  IconTrophy,
  IconShield,
  IconTerminal,
  IconChevronRight,
} from "@/components/Icons";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/admin/login");
  };

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: IconChart },
    { label: "Problem Registry", href: "/admin/problems", icon: IconCode },
    { label: "Provision Problem", href: "/admin/problems/new", icon: IconCode },
    { label: "Weekly Contests", href: "/admin/contests", icon: IconTrophy },
    { label: "Player Moderation", href: "/admin/users", icon: IconShield },
    { label: "Live Submissions", href: "/admin/submissions", icon: IconTerminal },
  ];

  return (
    <>
      {/* Admin Top Bar */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          background: "rgba(9, 9, 11, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          zIndex: 99,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/admin"
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
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "#18181f",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c084fc",
              }}
            >
              <IconShield size={14} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>
              Admin Console
            </span>
          </Link>

          <span className="hero-pill" style={{ padding: "2px 8px", fontSize: 10 }}>
            <span className="dot-indicator dot-indicator-emerald" />
            <span>Sandbox Active</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/problems"
            target="_blank"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 11, padding: "5px 12px", borderRadius: 7 }}
          >
            Public Site ↗
          </Link>
          <button
            onClick={handleLogout}
            className="btn btn-danger btn-sm"
            style={{ fontSize: 11, padding: "5px 12px", borderRadius: 7 }}
          >
            Exit Console
          </button>
        </div>
      </header>

      {/* Admin Sidebar */}
      <aside
        className="sidebar"
        style={{
          background: "#0c0c10",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          top: 56,
          height: "calc(100vh - 56px)",
        }}
      >
        <div style={{ marginBottom: 24, padding: "0 8px" }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
              marginBottom: 10,
              fontFamily: "var(--font-mono, monospace)",
              paddingLeft: 8,
            }}
          >
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  color: isActive ? "#ffffff" : "var(--text-muted)",
                  background: isActive ? "rgba(255, 255, 255, 0.08)" : "transparent",
                  border: isActive ? "1px solid rgba(255, 255, 255, 0.09)" : "1px solid transparent",
                  textDecoration: "none",
                  marginBottom: 3,
                }}
              >
                <Icon size={14} style={{ opacity: isActive ? 1 : 0.7 }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 14,
            right: 14,
            padding: 12,
            borderRadius: 10,
            background: "#121217",
            border: "1px solid rgba(255, 255, 255, 0.07)",
            fontSize: 11,
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ fontWeight: 600, color: "#ffffff", marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}>
            <span className="dot-indicator dot-indicator-emerald" />
            <span>Sandbox Isolation</span>
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 10, lineHeight: 1.4, fontFamily: "var(--font-mono, monospace)" }}>
            Bubblewrap unshared PID, NET, IPC namespaces enabled.
          </div>
        </div>
      </aside>
    </>
  );
}
