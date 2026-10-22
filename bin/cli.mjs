#!/usr/bin/env node

import {
  startSession,
  pauseSession,
  resumeSession,
  stopSession,
  getStatus,
  getDailyStats,
  getErgonomicTip,
  recordActivity
} from '../lib/timer-engine.mjs';
import { saveAndOpenDashboard } from '../lib/dashboard-generator.mjs';
import { generateAnalyticsReport, exportReportToFile } from '../lib/analytics-reporter.mjs';
import { getGitContext, generateCommitSuggestion } from '../lib/git-integrator.mjs';

const args = process.argv.slice(2);
const command = args[0] ? args[0].toLowerCase() : 'status';

function printHeader() {
  console.log('\n\x1b[36m⚡ [DevFlow Timer - Coding & Break Sentinel]\x1b[0m');
}

function renderProgressBar(percent, length = 24) {
  const filled = Math.round((percent / 100) * length);
  const empty = length - filled;
  return `[\x1b[32m${'█'.repeat(filled)}\x1b[0m${'░'.repeat(empty)}] ${percent}%`;
}

switch (command) {
  case 'start': {
    const duration = parseFloat(args[1]) || 25;
    const task = args.slice(2).join(' ') || 'Coding Sprint';
    const status = startSession({ type: 'coding', durationMinutes: duration, task });
    printHeader();
    console.log(`\x1b[32m✔ Sesi Coding Dimulai!\x1b[0m`);
    console.log(`  🎯 Target Tugas : ${status.task}`);
    console.log(`  ⏱️  Durasi       : ${status.targetDurationMinutes} Menit`);
    console.log(`  💡 Rekomendasi  : ${status.recommendation}\n`);
    break;
  }

  case 'break': {
    const duration = parseFloat(args[1]) || 5;
    const type = duration > 10 ? 'long_break' : 'short_break';
    const status = startSession({ type, durationMinutes: duration, task: 'Istirahat Ergonomis' });
    printHeader();
    console.log(`\x1b[34m☕ Sesi Istirahat Dimulai!\x1b[0m`);
    console.log(`  ⏱️  Durasi       : ${status.targetDurationMinutes} Menit`);
    console.log(`  🌿 Rekomendasi  : Alihkan mata dari layar, regangkan bahu, dan minum air.\n`);
    break;
  }

  case 'eye': {
    const status = startSession({ type: 'eye_rest', durationMinutes: 0.33, task: 'Aturan Mata 20-20-20' });
    printHeader();
    console.log(`\x1b[35m👁️  Aturan 20-20-20 Aktif (20 Detik)!\x1b[0m`);
    console.log(`  Tatap objek berjarak 6 meter (20 kaki) untuk mengistirahatkan saraf mata.\n`);
    break;
  }

  case 'status': {
    const status = getStatus();
    printHeader();
    if (!status.active) {
      console.log(`  Status: \x1b[33mIDLE (Tidak ada sesi aktif)\x1b[0m`);
      console.log(`  Hari ini: Coding ${status.todaySummary.totalCodingMinutes}m | Istirahat ${status.todaySummary.totalBreakMinutes}m | ${status.todaySummary.completedPomodoros} Pomodoro`);
      console.log(`  💡 ${status.nextRecommendation}\n`);
      console.log(`  Ketik: \x1b[32mdevflow start 25 "Fitur Baru"\x1b[0m untuk memulai.\n`);
    } else {
      const modeColor = status.type === 'coding' ? '\x1b[32m' : '\x1b[34m';
      console.log(`  Sesi: ${modeColor}${status.type.toUpperCase()}\x1b[0m ${status.isPaused ? '\x1b[33m(DIJEDA)\x1b[0m' : ''}`);
      console.log(`  Tugas: ${status.task}`);
      console.log(`  Progres: ${renderProgressBar(status.progressPercent)}`);
      console.log(`  Waktu: ${status.elapsedFormatted} / ${status.targetDurationMinutes}:00 (Sisa: \x1b[1m${status.remainingFormatted}\x1b[0m)`);
      console.log(`  💡 ${status.recommendation}\n`);
    }
    break;
  }

  case 'pause': {
    const res = pauseSession();
    printHeader();
    if (res.error) {
      console.log(`  \x1b[31m✖ ${res.error}\x1b[0m\n`);
    } else {
      console.log(`  \x1b[33m⏸ Sesi dijeda.\x1b[0m Ketik 'devflow resume' untuk melanjutkan.\n`);
    }
    break;
  }

  case 'resume': {
    const res = resumeSession();
    printHeader();
    if (res.error) {
      console.log(`  \x1b[31m✖ ${res.error}\x1b[0m\n`);
    } else {
      console.log(`  \x1b[32m▶ Sesi dilanjutkan.\x1b[0m Tetap fokus!\n`);
    }
    break;
  }

  case 'stop': {
    const res = stopSession({ completed: true });
    printHeader();
    console.log(`  \x1b[32m⏹ Sesi diselesaikan dan dicatat ke statistik harian.\x1b[0m`);
    console.log(`  Hari ini: Total coding ${res.todayStats.totalCodingMinutes}m | ${res.todayStats.completedPomodoros} Pomodoro selesai.\n`);
    break;
  }

  case 'stats': {
    const stats = getDailyStats();
    printHeader();
    console.log(`  📅 Tanggal            : ${stats.date}`);
    console.log(`  💻 Total Waktu Coding : \x1b[32m${stats.totalCodingMinutes} menit\x1b[0m (${stats.totalCodingHours} jam)`);
    console.log(`  ☕ Total Istirahat    : \x1b[34m${stats.totalBreakMinutes} menit\x1b[0m`);
    console.log(`  🍅 Pomodoro Selesai   : \x1b[32m${stats.completedPomodoros} siklus\x1b[0m`);
    console.log(`  ⚖️  Rasio Istirahat    : ${stats.breakRatioPercent}% (Target: ~20%)`);
    console.log(`  ⭐ Skor Produktivitas : \x1b[33m${stats.productivityScore}/100\x1b[0m (${stats.focusPace})\n`);
    break;
  }

  case 'dashboard': {
    printHeader();
    console.log(`  🚀 Membuka Cockpit Dashboard visual di browser...`);
    const res = saveAndOpenDashboard();
    console.log(`  File: ${res.filePath}`);
    console.log(`  \x1b[32m✔ Dashboard siap digunakan.\x1b[0m\n`);
    break;
  }

  case 'report': {
    printHeader();
    const rep = exportReportToFile();
    console.log(rep.summary.markdownReport);
    console.log(`\x1b[32m✔ Laporan lengkap tersimpan di: ${rep.filePath}\x1b[0m\n`);
    break;
  }

  case 'git': {
    printHeader();
    const git = getGitContext();
    if (!git.isGitRepo) {
      console.log(`  \x1b[33mFolder saat ini bukan repositori Git.\x1b[0m\n`);
    } else {
      console.log(`  🌿 Cabang Git Aktif  : \x1b[36m${git.branch}\x1b[0m`);
      console.log(`  📝 File Dimodifikasi : ${git.changedFilesCount} file`);
      if (git.changedFiles.length > 0) {
        git.changedFiles.forEach(f => console.log(`     • ${f}`));
      }
      console.log(`\n  Ketik: \x1b[32mdevflow start 25 "${git.suggestedTask}"\x1b[0m untuk memulai fokus pada cabang ini.\n`);
    }
    break;
  }

  case 'install': {
    printHeader();
    const os = await import('node:os');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const geminiDir = path.join(os.homedir(), '.gemini');
    const binDir = path.join(geminiDir, 'antigravity', 'bin');
    const configFile = path.join(geminiDir, 'config', 'config.json');

    try {
      if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });
      if (os.platform() === 'win32') {
        const cmdPath = path.join(binDir, 'devflow.cmd');
        const scriptPath = path.resolve(process.argv[1]);
        fs.writeFileSync(cmdPath, `@echo off\r\nnode "${scriptPath}" %*\r\n`, 'ascii');
        console.log(`  \x1b[32m✔ Global CLI launcher installed at: ${cmdPath}\x1b[0m`);
      } else {
        const linkPath = path.join(binDir, 'devflow');
        const scriptPath = path.resolve(process.argv[1]);
        try { fs.unlinkSync(linkPath); } catch(e) {}
        fs.symlinkSync(scriptPath, linkPath);
        console.log(`  \x1b[32m✔ Symlink installed at: ${linkPath}\x1b[0m`);
      }

      if (fs.existsSync(configFile)) {
        const raw = fs.readFileSync(configFile, 'utf8');
        const cfg = JSON.parse(raw || '{}');
        if (!cfg.plugins) cfg.plugins = {};
        if (!cfg.plugins['dev-flow-timer']) cfg.plugins['dev-flow-timer'] = {};
        cfg.plugins['dev-flow-timer'].enabled = true;
        fs.writeFileSync(configFile, JSON.stringify(cfg, null, 2), 'utf8');
        console.log(`  \x1b[32m✔ Plugin enabled in config.json\x1b[0m`);
      }
      console.log(`\n  \x1b[32m🎉 DevFlow Timer setup complete! Restart Antigravity to refresh.\x1b[0m\n`);
    } catch (err) {
      console.log(`  \x1b[31m✖ Setup error: ${err.message}\x1b[0m\n`);
    }
    break;
  }

  case 'tip': {
    const cat = args[1] || null;
    const tip = getErgonomicTip(cat);
    printHeader();
    console.log(`  🛡️  \x1b[36m${tip.title}\x1b[0m`);
    console.log(`  ${tip.description}`);
    console.log(`  \x1b[32m💡 Aksi: ${tip.action}\x1b[0m\n`);
    break;
  }

  default:
    printHeader();
    console.log(`  Perintah yang tersedia:`);
    console.log(`    start [menit] [tugas]  - Mulai sesi coding fokus (default: 25m)`);
    console.log(`    break [menit]          - Mulai istirahat (default: 5m)`);
    console.log(`    eye                    - Aturan 20-20-20 relaksasi mata (20 detik)`);
    console.log(`    status                 - Cek status timer dan sisa waktu`);
    console.log(`    pause / resume         - Jeda atau lanjutkan timer`);
    console.log(`    stop                   - Selesaikan sesi dan simpan ke riwayat`);
    console.log(`    stats                  - Lihat ringkasan metrik produktivitas harian`);
    console.log(`    report                 - Buat dan ekspor laporan analitik produktivitas (Markdown)`);
    console.log(`    git                    - Periksa konteks cabang Git & rekomendasi tugas fokus`);
    console.log(`    dashboard              - Buka Cockpit visual di browser`);
    console.log(`    tip [kategori]         - Tips ergonomis (eyes, posture, hands, back)\n`);
}
