"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import GoogleAuthButton from "@/components/GoogleAuthButton";

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
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <Link href="/" className="navbar-brand" style={{ justifyContent: "center" }}>
            <div className="logo-icon" style={{ background: "var(--user-gradient)" }}>
              ⚡
            </div>
            AI Judge
          </Link>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to start practicing & solve problems</p>

        {error && <div className="error-message">{error}</div>}

        <div style={{ marginBottom: 20 }}>
          <GoogleAuthButton portal="user" mode="login" />
        </div>

        <div className="form-divider">or sign in with email</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="form-divider">or</div>

        <p
          style={{
            textAlign: "center",
            fontSize: 14,
            color: "var(--text-muted)",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            style={{ color: "var(--accent-blue)", fontWeight: 600 }}
          >
            Sign up
          </Link>
        </p>

        <p
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "var(--text-muted)",
            marginTop: 12,
          }}
        >
          <Link
            href="/admin/login"
            style={{ color: "var(--accent-purple)", fontWeight: 500 }}
          >
            Admin login →
          </Link>
        </p>
      </div>
    </div>
  );
}
