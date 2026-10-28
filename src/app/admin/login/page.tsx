"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
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
      className="auth-page"
      style={{
        background: "radial-gradient(ellipse at top, #1e1338 0%, #0c0817 100%)",
      }}
    >
      <div
        className="auth-card"
        style={{
          border: "1px solid rgba(139, 92, 246, 0.3)",
          boxShadow: "0 20px 50px rgba(139, 92, 246, 0.15)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "var(--admin-gradient)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              boxShadow: "0 0 25px rgba(139, 92, 246, 0.4)",
              marginBottom: 12,
            }}
          >
            🛡️
          </div>
          <h1 className="auth-title" style={{ color: "#f3e8ff" }}>
            Admin Portal
          </h1>
          <p className="auth-subtitle">
            Secure administrative control & problem management
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div
          style={{
            padding: "10px 14px",
            background: "rgba(139, 92, 246, 0.1)",
            borderRadius: 8,
            border: "1px solid rgba(139, 92, 246, 0.2)",
            marginBottom: 20,
            fontSize: 12,
            color: "#c084fc",
          }}
        >
          🔑 Default admin credentials: <br />
          <strong>Email:</strong> admin@aijudge.local <br />
          <strong>Password:</strong> admin123
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label" style={{ color: "#d8b4fe" }}>
              Admin Email
            </label>
            <input
              type="email"
              className="input"
              style={{
                borderColor: "rgba(139, 92, 246, 0.3)",
                background: "rgba(15, 10, 28, 0.7)",
              }}
              placeholder="admin@aijudge.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="label" style={{ color: "#d8b4fe" }}>
              Admin Password
            </label>
            <input
              type="password"
              className="input"
              style={{
                borderColor: "rgba(139, 92, 246, 0.3)",
                background: "rgba(15, 10, 28, 0.7)",
              }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-admin"
            style={{ width: "100%", marginTop: 10, padding: "12px" }}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : "Authorize Admin Access"}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            textAlign: "center",
          }}
        >
          <Link
            href="/login"
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
          >
            ← Return to User Login
          </Link>
        </div>
      </div>
    </div>
  );
}
