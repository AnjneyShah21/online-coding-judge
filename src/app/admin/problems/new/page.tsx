"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";

export default function NewProblemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [targetLanguage, setTargetLanguage] = useState<"cpp" | "java" | "python" | "javascript" | "all">("cpp");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [timeLimitMs, setTimeLimitMs] = useState(2000);
  const [memoryLimitMb, setMemoryLimitMb] = useState(256);
  const [tagsInput, setTagsInput] = useState("algorithms, data-structures");
  const [description, setDescription] = useState(
    `# Problem Description\n\nGiven the input specifications, solve the challenge adhering to strict time and memory bounds.\n\n### Constraints\n- \`1 <= n <= 10^5\`\n\n### Input Format\n- Standard input stream\n\n### Output Format\n- Single line output\n`
  );

  const [starterPy, setStarterPy] = useState(
    `import sys\n\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    # Write Python solution here\n    \nsolve()\n`
  );

  const [starterCpp, setStarterCpp] = useState(
    `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    // Write C++ solution here\n    \n    return 0;\n}\n`
  );

  const [starterJava, setStarterJava] = useState(
    `import java.util.*;\nimport java.io.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write Java solution here\n    }\n}\n`
  );

  const [starterJs, setStarterJs] = useState(
    `const fs = require('fs');\n\nfunction main() {\n    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    if (!input || input.length === 0) return;\n    \n    // Write JavaScript solution here\n}\n\nmain();\n`
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const starter_code: Record<string, string> = {};
    if (targetLanguage === "python" || targetLanguage === "all") starter_code.python = starterPy;
    if (targetLanguage === "cpp" || targetLanguage === "all") starter_code.cpp = starterCpp;
    if (targetLanguage === "java" || targetLanguage === "all") starter_code.java = starterJava;
    if (targetLanguage === "javascript" || targetLanguage === "all") starter_code.javascript = starterJs;

    const target_languages = targetLanguage === "all" ? ["cpp", "java", "python", "javascript"] : [targetLanguage];

    try {
      const res = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          difficulty,
          time_limit_ms: Number(timeLimitMs),
          memory_limit_mb: Number(memoryLimitMb),
          tags,
          starter_code,
          target_languages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create problem");
        return;
      }

      // Redirect directly to test case setup and AI test generation!
      router.push(`/admin/problems/${data.id}/edit`);
    } catch {
      setError("Network error while creating problem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0c0817" }}>
      <AdminSidebar />
      <main className="main-with-sidebar">
        <div className="page-header">
          <Link
            href="/admin/problems"
            style={{ fontSize: 13, color: "#c084fc", textDecoration: "none", display: "inline-block", marginBottom: 8 }}
          >
            ← Back to Problems
          </Link>
          <h1 className="page-title" style={{ color: "#f3e8ff" }}>
            Create New Problem
          </h1>
          <p className="page-subtitle">
            Configure problem statement, target language track, constraints, and starter boilerplate.
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div
            className="glass-card"
            style={{
              padding: 28,
              background: "rgba(20, 14, 38, 0.8)",
              borderColor: "rgba(139, 92, 246, 0.2)",
              marginBottom: 24,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f3e8ff", marginBottom: 16 }}>
              Problem Details & Target Track
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="label">Problem Title</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. C++ Custom Comparator Priority Queue"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Target Language Track</label>
                <select
                  className="input select"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value as "cpp" | "java" | "python" | "javascript" | "all")}
                >
                  <option value="cpp">⚡ C++ Track Dedicated</option>
                  <option value="java">☕ Java Track Dedicated</option>
                  <option value="python">🐍 Python Track Dedicated</option>
                  <option value="javascript">📜 JavaScript Track Dedicated</option>
                  <option value="all">🌐 All Languages (Multi-Language)</option>
                </select>
              </div>

              <div>
                <label className="label">Difficulty</label>
                <select
                  className="input select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="label">Time Limit (ms)</label>
                <input
                  type="number"
                  className="input"
                  value={timeLimitMs}
                  onChange={(e) => setTimeLimitMs(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="label">Memory Limit (MB)</label>
                <input
                  type="number"
                  className="input"
                  value={memoryLimitMb}
                  onChange={(e) => setMemoryLimitMb(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="label">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="stl, collections, prefix-sum"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label">Problem Statement (Markdown supported)</label>
              <textarea
                className="input textarea mono"
                rows={10}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Starter Codes */}
          <div
            className="glass-card"
            style={{
              padding: 28,
              background: "rgba(20, 14, 38, 0.8)",
              borderColor: "rgba(139, 92, 246, 0.2)",
              marginBottom: 24,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f3e8ff", marginBottom: 16 }}>
              Starter Code Templates ({targetLanguage.toUpperCase()})
            </h2>

            {(targetLanguage === "cpp" || targetLanguage === "all") && (
              <div style={{ marginBottom: 16 }}>
                <label className="label">⚡ C++ (g++) Starter Code</label>
                <textarea
                  className="input textarea mono"
                  rows={6}
                  value={starterCpp}
                  onChange={(e) => setStarterCpp(e.target.value)}
                />
              </div>
            )}

            {(targetLanguage === "java" || targetLanguage === "all") && (
              <div style={{ marginBottom: 16 }}>
                <label className="label">☕ Java Starter Code</label>
                <textarea
                  className="input textarea mono"
                  rows={6}
                  value={starterJava}
                  onChange={(e) => setStarterJava(e.target.value)}
                />
              </div>
            )}

            {(targetLanguage === "python" || targetLanguage === "all") && (
              <div style={{ marginBottom: 16 }}>
                <label className="label">🐍 Python 3 Starter Code</label>
                <textarea
                  className="input textarea mono"
                  rows={6}
                  value={starterPy}
                  onChange={(e) => setStarterPy(e.target.value)}
                />
              </div>
            )}

            {(targetLanguage === "javascript" || targetLanguage === "all") && (
              <div style={{ marginBottom: 16 }}>
                <label className="label">📜 JavaScript (Node.js) Starter Code</label>
                <textarea
                  className="input textarea mono"
                  rows={6}
                  value={starterJs}
                  onChange={(e) => setStarterJs(e.target.value)}
                />
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <Link href="/admin/problems" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-admin" disabled={loading}>
              {loading ? <span className="spinner" /> : "Save & Proceed to Test Cases →"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
