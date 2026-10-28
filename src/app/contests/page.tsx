"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import UserNav from "@/components/UserNav";
import {
  IconTrophy,
  IconClock,
  IconCheck,
  IconChevronRight,
  IconUser,
  IconCode,
  IconMaximize,
  IconMinimize,
  IconAlertTriangle,
  IconShield,
  IconLock,
} from "@/components/Icons";

interface Contest {
  id: string;
  title: string;
  slug: string;
  description: string;
  start_time: string;
  end_time: string;
  problem_count?: number;
  participant_count?: number;
  is_published?: number;
  created_by?: string;
}

interface ContestDetails {
  contest: Contest;
  problems: {
    id: string;
    problem_id: string;
    title: string;
    difficulty: string;
    score: number;
    order_index: number;
  }[];
  isRegistered: boolean;
  hasEnded: boolean;
  leaderboard: {
    user_id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    score: number;
    solved_count: number;
  }[];
}

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [contestDetails, setContestDetails] = useState<ContestDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [regMsg, setRegMsg] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [exitingContest, setExitingContest] = useState(false);

  // Anti-Cheat & Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  const [antiCheatViolation, setAntiCheatViolation] = useState<string | null>(null);
  const [isEscapedFullscreenWarning, setIsEscapedFullscreenWarning] = useState(false);
  const isLegitExiting = useRef(false);

  // Candidate Live Contest Timer State
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const autoEndSent = useRef(false);

  useEffect(() => {
    autoEndSent.current = false;
  }, [selectedContestId]);

  useEffect(() => {
    if (!contestDetails) {
      setRemainingSeconds(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const end = new Date(contestDetails.contest.end_time).getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setRemainingSeconds(diff);
      if (diff === 0 && contestDetails.isRegistered && !contestDetails.hasEnded && !autoEndSent.current) {
        autoEndSent.current = true;
        fetch("/api/contests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "exit", contest_id: contestDetails.contest.id }),
          keepalive: true,
        }).catch((err) => {
          console.error("Failed to lock expired contest session:", err);
        }).finally(() => {
          setContestDetails((prev) => (prev ? { ...prev, hasEnded: true } : null));
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [contestDetails]);

  // Keep candidate countdowns in sync with timing changes made by an admin mid-contest.
  useEffect(() => {
    if (!contestDetails || !contestDetails.isRegistered || contestDetails.hasEnded) return;
    const contestId = contestDetails.contest.id;
    const refreshContest = async () => {
      try {
        const res = await fetch(`/api/contests?id=${contestId}`, { cache: "no-store" });
        const data = await res.json();
        if (data.contest) {
          setContestDetails((current) => current?.contest.id === contestId ? {
            ...current,
            contest: data.contest,
            hasEnded: data.hasEnded,
          } : current);
        }
      } catch (err) {
        console.error("Failed to refresh contest timing:", err);
      }
    };
    const interval = window.setInterval(refreshContest, 15000);
    return () => window.clearInterval(interval);
  }, [contestDetails?.contest.id, contestDetails?.isRegistered, contestDetails?.hasEnded]);

  const formatCountdown = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const fetchContests = async () => {
    try {
      const res = await fetch("/api/contests");
      const data = await res.json();
      if (data && data.contests) {
        setContests(data.contests);
        if (data.contests.length > 0 && !selectedContestId) {
          loadContestDetails(data.contests[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load contests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Request browser fullscreen mode
  const enterArenaFullscreen = async () => {
    setFullscreenError("");
    try {
      if (document.fullscreenElement) {
        setIsFullscreen(true);
        setIsEscapedFullscreenWarning(false);
        return;
      }
      const root = document.documentElement;
      if (!document.fullscreenEnabled || typeof root.requestFullscreen !== "function") {
        throw new Error("Fullscreen is unavailable in this browser context. Open the contest in a regular browser tab and allow fullscreen for the site.");
      }
      // Keep this call directly inside the click handler: browsers reject fullscreen
      // requests that happen later in an effect or after unrelated async work.
      await root.requestFullscreen();
      setIsFullscreen(true);
      setIsEscapedFullscreenWarning(false);
    } catch (err) {
      console.warn("Fullscreen request error:", err);
      setIsFullscreen(!!document.fullscreenElement);
      setFullscreenError(
        err instanceof Error && err.message
          ? err.message
          : "The browser blocked fullscreen. Click Enter Fullscreen again and allow the browser request."
      );
    }
  };

  // Anti-cheat auto-end handler: triggered immediately if user switches tab or window blurs
  const triggerAntiCheatAutoEnd = async (reason: string) => {
    if (!selectedContestId || !contestDetails || contestDetails.hasEnded || isLegitExiting.current || autoEndSent.current) {
      return;
    }
    autoEndSent.current = true;

    try {
      await fetch("/api/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "exit",
          contest_id: selectedContestId,
        }),
        keepalive: true,
      });
    } catch (err) {
      console.error("Failed to post anti-cheat contest auto-end:", err);
    }

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {}
    }

    setContestDetails((prev) => (prev ? { ...prev, hasEnded: true } : null));
    setAntiCheatViolation(reason);
    setIsEscapedFullscreenWarning(false);
  };

  // Explicit user exit confirmation
  const handleConfirmExit = async () => {
    if (!selectedContestId) return;
    setExitingContest(true);
    isLegitExiting.current = true;
    try {
      const res = await fetch("/api/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "exit",
          contest_id: selectedContestId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (document.fullscreenElement) {
          try {
            await document.exitFullscreen();
          } catch {}
        }
        setShowExitConfirmModal(false);
        setIsEscapedFullscreenWarning(false);
        setContestDetails((prev) => (prev ? { ...prev, hasEnded: true } : null));
        setRegMsg("Contest session concluded. Your final score is locked on the leaderboard.");
      } else {
        setRegMsg(data.error || "Failed to exit contest");
        isLegitExiting.current = false;
      }
    } catch {
      setRegMsg("Network error exiting contest");
      isLegitExiting.current = false;
    } finally {
      setExitingContest(false);
    }
  };

  const handleTogglePublish = async (contestId: string, currentPublished: number) => {
    try {
      const res = await fetch("/api/contests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contestId,
          is_published: currentPublished ? 0 : 1,
        }),
      });
      if (res.ok) {
        fetchContests();
        if (selectedContestId === contestId) {
          loadContestDetails(contestId);
        }
      }
    } catch (err) {
      console.error("Error toggling contest publication:", err);
    }
  };

  // Anti-Cheat & Fullscreen Enforcement Engine
  useEffect(() => {
    if (!contestDetails) return;
    const now = new Date().getTime();
    const s = new Date(contestDetails.contest.start_time).getTime();
    const e = new Date(contestDetails.contest.end_time).getTime();
    const isLive = now >= s && now <= e;
    const isActivelyCompeting = contestDetails.isRegistered && !contestDetails.hasEnded && isLive;

    if (!isActivelyCompeting) {
      setIsEscapedFullscreenWarning(false);
      return;
    }

    // Fullscreen state listener
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (active) setFullscreenError("");
      if (!active && !isLegitExiting.current) {
        // Participant dropped fullscreen while actively competing without clicking Exit Contest
        setIsEscapedFullscreenWarning(true);
      } else {
        setIsEscapedFullscreenWarning(false);
      }
    };

    // Tab switch or page hide -> IMMEDIATELY AUTO END
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" || document.hidden) {
        triggerAntiCheatAutoEnd(
          "Anti-Cheat Violation: Tab switch or background state detected. Your contest has been auto-ended and your score is finalized on the leaderboard."
        );
      }
    };

    // Window blur (focus lost to another application or dev tools) -> IMMEDIATELY AUTO END
    const handleBlur = () => {
      triggerAntiCheatAutoEnd(
        "Anti-Cheat Violation: Window lost focus (application switch detected). Your contest session has been auto-ended."
      );
    };

    // Prevent navigation / tab close
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "You are in an active contest. Exit the contest before leaving.";
      return event.returnValue;
    };

    // Browser shutdown/navigation can bypass normal fetch completion. sendBeacon queues
    // the session lock request while the document is being discarded.
    const handlePageHide = () => {
      if (autoEndSent.current || isLegitExiting.current) return;
      autoEndSent.current = true;
      const payload = new Blob(
        [JSON.stringify({ action: "exit", contest_id: contestDetails.contest.id })],
        { type: "application/json" }
      );
      const queued = navigator.sendBeacon("/api/contests", payload);
      if (!queued) {
        fetch("/api/contests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [contestDetails, selectedContestId]);

  const loadContestDetails = async (id: string) => {
    setSelectedContestId(id);
    setDetailsLoading(true);
    setRegMsg("");

    try {
      const res = await fetch(`/api/contests?id=${id}`);
      const data = await res.json();
      if (data.contest) {
        setContestDetails(data);
      }
    } catch (err) {
      console.error("Failed to load contest details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedContestId) return;
    setRegistering(true);
    setRegMsg("");

    try {
      const res = await fetch("/api/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          contest_id: selectedContestId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRegMsg(data.error || "Please log in to register");
      } else {
        setRegMsg("Registration successful! You are enrolled in this contest.");
        loadContestDetails(selectedContestId);
      }
    } catch {
      setRegMsg("Network error registering for contest");
    } finally {
      setRegistering(false);
    }
  };

  const getStatus = (start: string, end: string) => {
    const now = new Date().getTime();
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();

    if (now < s) {
      const diffHrs = Math.round((s - now) / (1000 * 60 * 60));
      return {
        label: `Starts in ${diffHrs > 0 ? diffHrs + "h" : "<1h"}`,
        isLive: false,
        isEnded: false,
        dotClass: "dot-indicator-blue",
      };
    } else if (now >= s && now <= e) {
      return {
        label: "Live Now",
        isLive: true,
        isEnded: false,
        dotClass: "dot-indicator-emerald",
      };
    } else {
      return {
        label: "Concluded",
        isLive: false,
        isEnded: true,
        dotClass: "dot-indicator-zinc",
      };
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <UserNav />

      <main className="page-container" style={{ maxWidth: 1160, margin: "0 auto", padding: "36px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div className="hero-pill" style={{ marginBottom: 12 }}>
            <span className="dot-indicator dot-indicator-emerald" />
            <span>Weekly Competitive Arena</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "#ffffff", marginBottom: 6 }}>
            Scheduled Contests & Leaderboards
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 680 }}>
            Compete in synchronized algorithmic challenges against developers worldwide with real-time scoring and automated anti-cheat monitoring.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div className="spinner spinner-lg" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading scheduled events...</p>
          </div>
        ) : contests.length === 0 ? (
          <div
            className="kokonut-card"
            style={{
              padding: "56px 24px",
              textAlign: "center",
              border: "1px dashed rgba(255, 255, 255, 0.12)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(255, 255, 255, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
                color: "var(--text-muted)",
              }}
            >
              <IconTrophy size={20} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: "#ffffff" }}>
              No Active Contests
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, maxWidth: 440, margin: "0 auto" }}>
              Weekly contests are scheduled by administrators. Check back soon for the next event schedule.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 20, alignItems: "start" }}>
            {/* Contest List on Left */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "var(--font-mono, monospace)" }}>
                Contest Schedule ({contests.length})
              </div>

              {contests.map((c) => {
                const status = getStatus(c.start_time, c.end_time);
                const isSelected = selectedContestId === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => loadContestDetails(c.id)}
                    className="kokonut-card-interactive"
                    style={{
                      padding: "16px 18px",
                      cursor: "pointer",
                      borderColor: isSelected ? "rgba(99, 102, 241, 0.5)" : "rgba(255, 255, 255, 0.08)",
                      background: isSelected ? "#151520" : "#111116",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: "#ffffff", margin: 0 }}>
                        {c.title}
                      </h3>
                      <span
                        className="pill-chip"
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          gap: 5,
                        }}
                      >
                        <span className={`dot-indicator ${status.dotClass}`} />
                        <span>{status.label}</span>
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                      <span>{new Date(c.start_time).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{c.problem_count || 0} problems</span>
                      <span>•</span>
                      <span>{c.participant_count || 0} enrolled</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Contest Details on Right */}
            <div>
              {detailsLoading || !contestDetails ? (
                <div className="kokonut-card" style={{ padding: 40, textAlign: "center" }}>
                  <div className="spinner" style={{ margin: "0 auto 12px" }} />
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading arena details...</p>
                </div>
              ) : (
                <div
                  className="kokonut-card"
                  style={{
                    padding: 24,
                    background: "#111116",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  {/* Contest Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, gap: 16 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", margin: 0 }}>
                          {contestDetails.contest.title}
                        </h2>
                        {!contestDetails.contest.is_published && (
                          <span
                            className="pill-chip"
                            style={{
                              background: "rgba(234, 179, 8, 0.12)",
                              borderColor: "rgba(234, 179, 8, 0.3)",
                              color: "#facc15",
                              fontSize: 10,
                              padding: "2px 7px",
                            }}
                          >
                            Private (Creator Only)
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                        {contestDetails.contest.description || "Compete against time constraints to maximize algorithmic points."}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {/* Creator publication toggle */}
                      {(currentUser?.role === "admin" || currentUser?.id === contestDetails.contest.created_by) && (
                        <button
                          onClick={() =>
                            handleTogglePublish(
                              contestDetails.contest.id,
                              contestDetails.contest.is_published || 0
                            )
                          }
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 11, padding: "5px 10px" }}
                        >
                          {contestDetails.contest.is_published ? "Unpublish" : "Publish Live"}
                        </button>
                      )}

                      {contestDetails.hasEnded ? (
                        <span
                          className="pill-chip"
                          style={{
                            background: "rgba(244, 63, 94, 0.12)",
                            borderColor: "rgba(244, 63, 94, 0.3)",
                            color: "#f87171",
                            fontSize: 12,
                            padding: "5px 12px",
                          }}
                        >
                          Contest Concluded
                        </span>
                      ) : contestDetails.isRegistered ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            className="pill-chip"
                            style={{
                              background: "rgba(16, 185, 129, 0.1)",
                              borderColor: "rgba(16, 185, 129, 0.25)",
                              color: "#34d399",
                              fontSize: 12,
                              padding: "5px 12px",
                            }}
                          >
                            <IconCheck size={13} />
                            Enrolled
                          </span>

                          {/* Exit Contest Button during live event */}
                          {getStatus(contestDetails.contest.start_time, contestDetails.contest.end_time).isLive && (
                            <button
                              onClick={() => setShowExitConfirmModal(true)}
                              className="btn btn-sm"
                              style={{
                                background: "rgba(239, 68, 68, 0.15)",
                                border: "1px solid rgba(239, 68, 68, 0.35)",
                                color: "#f87171",
                                fontSize: 12,
                                padding: "5px 12px",
                                cursor: "pointer",
                              }}
                            >
                              Exit Contest
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={handleRegister}
                          disabled={registering}
                          className="btn btn-primary btn-sm"
                          style={{ padding: "7px 16px", borderRadius: 8 }}
                        >
                          {registering ? <span className="spinner" /> : "Register"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Anti-Cheat Triggered Termination Banner */}
                  {antiCheatViolation && (
                    <div
                      style={{
                        padding: "14px 18px",
                        borderRadius: 12,
                        background: "rgba(239, 68, 68, 0.12)",
                        border: "1px solid rgba(239, 68, 68, 0.35)",
                        color: "#fca5a5",
                        fontSize: 13,
                        marginBottom: 20,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                      }}
                    >
                      <IconAlertTriangle size={20} style={{ color: "#f87171", flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <strong style={{ color: "#ffffff", display: "block", marginBottom: 3 }}>
                          Contest Session Auto-Ended (Anti-Cheat Security Violation)
                        </strong>
                        {antiCheatViolation}
                      </div>
                    </div>
                  )}

                  {/* Candidate Live Countdown Timer & Proctored Arena Bar */}
                  {getStatus(contestDetails.contest.start_time, contestDetails.contest.end_time).isLive &&
                    contestDetails.isRegistered &&
                    !contestDetails.hasEnded && (
                      <div
                        style={{
                          padding: "14px 18px",
                          borderRadius: 12,
                          background: "rgba(99, 102, 241, 0.08)",
                          border: "1px solid rgba(99, 102, 241, 0.25)",
                          marginBottom: 20,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 14,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 14px",
                              background: "rgba(0, 0, 0, 0.5)",
                              borderRadius: 8,
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                            }}
                          >
                            <span className="dot-indicator dot-indicator-emerald" />
                            <IconClock size={15} style={{ color: "#38bdf8" }} />
                            <span
                              style={{
                                fontSize: 16,
                                fontWeight: 800,
                                color: "#ffffff",
                                fontFamily: "var(--font-mono, monospace)",
                                letterSpacing: "0.04em",
                              }}
                            >
                              {remainingSeconds !== null ? formatCountdown(remainingSeconds) : "00:00:00"}
                            </span>
                            <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>
                              Remaining
                            </span>
                          </div>

                          <div style={{ fontSize: 12 }}>
                            {isFullscreen ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#34d399", fontWeight: 600 }}>
                                <IconShield size={14} /> Fullscreen Proctored Lock Active
                              </span>
                            ) : (
                              <span style={{ color: "#fbbf24", fontWeight: 600 }}>
                                Proctored Fullscreen Required
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {!isFullscreen ? (
                            <button
                              onClick={enterArenaFullscreen}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: 12, padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
                            >
                              <IconMaximize size={14} />
                              <span>Enter Fullscreen Arena</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowExitConfirmModal(true)}
                              className="btn btn-sm"
                              style={{
                                background: "rgba(239, 68, 68, 0.2)",
                                border: "1px solid rgba(239, 68, 68, 0.4)",
                                color: "#f87171",
                                fontSize: 12,
                                padding: "6px 12px",
                                cursor: "pointer",
                              }}
                            >
                              Exit Contest
                            </button>
                          )}
                        </div>
                        {fullscreenError && (
                          <p role="alert" style={{ flexBasis: "100%", margin: 0, color: "#fca5a5", fontSize: 12 }}>
                            {fullscreenError}
                          </p>
                        )}
                      </div>
                  )}

                  {/* Contest Session Concluded Warning Banner */}
                  {contestDetails.hasEnded && !antiCheatViolation && (
                    <div
                      style={{
                        padding: "12px 16px",
                        borderRadius: 10,
                        background: "rgba(239, 68, 68, 0.08)",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                        color: "#fca5a5",
                        fontSize: 13,
                        marginBottom: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <IconClock size={16} style={{ color: "#f87171", flexShrink: 0 }} />
                      <div>
                        <strong>Contest Session Concluded:</strong> Your attempt has finished and your final score is recorded on the leaderboard.
                      </div>
                    </div>
                  )}

                  {regMsg && (
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "rgba(16, 185, 129, 0.08)",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        color: "#34d399",
                        fontSize: 12,
                        marginBottom: 16,
                        fontFamily: "var(--font-mono, monospace)",
                      }}
                    >
                      {regMsg}
                    </div>
                  )}

                  {/* Window Timeline */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      padding: 14,
                      background: "rgba(255, 255, 255, 0.02)",
                      borderRadius: 10,
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      marginBottom: 20,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)", textTransform: "uppercase", marginBottom: 3 }}>
                        Start Time
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#f4f4f5", fontFamily: "var(--font-mono, monospace)" }}>
                        {new Date(contestDetails.contest.start_time).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)", textTransform: "uppercase", marginBottom: 3 }}>
                        End Time
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#f4f4f5", fontFamily: "var(--font-mono, monospace)" }}>
                        {new Date(contestDetails.contest.end_time).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Contest Problems */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10, fontFamily: "var(--font-mono, monospace)" }}>
                      Contest Problemset
                    </div>

                    {contestDetails.problems.length === 0 ? (
                      <p style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-mono, monospace)" }}>
                        Problems will be revealed once the contest begins.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {contestDetails.problems.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 14px",
                              background: "rgba(255, 255, 255, 0.02)",
                              borderRadius: 8,
                              border: "1px solid rgba(255, 255, 255, 0.06)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)", width: 22 }}>
                                Q{idx + 1}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>{p.title}</span>
                              <span className={`badge badge-${p.difficulty}`} style={{ fontSize: 10, padding: "2px 6px" }}>
                                {p.difficulty}
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                                {p.score} pts
                              </span>
                              {contestDetails.hasEnded ? (
                                <span
                                  style={{
                                    padding: "3px 10px",
                                    fontSize: 11,
                                    borderRadius: 6,
                                    background: "rgba(255, 255, 255, 0.04)",
                                    color: "var(--text-muted)",
                                    border: "1px solid rgba(255, 255, 255, 0.06)",
                                    fontFamily: "var(--font-mono, monospace)",
                                  }}
                                >
                                  Locked
                                </span>
                              ) : (
                                <Link
                                  href={`/problems/${p.problem_id}?contest_id=${contestDetails.contest.id}`}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: "3px 10px", fontSize: 11 }}
                                >
                                  Solve
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Contest Leaderboard */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10, fontFamily: "var(--font-mono, monospace)" }}>
                      Live Standings
                    </div>

                    {contestDetails.leaderboard.length === 0 ? (
                      <p style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-mono, monospace)" }}>
                        No submissions recorded yet for this contest.
                      </p>
                    ) : (
                      <div className="table-container">
                        <table>
                          <thead>
                            <tr>
                              <th style={{ fontSize: 11 }}>Rank</th>
                              <th style={{ fontSize: 11 }}>Player</th>
                              <th style={{ fontSize: 11 }}>Solved</th>
                              <th style={{ fontSize: 11 }}>Points</th>
                            </tr>
                          </thead>
                          <tbody>
                            {contestDetails.leaderboard.map((player, i) => (
                              <tr key={player.user_id}>
                                <td style={{ fontWeight: 600, fontFamily: "var(--font-mono, monospace)", color: i === 0 ? "#fbbf24" : "var(--text-muted)" }}>
                                  #{i + 1}
                                </td>
                                <td style={{ fontWeight: 500, color: "#f4f4f5" }}>
                                  {player.display_name || player.username}
                                </td>
                                <td style={{ fontFamily: "var(--font-mono, monospace)" }}>{player.solved_count}</td>
                                <td style={{ fontWeight: 700, color: "#60a5fa", fontFamily: "var(--font-mono, monospace)" }}>
                                  {player.score}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Exit & Auto-End Confirmation Modal */}
      {showExitConfirmModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#121218",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: 16,
              maxWidth: 440,
              width: "100%",
              padding: 24,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "rgba(239, 68, 68, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f87171",
                }}
              >
                <IconClock size={16} />
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", margin: 0 }}>
                Exit Contest & Lock Score?
              </h3>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
              Exiting the contest will automatically and permanently end your session. You will NOT be able to re-enter, solve problems, or submit more solutions for this event. Your current score will be finalized on the leaderboard.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowExitConfirmModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 13, padding: "8px 16px" }}
              >
                Stay in Contest
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                disabled={exitingContest}
                className="btn btn-sm"
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                {exitingContest ? "Ending Session..." : "Confirm & Auto-End"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Escape Blocker Modal */}
      {isEscapedFullscreenWarning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.94)",
            backdropFilter: "blur(16px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            className="kokonut-card"
            style={{
              maxWidth: 480,
              width: "100%",
              padding: 32,
              textAlign: "center",
              border: "1px solid rgba(239, 68, 68, 0.45)",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.9)",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.15)",
                color: "#f87171",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
              }}
            >
              <IconAlertTriangle size={28} />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", marginBottom: 8 }}>
              Fullscreen Mode Required
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
              Contest integrity rules require an active proctored fullscreen session. You cannot attempt or view problems outside of fullscreen mode.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button
                type="button"
                onClick={enterArenaFullscreen}
                className="btn btn-primary"
                style={{ padding: "10px 22px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <IconMaximize size={15} />
                <span>Re-Enter Fullscreen</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEscapedFullscreenWarning(false);
                  setShowExitConfirmModal(true);
                }}
                className="btn btn-secondary"
                style={{ padding: "10px 18px", fontSize: 13 }}
              >
                Exit Contest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
