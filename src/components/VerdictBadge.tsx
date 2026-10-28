"use client";

interface VerdictBadgeProps {
  verdict: string;
}

export default function VerdictBadge({ verdict }: VerdictBadgeProps) {
  const getBadgeInfo = (v: string) => {
    switch (v?.toLowerCase()) {
      case "accepted":
        return { label: "Accepted", className: "badge-accepted", icon: "✓" };
      case "wrong_answer":
        return { label: "Wrong Answer", className: "badge-wrong_answer", icon: "✗" };
      case "time_limit_exceeded":
        return { label: "Time Limit Exceeded", className: "badge-time_limit_exceeded", icon: "⏱" };
      case "memory_limit_exceeded":
        return { label: "Memory Limit Exceeded", className: "badge-memory_limit_exceeded", icon: "💾" };
      case "compilation_error":
        return { label: "Compilation Error", className: "badge-compilation_error", icon: "⚠️" };
      case "runtime_error":
        return { label: "Runtime Error", className: "badge-runtime_error", icon: "💥" };
      case "running":
        return { label: "Running...", className: "badge-running", icon: "⚡" };
      case "pending":
      default:
        return { label: "In Queue", className: "badge-pending", icon: "⏳" };
    }
  };

  const info = getBadgeInfo(verdict);

  return (
    <span className={`badge ${info.className}`} style={{ gap: 4 }}>
      <span>{info.icon}</span>
      <span>{info.label}</span>
    </span>
  );
}
