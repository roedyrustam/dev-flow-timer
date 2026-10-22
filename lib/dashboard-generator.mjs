import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { exec } from 'node:child_process';
import { getStatus, getDailyStats, getErgonomicTip, loadState } from './timer-engine.mjs';

const DASHBOARD_FILE = path.join(os.homedir(), '.gemini', 'antigravity', 'devflow-dashboard.html');

export function generateDashboardHtml() {
  const status = getStatus();
  const stats = getDailyStats();
  const tip = getErgonomicTip();
  const state = loadState();

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevFlow - Coding & Break Productivity Cockpit</title>
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
      --break-glow: rgba(14, 165, 233, 0.25);
      --eye-color: #a855f7;
      --warning-color: #f59e0b;
      --danger-color: #ef4444;
      --accent: #6366f1;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      background-color: var(--bg);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
    }
    .container {
      width: 100%;
      max-width: 900px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 1rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: linear-gradient(135deg, #10b981, #0ea5e9);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: 1.1rem;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    .brand-title {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .brand-subtitle {
      font-size: 0.78rem;
      color: var(--text-muted);
    }
    .header-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #34d399;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.03em;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse 2s infinite ease-in-out;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }
    .grid-main {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 1.5rem;
    }
    @media (max-width: 768px) {
      .grid-main { grid-template-columns: 1fr; }
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 1.5rem;
      position: relative;
    }
    .timer-center-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem 1rem;
    }
    .svg-ring-container {
      position: relative;
      width: 260px;
      height: 260px;
      margin-bottom: 1.5rem;
    }
    .svg-ring {
      transform: rotate(-90deg);
      width: 100%;
      height: 100%;
    }
    .ring-bg {
      fill: none;
      stroke: #1e293b;
      stroke-width: 10;
    }
    .ring-progress {
      fill: none;
      stroke: var(--focus-color);
      stroke-width: 10;
      stroke-linecap: round;
      stroke-dasharray: 754;
      stroke-dashoffset: 0;
      transition: stroke-dashoffset 1s linear, stroke 0.4s ease;
    }
    .timer-inner-content {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .state-pill {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.08em;
      padding: 0.2rem 0.65rem;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.08);
      margin-bottom: 0.5rem;
      color: var(--text-muted);
    }
    .time-digits {
      font-size: 3.25rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.04em;
      line-height: 1;
      margin-bottom: 0.4rem;
    }
    .task-label {
      font-size: 0.85rem;
      color: var(--text-muted);
      max-width: 190px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .controls-row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      justify-content: center;
      margin-bottom: 1.5rem;
    }
    .btn {
      background: #1e293b;
      color: var(--text-main);
      border: 1px solid #334155;
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.15s ease;
    }
    .btn:hover {
      background: #334155;
      border-color: #475569;
      transform: translateY(-1px);
    }
    .btn-primary {
      background: #10b981;
      border-color: #10b981;
      color: #064e3b;
    }
    .btn-primary:hover {
      background: #34d399;
      border-color: #34d399;
      box-shadow: 0 4px 14px var(--focus-glow);
    }
    .btn-danger {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.4);
      color: #f87171;
    }
    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.25);
    }
    .preset-selector {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      justify-content: center;
      margin-top: 0.5rem;
    }
    .preset-btn {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 0.45rem 0.85rem;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }
    .preset-btn:hover {
      background: rgba(255, 255, 255, 0.09);
      color: var(--text-main);
      border-color: #475569;
    }
    .preset-btn.active {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.5);
      color: #34d399;
      font-weight: 600;
    }
    .side-stack {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    .metric-box {
      background: #090d16;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 0.85rem;
    }
    .metric-title {
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.04em;
      margin-bottom: 0.35rem;
    }
    .metric-val {
      font-size: 1.4rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .metric-sub {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
    }
    .tip-card {
      background: linear-gradient(145deg, #0f172a, #131c31);
      border: 1px solid #1e293b;
    }
    .tip-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #38bdf8;
      font-size: 0.85rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .tip-body {
      font-size: 0.82rem;
      line-height: 1.5;
      color: #cbd5e1;
      margin-bottom: 0.75rem;
    }
    .tip-action-box {
      background: rgba(14, 165, 233, 0.08);
      border-left: 3px solid #0ea5e9;
      padding: 0.6rem 0.8rem;
      border-radius: 0 6px 6px 0;
      font-size: 0.78rem;
      color: #bae6fd;
    }
    .sound-toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      margin-top: 0.75rem;
      border-top: 1px solid var(--card-border);
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .switch {
      position: relative;
      display: inline-block;
      width: 38px;
      height: 20px;
    }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #334155;
      transition: .2s;
      border-radius: 20px;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .2s;
      border-radius: 50%;
    }
    input:checked + .slider { background-color: #10b981; }
    input:checked + .slider:before { transform: translateX(18px); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="brand-icon">&lt;/&gt;</div>
        <div>
          <div class="brand-title">DevFlow Timer</div>
          <div class="brand-subtitle">Smart Coding Rhythm & Ergonomic Break Sentinel</div>
        </div>
      </div>
      <div class="header-badge" id="statusPill">
        <div class="pulse-dot"></div>
        <span id="headerStatusText">Ready</span>
      </div>
    </header>

    <div class="grid-main">
      <div class="card timer-center-panel">
        <div class="svg-ring-container">
          <svg class="svg-ring" viewBox="0 0 260 260">
            <circle class="ring-bg" cx="130" cy="130" r="115"></circle>
            <circle class="ring-progress" id="progressRing" cx="130" cy="130" r="115"></circle>
          </svg>
          <div class="timer-inner-content">
            <div class="state-pill" id="sessionStatePill">READY</div>
            <div class="time-digits" id="timeDisplay">25:00</div>
            <div class="task-label" id="taskLabel">Deep Focus Coding Sprint</div>
          </div>
        </div>

        <div class="controls-row">
          <button class="btn btn-primary" id="btnMain" onclick="handleMainAction()">
            <span>▶</span> Start Session
          </button>
          <button class="btn" id="btnPause" onclick="handlePauseToggle()" style="display:none;">
            <span>⏸</span> Pause
          </button>
          <button class="btn btn-danger" id="btnStop" onclick="handleStopSession()" style="display:none;">
            <span>⏹</span> Stop
          </button>
        </div>

        <div class="preset-selector">
          <button class="preset-btn active" onclick="setPreset('coding', 25, 'Pomodoro Focus (25m)')">25m Pomodoro</button>
          <button class="preset-btn" onclick="setPreset('coding', 50, 'Deep Architecture (50m)')">50m Deep Work</button>
          <button class="preset-btn" onclick="setPreset('short_break', 5, 'Short Rest (5m)')">5m Short Break</button>
          <button class="preset-btn" onclick="setPreset('long_break', 15, 'Long Reset (15m)')">15m Long Break</button>
          <button class="preset-btn" onclick="setPreset('eye_rest', 0.33, '20-20-20 Rule')">20s Eye Rest</button>
        </div>
      </div>

      <div class="side-stack">
        <div class="card">
          <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.35rem;">Today's Summary</h3>
          <p style="font-size: 0.78rem; color: var(--text-muted);">Your focus metrics & recovery rhythm</p>

          <div class="metric-grid">
            <div class="metric-box">
              <div class="metric-title">Coding Time</div>
              <div class="metric-val" id="statCoding">${stats.totalCodingMinutes}<span style="font-size:0.8rem; font-weight:normal; margin-left:2px;">m</span></div>
              <div class="metric-sub">${stats.totalCodingHours} hours focused</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">Break Time</div>
              <div class="metric-val" id="statBreak">${stats.totalBreakMinutes}<span style="font-size:0.8rem; font-weight:normal; margin-left:2px;">m</span></div>
              <div class="metric-sub">Healthy ratio ~20%</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">Pomodoro</div>
              <div class="metric-val" id="statCycles">${stats.completedPomodoros}</div>
              <div class="metric-sub">Cycles completed</div>
            </div>
            <div class="metric-box">
              <div class="metric-title">Rhythm Score</div>
              <div class="metric-val" style="color: #34d399;" id="statScore">${stats.productivityScore}</div>
              <div class="metric-sub" id="statPace">${stats.focusPace}</div>
            </div>
          </div>

          <div class="sound-toggle-row">
            <span>Audio Chime (Web Audio Synthesizer)</span>
            <label class="switch">
              <input type="checkbox" id="soundToggle" checked>
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="card tip-card">
          <div class="tip-header">
            <span>🛡️ Ergonomic & Eye Health Sentinel</span>
          </div>
          <div class="tip-body" id="tipDescription">
            <strong>${tip.titleEn || tip.title}</strong><br>
            ${tip.descriptionEn || tip.description}
          </div>
          <div class="tip-action-box" id="tipAction">
            💡 <strong>Quick Action:</strong> ${tip.actionEn || tip.action}
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Audio Synthesizer via Web Audio API (Zero external MP3 dependencies)
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;

    function playChime(type = 'success') {
      const toggle = document.getElementById('soundToggle');
      if (!toggle || !toggle.checked) return;
      try {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'success') {
          // Solfeggio 528Hz Harmonic Bell (Transformative & Calm)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(528, now);
          osc.frequency.exponentialRampToValueAtTime(1056, now + 0.15);
          osc.frequency.exponentialRampToValueAtTime(528, now + 0.8);

          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

          osc.start(now);
          osc.stop(now + 1.2);
        } else if (type === 'tick') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
        }
      } catch (e) {
        console.warn('Audio play prevented:', e);
      }
    }

    // Local State Model
    let currentMode = 'coding';
    let targetMinutes = 25;
    let taskName = 'Deep Focus Coding Sprint';
    let isRunning = false;
    let isPaused = false;
    let elapsedSeconds = 0;
    let totalTargetSeconds = 25 * 60;
    let timerInterval = null;

    const CIRCUMFERENCE = 2 * Math.PI * 115; // ~722.56
    const ring = document.getElementById('progressRing');
    ring.style.strokeDasharray = CIRCUMFERENCE;

    function updateDisplay() {
      const remaining = Math.max(0, totalTargetSeconds - elapsedSeconds);
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      document.getElementById('timeDisplay').textContent = 
        String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      
      const fraction = Math.min(1, elapsedSeconds / totalTargetSeconds);
      const offset = CIRCUMFERENCE * (1 - fraction);
      ring.style.strokeDashoffset = offset;

      // Color coding based on mode
      if (currentMode === 'coding') {
        ring.style.stroke = '#10b981';
      } else if (currentMode === 'short_break') {
        ring.style.stroke = '#0ea5e9';
      } else if (currentMode === 'long_break') {
        ring.style.stroke = '#6366f1';
      } else if (currentMode === 'eye_rest') {
        ring.style.stroke = '#a855f7';
      }

      document.title = (isRunning ? ('[' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '] ') : '') + 'DevFlow Timer';
    }

    function setPreset(mode, minutes, label) {
      if (isRunning && !confirm('A session is currently running. Switch to new preset?')) {
        return;
      }
      stopTimerInternal();
      currentMode = mode;
      targetMinutes = minutes;
      taskName = label;
      totalTargetSeconds = Math.round(minutes * 60);
      elapsedSeconds = 0;

      document.getElementById('sessionStatePill').textContent = mode.toUpperCase().replace('_', ' ');
      document.getElementById('taskLabel').textContent = label;
      
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');

      updateDisplay();
    }

    function handleMainAction() {
      if (!isRunning) {
        startTimer();
      }
    }

    function startTimer() {
      isRunning = true;
      isPaused = false;
      document.getElementById('btnMain').style.display = 'none';
      document.getElementById('btnPause').style.display = 'inline-flex';
      document.getElementById('btnStop').style.display = 'inline-flex';
      document.getElementById('headerStatusText').textContent = 'Session Running (' + currentMode + ')';
      
      playChime('tick');

      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        if (!isPaused) {
          elapsedSeconds++;
          updateDisplay();

          if (elapsedSeconds >= totalTargetSeconds) {
            handleSessionCompleted();
          }
        }
      }, 1000);
    }

    function handlePauseToggle() {
      isPaused = !isPaused;
      const pauseBtn = document.getElementById('btnPause');
      if (isPaused) {
        pauseBtn.innerHTML = '<span>▶</span> Resume';
        document.getElementById('headerStatusText').textContent = 'Session Paused';
      } else {
        pauseBtn.innerHTML = '<span>⏸</span> Pause';
        document.getElementById('headerStatusText').textContent = 'Session Running (' + currentMode + ')';
      }
    }

    function handleSessionCompleted() {
      stopTimerInternal();
      playChime('success');
      alert(currentMode === 'coding'
        ? '🎉 Focus Session Completed! Time for a 5-minute break to rest your eyes and recharge your mind.'
        : '🌿 Break finished! Mind and body refreshed, ready to resume coding.');
      
      if (currentMode === 'coding') {
        const codingMin = Math.round(totalTargetSeconds / 60);
        const cur = parseInt(document.getElementById('statCoding').textContent) || 0;
        document.getElementById('statCoding').innerHTML = (cur + codingMin) + '<span style="font-size:0.8rem; font-weight:normal; margin-left:2px;">m</span>';
        const cycles = parseInt(document.getElementById('statCycles').textContent) || 0;
        document.getElementById('statCycles').textContent = cycles + 1;
      } else {
        const breakMin = Math.round(totalTargetSeconds / 60);
        const cur = parseInt(document.getElementById('statBreak').textContent) || 0;
        document.getElementById('statBreak').innerHTML = (cur + breakMin) + '<span style="font-size:0.8rem; font-weight:normal; margin-left:2px;">m</span>';
      }
    }

    function handleStopSession() {
      if (confirm('End current session?')) {
        stopTimerInternal();
      }
    }

    function stopTimerInternal() {
      isRunning = false;
      isPaused = false;
      clearInterval(timerInterval);
      elapsedSeconds = 0;
      document.getElementById('btnMain').style.display = 'inline-flex';
      document.getElementById('btnPause').style.display = 'none';
      document.getElementById('btnStop').style.display = 'none';
      document.getElementById('headerStatusText').textContent = 'Ready';
      updateDisplay();
    }

    // Init
    updateDisplay();
  </script>
</body>
</html>`;
}

export function saveAndOpenDashboard() {
  const html = generateDashboardHtml();
  fs.writeFileSync(DASHBOARD_FILE, html, 'utf8');

  // Launch browser based on OS
  const platform = os.platform();
  let cmd = `start "" "${DASHBOARD_FILE}"`;
  if (platform === 'darwin') {
    cmd = `open "${DASHBOARD_FILE}"`;
  } else if (platform === 'linux') {
    cmd = `xdg-open "${DASHBOARD_FILE}"`;
  }

  exec(cmd, (err) => {
    if (err) {
      console.warn('[DevFlow] Could not auto-launch browser:', err.message);
    }
  });

  return {
    filePath: DASHBOARD_FILE,
    fileUri: `file:///${DASHBOARD_FILE.replace(/\\\\/g, '/')}`,
    opened: true
  };
}
