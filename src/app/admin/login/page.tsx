"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { IconShield, IconLock, IconUser, IconChevronRight, IconCheck } from "@/components/Icons";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleQuickFill = () => {
    setEmail("admin@aijudge.local");
    setPassword("admin123");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      if (data.user.role !== "admin") {
        // Disallow regular users from using the admin portal
        await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "logout" }),
        });
        setError("Access Denied: This portal is reserved strictly for Platform Administrators.");
        return;
      }

      router.push("/admin");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        background: "var(--bg-primary)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient Radial Lighting Glows */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 600,
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "15%",
          width: 400,
          height: 400,
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(50px)",
        }}
      />

      {/* Main Kokonut Glass Card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 460,
          background: "rgba(17, 17, 24, 0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 20,
          padding: 32,
          boxShadow: "0 24px 60px -12px rgba(0, 0, 0, 0.6), 0 0 35px rgba(168, 85, 247, 0.12)",
        }}
      >
        {/* Header Badges & Title */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", marginBottom: 14 }}>
            <div className="hero-pill" style={{ background: "rgba(168, 85, 247, 0.1)", borderColor: "rgba(168, 85, 247, 0.25)" }}>
              <span className="dot-indicator dot-indicator-emerald" />
              <span style={{ color: "#d8b4fe" }}>System Moderation Portal</span>
            </div>
          </div>

          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)",
              border: "1px solid rgba(168, 85, 247, 0.35)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#c084fc",
              boxShadow: "0 0 24px rgba(168, 85, 247, 0.25)",
              marginBottom: 14,
            }}
          >
            <IconShield size={26} />
          </div>

          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              marginBottom: 6,
            }}
          >
            Admin Command Center
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
            Restricted access for challenge setters and platform hosts.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(244, 63, 94, 0.1)",
              border: "1px solid rgba(244, 63, 94, 0.25)",
              color: "#fb7185",
              fontSize: 12,
              marginBottom: 18,
              lineHeight: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Demo Credentials Auto-Fill Banner */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)", marginBottom: 2 }}>
              Default Admin Account
            </div>
            <div style={{ fontSize: 12, color: "#e2e8f0", fontFamily: "var(--font-mono, monospace)" }}>
              admin@aijudge.local • admin123
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickFill}
            style={{
              background: copied ? "rgba(16, 185, 129, 0.15)" : "rgba(168, 85, 247, 0.15)",
              border: copied ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid rgba(168, 85, 247, 0.35)",
              color: copied ? "#34d399" : "#c084fc",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
          >
            {copied ? (
              <>
                <IconCheck size={12} />
                <span>Filled!</span>
              </>
            ) : (
              <span>Auto-Fill</span>
            )}
          </button>
        </div>

        {/* Google OAuth Option */}
        <div style={{ marginBottom: 18 }}>
          <GoogleAuthButton portal="admin" mode="login" />
        </div>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "20px 0",
            color: "var(--text-muted)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "rgba(255, 255, 255, 0.08)" }} />
          <span>or credentials</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255, 255, 255, 0.08)" }} />
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-secondary)",
                marginBottom: 6,
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              Admin Email
            </label>
            <input
              type="email"
              className="input"
              style={{
                height: 42,
                fontSize: 13,
                background: "#0c0c11",
                borderColor: "rgba(255, 255, 255, 0.1)",
                fontFamily: "var(--font-mono, monospace)",
              }}
              placeholder="admin@aijudge.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-secondary)",
                marginBottom: 6,
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              Admin Password
            </label>
            <input
              type="password"
              className="input"
              style={{
                height: 42,
                fontSize: 13,
                background: "#0c0c11",
                borderColor: "rgba(255, 255, 255, 0.1)",
                fontFamily: "var(--font-mono, monospace)",
              }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              height: 44,
              borderRadius: 10,
              background: "linear-gradient(135deg, #9333ea 0%, #6366f1 100%)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 16px rgba(147, 51, 234, 0.3)",
              transition: "all 0.2s ease",
            }}
          >
            {loading ? (
              <div className="spinner" />
            ) : (
              <>
                <IconShield size={16} />
                <span>Authorize Admin Session</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
          }}
        >
          <Link
            href="/login"
            style={{
              color: "var(--text-muted)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>← User Login</span>
          </Link>
          <Link
            href="/problems"
            style={{
              color: "#c084fc",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Player Arena →
          </Link>
        </div>
      </div>
    </div>
  );
}
