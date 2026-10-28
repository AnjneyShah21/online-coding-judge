"use client";
import Link from "next/link";
import { useState } from "react";

const CODE_SNIPPETS = {
  cpp: {
    lang: "C++20",
    file: "Solution.cpp",
    badge: "⚡ GCC 13 • Fast I/O",
    code: `#include <iostream>
#include <vector>
#include <queue>
#include <unordered_map>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, k;
    if (!(cin >> n >> k)) return 0;
    
    // Bubblewrap container executes in unshared rootless namespace
    cout << "Allocating STL PriorityQueue...\\n";
    cout << "Execution: 4ms • Memory: 1.8MB • Verdict: AC\\n";
    return 0;
}`,
    runtime: "4 ms",
    memory: "1.8 MB",
  },
  java: {
    lang: "Java 21",
    file: "Solution.java",
    badge: "☕ OpenJDK 21 • Stream API",
    code: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        Map<String, Integer> freq = new HashMap<>();
        
        // JVM sandboxed runner with CPU & Memory cgroups
        System.out.println("Building HashMap buckets...");
        System.out.println("Execution: 12ms • Memory: 14.2MB • Verdict: AC");
    }
}`,
    runtime: "12 ms",
    memory: "14.2 MB",
  },
  python: {
    lang: "Python 3.12",
    file: "solution.py",
    badge: "🐍 Python 3.12 • CPython",
    code: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
        
    # Pythonic remainder prefix sum
    print("Running linear pass with dict lookups...")
    print("Execution: 18ms • Memory: 3.4MB • Verdict: AC")

solve()`,
    runtime: "18 ms",
    memory: "3.4 MB",
  },
  javascript: {
    lang: "Node.js 20",
    file: "solution.js",
    badge: "📜 V8 Engine • ES2024",
    code: `const fs = require('fs');

function main() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    const seen = new Set();
    
    // High-performance V8 sliding window
    console.log("Analyzing unique character intervals...");
    console.log("Execution: 8ms • Memory: 5.1MB • Verdict: AC");
}

main();`,
    runtime: "8 ms",
    memory: "5.1 MB",
  },
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"cpp" | "java" | "python" | "javascript">("cpp");
  const [runningDemo, setRunningDemo] = useState(false);
  const [demoOutput, setDemoOutput] = useState<string | null>(null);

  const currentSnippet = CODE_SNIPPETS[activeTab];

  const handleRunDemo = () => {
    setRunningDemo(true);
    setDemoOutput(null);
    setTimeout(() => {
      setDemoOutput(
        `✓ Compilation & Sandbox Initialization Complete\n⚡ Runtime: ${currentSnippet.runtime} | 💾 Memory: ${currentSnippet.memory}\n🚀 Verdict: ACCEPTED (All hidden test cases passed)`
      );
      setRunningDemo(false);
    }, 700);
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", background: "#09090b" }}>
      {/* Background Dot Mesh and Ambient Spotlight */}
      <div className="dot-mesh-bg" />
      <div
        style={{
          position: "absolute",
          top: -100,
          left: "50%",
          transform: "translateX(-50%)",
          width: 800,
          height: 400,
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.03) 50%, transparent 80%)",
          pointerEvents: "none",
          filter: "blur(60px)",
        }}
      />

      {/* Floating Modern Header */}
      <nav className="navbar" style={{ maxWidth: 1140, margin: "16px auto 0", borderRadius: 16, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <Link href="/" className="navbar-brand">
          <div
            className="logo-icon"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            ⚡
          </div>
          <span style={{ fontWeight: 700, letterSpacing: "-0.02em", color: "#ffffff" }}>
            AI Judge
          </span>
        </Link>

        <div className="navbar-links">
          <Link href="/problems">Problems</Link>
          <Link href="/contests">Contests</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <div style={{ width: 1, height: 16, background: "rgba(255, 255, 255, 0.12)", margin: "0 4px" }} />
          <Link href="/login" style={{ fontSize: 13 }}>Log In</Link>
          <Link href="/register" className="btn btn-primary btn-sm" style={{ padding: "5px 12px", fontSize: 12 }}>
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          padding: "80px 24px 40px",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {/* Kokonut Status Chip */}
        <div style={{ marginBottom: 20 }}>
          <div className="pill-chip">
            <span className="status-dot" />
            <span style={{ color: "#ffffff", fontWeight: 600 }}>Linux Bubblewrap Sandbox</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>Zero network isolation</span>
          </div>
        </div>

        {/* Hero Title with Metallic Fade */}
        <h1
          style={{
            fontSize: "clamp(38px, 6vw, 68px)",
            fontWeight: 800,
            letterSpacing: "-0.035em",
            lineHeight: 1.08,
            marginBottom: 20,
            color: "#ffffff",
          }}
        >
          The Competitive Judge for{" "}
          <span
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Modern Engineers
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(15px, 2vw, 18px)",
            color: "var(--text-secondary)",
            maxWidth: 620,
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          Untrusted code execution with strict POSIX limits, dedicated language question tracks for C++, Java, Python, and JavaScript, and instant AI debugging insights.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 60 }}>
          <Link href="/problems" className="btn btn-primary btn-lg">
            Start Solving Problems →
          </Link>
          <Link href="/admin/login" className="btn btn-secondary btn-lg">
            🔐 Admin Console
          </Link>
        </div>

        {/* KokonutUI Live Sandbox Playground Window */}
        <div
          className="kokonut-card border-shimmer"
          style={{
            textAlign: "left",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)",
            background: "#0c0c10",
          }}
        >
          {/* Top Window Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 16px",
              background: "#111116",
              borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* macOS Dots */}
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
              </div>

              {/* Language Switcher Tabs inside Window */}
              <div className="tabs" style={{ padding: 2 }}>
                {[
                  { id: "cpp", label: "⚡ Solution.cpp" },
                  { id: "java", label: "☕ Solution.java" },
                  { id: "python", label: "🐍 solution.py" },
                  { id: "javascript", label: "📜 solution.js" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTab(t.id as any);
                      setDemoOutput(null);
                    }}
                    className={`tab ${activeTab === t.id ? "active" : ""}`}
                    style={{ fontSize: 11, padding: "4px 10px" }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
                {currentSnippet.badge}
              </span>
              <button
                onClick={handleRunDemo}
                disabled={runningDemo}
                className="btn btn-sm btn-primary"
                style={{ padding: "4px 12px", fontSize: 11 }}
              >
                {runningDemo ? <span className="spinner" /> : "▶ Test Run"}
              </button>
            </div>
          </div>

          {/* Code Body */}
          <div style={{ padding: "18px 20px", position: "relative" }}>
            <pre
              className="mono"
              style={{
                fontSize: 12.5,
                lineHeight: 1.6,
                color: "#e4e4e7",
                overflowX: "auto",
                margin: 0,
              }}
            >
              {currentSnippet.code}
            </pre>

            {demoOutput && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  color: "#34d399",
                  fontSize: 12,
                  fontFamily: "monospace",
                  whiteSpace: "pre-line",
                  lineHeight: 1.6,
                  animation: "fadeIn 0.2s ease-out",
                }}
              >
                {demoOutput}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 4 Dedicated Language Tracks (Kokonut Card Spotlight) */}
      <section
        style={{
          maxWidth: 1140,
          margin: "0 auto 80px",
          padding: "0 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div className="pill-chip" style={{ marginBottom: 10 }}>
            <span>Curated Track Isolation</span>
          </div>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#ffffff" }}>
            Dedicated Language Problem Tracks
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 540, margin: "0 auto" }}>
            No generic overlapping questions. Every track features specialized questions designed around the language&apos;s unique standard libraries and paradigms.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {/* C++ Card */}
          <div
            className="kokonut-card border-shimmer"
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(168, 85, 247, 0.12)",
                    border: "1px solid rgba(168, 85, 247, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  ⚡
                </div>
                <span className="badge badge-accepted" style={{ background: "rgba(168, 85, 247, 0.1)", color: "#c084fc", borderColor: "rgba(168, 85, 247, 0.25)" }}>
                  GCC C++20
                </span>
              </div>

              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: "#ffffff" }}>
                C++ Track
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                Tailored for competitive programming. STL priority queues, custom comparators, prefix XORs, and zero-overhead memory efficiency.
              </p>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                {["PriorityQueue", "Bitwise XOR", "Fast I/O", "STL"].map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "rgba(255, 255, 255, 0.04)",
                      color: "var(--text-muted)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
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
              style={{ width: "100%", textAlign: "center", borderColor: "rgba(168, 85, 247, 0.3)" }}
            >
              Practice C++ Track →
            </Link>
          </div>

          {/* Java Card */}
          <div
            className="kokonut-card border-shimmer"
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(244, 63, 94, 0.12)",
                    border: "1px solid rgba(244, 63, 94, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  ☕
                </div>
                <span className="badge badge-accepted" style={{ background: "rgba(244, 63, 94, 0.1)", color: "#fb7185", borderColor: "rgba(244, 63, 94, 0.25)" }}>
                  Java 21
                </span>
              </div>

              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: "#ffffff" }}>
                Java Track
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                Enterprise & OOP algorithmic challenges. HashMaps, Character array sorting, StringBuilders, and clean object hierarchies.
              </p>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                {["Collections", "HashMap", "Tokenizers", "Streams"].map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "rgba(255, 255, 255, 0.04)",
                      color: "var(--text-muted)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
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
              style={{ width: "100%", textAlign: "center", borderColor: "rgba(244, 63, 94, 0.3)" }}
            >
              Practice Java Track →
            </Link>
          </div>

          {/* Python Card */}
          <div
            className="kokonut-card border-shimmer"
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(96, 165, 250, 0.12)",
                    border: "1px solid rgba(96, 165, 250, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  🐍
                </div>
                <span className="badge badge-accepted" style={{ background: "rgba(96, 165, 250, 0.1)", color: "#60a5fa", borderColor: "rgba(96, 165, 250, 0.25)" }}>
                  Python 3.12
                </span>
              </div>

              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: "#ffffff" }}>
                Python Track
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                Pythonic logic and mathematical intuition. Subarray remainder frequencies, coordinate spiral traversals, and dict lookups.
              </p>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                {["Subarray Modulo", "Spiral Matrix", "Slicing", "Dict"].map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "rgba(255, 255, 255, 0.04)",
                      color: "var(--text-muted)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href="/problems?lang=python"
              className="btn btn-secondary"
              style={{ width: "100%", textAlign: "center", borderColor: "rgba(96, 165, 250, 0.3)" }}
            >
              Practice Python Track →
            </Link>
          </div>

          {/* JavaScript Card */}
          <div
            className="kokonut-card border-shimmer"
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(245, 158, 11, 0.12)",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                  }}
                >
                  📜
                </div>
                <span className="badge badge-accepted" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#fbbf24", borderColor: "rgba(245, 158, 11, 0.25)" }}>
                  Node.js 20
                </span>
              </div>

              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: "#ffffff" }}>
                JavaScript Track
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                Modern ES6+ data transformations. Recursive JSON key path flattening, sliding windows, and Set-based lookups.
              </p>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                {["Deep Object", "Sliding Window", "ES6 Set", "JSON"].map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "rgba(255, 255, 255, 0.04)",
                      color: "var(--text-muted)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
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
              style={{ width: "100%", textAlign: "center", borderColor: "rgba(245, 158, 11, 0.3)" }}
            >
              Practice JavaScript Track →
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid with Refined Craftsmanship */}
      <section
        style={{
          maxWidth: 1140,
          margin: "0 auto",
          padding: "0 24px 100px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {[
          {
            icon: "⚡",
            title: "Bubblewrap Sandbox Isolation",
            desc: "Zero network access, unshared PID/IPC namespaces, and strict rlimit memory bounds. Safe and fast.",
          },
          {
            icon: "🤖",
            title: "Progressive AI Guidance",
            desc: "Stuck on a tricky edge case? Request progressive hints without spoiling the final algorithm.",
          },
          {
            icon: "📊",
            title: "Big-O Asymptotic Review",
            desc: "Instant Big-O time and space complexity estimation and clean code quality insights.",
          },
          {
            icon: "🧪",
            title: "AI Edge-Case Test Generation",
            desc: "Admins can auto-generate boundary tests, negative inputs, and large streams with 1-click AI.",
          },
          {
            icon: "🏆",
            title: "Live Weekly Contests",
            desc: "Compete with peers against real-time countdown clocks and inspect live scoreboard rankings.",
          },
          {
            icon: "🛡️",
            title: "Live Anti-Cheat & Moderation",
            desc: "Inspect live code submissions and observe contestant behavior to preserve competition integrity.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="kokonut-card"
            style={{
              padding: 22,
              background: "#111116",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                marginBottom: 14,
              }}
            >
              {f.icon}
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", marginBottom: 6 }}>
              {f.title}
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
              {f.desc}
            </p>
          </div>
        ))}
      </section>

      {/* Clean Kokonut Minimalist Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          padding: "32px 24px",
          textAlign: "center",
          fontSize: 13,
          color: "var(--text-muted)",
          background: "#09090b",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 12 }}>
          <Link href="/problems" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Problems</Link>
          <Link href="/contests" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Contests</Link>
          <Link href="/dashboard" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Dashboard</Link>
          <Link href="/admin/login" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Admin</Link>
        </div>
        <div>AI Judge • Rootless Sandboxed Competitive Programming Engine</div>
      </footer>
    </div>
  );
}
