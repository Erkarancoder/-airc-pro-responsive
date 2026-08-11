/* ─────────────────────────────────────────────
   js/dashboard.js — A.I.R.C. Pro
   Computes dashboard stats from stored session history:
   totals, averages, weak/strong topics, daily streak,
   XP points, badges, weekly/monthly aggregates.
───────────────────────────────────────────── */
'use strict';

const BADGES = [
  { id: 'first_step',    label: 'First Step',       icon: '🥇', check: (s) => s.total >= 1 },
  { id: 'five_sessions',  label: 'Getting Warmed Up', icon: '🔥', check: (s) => s.total >= 5 },
  { id: 'twenty_sessions', label: 'Dedicated',        icon: '💪', check: (s) => s.total >= 20 },
  { id: 'high_scorer',    label: 'High Scorer',       icon: '🏆', check: (s) => s.avgScore >= 80 },
  { id: 'streak_3',       label: '3-Day Streak',      icon: '⚡', check: (s) => s.streak >= 3 },
  { id: 'streak_7',       label: '7-Day Streak',      icon: '🌟', check: (s) => s.streak >= 7 },
  { id: 'well_rounded',   label: 'Well Rounded',      icon: '🧭', check: (s) => s.categoriesCovered >= 5 },
];

function dayKey(iso) { return new Date(iso).toISOString().slice(0, 10); }

function computeStreak(sessions) {
  if (!sessions.length) return 0;
  const days = new Set(sessions.map(s => dayKey(s.startedAt)));
  let streak = 0;
  let cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) { streak++; cursor.setDate(cursor.getDate() - 1); }
    else break;
  }
  return streak;
}

function computeXP(sessions) {
  return sessions.reduce((sum, s) => sum + 10 + Math.round((s.score || 0) / 5), 0);
}

function computeTopicBreakdown(sessions) {
  const byCat = {};
  sessions.forEach(s => {
    const cat = s.category || 'general';
    if (!byCat[cat]) byCat[cat] = { total: 0, count: 0 };
    byCat[cat].total += s.score || 0;
    byCat[cat].count += 1;
  });
  const list = Object.entries(byCat).map(([cat, v]) => ({ cat, avg: Math.round(v.total / v.count), count: v.count }));
  list.sort((a, b) => b.avg - a.avg);
  return {
    strong: list.slice(0, 3),
    weak: [...list].sort((a, b) => a.avg - b.avg).slice(0, 3),
    categoriesCovered: list.length,
  };
}

function computeWeeklyMonthly(sessions) {
  const now = Date.now();
  const weekMs = 7 * 24 * 3600 * 1000, monthMs = 30 * 24 * 3600 * 1000;
  const weekly = sessions.filter(s => now - new Date(s.startedAt).getTime() <= weekMs);
  const monthly = sessions.filter(s => now - new Date(s.startedAt).getTime() <= monthMs);
  const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + (b.score || 0), 0) / arr.length) : 0;
  return {
    weeklyCount: weekly.length, weeklyAvg: avg(weekly),
    monthlyCount: monthly.length, monthlyAvg: avg(monthly),
  };
}

/** Turns weak-topic + score data into plain-English improvement suggestions */
function computeSuggestions(sessions, weak, avgScore) {
  const tips = [];
  if (!sessions.length) {
    return ['Complete your first mock interview to unlock personalised suggestions.'];
  }
  weak.forEach(w => {
    tips.push(`Practice more "${w.cat}" questions — your average there is ${w.avg}/100.`);
  });
  const avgFillers = sessions.reduce((a, s) => a + (s.fillers || 0), 0) / sessions.length;
  if (avgFillers > 5) tips.push(`Cut filler words — you're averaging ${Math.round(avgFillers)} per session. Pause silently instead.`);
  const avgWpm = sessions.reduce((a, s) => a + (s.wpm || 0), 0) / sessions.length;
  if (avgWpm && (avgWpm < 110 || avgWpm > 170)) {
    tips.push(avgWpm < 110 ? 'Try to speak a little faster and more fluidly — aim for 120–160 WPM.' : 'Slow down slightly — aim for 120–160 WPM for clearer delivery.');
  }
  if (avgScore < 60) tips.push('Review the "Suggestions" section on each report before your next attempt — repetition is the fastest way to improve.');
  if (!tips.length) tips.push('Great consistency — try a harder difficulty or a company-specific round to keep growing.');
  return tips.slice(0, 5);
}

/** Full dashboard computation from an array of stored sessions */
function computeDashboard(sessions) {
  const total = sessions.length;
  const avgScore = total ? Math.round(sessions.reduce((a, s) => a + (s.score || 0), 0) / total) : 0;
  const streak = computeStreak(sessions);
  const xp = computeXP(sessions);
  const { strong, weak, categoriesCovered } = computeTopicBreakdown(sessions);
  const { weeklyCount, weeklyAvg, monthlyCount, monthlyAvg } = computeWeeklyMonthly(sessions);
  const suggestions = computeSuggestions(sessions, weak, avgScore);

  const statSnapshot = { total, avgScore, streak, categoriesCovered };
  const earnedBadges = BADGES.filter(b => b.check(statSnapshot));

  return {
    total, avgScore, streak, xp, strong, weak, categoriesCovered,
    weeklyCount, weeklyAvg, monthlyCount, monthlyAvg,
    badges: earnedBadges, suggestions,
  };
}

window.AIRC_DASHBOARD = { computeDashboard, BADGES };
