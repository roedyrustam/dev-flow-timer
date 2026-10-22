import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { sendDesktopNotification } from './notifier.mjs';

function getStateFile() {
  if (process.env.DEVFLOW_STATE_FILE) {
    return process.env.DEVFLOW_STATE_FILE;
  }
  return path.join(os.homedir(), '.gemini', 'antigravity', 'devflow-state.json');
}

function getStateDir() {
  return path.dirname(getStateFile());
}

const DEFAULT_PREFERENCES = {
  pomodoroMinutes: 25,
  deepWorkMinutes: 50,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  eyeRestIntervalMinutes: 20,
  eyeRestSeconds: 20,
  dailyGoalPomodoros: 6,
  soundAlerts: true,
  autoStartBreaks: false
};

const ERGONOMIC_TIPS = [
  {
    title: "20-20-20 Rule (Eye Relief)",
    titleEn: "20-20-20 Rule (Eye Relief)",
    category: "eyes",
    description: "Every 20 minutes of coding, look at an object 20 feet (6 meters) away for 20 seconds to relax ciliary eye muscles.",
    descriptionEn: "Every 20 minutes of coding, look at an object 20 feet (6 meters) away for 20 seconds to relax ciliary eye muscles.",
    action: "Look away from the monitor towards a distant view or the farthest corner of the room.",
    actionEn: "Look away from the monitor towards a distant view or the farthest corner of the room."
  },
  {
    title: "Neck & Shoulder Relief (Cervical Ease)",
    titleEn: "Neck & Shoulder Relief (Cervical Ease)",
    category: "posture",
    description: "A 'forward head' posture while staring at screens places up to 27 kg of strain on your cervical spine.",
    descriptionEn: "A 'forward head' posture while staring at screens places up to 27 kg of strain on your cervical spine.",
    action: "Perform a gentle chin tuck, roll shoulders backwards 5 times, and hold for 5 seconds.",
    actionEn: "Perform a gentle chin tuck, roll shoulders backwards 5 times, and hold for 5 seconds."
  },
  {
    title: "Wrist & Hand Stretch (Carpal Tunnel Defense)",
    titleEn: "Wrist & Hand Stretch (Carpal Tunnel Defense)",
    category: "hands",
    description: "Continuous typing and trackpad usage strains the median nerve and wrist tendons.",
    descriptionEn: "Continuous typing and trackpad usage strains the median nerve and wrist tendons.",
    action: "Extend your arm forward with palm facing up, gently pull fingers back for 10 seconds per hand.",
    actionEn: "Extend your arm forward with palm facing up, gently pull fingers back for 10 seconds per hand."
  },
  {
    title: "Cellular Hydration & Brain Oxygenation",
    titleEn: "Cellular Hydration & Brain Oxygenation",
    category: "health",
    description: "A 2% drop in hydration reduces cognitive concentration and computing speed by up to 15%.",
    descriptionEn: "A 2% drop in hydration reduces cognitive concentration and computing speed by up to 15%.",
    action: "Drink 1 full glass of fresh water right now.",
    actionEn: "Drink 1 full glass of fresh water right now."
  },
  {
    title: "Spine Decompression (Back Reset)",
    titleEn: "Spine Decompression (Back Reset)",
    category: "back",
    description: "Sitting for over 50 minutes compresses lumbar intervertebral discs.",
    descriptionEn: "Sitting for over 50 minutes compresses lumbar intervertebral discs.",
    action: "Stand up straight, place hands on your lower back, and gently arch backwards 15 degrees.",
    actionEn: "Stand up straight, place hands on your lower back, and gently arch backwards 15 degrees."
  },
  {
    title: "4-7-8 Diaphragmatic Breathing (Focus Reset)",
    titleEn: "4-7-8 Diaphragmatic Breathing (Focus Reset)",
    category: "mind",
    description: "Lowers heart rate, clears mental debugging stress, and recharges your prefrontal cortex.",
    descriptionEn: "Lowers heart rate, clears mental debugging stress, and recharges your prefrontal cortex.",
    action: "Inhale through nose for 4s, hold for 7s, exhale completely through mouth for 8s.",
    actionEn: "Inhale through nose for 4s, hold for 7s, exhale completely through mouth for 8s."
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
  const stateDir = getStateDir();
  const stateFile = getStateFile();
  try {
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }
    if (!fs.existsSync(stateFile)) {
      const initial = getDefaultState();
      saveState(initial);
      return initial;
    }
    const raw = fs.readFileSync(stateFile, 'utf8');
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
  const stateDir = getStateDir();
  const stateFile = getStateFile();
  try {
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }
    const tempFile = `${stateFile}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), 'utf8');
    fs.renameSync(tempFile, stateFile);
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

export function stopSession({ completed = true, reason = 'manual_stop', elapsedMinutes: elapsedMinutesOverride = null } = {}) {
  const state = loadState();
  const s = state.currentSession;
  if (!s) {
    return { message: 'No active session to stop.' };
  }

  const now = Date.now();
  const effectiveEnd = s.isPaused ? (s.pausedAt || now) : now;
  const elapsedMs = Math.max(0, effectiveEnd - s.startTimestamp - (s.totalPausedMs || 0));
  const elapsedMinutes = elapsedMinutesOverride !== null
    ? Math.max(0, Math.round(Number(elapsedMinutesOverride) * 10) / 10)
    : Math.round((elapsedMs / (60 * 1000)) * 10) / 10;

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
        ? `Completed ${elapsedMinutes}m focus! Time to rest your eyes and recharge your mind.`
        : `Break finished! Body and mind refreshed, ready to resume coding.`;
      sendDesktopNotification({
        title: `DevFlow: ${s.task || 'Timer Completed'}`,
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
      message: 'No active session. You can start a coding sprint or a restorative break.',
      todaySummary: {
        totalCodingMinutes: dayStat.totalCodingMinutes,
        totalBreakMinutes: dayStat.totalBreakMinutes,
        completedPomodoros: dayStat.completedPomodoros
      },
      nextRecommendation: 'Start a 25m Focus Block (Pomodoro) to begin a productive coding sprint.'
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
      recommendation = 'Focus time completed! Save your code and take a 5-minute break to rest your eyes and refresh your mind.';
    } else {
      recommendation = 'Break completed. Stretch your back and get ready to return to your code!';
    }
  } else {
    if (s.type === 'coding') {
      if (progressPercent > 75) {
        recommendation = 'Almost done with focus sprint. Wrap up current code block cleanly.';
      } else {
        recommendation = 'In the flow zone. Minimize distractions and keep up the momentum.';
      }
    } else {
      recommendation = 'Look away from the screen, do light stretching, and stay hydrated.';
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
    focusPace = 'Break Needed (Micro-Break Recommended)';
  } else if (dayStat.completedPomodoros >= 4) {
    focusPace = 'High Deep Work Flow';
  }

  const goal = state.preferences.dailyGoalPomodoros || 6;
  const goalPercent = Math.min(100, Math.round((dayStat.completedPomodoros / goal) * 100));

  return {
    date: today,
    totalCodingMinutes: dayStat.totalCodingMinutes,
    totalCodingHours: Math.round(codingHours * 10) / 10,
    totalBreakMinutes: dayStat.totalBreakMinutes,
    completedPomodoros: dayStat.completedPomodoros,
    dailyGoalPomodoros: goal,
    goalProgressPercent: goalPercent,
    waterGlasses: dayStat.waterGlasses || 0,
    breakRatioPercent: Math.round(breakRatio * 100),
    productivityScore: score,
    focusPace,
    sessionsCount: dayStat.sessionsCount,
    recentSessions: dayStat.sessions.slice(-8)
  };
}

export function getWeeklyStats() {
  const state = loadState();
  const history = state.history || {};
  
  const days = [];
  const tagTotals = {};
  const hourlyDistribution = new Array(24).fill(0);
  let totalWeeklyCodingMin = 0;
  let totalWeeklyBreakMin = 0;
  let totalWeeklyPomodoros = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const dayStat = history[key] || {
      date: key,
      totalCodingMinutes: 0,
      totalBreakMinutes: 0,
      completedPomodoros: 0,
      sessions: []
    };

    totalWeeklyCodingMin += dayStat.totalCodingMinutes || 0;
    totalWeeklyBreakMin += dayStat.totalBreakMinutes || 0;
    totalWeeklyPomodoros += dayStat.completedPomodoros || 0;

    if (Array.isArray(dayStat.sessions)) {
      for (const s of dayStat.sessions) {
        const tag = s.tag || 'general';
        const mins = s.actualElapsedMinutes || s.targetDurationMinutes || 0;
        tagTotals[tag] = (tagTotals[tag] || 0) + mins;

        if (s.startTimestamp) {
          const hour = new Date(s.startTimestamp).getHours();
          hourlyDistribution[hour] += Math.round(mins);
        }
      }
    }

    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    days.push({
      date: key,
      dayName,
      codingMinutes: dayStat.totalCodingMinutes || 0,
      breakMinutes: dayStat.totalBreakMinutes || 0,
      pomodoros: dayStat.completedPomodoros || 0
    });
  }

  // Calculate Streak
  let streak = 0;
  let checkDate = new Date();
  while (true) {
    const k = checkDate.toISOString().split('T')[0];
    const stat = history[k];
    if (stat && (stat.totalCodingMinutes > 0 || stat.completedPomodoros > 0)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (k === getTodayKey() && streak === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yk = checkDate.toISOString().split('T')[0];
        const ystat = history[yk];
        if (ystat && (ystat.totalCodingMinutes > 0 || ystat.completedPomodoros > 0)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }

  const tags = Object.keys(tagTotals).map(tag => ({
    tag,
    minutes: Math.round(tagTotals[tag] * 10) / 10,
    percent: totalWeeklyCodingMin > 0 ? Math.round((tagTotals[tag] / totalWeeklyCodingMin) * 100) : 0
  })).sort((a, b) => b.minutes - a.minutes);

  return {
    days,
    totalWeeklyCodingMinutes: Math.round(totalWeeklyCodingMin * 10) / 10,
    totalWeeklyCodingHours: (totalWeeklyCodingMin / 60).toFixed(1),
    totalWeeklyBreakMinutes: Math.round(totalWeeklyBreakMin * 10) / 10,
    totalWeeklyPomodoros,
    currentStreakDays: streak,
    tags,
    hourlyDistribution
  };
}

export function logWater() {
  const state = loadState();
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
  state.history[today].waterGlasses = (state.history[today].waterGlasses || 0) + 1;
  saveState(state);
  return {
    glasses: state.history[today].waterGlasses,
    message: `💧 Glass #${state.history[today].waterGlasses} recorded! Optimal hydration maintains peak focus.`
  };
}

export function setDailyGoal(pomodoroCount) {
  const count = parseInt(pomodoroCount, 10);
  if (isNaN(count) || count <= 0) return { error: 'Daily Pomodoro goal must be a positive integer.' };
  updatePreferences({ dailyGoalPomodoros: count });
  return { dailyGoalPomodoros: count, message: `🎯 Daily goal set to ${count} Pomodoro cycles (${count * 25} minutes).` };
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

export function getRecentSessions(limit = 15) {
  const state = loadState();
  const allSessions = [];
  const dates = Object.keys(state.history || {}).sort().reverse();
  for (const date of dates) {
    const day = state.history[date];
    if (Array.isArray(day.sessions)) {
      for (const s of [...day.sessions].reverse()) {
        allSessions.push({ ...s, date });
        if (allSessions.length >= limit) break;
      }
    }
    if (allSessions.length >= limit) break;
  }
  return allSessions;
}

export function exportHistory(format = 'json') {
  const state = loadState();
  if (format === 'csv') {
    const headers = [
      'session_id', 'date', 'type', 'task', 'tag', 'target_minutes',
      'actual_minutes', 'completed', 'started_at', 'ended_at'
    ];
    const rows = [headers.join(',')];
    const dates = Object.keys(state.history || {}).sort();
    for (const date of dates) {
      const day = state.history[date];
      if (Array.isArray(day.sessions)) {
        for (const s of day.sessions) {
          const safeTask = `"${(s.task || '').replace(/"/g, '""')}"`;
          const row = [
            s.id || '',
            date,
            s.type || '',
            safeTask,
            s.tag || 'general',
            s.targetDurationMinutes || 0,
            s.actualElapsedMinutes || 0,
            s.completed ? 'true' : 'false',
            s.startedAt || '',
            s.endedAt || ''
          ];
          rows.push(row.join(','));
        }
      }
    }
    return rows.join('\n');
  }
  return JSON.stringify(state.history, null, 2);
}

export function clearStateForTesting() {
  const stateFile = getStateFile();
  try {
    if (fs.existsSync(stateFile)) {
      fs.unlinkSync(stateFile);
    }
  } catch (e) {}
}

