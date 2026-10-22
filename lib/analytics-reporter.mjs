import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadState } from './timer-engine.mjs';

export function generateAnalyticsReport() {
  const state = loadState();
  const history = state.history || {};
  const dates = Object.keys(history).sort();

  let totalCodingAll = 0;
  let totalBreakAll = 0;
  let totalPomodorosAll = 0;
  let totalSessionsAll = 0;

  const daySummaries = [];

  for (const date of dates) {
    const day = history[date];
    totalCodingAll += day.totalCodingMinutes || 0;
    totalBreakAll += day.totalBreakMinutes || 0;
    totalPomodorosAll += day.completedPomodoros || 0;
    totalSessionsAll += day.sessionsCount || 0;

    const breakRatio = day.totalCodingMinutes > 0
      ? (day.totalBreakMinutes / day.totalCodingMinutes)
      : 0;

    daySummaries.push({
      date,
      codingMinutes: day.totalCodingMinutes || 0,
      breakMinutes: day.totalBreakMinutes || 0,
      pomodoros: day.completedPomodoros || 0,
      breakRatioPercent: Math.round(breakRatio * 100),
      sessions: day.sessions || []
    });
  }

  // Calculate Ergonomic Grade & Burnout Risk
  const avgBreakRatio = totalCodingAll > 0 ? (totalBreakAll / totalCodingAll) : 0;
  let ergonomicGrade = 'A';
  let burnoutRisk = 'Low (Healthy Pacing)';

  if (totalCodingAll > 180 && avgBreakRatio < 0.08) {
    ergonomicGrade = 'C';
    burnoutRisk = 'High (Prolonged screen time without restorative breaks)';
  } else if (totalCodingAll > 120 && avgBreakRatio < 0.15) {
    ergonomicGrade = 'B';
    burnoutRisk = 'Moderate (Consider increasing frequency of 5-minute micro-breaks)';
  } else if (avgBreakRatio >= 0.15 && totalPomodorosAll >= 3) {
    ergonomicGrade = 'A+';
    burnoutRisk = 'Very Low (Optimal Deep Work & Recovery Rhythm)';
  }

  // Generate Markdown summary
  const markdown = `# 📊 DevFlow Productivity & Ergonomic Analytics Report

**Evaluation Period**: ${dates[0] || 'Today'} to ${dates[dates.length - 1] || 'Today'}  
**Audit Status**: Verified by DevFlow Ergonomic Sentinel  

---

## 🏆 Executive Summary

| Performance Metric | Accumulated Value | Standard Evaluation |
| :--- | :--- | :--- |
| **Total Focus Coding Time** | **${Math.round(totalCodingAll * 10) / 10} Minutes** (${(totalCodingAll / 60).toFixed(1)} Hours) | Productive Sessions |
| **Total Rest Duration** | **${Math.round(totalBreakAll * 10) / 10} Minutes** | Active Recovery |
| **Completed Pomodoros** | **${totalPomodorosAll} Cycles** | Completed Focus Blocks |
| **Break vs Work Ratio** | **${Math.round(avgBreakRatio * 100)}%** (Target: ~20%) | Mental Balance |
| **Burnout Risk Index** | **${burnoutRisk}** | Cognitive Protection |
| **Ergonomic Compliance** | **Grade ${ergonomicGrade}** | Physical Ergonomics |

---

## 📅 Daily Session Breakdown

| Date | Coding Duration | Break Time | Pomodoros | Break Ratio | Rhythm Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
${daySummaries.map(d => `| **${d.date}** | ${d.codingMinutes}m | ${d.breakMinutes}m | ${d.pomodoros} | ${d.breakRatioPercent}% | ${d.breakRatioPercent >= 15 ? '🟢 Balanced' : '🟡 Needs More Breaks'} |`).join('\n')}

---

## 💡 Recommendations for Sustainable Productivity

1. **Maintain Consistency with 4 Pomodoro Cycles**: Target at least 4 Pomodoro cycles (100 minutes of deep focus) per day before a major midday break.
2. **Uphold 20-20-20 Rule Discipline**: Never skip the 20-second eye relaxation every 20 minutes when working on high-resolution displays.
3. **Routine Neck & Shoulder Stretches**: Take 30 seconds for a chin tuck and shoulder roll after completing intensive debugging sessions.
`;

  return {
    period: { start: dates[0] || null, end: dates[dates.length - 1] || null },
    totalCodingMinutes: Math.round(totalCodingAll * 10) / 10,
    totalCodingHours: (totalCodingAll / 60).toFixed(1),
    totalBreakMinutes: Math.round(totalBreakAll * 10) / 10,
    totalPomodoros: totalPomodorosAll,
    breakRatioPercent: Math.round(avgBreakRatio * 100),
    ergonomicGrade,
    burnoutRisk,
    daySummaries,
    markdownReport: markdown
  };
}

export function exportReportToFile(customPath = null) {
  const rep = generateAnalyticsReport();
  const filePath = customPath || path.join(os.homedir(), '.gemini', 'antigravity', 'PRODUCTIVITY_REPORT.md');
  fs.writeFileSync(filePath, rep.markdownReport, 'utf8');
  return {
    filePath,
    summary: rep
  };
}
