import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  getStatus,
  startSession,
  pauseSession,
  resumeSession,
  stopSession,
  getDailyStats,
  getWeeklyStats,
  logWater,
  setDailyGoal,
  getErgonomicTip,
  loadState,
  recordActivity
} from '../../lib/timer-engine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.ANTIGRAVITY_SIDECAR_WEB_PORT || '52800', 10);
const TOKEN = process.env.ANTIGRAVITY_SIDECAR_UI_TOKEN || '';
const BIND_HOST = '127.0.0.1';

// Load preload.js if available
let preloadJs = '';
const possiblePreloads = [
  path.join(os.homedir(), '.gemini', 'antigravity', 'lib', 'node_modules', 'sidecar_sdk', 'preload.js'),
  path.join(os.homedir(), '.gemini', 'config', 'node_modules', 'sidecar_sdk', 'preload.js'),
  path.resolve(__dirname, '../../../../antigravity/lib/node_modules/sidecar_sdk/preload.js')
];

for (const p of possiblePreloads) {
  if (fs.existsSync(p)) {
    try {
      preloadJs = fs.readFileSync(p, 'utf8');
      break;
    } catch (e) {}
  }
}

function getPanelHtml() {
  const stats = getDailyStats();
  const tip = getErgonomicTip();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevFlow Sidecar Cockpit</title>
  <script src="/preload.js"></script>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #0f172a;
      --card-border: #1e293b;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --focus-color: #10b981;
      --focus-glow: rgba(16, 185, 129, 0.25);
      --break-color: #0ea5e9;
      --eye-color: #a855f7;
      --danger-color: #ef4444;
      --warning-color: #f59e0b;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    body {
      background: var(--bg);
      color: var(--text-main);
      padding: 0.85rem 0.65rem;
      min-height: 100vh;
      overflow-x: hidden;
    }
    .panel-container {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      max-width: 400px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.6rem;
      border-bottom: 1px solid var(--card-border);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }
    .logo-badge {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      background: linear-gradient(135deg, #10b981, #0ea5e9);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: white;
      font-size: 0.8rem;
    }
    .title {
      font-size: 0.9rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .status-badge {
      font-size: 0.68rem;
      font-weight: 600;
      padding: 0.15rem 0.55rem;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      animation: pulse 2s infinite ease-in-out;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.3; transform: scale(0.8); }
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 0.9rem;
    }
    .timer-core {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 0.25rem 0;
    }
    .ring-wrapper {
      position: relative;
      width: 176px;
      height: 176px;
      margin-bottom: 0.85rem;
    }
    .svg-ring {
      transform: rotate(-90deg);
      width: 100%;
      height: 100%;
    }
    .ring-bg {
      fill: none;
      stroke: #1e293b;
      stroke-width: 8;
    }
    .ring-progress {
      fill: none;
      stroke: var(--focus-color);
      stroke-width: 8;
      stroke-linecap: round;
      stroke-dasharray: 490;
      stroke-dashoffset: 0;
      transition: stroke-dashoffset 0.8s linear, stroke 0.3s;
    }
    .inner-display {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .mode-tag {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.2rem;
    }
    .digits {
      font-size: 2.45rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.03em;
      line-height: 1;
    }
    .task-preview {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 0.3rem;
      max-width: 140px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .btn-row {
      display: flex;
      gap: 0.45rem;
      width: 100%;
      justify-content: center;
      margin-bottom: 0.75rem;
    }
    .btn {
      background: #1e293b;
      color: var(--text-main);
      border: 1px solid #334155;
      padding: 0.45rem 0.85rem;
      border-radius: 7px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      transition: all 0.15s ease;
    }
    .btn:hover { background: #334155; border-color: #475569; }
    .btn-primary {
      background: #10b981;
      border-color: #10b981;
      color: #064e3b;
    }
    .btn-primary:hover {
      background: #34d399;
      box-shadow: 0 2px 10px var(--focus-glow);
    }
    .btn-danger {
      background: rgba(239, 68, 68, 0.12);
      border-color: rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
    .presets-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.35rem;
      width: 100%;
    }
    .preset-chip {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 0.38rem 0.45rem;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 500;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s;
    }
    .preset-chip:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-main);
    }
    .preset-chip.active {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.4);
      color: #34d399;
      font-weight: 600;
    }
    .stats-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0.4rem;
      margin-top: 0.25rem;
    }
    .mini-stat {
      background: #090d16;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 0.45rem;
      text-align: center;
    }
    .mini-title {
      font-size: 0.62rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
    }
    .mini-val {
      font-size: 1.1rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      margin-top: 0.1rem;
    }
    .tip-box {
      background: rgba(14, 165, 233, 0.08);
      border-left: 3px solid #0ea5e9;
      padding: 0.5rem 0.65rem;
      border-radius: 0 6px 6px 0;
      font-size: 0.7rem;
      line-height: 1.4;
      color: #bae6fd;
    }
    .sync-indicator {
      font-size: 0.62rem;
      color: #64748b;
      text-align: center;
      margin-top: 0.2rem;
    }
  </style>
</head>
<body>
  <div class="panel-container">
    <div class="header">
      <div class="brand">
        <div class="logo-badge">&lt;/&gt;</div>
        <div>
          <div class="title">DevFlow Panel</div>
        </div>
      </div>
      <div class="status-badge" id="badgeStatus">
        <div class="dot" id="badgeDot"></div>
        <span id="badgeText">READY</span>
      </div>
    </div>

    <div class="card timer-core">
      <div class="ring-wrapper">
        <svg class="svg-ring" viewBox="0 0 176 176">
          <circle class="ring-bg" cx="88" cy="88" r="78"></circle>
          <circle class="ring-progress" id="progressRing" cx="88" cy="88" r="78"></circle>
        </svg>
        <div class="inner-display">
          <div class="mode-tag" id="modeTag">POMODORO</div>
          <div class="digits" id="timeDigits">25:00</div>
          <div class="task-preview" id="taskPreview">Coding Focus Sprint</div>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn btn-primary" id="btnMain" onclick="doStart()">
          <span>▶</span> Start
        </button>
        <button class="btn" id="btnPause" onclick="doPauseToggle()" style="display:none;">
          <span>⏸</span> Pause
        </button>
        <button class="btn btn-danger" id="btnStop" onclick="doStop()" style="display:none;">
          <span>⏹</span> Stop
        </button>
      </div>

      <div class="presets-grid">
        <button class="preset-chip active" id="chip-pomodoro" onclick="applyPreset('coding', 25, 'Pomodoro (25m)')">25m Pomodoro</button>
        <button class="preset-chip" id="chip-deep" onclick="applyPreset('coding', 50, 'Deep Work (50m)')">50m Deep Work</button>
        <button class="preset-chip" id="chip-break" onclick="applyPreset('short_break', 5, 'Short Rest (5m)')">5m Short Break</button>
        <button class="preset-chip" id="chip-eye" onclick="applyPreset('eye_rest', 0.33, '20-20-20 Rule')">20s Eye Rest</button>
      </div>
    </div>

    <div class="card">
      <div style="font-size: 0.75rem; font-weight: 700; margin-bottom: 0.35rem;">Today's Statistics</div>
      <div class="stats-row">
        <div class="mini-stat">
          <div class="mini-title">Coding</div>
          <div class="mini-val" id="statCoding">${stats.totalCodingMinutes}m</div>
        </div>
        <div class="mini-stat">
          <div class="mini-title">Break</div>
          <div class="mini-val" id="statBreak">${stats.totalBreakMinutes}m</div>
        </div>
        <div class="mini-stat">
          <div class="mini-title">Pomodoro</div>
          <div class="mini-val" id="statCycles">${stats.completedPomodoros}</div>
        </div>
      </div>
    </div>

    <!-- Daily Goal & Hydration -->
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
        <span style="font-size: 0.75rem; font-weight: 700;">Daily Goal</span>
        <span style="font-size: 0.68rem; color: #34d399; font-weight: 600;" id="goalText">${stats.completedPomodoros} / ${stats.dailyGoalPomodoros || 6} Pomodoros (${stats.goalProgressPercent}%)</span>
      </div>
      <div style="background: #1e293b; height: 6px; border-radius: 999px; overflow: hidden;">
        <div id="goalBar" style="background: linear-gradient(90deg, #10b981, #06b6d4); height: 100%; width: ${stats.goalProgressPercent}%; transition: width 0.5s ease;"></div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.6rem; font-size: 0.7rem; color: var(--text-muted);">
        <div style="display: flex; align-items: center; gap: 0.3rem;">
          <span>💧 Water:</span>
          <strong id="waterCount" style="color: #38bdf8;">${stats.waterGlasses || 0}</strong> glasses
        </div>
        <button onclick="addWater()" style="background: rgba(14, 165, 233, 0.15); border: 1px solid rgba(14, 165, 233, 0.3); color: #38bdf8; padding: 0.2rem 0.55rem; border-radius: 4px; font-size: 0.65rem; font-weight: 600; cursor: pointer; transition: all 0.15s;">+1 Drink</button>
      </div>
    </div>

    <!-- 7-Day Trend Chart -->
    <div class="card">
      <div style="font-size: 0.75rem; font-weight: 700; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
        <span>7-Day Trend</span>
        <span style="font-size: 0.65rem; color: #c084fc; font-weight: 600;" id="streakPill">🔥 Streak</span>
      </div>
      <div id="weeklyBars" style="display: flex; justify-content: space-between; align-items: flex-end; height: 46px; padding-top: 4px; border-bottom: 1px solid #1e293b; gap: 4px;">
      </div>
      <div id="weeklyLabels" style="display: flex; justify-content: space-between; font-size: 0.58rem; color: #64748b; margin-top: 0.25rem;">
      </div>
    </div>

    <div class="tip-box" id="tipCard">
      🛡️ <strong>${tip.titleEn || tip.title}</strong><br>
      <span id="tipAction">${tip.actionEn || tip.action}</span>
    </div>

    <div class="sync-indicator">⚡ Synced real-time with CLI & AI Agent</div>
  </div>

  <script>
    // Web Audio Synthesizer
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;

    function playSound(freq = 528) {
      try {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
      } catch(e) {}
    }

    const CIRCUMFERENCE = 2 * Math.PI * 78; // ~490.08
    const ring = document.getElementById('progressRing');
    ring.style.strokeDasharray = CIRCUMFERENCE;

    let selectedPreset = { type: 'coding', duration: 25, label: 'Pomodoro (25m)' };
    let lastStatus = null;

    function updateUi(status) {
      lastStatus = status;

      if (!status.active) {
        document.getElementById('badgeText').textContent = 'READY';
        document.getElementById('badgeDot').style.background = '#10b981';
        document.getElementById('btnMain').style.display = 'inline-flex';
        document.getElementById('btnPause').style.display = 'none';
        document.getElementById('btnStop').style.display = 'none';
        
        document.getElementById('modeTag').textContent = selectedPreset.type.toUpperCase().replace('_', ' ');
        document.getElementById('taskPreview').textContent = selectedPreset.label;
        
        const m = Math.floor(selectedPreset.duration);
        const s = Math.round((selectedPreset.duration - m) * 60);
        document.getElementById('timeDigits').textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
        ring.style.strokeDashoffset = 0;
        ring.style.stroke = '#10b981';
        return;
      }

      // Active session running
      const isPaused = status.isPaused;
      document.getElementById('badgeText').textContent = isPaused ? 'PAUSED' : status.type.toUpperCase().replace('_', ' ');
      document.getElementById('badgeDot').style.background = isPaused ? '#f59e0b' : (status.type === 'coding' ? '#10b981' : '#0ea5e9');
      
      document.getElementById('btnMain').style.display = 'none';
      document.getElementById('btnPause').style.display = 'inline-flex';
      document.getElementById('btnPause').innerHTML = isPaused ? '<span>▶</span> Resume' : '<span>⏸</span> Pause';
      document.getElementById('btnStop').style.display = 'inline-flex';

      document.getElementById('modeTag').textContent = status.type.toUpperCase().replace('_', ' ');
      document.getElementById('taskPreview').textContent = status.task;
      document.getElementById('timeDigits').textContent = status.remainingFormatted;

      const frac = status.progressPercent / 100;
      ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - Math.min(1, frac));

      if (status.type === 'coding') ring.style.stroke = '#10b981';
      else if (status.type === 'short_break') ring.style.stroke = '#0ea5e9';
      else if (status.type === 'long_break') ring.style.stroke = '#6366f1';
      else if (status.type === 'eye_rest') ring.style.stroke = '#a855f7';

      // Update today metrics
      if (status.todaySummary) {
        document.getElementById('statCoding').textContent = status.todaySummary.totalCodingMinutes + 'm';
        document.getElementById('statBreak').textContent = status.todaySummary.totalBreakMinutes + 'm';
        document.getElementById('statCycles').textContent = status.todaySummary.completedPomodoros;
      }

      if (status.isOvertime) {
        playSound(528);
      }
    }

    async function pollStatus() {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          updateUi(data);
        }
      } catch (err) {}
    }

    async function doStart() {
      try {
        playSound(440);
        await fetch('/api/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: selectedPreset.type,
            durationMinutes: selectedPreset.duration,
            task: selectedPreset.label
          })
        });
        pollStatus();
      } catch(e) {}
    }

    async function doPauseToggle() {
      if (!lastStatus || !lastStatus.active) return;
      const endpoint = lastStatus.isPaused ? '/api/resume' : '/api/pause';
      try {
        await fetch(endpoint, { method: 'POST' });
        pollStatus();
      } catch(e) {}
    }

    async function doStop() {
      try {
        await fetch('/api/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true })
        });
        pollStatus();
      } catch(e) {}
    }

    function applyPreset(type, duration, label) {
      selectedPreset = { type, duration, label };
      document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      event.target.classList.add('active');

      if (!lastStatus || !lastStatus.active) {
        updateUi({ active: false });
      } else {
        if (confirm('A session is currently running. Switch to a new session?')) {
          doStart();
        }
      }
    }

    async function addWater() {
      try {
        const res = await fetch('/api/water', { method: 'POST' });
        if (res.ok) {
          const d = await res.json();
          document.getElementById('waterCount').textContent = d.glasses;
          playSound(660);
        }
      } catch(e) {}
    }

    async function loadWeekly() {
      try {
        const res = await fetch('/api/weekly');
        if (res.ok) {
          const data = await res.json();
          document.getElementById('streakPill').textContent = '🔥 ' + data.currentStreakDays + ' Day Streak';
          
          const maxMin = Math.max(30, ...data.days.map(d => d.codingMinutes));
          const barsContainer = document.getElementById('weeklyBars');
          const labelsContainer = document.getElementById('weeklyLabels');
          barsContainer.innerHTML = '';
          labelsContainer.innerHTML = '';

          data.days.forEach(d => {
            const h = Math.max(4, Math.round((d.codingMinutes / maxMin) * 40));
            const bar = document.createElement('div');
            bar.style.flex = '1';
            bar.style.height = h + 'px';
            bar.style.background = d.codingMinutes > 0 ? 'linear-gradient(180deg, #34d399, #059669)' : '#1e293b';
            bar.style.borderRadius = '3px 3px 0 0';
            bar.title = d.dayName + ': ' + d.codingMinutes + 'm coding (' + d.pomodoros + ' pomodoros)';
            barsContainer.appendChild(bar);

            const lbl = document.createElement('div');
            lbl.style.flex = '1';
            lbl.style.textAlign = 'center';
            lbl.textContent = d.dayName;
            labelsContainer.appendChild(lbl);
          });
        }
      } catch(e) {}
    }

    // Auto-poll status every 1 second for live synchronization
    pollStatus();
    loadWeekly();
    setInterval(pollStatus, 1000);
    setInterval(loadWeekly, 15000);
  </script>
</body>
</html>`;
}

// Sidecar HTTP Server with REST APIs
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-sidecar-token');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Preload.js
  if (url.pathname === '/preload.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(preloadJs || '/* preload */');
    return;
  }

  // Frontend HTML
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getPanelHtml());
    return;
  }

  // REST APIs
  if (url.pathname === '/api/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getStatus()));
    return;
  }

  if (url.pathname === '/api/stats' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getDailyStats()));
    return;
  }

  if (url.pathname === '/api/tip' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getErgonomicTip()));
    return;
  }

  if (url.pathname === '/api/weekly' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getWeeklyStats()));
    return;
  }

  // POST action endpoints
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let data = {};
      try {
        if (body) data = JSON.parse(body);
      } catch(e) {}

      if (url.pathname === '/api/start') {
        const out = startSession({
          type: data.type || 'coding',
          task: data.task || 'Coding Sprint',
          durationMinutes: data.durationMinutes,
          tag: data.tag || 'general'
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(out));
        return;
      }

      if (url.pathname === '/api/pause') {
        const out = pauseSession();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(out));
        return;
      }

      if (url.pathname === '/api/resume') {
        const out = resumeSession();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(out));
        return;
      }

      if (url.pathname === '/api/stop') {
        const out = stopSession({
          completed: data.completed !== undefined ? Boolean(data.completed) : true,
          reason: data.reason || 'manual_stop'
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(out));
        return;
      }

      if (url.pathname === '/api/water') {
        const out = logWater();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(out));
        return;
      }

      if (url.pathname === '/api/goal') {
        const out = setDailyGoal(data.goal);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(out));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, BIND_HOST, () => {
  console.log(`[DevFlow Sidecar] Web UI listening on http://${BIND_HOST}:${PORT}`);
});
