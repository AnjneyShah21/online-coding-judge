"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface GoogleAuthButtonProps {
  portal: "user" | "admin";
  mode?: "login" | "register";
}

export default function GoogleAuthButton({ portal, mode = "login" }: GoogleAuthButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");

  const presetAccounts = portal === "admin"
    ? [
        { email: "admin@aijudge.local", name: "Administrator", role: "admin" },
        { email: "lead.judge@google.com", name: "Lead Contest Setter", role: "admin" },
      ]
    : [
        { email: "alex.codes@gmail.com", name: "Alex Chen", role: "user" },
        { email: "sarah.dev@gmail.com", name: "Sarah Miller", role: "user" },
        { email: "vikram.sharma@gmail.com", name: "Vikram Sharma", role: "user" },
      ];

  const handleSignIn = async (email: string, name: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          portal,
          google_id: `g_${Math.random().toString(36).substring(2, 10)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Google authentication failed");
        return;
      }

      router.push(data.redirectTo || (portal === "admin" ? "/admin" : "/problems"));
      router.refresh();
    } catch {
      setError("Network error connecting to Google Auth");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="btn"
        style={{
          width: "100%",
          background: "#ffffff",
          color: "#1f2937",
          border: "1px solid #d1d5db",
          fontWeight: 600,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "10px 16px",
          borderRadius: 10,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
          />
        </svg>
        <span>
          {portal === "admin"
            ? "Authorize with Google Admin"
            : mode === "register"
            ? "Sign up with Google"
            : "Continue with Google"}
        </span>
      </button>

      {/* Google Account Picker Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#161622",
              border: "1px solid var(--border-default)",
              borderRadius: 18,
              padding: 28,
              boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" />
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                    {portal === "admin" ? "Google Admin Sign-In" : "Sign in with Google"}
                  </h3>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Choose account to continue to AI Judge
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: "4px 8px", fontSize: 12 }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "var(--accent-red-soft)",
                  color: "var(--accent-red)",
                  fontSize: 13,
                  marginBottom: 16,
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                {error}
              </div>
            )}

            {/* Quick Profile Choices */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {presetAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSignIn(acc.email, acc.name)}
                  disabled={loading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "var(--text-primary)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget.style.borderColor = "var(--accent-blue)"))}
                  onMouseLeave={(e) => ((e.currentTarget.style.borderColor = "var(--border-subtle)"))}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #4285F4, #34A853)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "white",
                    }}
                  >
                    {acc.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{acc.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{acc.email}</div>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>→</span>
                </button>
              ))}
            </div>

            {/* Or enter custom Google account */}
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                Or use another Google account:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  type="email"
                  className="input"
                  placeholder="your.email@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Your Full Name (optional)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleSignIn(customEmail, customName || customEmail.split("@")[0])}
                  disabled={loading || !customEmail}
                  className={portal === "admin" ? "btn btn-admin" : "btn btn-primary"}
                  style={{ width: "100%", marginTop: 4 }}
                >
                  {loading ? <span className="spinner" /> : "Sign in with this Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
