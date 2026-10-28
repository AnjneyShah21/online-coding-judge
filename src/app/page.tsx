"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Background effects */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 30%, rgba(79, 143, 255, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.04) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* Floating grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      {/* Nav */}
      <nav className="navbar" style={{ background: "rgba(10,10,15,0.5)" }}>
        <Link href="/" className="navbar-brand">
          <div
            className="logo-icon"
            style={{ background: "var(--gradient-hero)" }}
          >
            ⚡
          </div>
          AI Judge
        </Link>
        <div className="navbar-links">
          <Link href="/login">Log In</Link>
          <Link href="/register" className="btn btn-primary btn-sm">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          padding: "120px 24px 80px",
          maxWidth: 800,
          margin: "0 auto",
        }}
        className={mounted ? "animate-fade-in-up" : ""}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 16px",
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
            background: "var(--accent-blue-soft)",
            color: "var(--accent-blue)",
            marginBottom: 24,
            border: "1px solid rgba(79, 143, 255, 0.2)",
          }}
        >
          🤖 AI-Powered Programming Judge
        </div>

        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 64px)",
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: 20,
            background: "var(--gradient-hero)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundSize: "200% 200%",
            animation: "gradientMove 4s ease infinite",
          }}
        >
          Code. Submit. Conquer.
        </h1>

        <p
          style={{
            fontSize: 18,
            color: "var(--text-secondary)",
            maxWidth: 560,
            margin: "0 auto 40px",
            lineHeight: 1.7,
          }}
        >
          Sharpen your programming skills with curated challenges. Get instant
          feedback, AI-powered hints, and detailed code analysis — all in a
          blazing-fast sandboxed environment.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" className="btn btn-primary btn-lg">
            🚀 Start Coding Now
          </Link>
          <Link href="/admin/login" className="btn btn-secondary btn-lg">
            🔐 Admin Portal
          </Link>
        </div>
      </main>

      {/* Language Tracks Section */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto 40px",
          padding: "0 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--accent-blue)",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Practice By Technology
          </div>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800 }}>
            Choose Your Programming Language
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, maxWidth: 540, margin: "0 auto" }}>
            Admins configure language-tailored problem sets with starter templates. Pick your language track to start practicing.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20,
          }}
        >
          {/* C++ Card */}
          <div
            className="glass-card"
            style={{
              padding: 24,
              border: "1px solid rgba(139, 92, 246, 0.25)",
              background: "linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, rgba(15, 15, 25, 0.8) 100%)",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 36 }}>⚡</div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 12,
                    background: "rgba(139, 92, 246, 0.15)",
                    color: "var(--accent-purple)",
                  }}
                >
                  GCC C++20
                </span>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                C++ Track
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                Competitive programming mastery. STL priority queues, prefix XORs, bit manipulation, and raw hardware speed.
              </p>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                {["STL Queues", "Prefix XOR", "Fast I/O", "Bitsets"].map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "var(--bg-elevated)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href="/problems?lang=cpp"
              className="btn btn-secondary"
              style={{
                width: "100%",
                textAlign: "center",
                padding: "10px 16px",
                borderColor: "rgba(139, 92, 246, 0.4)",
                color: "#e9d5ff",
              }}
            >
              Practice C++ →
            </Link>
          </div>

          {/* Java Card */}
          <div
            className="glass-card"
            style={{
              padding: 24,
              border: "1px solid rgba(239, 68, 68, 0.25)",
              background: "linear-gradient(180deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 15, 25, 0.8) 100%)",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 36 }}>☕</div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 12,
                    background: "rgba(239, 68, 68, 0.15)",
                    color: "#f87171",
                  }}
                >
                  Java 17/21
                </span>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                Java Track
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                Enterprise & OOP algorithmic challenges. HashMaps, PriorityQueues, StringBuilder, and clean object hierarchies.
              </p>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                {["Collections", "HashMap", "Tokenizers", "OOP"].map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "var(--bg-elevated)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href="/problems?lang=java"
              className="btn btn-secondary"
              style={{
                width: "100%",
                textAlign: "center",
                padding: "10px 16px",
                borderColor: "rgba(239, 68, 68, 0.4)",
                color: "#fca5a5",
              }}
            >
              Practice Java →
            </Link>
          </div>

          {/* Python Card */}
          <div
            className="glass-card"
            style={{
              padding: 24,
              border: "1px solid rgba(79, 143, 255, 0.25)",
              background: "linear-gradient(180deg, rgba(79, 143, 255, 0.08) 0%, rgba(15, 15, 25, 0.8) 100%)",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 36 }}>🐍</div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 12,
                    background: "rgba(79, 143, 255, 0.15)",
                    color: "var(--accent-blue)",
                  }}
                >
                  Python 3.10+
                </span>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                Python Track
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                Rapid problem solving, matrix traversals, remainder prefix sums, and elegant dictionary frequencies.
              </p>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                {["Matrix Spiral", "Subarrays", "Dict Math", "Slicing"].map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "var(--bg-elevated)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href="/problems?lang=python"
              className="btn btn-primary"
              style={{ width: "100%", textAlign: "center", padding: "10px 16px" }}
            >
              Practice Python →
            </Link>
          </div>

          {/* JavaScript Card */}
          <div
            className="glass-card"
            style={{
              padding: 24,
              border: "1px solid rgba(245, 158, 11, 0.25)",
              background: "linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 15, 25, 0.8) 100%)",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 36 }}>📜</div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 12,
                    background: "rgba(245, 158, 11, 0.15)",
                    color: "var(--accent-amber)",
                  }}
                >
                  Node.js 20+
                </span>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                JavaScript Track
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                Modern ES6+ algorithms. Recursive JSON object flattening, sliding windows, and Set-based lookup tables.
              </p>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                {["Deep Flatten", "Sliding Window", "ES6 Set", "JSON Parse"].map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "var(--bg-elevated)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href="/problems?lang=javascript"
              className="btn btn-secondary"
              style={{
                width: "100%",
                textAlign: "center",
                padding: "10px 16px",
                borderColor: "rgba(245, 158, 11, 0.4)",
                color: "#fde68a",
              }}
            >
              Practice JavaScript →
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "40px 24px 100px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {[
          {
            icon: "⚡",
            title: "Sandboxed Execution",
            desc: "Code runs in isolated bwrap containers with strict time & memory limits. Safe and secure.",
            color: "var(--accent-blue)",
            bg: "var(--accent-blue-soft)",
          },
          {
            icon: "🤖",
            title: "AI Smart Hints",
            desc: "Stuck on a problem? Get progressive hints powered by AI — from gentle nudges to detailed guidance.",
            color: "var(--accent-purple)",
            bg: "var(--accent-purple-soft)",
          },
          {
            icon: "📊",
            title: "Code Analysis",
            desc: "Get instant complexity analysis, code quality scoring, and improvement suggestions from AI.",
            color: "var(--accent-cyan)",
            bg: "var(--accent-cyan-soft)",
          },
          {
            icon: "🧪",
            title: "AI Test Generation",
            desc: "Admins can auto-generate edge-case test inputs using AI to build robust problem sets.",
            color: "var(--accent-green)",
            bg: "var(--accent-green-soft)",
          },
          {
            icon: "🌐",
            title: "Multi-Language",
            desc: "Submit solutions in Python, C++, or JavaScript. More languages coming soon.",
            color: "var(--accent-amber)",
            bg: "var(--accent-amber-soft)",
          },
          {
            icon: "🏆",
            title: "Leaderboard",
            desc: "Compete with other coders. Climb the rankings by solving more problems.",
            color: "var(--accent-red)",
            bg: "var(--accent-red-soft)",
          },
        ].map((feat, i) => (
          <div
            key={feat.title}
            className="glass-card"
            style={{
              padding: 28,
              animationDelay: `${i * 0.1}s`,
              opacity: mounted ? 1 : 0,
              animation: mounted
                ? `fadeInUp 0.5s ease-out ${i * 0.1}s forwards`
                : "none",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                background: feat.bg,
                marginBottom: 16,
              }}
            >
              {feat.icon}
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
              {feat.title}
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
              {feat.desc}
            </p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "24px",
          textAlign: "center",
          fontSize: 13,
          color: "var(--text-muted)",
        }}
      >
        Built with ⚡ AI Judge — Default admin: admin@aijudge.local / admin123
      </footer>
    </div>
  );
}
