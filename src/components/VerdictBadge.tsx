"use client";

interface VerdictBadgeProps {
  verdict: string;
}

export default function VerdictBadge({ verdict }: VerdictBadgeProps) {
  const getBadgeInfo = (v: string) => {
    switch (v?.toLowerCase()) {
      case "accepted":
      case "ac":
        return { label: "Accepted", code: "AC", className: "badge-accepted", dotClass: "dot-indicator-emerald" };
      case "wrong_answer":
      case "wa":
        return { label: "Wrong Answer", code: "WA", className: "badge-wrong_answer", dotClass: "dot-indicator-rose" };
      case "time_limit_exceeded":
      case "tle":
        return { label: "Time Limit Exceeded", code: "TLE", className: "badge-time_limit_exceeded", dotClass: "dot-indicator-amber" };
      case "memory_limit_exceeded":
      case "mle":
        return { label: "Memory Limit Exceeded", code: "MLE", className: "badge-memory_limit_exceeded", dotClass: "dot-indicator-amber" };
      case "compilation_error":
      case "ce":
        return { label: "Compilation Error", code: "CE", className: "badge-compilation_error", dotClass: "dot-indicator-rose" };
      case "runtime_error":
      case "re":
        return { label: "Runtime Error", code: "RE", className: "badge-runtime_error", dotClass: "dot-indicator-rose" };
      case "running":
        return { label: "Executing", code: "RUN", className: "badge-running", dotClass: "dot-indicator-blue" };
      case "pending":
      default:
        return { label: "Queued", code: "QUEUED", className: "badge-pending", dotClass: "dot-indicator-blue" };
    }
  };

  const info = getBadgeInfo(verdict);

  return (
    <span
      className={`badge ${info.className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontFamily: "var(--font-mono, monospace)",
      }}
    >
      <span className={`dot-indicator ${info.dotClass}`} />
      <span>{info.label}</span>
      <span style={{ opacity: 0.7, fontSize: 10 }}>({info.code})</span>
    </span>
  );
}
