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
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [timeLimitMs, setTimeLimitMs] = useState(2000);
  const [memoryLimitMb, setMemoryLimitMb] = useState(256);
  const [tagsInput, setTagsInput] = useState("algorithms, data-structures");
  const [description, setDescription] = useState(
    `# Problem Description\n\nGiven an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.\n\n### Constraints\n- \`2 <= nums.length <= 10^4\`\n- \`-10^9 <= nums[i] <= 10^9\`\n\n### Input Format\n- First line contains integer \`n\`\n- Second line contains \`n\` space-separated integers\n- Third line contains integer \`target\`\n\n### Output Format\n- Two space-separated integers representing the 0-based indices\n`
  );

  const [starterPy, setStarterPy] = useState(
    `import sys\n\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    target = int(lines[n+1])\n    # Write your solution here\n    \nsolve()\n`
  );

  const [starterCpp, setStarterCpp] = useState(
    `#include <iostream>\n#include <vector>\n#include <unordered_map>\n\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    int target;\n    cin >> target;\n    \n    // Write your solution here\n    \n    return 0;\n}\n`
  );

  const [starterJs, setStarterJs] = useState(
    `const fs = require('fs');\n\nfunction main() {\n    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    if (input.length < 2) return;\n    const n = parseInt(input[0], 10);\n    const nums = input.slice(1, n + 1).map(Number);\n    const target = parseInt(input[n + 1], 10);\n    \n    // Write your solution here\n}\n\nmain();\n`
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const starter_code = {
      python: starterPy,
      cpp: starterCpp,
      javascript: starterJs,
    };

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
            Configure problem statement, constraints, time limits, and starter templates.
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
              Problem Details
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label className="label">Problem Title</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Two Sum"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
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
                  placeholder="hash-table, arrays, math"
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
              Starter Code Templates
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label className="label">Python 3 Starter Code</label>
              <textarea
                className="input textarea mono"
                rows={5}
                value={starterPy}
                onChange={(e) => setStarterPy(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label">C++ (g++) Starter Code</label>
              <textarea
                className="input textarea mono"
                rows={5}
                value={starterCpp}
                onChange={(e) => setStarterCpp(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label">JavaScript (Node.js) Starter Code</label>
              <textarea
                className="input textarea mono"
                rows={5}
                value={starterJs}
                onChange={(e) => setStarterJs(e.target.value)}
              />
            </div>
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
