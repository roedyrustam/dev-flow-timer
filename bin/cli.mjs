#!/usr/bin/env node

import {
  startSession,
  pauseSession,
  resumeSession,
  stopSession,
  getStatus,
  getDailyStats,
  getWeeklyStats,
  logWater,
  setDailyGoal,
  getErgonomicTip,
  recordActivity,
  getRecentSessions,
  exportHistory
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
    console.log(`\x1b[32m✔ Coding Session Started!\x1b[0m`);
    console.log(`  🎯 Task Target : ${status.task}`);
    console.log(`  ⏱️  Duration    : ${status.targetDurationMinutes} Minutes`);
    console.log(`  💡 Advice      : ${status.recommendation}\n`);
    break;
  }

  case 'break': {
    const duration = parseFloat(args[1]) || 5;
    const type = duration > 10 ? 'long_break' : 'short_break';
    const status = startSession({ type, durationMinutes: duration, task: 'Ergonomic Break' });
    printHeader();
    console.log(`\x1b[34m☕ Break Session Started!\x1b[0m`);
    console.log(`  ⏱️  Duration    : ${status.targetDurationMinutes} Minutes`);
    console.log(`  🌿 Advice      : Look away from screen, stretch shoulders, and drink water.\n`);
    break;
  }

  case 'eye': {
    const status = startSession({ type: 'eye_rest', durationMinutes: 0.33, task: '20-20-20 Eye Rest' });
    printHeader();
    console.log(`\x1b[35m👁️  20-20-20 Rule Active (20 Seconds)!\x1b[0m`);
    console.log(`  Look at an object 20 feet (6 meters) away to relax eye ciliary muscles.\n`);
    break;
  }

  case 'status': {
    const status = getStatus();
    printHeader();
    if (!status.active) {
      console.log(`  Status: \x1b[33mIDLE (No active session)\x1b[0m`);
      console.log(`  Today: Coding ${status.todaySummary.totalCodingMinutes}m | Break ${status.todaySummary.totalBreakMinutes}m | ${status.todaySummary.completedPomodoros} Pomodoro`);
      console.log(`  💡 ${status.nextRecommendation}\n`);
      console.log(`  Type: \x1b[32mdevflow start 25 "New Feature"\x1b[0m to begin.\n`);
    } else {
      const modeColor = status.type === 'coding' ? '\x1b[32m' : '\x1b[34m';
      console.log(`  Session: ${modeColor}${status.type.toUpperCase()}\x1b[0m ${status.isPaused ? '\x1b[33m(PAUSED)\x1b[0m' : ''}`);
      console.log(`  Task: ${status.task}`);
      console.log(`  Progress: ${renderProgressBar(status.progressPercent)}`);
      console.log(`  Time: ${status.elapsedFormatted} / ${status.targetDurationMinutes}:00 (Remaining: \x1b[1m${status.remainingFormatted}\x1b[0m)`);
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
      console.log(`  \x1b[33m⏸ Session paused.\x1b[0m Type 'devflow resume' to continue.\n`);
    }
    break;
  }

  case 'resume': {
    const res = resumeSession();
    printHeader();
    if (res.error) {
      console.log(`  \x1b[31m✖ ${res.error}\x1b[0m\n`);
    } else {
      console.log(`  \x1b[32m▶ Session resumed.\x1b[0m Stay focused!\n`);
    }
    break;
  }

  case 'stop': {
    const res = stopSession({ completed: true });
    printHeader();
    console.log(`  \x1b[32m⏹ Session completed and logged to daily productivity history.\x1b[0m`);
    console.log(`  Today: Total coding ${res.todayStats.totalCodingMinutes}m | ${res.todayStats.completedPomodoros} Pomodoros completed.\n`);
    break;
  }

  case 'stats': {
    const stats = getDailyStats();
    printHeader();
    console.log(`  📅 Date                : ${stats.date}`);
    console.log(`  💻 Total Coding Time   : \x1b[32m${stats.totalCodingMinutes} minutes\x1b[0m (${stats.totalCodingHours} hours)`);
    console.log(`  ☕ Total Break Time    : \x1b[34m${stats.totalBreakMinutes} minutes\x1b[0m`);
    console.log(`  🍅 Completed Pomodoros : \x1b[32m${stats.completedPomodoros} cycles\x1b[0m`);
    console.log(`  ⚖️  Break Ratio         : ${stats.breakRatioPercent}% (Target: ~20%)`);
    console.log(`  ⭐ Productivity Score  : \x1b[33m${stats.productivityScore}/100\x1b[0m (${stats.focusPace})\n`);
    break;
  }

  case 'week': {
    const weekly = getWeeklyStats();
    printHeader();
    console.log(`  📅 \x1b[1m7-Day Trend\x1b[0m (Total: \x1b[32m${weekly.totalWeeklyCodingMinutes}m\x1b[0m | \x1b[34m${weekly.totalWeeklyBreakMinutes}m break\x1b[0m | ${weekly.totalWeeklyPomodoros} Pomodoro)`);
    console.log(`  🔥 Focus Streak : \x1b[35m${weekly.currentStreakDays} Consecutive Days\x1b[0m\n`);

    const maxMins = Math.max(30, ...weekly.days.map(d => d.codingMinutes));
    weekly.days.forEach(d => {
      const bars = Math.round((d.codingMinutes / maxMins) * 20);
      const barStr = bars > 0 ? '\x1b[32m' + '█'.repeat(bars) + '\x1b[0m' : '░';
      console.log(`  ${d.dayName} (${d.date.slice(5)}): ${barStr.padEnd(28)} ${d.codingMinutes}m (${d.pomodoros}🍅)`);
    });

    if (weekly.tags && weekly.tags.length > 0) {
      console.log(`\n  🏷️  \x1b[1mTask Category Distribution:\x1b[0m`);
      weekly.tags.forEach(t => {
        console.log(`     • ${t.tag.padEnd(14)} : ${t.minutes}m (${t.percent}%)`);
      });
    }
    console.log('');
    break;
  }

  case 'goal': {
    printHeader();
    const count = parseInt(args[1], 10);
    if (!count) {
      const stats = getDailyStats();
      console.log(`  🎯 Daily Goal : ${stats.completedPomodoros} / ${stats.dailyGoalPomodoros || 6} Pomodoros (${stats.goalProgressPercent}%)`);
      console.log(`  Use: \x1b[32mdevflow goal 8\x1b[0m to update target.\n`);
    } else {
      const res = setDailyGoal(count);
      console.log(`  \x1b[32m✔ ${res.message}\x1b[0m\n`);
    }
    break;
  }

  case 'water': {
    printHeader();
    const res = logWater();
    console.log(`  \x1b[36m${res.message}\x1b[0m\n`);
    break;
  }

  case 'log': {
    printHeader();
    const stats = getDailyStats();
    console.log(`  📋 \x1b[1mToday's Session History (${stats.date})\x1b[0m`);
    if (!stats.recentSessions || stats.recentSessions.length === 0) {
      console.log(`     (No completed sessions today yet)\n`);
    } else {
      stats.recentSessions.forEach((s, idx) => {
        const timeStr = s.startTimestamp ? new Date(s.startTimestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--';
        const statusEmoji = s.completed ? '✔' : '✖';
        console.log(`     ${idx + 1}. [${timeStr}] ${statusEmoji} ${s.type.toUpperCase().padEnd(11)} : ${s.task} (${s.actualElapsedMinutes}m) [tag: ${s.tag}]`);
      });
      console.log('');
    }
    break;
  }

  case 'dashboard': {
    printHeader();
    console.log(`  🚀 Launching visual Cockpit Dashboard in browser...`);
    const res = saveAndOpenDashboard();
    console.log(`  File: ${res.filePath}`);
    console.log(`  \x1b[32m✔ Dashboard ready.\x1b[0m\n`);
    break;
  }

  case 'report': {
    printHeader();
    const rep = exportReportToFile();
    console.log(rep.summary.markdownReport);
    console.log(`\x1b[32m✔ Full report saved at: ${rep.filePath}\x1b[0m\n`);
    break;
  }

  case 'git': {
    printHeader();
    const git = getGitContext();
    if (!git.isGitRepo) {
      console.log(`  \x1b[33mCurrent folder is not a Git repository.\x1b[0m\n`);
    } else {
      console.log(`  🌿 Active Git Branch  : \x1b[36m${git.branch}\x1b[0m`);
      console.log(`  📝 Modified Files     : ${git.changedFilesCount} files`);
      if (git.changedFiles.length > 0) {
        git.changedFiles.forEach(f => console.log(`     • ${f}`));
      }
      console.log(`\n  Type: \x1b[32mdevflow start 25 "${git.suggestedTask}"\x1b[0m to begin focusing on this branch.\n`);
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
    console.log(`  🛡️  \x1b[36m${tip.titleEn || tip.title}\x1b[0m`);
    console.log(`  ${tip.descriptionEn || tip.description}`);
    console.log(`  \x1b[32m💡 Action: ${tip.actionEn || tip.action}\x1b[0m\n`);
    break;
  }

  case 'history': {
    printHeader();
    const limit = parseInt(args[1], 10) || 10;
    const sessions = getRecentSessions(limit);
    console.log(`  📋 \x1b[1mRecent Session History (Last ${sessions.length} sessions)\x1b[0m`);
    if (!sessions || sessions.length === 0) {
      console.log('     (No sessions recorded yet)\n');
    } else {
      sessions.forEach((s, idx) => {
        const timeStr = s.startedAt ? new Date(s.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--';
        const statusEmoji = s.completed ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✖\x1b[0m';
        const typeStr = s.type ? s.type.toUpperCase().padEnd(11) : 'CODING     ';
        console.log(`     ${idx + 1}. [${s.date} ${timeStr}] ${statusEmoji} ${typeStr} : ${s.task} (${s.actualElapsedMinutes}m) [tag: ${s.tag || 'general'}]`);
      });
      console.log('');
    }
    break;
  }

  case 'export': {
    printHeader();
    const format = (args[1] || 'json').toLowerCase().replace('--', '');
    const targetFile = args[2] || null;
    const content = exportHistory(format === 'csv' ? 'csv' : 'json');
    if (targetFile) {
      const fs = await import('node:fs');
      fs.writeFileSync(targetFile, content, 'utf8');
      console.log(`  \x1b[32m✔ Exported productivity history (${format.toUpperCase()}) to: ${targetFile}\x1b[0m\n`);
    } else {
      console.log(content);
      console.log(`\n  \x1b[32m✔ Exported in ${format.toUpperCase()} format.\x1b[0m Tip: devflow export csv ./history.csv\n`);
    }
    break;
  }

  case 'watch': {
    const readline = await import('node:readline');
    let isExiting = false;

    const cleanup = () => {
      if (isExiting) return;
      isExiting = true;
      if (process.stdin.isTTY) {
        try { process.stdin.setRawMode(false); } catch (e) {}
      }
      process.stdout.write('\x1b[?25h\n'); // show cursor
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    if (process.stdin.isTTY) {
      readline.emitKeypressEvents(process.stdin);
      try {
        process.stdin.setRawMode(true);
        process.stdin.on('keypress', (str, key) => {
          if (key && (key.ctrl && key.name === 'c') || str === 'q' || str === 'Q') {
            cleanup();
          } else if (str === 'p' || str === 'P') {
            pauseSession();
          } else if (str === 'r' || str === 'R') {
            resumeSession();
          } else if (str === 's' || str === 'S') {
            stopSession({ completed: true });
          }
        });
      } catch (e) {}
    }

    const render = () => {
      const status = getStatus();
      process.stdout.write('\x1b[?25l'); // hide cursor
      process.stdout.write('\x1b[2J\x1b[H'); // clear screen and move home

      console.log('\x1b[36m⚡ [DevFlow Timer - Live Terminal Watcher]\x1b[0m');
      console.log('───────────────────────────────────────────────────────');

      if (!status.active) {
        console.log('\n  Status: \x1b[33mIDLE (No active session)\x1b[0m');
        console.log(`  Today : ${status.todaySummary.totalCodingMinutes}m coding | ${status.todaySummary.completedPomodoros} Pomodoros completed`);
        console.log(`\n  \x1b[32m💡 ${status.nextRecommendation}\x1b[0m`);
        console.log('\n  Controls: Press [q] to exit watcher, or run `devflow start`');
      } else {
        const modeColor = status.type === 'coding' ? '\x1b[32m' : '\x1b[34m';
        const typeTag = status.type.toUpperCase();
        const pausedTag = status.isPaused ? ' \x1b[33m[PAUSED]\x1b[0m' : ' \x1b[32m[RUNNING]\x1b[0m';

        console.log(`  Mode   : ${modeColor}\x1b[1m${typeTag}\x1b[0m${pausedTag}`);
        console.log(`  Task   : \x1b[1m${status.task}\x1b[0m ${status.tag ? `(#${status.tag})` : ''}`);
        console.log(`  Timer  : \x1b[1m\x1b[37m${status.remainingFormatted}\x1b[0m / ${status.targetDurationMinutes}:00 (Elapsed: ${status.elapsedFormatted})`);
        console.log(`  Prog   : ${renderProgressBar(status.progressPercent, 28)}`);
        console.log(`  Today  : ${status.todaySummary.totalCodingMinutes}m focused | ${status.todaySummary.completedPomodoros}🍅 completed`);
        console.log(`\n  \x1b[33m💡 ${status.recommendation}\x1b[0m`);
        console.log('\n───────────────────────────────────────────────────────');
        console.log('  Keys   : [\x1b[33mp\x1b[0m] Pause | [\x1b[32mr\x1b[0m] Resume | [\x1b[31ms\x1b[0m] Stop | [\x1b[36mq\x1b[0m] Exit Watcher');
      }
    };

    render();
    setInterval(render, 1000);
    break;
  }

  default:
    printHeader();
    console.log(`  Available commands:`);
    console.log(`    start [minutes] [task]  - Start focus coding session (default: 25m)`);
    console.log(`    break [minutes]         - Start break session (default: 5m)`);
    console.log(`    eye                     - 20-20-20 eye relief rule (20 seconds)`);
    console.log(`    watch                   - Live full-screen in-terminal countdown watcher`);
    console.log(`    status                  - Check timer status and remaining time`);
    console.log(`    pause / resume          - Pause or resume running timer`);
    console.log(`    stop                    - End active session and save to history`);
    console.log(`    stats                   - View daily productivity metrics`);
    console.log(`    week                    - 7-day productivity trend chart & tag distribution`);
    console.log(`    goal [count]            - Set daily target Pomodoro cycles`);
    console.log(`    water                   - Log 1 glass of water intake (+1 glass)`);
    console.log(`    log / history           - View session history log`);
    console.log(`    export [csv|json] [file]- Export productivity session history to CSV/JSON`);
    console.log(`    report                  - Generate and export productivity report (Markdown)`);
    console.log(`    git                     - Inspect Git branch context & suggested focus task`);
    console.log(`    dashboard               - Open visual HTML cockpit in browser`);
    console.log(`    tip [category]          - Ergonomic tips (eyes, posture, hands, back, health, mind)\n`);
}
