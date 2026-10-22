import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { sendDesktopNotification } from './notifier.mjs';

const STATE_DIR = path.join(os.homedir(), '.gemini', 'antigravity');
const STATE_FILE = path.join(STATE_DIR, 'devflow-state.json');

const DEFAULT_PREFERENCES = {
  pomodoroMinutes: 25,
  deepWorkMinutes: 50,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  eyeRestIntervalMinutes: 20,
  eyeRestSeconds: 20,
  soundAlerts: true,
  autoStartBreaks: false
};

const ERGONOMIC_TIPS = [
  {
    title: "Aturan 20-20-20 (Eye Relief)",
    category: "eyes",
    description: "Setiap 20 menit coding, alihkan pandangan ke objek sejauh 20 kaki (sekitar 6 meter) selama 20 detik. Ini mengendurkan otot siliaris mata dan mencegah rabun lelah.",
    action: "Lepaskan kacamata sejenak, tatap pemandangan luar jendela atau sudut terjauh ruangan."
  },
  {
    title: "Relaksasi Leher & Bahu (Cervical Relief)",
    category: "posture",
    description: "Posisi 'forward head' saat menatap monitor membebani tulang leher hingga 27 kg.",
    action: "Tarik dagu ke dalam (chin tuck), putar bahu ke belakang perlahan 5 kali, tahan 5 detik."
  },
  {
    title: "Peregangan Pergelangan Tangan (Carpal Tunnel Defense)",
    category: "hands",
    description: "Mengetik dan menggunakan trackpad terus-menerus menekan saraf median.",
    action: "Rentangkan tangan ke depan, tarik jemari ke belakang dengan lembut selama 10 detik per tangan."
  },
  {
    title: "Hidrasi Seluler & Oksigenasi Otak",
    category: "health",
    description: "Penurunan 2% cairan tubuh menurunkan konsentrasi dan kecepatan komputasi otak hingga 15%.",
    action: "Minum 1 gelas air putih hangat atau segar sekarang juga."
  },
  {
    title: "Dekompresi Tulang Belakang (Spine Reset)",
    category: "back",
    description: "Duduk lebih dari 50 menit menekan bantalan intervertebralis pinggang.",
    action: "Berdiri tegak, letakkan kedua telapak tangan di pinggang belakang, regangkan punggung ke belakang 15 derajat."
  },
  {
    title: "Pernapasan Diafragma 4-7-8 (Reset Fokus)",
    category: "mind",
    description: "Menurunkan detak jantung, meredakan frustrasi saat debugging rumit, dan menyegarkan korteks prefrontal.",
    action: "Tarik napas 4 detik lewat hidung, tahan 7 detik, hembuskan 8 detik lewat mulut."
  }
];

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultState() {
  const today = getTodayKey();
  return {
    version: '1.0.0',
    currentSession: null,
    preferences: { ...DEFAULT_PREFERENCES },
    history: {
      [today]: {
        date: today,
        totalCodingMinutes: 0,
        totalBreakMinutes: 0,
        completedPomodoros: 0,
        sessionsCount: 0,
        sessions: []
      }
    },
    lastActivityAt: new Date().toISOString()
  };
}

export function loadState() {
  try {
    if (!fs.existsSync(STATE_DIR)) {
      fs.mkdirSync(STATE_DIR, { recursive: true });
    }
    if (!fs.existsSync(STATE_FILE)) {
      const initial = getDefaultState();
      saveState(initial);
      return initial;
    }
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const today = getTodayKey();
    if (!parsed.history) parsed.history = {};
    if (!parsed.history[today]) {
      parsed.history[today] = {
        date: today,
        totalCodingMinutes: 0,
        totalBreakMinutes: 0,
        completedPomodoros: 0,
        sessionsCount: 0,
        sessions: []
      };
    }
    if (!parsed.preferences) {
      parsed.preferences = { ...DEFAULT_PREFERENCES };
    }
    return parsed;
  } catch (err) {
    console.error('[DevFlow] Error loading state, recreating:', err.message);
    const fallback = getDefaultState();
    saveState(fallback);
    return fallback;
  }
}

export function saveState(state) {
  try {
    if (!fs.existsSync(STATE_DIR)) {
      fs.mkdirSync(STATE_DIR, { recursive: true });
    }
    const tempFile = `${STATE_FILE}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), 'utf8');
    fs.renameSync(tempFile, STATE_FILE);
  } catch (err) {
    console.error('[DevFlow] Failed to write state:', err.message);
  }
}

export function startSession({
  type = 'coding',
  task = 'General Coding Sprint',
  durationMinutes = null,
  tag = 'development'
} = {}) {
  const state = loadState();
  const prefs = state.preferences;

  let targetDuration = durationMinutes;
  if (!targetDuration || targetDuration <= 0) {
    if (type === 'coding') targetDuration = prefs.pomodoroMinutes;
    else if (type === 'short_break') targetDuration = prefs.shortBreakMinutes;
    else if (type === 'long_break') targetDuration = prefs.longBreakMinutes;
    else if (type === 'eye_rest') targetDuration = prefs.eyeRestSeconds / 60;
    else targetDuration = 25;
  }

  // If there was an ongoing session, stop and archive it first
  if (state.currentSession && state.currentSession.status === 'running') {
    stopSession({ completed: false, reason: 'interrupted_by_new_session' });
  }

  const now = Date.now();
  const session = {
    id: `sess_${now}_${crypto.randomBytes(3).toString('hex')}`,
    type, // 'coding' | 'short_break' | 'long_break' | 'eye_rest'
    task: task || (type === 'coding' ? 'Focus Coding Block' : 'Ergonomic Break'),
    tag: tag || 'general',
    targetDurationMinutes: targetDuration,
    startTimestamp: now,
    targetEndTimestamp: now + Math.round(targetDuration * 60 * 1000),
    isPaused: false,
    pausedAt: null,
    totalPausedMs: 0,
    status: 'running' // 'running' | 'paused' | 'completed' | 'cancelled'
  };

  state.currentSession = session;
  state.lastActivityAt = new Date().toISOString();
  saveState(state);

  return getStatus();
}

export function pauseSession() {
  const state = loadState();
  const s = state.currentSession;
  if (!s || s.status !== 'running' || s.isPaused) {
    return { error: 'No active running session to pause.' };
  }

  s.isPaused = true;
  s.pausedAt = Date.now();
  s.status = 'paused';
  saveState(state);
  return getStatus();
}

export function resumeSession() {
  const state = loadState();
  const s = state.currentSession;
  if (!s || s.status !== 'paused' || !s.isPaused) {
    return { error: 'No paused session to resume.' };
  }

  const pausedDuration = Date.now() - (s.pausedAt || Date.now());
  s.totalPausedMs = (s.totalPausedMs || 0) + pausedDuration;
  s.targetEndTimestamp = s.targetEndTimestamp + pausedDuration;
  s.isPaused = false;
  s.pausedAt = null;
  s.status = 'running';
  saveState(state);
  return getStatus();
}

export function stopSession({ completed = true, reason = 'manual_stop' } = {}) {
  const state = loadState();
  const s = state.currentSession;
  if (!s) {
    return { message: 'No active session to stop.' };
  }

  const now = Date.now();
  const effectiveEnd = s.isPaused ? (s.pausedAt || now) : now;
  const elapsedMs = Math.max(0, effectiveEnd - s.startTimestamp - (s.totalPausedMs || 0));
  const elapsedMinutes = Math.round((elapsedMs / (60 * 1000)) * 10) / 10;

  const finishedSession = {
    ...s,
    endTimestamp: now,
    actualElapsedMinutes: elapsedMinutes,
    completed: Boolean(completed),
    status: completed ? 'completed' : 'interrupted',
    stopReason: reason
  };

  if (completed) {
    try {
      const notifMsg = s.type === 'coding'
        ? `Selesai ${elapsedMinutes}m fokus! Waktunya istirahat sejenak untuk memulihkan mata & pikiran.`
        : `Istirahat selesai! Tubuh & pikiran rileks, siap melanjutkan sprint coding.`;
      sendDesktopNotification({
        title: `DevFlow: ${s.task || 'Timer Selesai'}`,
        message: notifMsg
      });
    } catch (e) {}
  }

  const today = getTodayKey();
  if (!state.history[today]) {
    state.history[today] = {
      date: today,
      totalCodingMinutes: 0,
      totalBreakMinutes: 0,
      completedPomodoros: 0,
      sessionsCount: 0,
      sessions: []
    };
  }

  const dayStat = state.history[today];
  dayStat.sessionsCount += 1;
  dayStat.sessions.push(finishedSession);

  if (s.type === 'coding') {
    dayStat.totalCodingMinutes = Math.round((dayStat.totalCodingMinutes + elapsedMinutes) * 10) / 10;
    if (completed && elapsedMinutes >= (state.preferences.pomodoroMinutes * 0.8)) {
      dayStat.completedPomodoros += 1;
    }
  } else {
    dayStat.totalBreakMinutes = Math.round((dayStat.totalBreakMinutes + elapsedMinutes) * 10) / 10;
  }

  state.currentSession = null;
  state.lastActivityAt = new Date().toISOString();
  saveState(state);

  return {
    finishedSession,
    todayStats: {
      totalCodingMinutes: dayStat.totalCodingMinutes,
      totalBreakMinutes: dayStat.totalBreakMinutes,
      completedPomodoros: dayStat.completedPomodoros
    }
  };
}

export function getStatus() {
  const state = loadState();
  const today = getTodayKey();
  const dayStat = state.history[today] || {
    totalCodingMinutes: 0,
    totalBreakMinutes: 0,
    completedPomodoros: 0,
    sessions: []
  };

  const s = state.currentSession;
  if (!s) {
    return {
      active: false,
      status: 'idle',
      message: 'Tidak ada sesi aktif saat ini. Anda dapat memulai sesi coding atau istirahat.',
      todaySummary: {
        totalCodingMinutes: dayStat.totalCodingMinutes,
        totalBreakMinutes: dayStat.totalBreakMinutes,
        completedPomodoros: dayStat.completedPomodoros
      },
      nextRecommendation: 'Mulai 25m Focus Block (Pomodoro) untuk memulai sprint coding yang produktif.'
    };
  }

  const now = Date.now();
  const effectiveNow = s.isPaused ? (s.pausedAt || now) : now;
  const elapsedMs = Math.max(0, effectiveNow - s.startTimestamp - (s.totalPausedMs || 0));
  const totalTargetMs = s.targetDurationMinutes * 60 * 1000;
  const remainingMs = Math.max(0, totalTargetMs - elapsedMs);
  const isOvertime = elapsedMs > totalTargetMs;

  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const remainingSeconds = Math.floor(remainingMs / 1000);
  const progressPercent = Math.min(100, Math.round((elapsedMs / totalTargetMs) * 100));

  const formatMinSec = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  let recommendation = '';
  if (isOvertime) {
    if (s.type === 'coding') {
      recommendation = 'Waktu fokus telah selesai! Segera simpan kode dan ambil istirahat 5 menit untuk menjaga kesegaran otak.';
    } else {
      recommendation = 'Istirahat telah cukup. Regangkan punggung dan siap kembali fokus ke kode!';
    }
  } else {
    if (s.type === 'coding') {
      if (progressPercent > 75) {
        recommendation = 'Sisa waktu fokus sedikit lagi. Selesaikan fungsi/blok kode saat ini dengan rapi.';
      } else {
        recommendation = 'Sedang dalam zona fokus. Minimalkan gangguan dan pertahankan flow kerja.';
      }
    } else {
      recommendation = 'Lepaskan pandangan dari layar, lakukan peregangan ringan dan minum air putih.';
    }
  }

  return {
    active: true,
    sessionId: s.id,
    type: s.type, // 'coding' | 'short_break' | 'long_break' | 'eye_rest'
    task: s.task,
    tag: s.tag,
    status: s.status,
    isPaused: s.isPaused,
    targetDurationMinutes: s.targetDurationMinutes,
    elapsedSeconds,
    remainingSeconds,
    elapsedFormatted: formatMinSec(elapsedSeconds),
    remainingFormatted: formatMinSec(remainingSeconds),
    progressPercent,
    isOvertime,
    recommendation,
    todaySummary: {
      totalCodingMinutes: dayStat.totalCodingMinutes,
      totalBreakMinutes: dayStat.totalBreakMinutes,
      completedPomodoros: dayStat.completedPomodoros
    }
  };
}

export function getDailyStats() {
  const state = loadState();
  const today = getTodayKey();
  const dayStat = state.history[today] || {
    totalCodingMinutes: 0,
    totalBreakMinutes: 0,
    completedPomodoros: 0,
    sessionsCount: 0,
    sessions: []
  };

  // Calculate Ergonomics & Focus Score (0 - 100)
  const codingHours = dayStat.totalCodingMinutes / 60;
  const breakRatio = dayStat.totalCodingMinutes > 0
    ? (dayStat.totalBreakMinutes / dayStat.totalCodingMinutes)
    : 0;

  // Ideal break ratio is ~0.20 (5m break every 25m = 20%)
  let score = 70;
  if (dayStat.completedPomodoros >= 4) score += 15;
  if (breakRatio >= 0.15 && breakRatio <= 0.35) score += 15;
  if (breakRatio < 0.05 && dayStat.totalCodingMinutes > 90) score -= 25; // Burnout risk!
  score = Math.max(10, Math.min(100, Math.round(score)));

  let focusPace = 'Optimal';
  if (breakRatio < 0.10 && dayStat.totalCodingMinutes > 60) {
    focusPace = 'Kurang Istirahat (Perlu Micro-Break)';
  } else if (dayStat.completedPomodoros >= 4) {
    focusPace = 'High Deep Work Flow';
  }

  return {
    date: today,
    totalCodingMinutes: dayStat.totalCodingMinutes,
    totalCodingHours: Math.round(codingHours * 10) / 10,
    totalBreakMinutes: dayStat.totalBreakMinutes,
    completedPomodoros: dayStat.completedPomodoros,
    breakRatioPercent: Math.round(breakRatio * 100),
    productivityScore: score,
    focusPace,
    sessionsCount: dayStat.sessionsCount,
    recentSessions: dayStat.sessions.slice(-8)
  };
}

export function recordActivity(source = 'general') {
  const state = loadState();
  state.lastActivityAt = new Date().toISOString();
  saveState(state);
  return { updated: true, timestamp: state.lastActivityAt };
}

export function getErgonomicTip(category = null) {
  let pool = ERGONOMIC_TIPS;
  if (category) {
    const filtered = pool.filter(t => t.category === category);
    if (filtered.length > 0) pool = filtered;
  }
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

export function updatePreferences(updates = {}) {
  const state = loadState();
  state.preferences = {
    ...state.preferences,
    ...updates
  };
  saveState(state);
  return state.preferences;
}
