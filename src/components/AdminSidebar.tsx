"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
    { label: "Dashboard", href: "/admin", icon: "📊" },
    { label: "Problems", href: "/admin/problems", icon: "📝" },
    { label: "New Problem", href: "/admin/problems/new", icon: "➕" },
    { label: "All Submissions", href: "/admin/submissions", icon: "⚡" },
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
          height: 64,
          background: "rgba(18, 12, 33, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(139, 92, 246, 0.2)",
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
            className="navbar-brand"
            style={{ color: "#f3e8ff", textDecoration: "none" }}
          >
            <div
              className="logo-icon"
              style={{
                background: "var(--admin-gradient)",
                boxShadow: "0 0 15px rgba(139, 92, 246, 0.4)",
              }}
            >
              🛡️
            </div>
            AI Judge <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 500 }}>(Admin Portal)</span>
          </Link>
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
              background: "rgba(139, 92, 246, 0.25)",
              color: "#c084fc",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              letterSpacing: 0.5,
            }}
          >
            SYSTEM ADMIN
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/problems"
            target="_blank"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 12, borderColor: "rgba(139, 92, 246, 0.2)" }}
          >
            ↗ View Public Site
          </Link>
          <button
            onClick={handleLogout}
            className="btn btn-danger btn-sm"
            style={{ fontSize: 12 }}
          >
            Exit Admin
          </button>
        </div>
      </header>

      {/* Admin Sidebar */}
      <aside
        className="sidebar"
        style={{
          background: "rgba(18, 12, 33, 0.98)",
          borderRight: "1px solid rgba(139, 92, 246, 0.15)",
        }}
      >
        <div style={{ marginBottom: 24, padding: "0 8px" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "rgba(216, 180, 254, 0.6)",
              marginBottom: 8,
            }}
          >
            Management
          </div>
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 16,
            right: 16,
            padding: 14,
            borderRadius: 10,
            background: "rgba(139, 92, 246, 0.08)",
            border: "1px solid rgba(139, 92, 246, 0.15)",
            fontSize: 12,
            color: "#d8b4fe",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>🤖 AI Operations</div>
          <div style={{ opacity: 0.8, fontSize: 11, lineHeight: 1.4 }}>
            Generate test cases & stress-test candidate solutions automatically.
          </div>
        </div>
      </aside>
    </>
  );
}
