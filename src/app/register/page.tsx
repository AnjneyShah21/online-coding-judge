"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import GoogleAuthButton from "@/components/GoogleAuthButton";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
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
        body: JSON.stringify({
          action: "register",
          username,
          email,
          password,
          display_name: displayName || username,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/problems");
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
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join developers solving algorithmic challenges</p>

        {error && <div className="error-message">{error}</div>}

        <div style={{ marginBottom: 20 }}>
          <GoogleAuthButton portal="user" mode="register" />
        </div>

        <div className="form-divider">or register with email</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Username</label>
            <input
              type="text"
              className="input"
              placeholder="coder_sam"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Display Name</label>
            <input
              type="text"
              className="input"
              placeholder="Sam Coder"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="sam@example.com"
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
              minLength={6}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : "Create Account"}
          </button>
        </form>

        <div className="form-divider">or</div>

        <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent-blue)", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
