"use client";

interface VerdictBadgeProps {
  verdict: string;
}

export default function VerdictBadge({ verdict }: VerdictBadgeProps) {
  const getBadgeInfo = (v: string) => {
    switch (v?.toLowerCase()) {
      case "accepted":
      case "ac":
        return { label: "Accepted (AC)", className: "badge-accepted", icon: "✓" };
      case "wrong_answer":
      case "wa":
        return { label: "Wrong Answer (WA)", className: "badge-wrong_answer", icon: "✗" };
      case "time_limit_exceeded":
      case "tle":
        return { label: "Time Limit Exceeded (TLE)", className: "badge-time_limit_exceeded", icon: "⏱" };
      case "memory_limit_exceeded":
      case "mle":
        return { label: "Memory Limit Exceeded (MLE)", className: "badge-memory_limit_exceeded", icon: "💾" };
      case "compilation_error":
      case "ce":
        return { label: "Compilation Error (CE)", className: "badge-compilation_error", icon: "⚠️" };
      case "runtime_error":
      case "re":
        return { label: "Runtime Error (RE)", className: "badge-runtime_error", icon: "💥" };
      case "running":
        return { label: "Running...", className: "badge-running", icon: "⚡" };
      case "pending":
      default:
        return { label: "In Queue (Pending)", className: "badge-pending", icon: "⏳" };
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
