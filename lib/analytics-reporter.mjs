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
  let burnoutRisk = 'Rendah (Pacing Sehat)';

  if (totalCodingAll > 180 && avgBreakRatio < 0.08) {
    ergonomicGrade = 'C';
    burnoutRisk = 'Tinggi (Terlalu lama menatap layar tanpa jeda pemulihan)';
  } else if (totalCodingAll > 120 && avgBreakRatio < 0.15) {
    ergonomicGrade = 'B';
    burnoutRisk = 'Sedang (Perlu menambah frekuensi micro-break 5 menit)';
  } else if (avgBreakRatio >= 0.15 && totalPomodorosAll >= 3) {
    ergonomicGrade = 'A+';
    burnoutRisk = 'Sangat Rendah (Ritme Deep Work & Istirahat Optimal)';
  }

  // Generate Markdown summary
  const markdown = `# 📊 Laporan Analitik Produktivitas & Ergonomi DevFlow

**Periode Evaluasi**: ${dates[0] || 'Hari Ini'} s/d ${dates[dates.length - 1] || 'Hari Ini'}  
**Status Audit**: Terverifikasi oleh DevFlow Ergonomic Sentinel  

---

## 🏆 Ringkasan Eksekutif

| Metrik Kinerja | Nilai Akumulasi | Evaluasi Standar |
| :--- | :--- | :--- |
| **Total Waktu Fokus Coding** | **${Math.round(totalCodingAll * 10) / 10} Menit** (${(totalCodingAll / 60).toFixed(1)} Jam) | Sesi Produktif |
| **Total Waktu Istirahat** | **${Math.round(totalBreakAll * 10) / 10} Menit** | Pemulihan Aktif |
| **Siklus Pomodoro Selesai** | **${totalPomodorosAll} Siklus** | Blok Fokus Tuntas |
| **Rasio Istirahat vs Kerja** | **${Math.round(avgBreakRatio * 100)}%** (Target: ~20%) | Keseimbangan Mental |
| **Indeks Risiko Burnout** | **${burnoutRisk}** | Perlindungan Kognitif |
| **Nilai Kepatuhan Ergonomis** | **Grade ${ergonomicGrade}** | Ergonomi Kerja |

---

## 📅 Rincian Sesi Harian

| Tanggal | Durasi Coding | Istirahat | Pomodoro | Rasio Break | Status Ritme |
| :--- | :--- | :--- | :--- | :--- | :--- |
${daySummaries.map(d => `| **${d.date}** | ${d.codingMinutes}m | ${d.breakMinutes}m | ${d.pomodoros} | ${d.breakRatioPercent}% | ${d.breakRatioPercent >= 15 ? '🟢 Seimbang' : '🟡 Kurang Jeda'} |`).join('\n')}

---

## 💡 Rekomendasi Peningkatan Produktivitas

1. **Jaga Konsistensi 4 Siklus Pomodoro**: Usahakan minimal 4 siklus Pomodoro (100 menit fokus) per hari sebelum jeda siang.
2. **Pertahankan Disiplin Aturan 20-20-20**: Jangan lewatkan relaksasi mata 20 detik setiap 20 menit menatap monitor beresolusi tinggi.
3. **Peregangan Leher & Bahu Rutin**: Luangkan 30 detik untuk *chin tuck* setiap kali menyelesaikan sesi debugging intensif.
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
