"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { IconCode, IconCheck, IconChevronRight } from "@/components/Icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

      if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/problems");
      }
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
      {/* Ambient Lighting */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 500,
          height: 500,
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, rgba(99, 102, 241, 0.04) 50%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(60px)",
        }}
      />

      {/* Main Kokonut Glass Card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: 440,
          background: "rgba(17, 17, 24, 0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 20,
          padding: 32,
          boxShadow: "0 24px 60px -12px rgba(0, 0, 0, 0.6), 0 0 35px rgba(56, 189, 248, 0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", marginBottom: 14 }}>
            <div className="hero-pill">
              <span className="dot-indicator dot-indicator-emerald" />
              <span>Competitive Online Judge</span>
            </div>
          </div>

          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#38bdf8",
              boxShadow: "0 0 24px rgba(56, 189, 248, 0.2)",
              marginBottom: 14,
            }}
          >
            <IconCode size={24} />
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
            Welcome Back
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            Sign in to access your problem catalog, save code, and build your daily streak.
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
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <GoogleAuthButton portal="user" mode="login" />
        </div>

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
          <span>or sign in with email</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255, 255, 255, 0.08)" }} />
        </div>

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
              Email Address
            </label>
            <input
              type="email"
              className="input"
              style={{
                height: 42,
                fontSize: 13,
                background: "#0c0c11",
                borderColor: "rgba(255, 255, 255, 0.1)",
              }}
              placeholder="you@example.com"
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
              Password
            </label>
            <input
              type="password"
              className="input"
              style={{
                height: 42,
                fontSize: 13,
                background: "#0c0c11",
                borderColor: "rgba(255, 255, 255, 0.1)",
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
            className="btn btn-primary"
            style={{
              marginTop: 6,
              height: 42,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {loading ? <div className="spinner" /> : "Sign In to Account"}
          </button>
        </form>

        <div
          style={{
            marginTop: 22,
            paddingTop: 16,
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            textAlign: "center",
            fontSize: 13,
            color: "var(--text-muted)",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "#38bdf8", fontWeight: 600, textDecoration: "none" }}>
            Sign up
          </Link>
        </div>

        <div style={{ marginTop: 10, textAlign: "center", fontSize: 12 }}>
          <Link href="/admin/login" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
            Admin Portal Access →
          </Link>
        </div>
      </div>
    </div>
  );
}
