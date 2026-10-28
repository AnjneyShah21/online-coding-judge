import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserProgressStats, getDb } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      // Graceful fallback for unauthenticated users showing platform metrics
      const db = getDb();
      const easyTotal = (db.prepare("SELECT COUNT(*) as c FROM problems WHERE difficulty = 'easy'").get() as { c: number }).c;
      const medTotal = (db.prepare("SELECT COUNT(*) as c FROM problems WHERE difficulty = 'medium'").get() as { c: number }).c;
      const hardTotal = (db.prepare("SELECT COUNT(*) as c FROM problems WHERE difficulty = 'hard'").get() as { c: number }).c;
      return NextResponse.json({
        authenticated: false,
        stats: {
          activityMap: {},
          currentStreak: 0,
          longestStreak: 0,
          solvedStats: {
            easy: { solved: 0, total: easyTotal },
            medium: { solved: 0, total: medTotal },
            hard: { solved: 0, total: hardTotal },
            totalSolved: 0,
            totalProblems: easyTotal + medTotal + hardTotal,
          },
          languageBreakdown: {},
          acceptanceRate: 0,
          totalSubmissions: 0,
        },
      });
    }

    const stats = getUserProgressStats(session.userId);
    return NextResponse.json({ authenticated: true, stats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

