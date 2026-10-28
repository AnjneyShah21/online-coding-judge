import React from "react";
import { IconTerminal, IconCode, IconShield, IconSparkles } from "@/components/Icons";

interface ProblemDescriptionProps {
  description: string;
}

// Helper to format inline markdown (code, bold, italic)
function renderInlineText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Regex to match `code` or **bold** or *italic*
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      const code = token.slice(1, -1);
      parts.push(
        <code
          key={match.index}
          className="mono"
          style={{
            background: "rgba(56, 189, 248, 0.08)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
            color: "#38bdf8",
            padding: "1px 6px",
            borderRadius: 4,
            fontSize: "0.9em",
            margin: "0 2px",
          }}
        >
          {code}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      const bold = token.slice(2, -2);
      parts.push(
        <strong key={match.index} style={{ color: "#ffffff", fontWeight: 600 }}>
          {bold}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      const italic = token.slice(1, -1);
      parts.push(
        <em key={match.index} style={{ color: "var(--text-secondary)" }}>
          {italic}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

interface ParsedSection {
  type: "body" | "input" | "output" | "constraints" | "other";
  title?: string;
  lines: string[];
}

export default function ProblemDescription({ description }: ProblemDescriptionProps) {
  if (!description) return null;

  // Split description by lines and group into structured sections
  const rawLines = description.split("\n");
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection = { type: "body", lines: [] };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();

    // Check for markdown headers
    const headerMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headerMatch) {
      const headerTitle = headerMatch[2].trim();
      const lower = headerTitle.toLowerCase();

      // Push current section if it has lines
      if (currentSection.lines.length > 0) {
        sections.push(currentSection);
      }

      if (lower.includes("input format") || lower === "input") {
        currentSection = { type: "input", title: "Input Format", lines: [] };
      } else if (lower.includes("output format") || lower === "output") {
        currentSection = { type: "output", title: "Output Format", lines: [] };
      } else if (lower.includes("constraint")) {
        currentSection = { type: "constraints", title: "Constraints", lines: [] };
      } else if (headerMatch[1] === "#" && !lower.includes("format") && !lower.includes("constraint")) {
        // Top level problem title inside description - omit or start fresh body
        currentSection = { type: "body", lines: [] };
      } else {
        currentSection = { type: "other", title: headerTitle, lines: [] };
      }
      continue;
    }

    // Normal line or bullet line
    if (line.length > 0 || currentSection.lines.length > 0) {
      currentSection.lines.push(rawLines[i]);
    }
  }

  if (currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {sections.map((section, idx) => {
        // Trim leading and trailing empty lines
        const cleanLines = section.lines.join("\n").trim().split("\n");
        if (cleanLines.length === 1 && cleanLines[0] === "") return null;

        // 1. General Body / Description
        if (section.type === "body") {
          return (
            <div
              key={idx}
              style={{
                color: "var(--text-secondary)",
                fontSize: 14,
                lineHeight: 1.7,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {cleanLines.map((l, lIdx) => {
                const trimmed = l.trim();
                if (!trimmed) return null;
                if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                  return (
                    <div key={lIdx} style={{ display: "flex", alignItems: "flex-start", gap: 10, paddingLeft: 4 }}>
                      <span className="dot-indicator dot-indicator-zinc" style={{ marginTop: 7, flexShrink: 0 }} />
                      <span>{renderInlineText(trimmed.replace(/^[-*]\s+/, ""))}</span>
                    </div>
                  );
                }
                return (
                  <p key={lIdx} style={{ margin: 0 }}>
                    {renderInlineText(l)}
                  </p>
                );
              })}
            </div>
          );
        }

        // 2. Input Format Section
        if (section.type === "input") {
          return (
            <div
              key={idx}
              style={{
                padding: "16px 18px",
                borderRadius: 10,
                background: "rgba(56, 189, 248, 0.03)",
                border: "1px solid rgba(56, 189, 248, 0.15)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#38bdf8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontFamily: "var(--font-mono, monospace)",
                  marginBottom: 10,
                }}
              >
                <IconTerminal size={14} />
                <span>Input Format</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cleanLines.map((l, lIdx) => {
                  const trimmed = l.trim();
                  if (!trimmed) return null;
                  const itemText = trimmed.replace(/^[-*]\s+/, "");
                  return (
                    <div
                      key={lIdx}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        className="dot-indicator dot-indicator-blue"
                        style={{ marginTop: 6, flexShrink: 0 }}
                      />
                      <div>{renderInlineText(itemText)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // 3. Output Format Section
        if (section.type === "output") {
          return (
            <div
              key={idx}
              style={{
                padding: "16px 18px",
                borderRadius: 10,
                background: "rgba(168, 85, 247, 0.03)",
                border: "1px solid rgba(168, 85, 247, 0.15)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#c084fc",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontFamily: "var(--font-mono, monospace)",
                  marginBottom: 10,
                }}
              >
                <IconCode size={14} />
                <span>Output Format</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cleanLines.map((l, lIdx) => {
                  const trimmed = l.trim();
                  if (!trimmed) return null;
                  const itemText = trimmed.replace(/^[-*]\s+/, "");
                  return (
                    <div
                      key={lIdx}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        className="dot-indicator"
                        style={{
                          background: "#c084fc",
                          boxShadow: "0 0 8px rgba(192, 132, 252, 0.4)",
                          marginTop: 6,
                          flexShrink: 0,
                        }}
                      />
                      <div>{renderInlineText(itemText)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // 4. Constraints Section
        if (section.type === "constraints") {
          return (
            <div
              key={idx}
              style={{
                padding: "16px 18px",
                borderRadius: 10,
                background: "rgba(52, 211, 153, 0.03)",
                border: "1px solid rgba(52, 211, 153, 0.15)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#34d399",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontFamily: "var(--font-mono, monospace)",
                  marginBottom: 12,
                }}
              >
                <IconShield size={14} />
                <span>Constraints</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cleanLines.map((l, lIdx) => {
                  const trimmed = l.trim();
                  if (!trimmed) return null;
                  const cleanConstraint = trimmed.replace(/^[-*]\s+/, "");
                  return (
                    <div
                      key={lIdx}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: "rgba(0, 0, 0, 0.35)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        fontSize: 12,
                        fontFamily: "var(--font-mono, monospace)",
                        color: "#e4e4e7",
                        width: "fit-content",
                      }}
                    >
                      <span className="dot-indicator dot-indicator-emerald" />
                      <span>{renderInlineText(cleanConstraint)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // 5. Other custom sections (e.g. Notes, Hints)
        return (
          <div
            key={idx}
            style={{
              padding: "16px 18px",
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {section.title && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#ffffff",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontFamily: "var(--font-mono, monospace)",
                  marginBottom: 10,
                }}
              >
                <IconSparkles size={14} />
                <span>{section.title}</span>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}>
              {cleanLines.map((l, lIdx) => (
                <div key={lIdx}>{renderInlineText(l.replace(/^[-*]\s+/, ""))}</div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
