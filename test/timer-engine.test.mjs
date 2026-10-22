import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

// Setup isolated test state
const testStatePath = path.join(os.tmpdir(), `devflow-test-engine-${Date.now()}-${Math.random().toString(36).substring(2)}.json`);
process.env.DEVFLOW_STATE_FILE = testStatePath;

const {
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
  updatePreferences,
  getRecentSessions,
  exportHistory,
  clearStateForTesting
} = await import('../lib/timer-engine.mjs');

test('DevFlow Timer Engine Test Suite', async (t) => {
  t.beforeEach(() => {
    clearStateForTesting();
  });

  t.after(() => {
    clearStateForTesting();
  });

  await t.test('initial status is idle when no session active', () => {
    const status = getStatus();
    assert.equal(status.active, false);
    assert.equal(status.status, 'idle');
    assert.ok(status.message.includes('No active session'));
  });

  await t.test('startSession creates an active coding session', () => {
    const session = startSession({
      type: 'coding',
      durationMinutes: 25,
      task: 'Build Auth Controller',
      tag: 'feature'
    });

    assert.equal(session.active, true);
    assert.equal(session.type, 'coding');
    assert.equal(session.task, 'Build Auth Controller');
    assert.equal(session.tag, 'feature');
    assert.equal(session.targetDurationMinutes, 25);
    assert.equal(session.isPaused, false);

    const currentStatus = getStatus();
    assert.equal(currentStatus.active, true);
    assert.equal(currentStatus.task, 'Build Auth Controller');
  });

  await t.test('pauseSession and resumeSession manage paused state', () => {
    startSession({ type: 'coding', durationMinutes: 25, task: 'Fix Bug' });

    const paused = pauseSession();
    assert.equal(paused.isPaused, true);
    assert.equal(paused.status, 'paused');

    // Cannot pause again when already paused
    const doublePause = pauseSession();
    assert.ok(doublePause.error);

    const resumed = resumeSession();
    assert.equal(resumed.isPaused, false);
    assert.equal(resumed.status, 'running');

    // Cannot resume when running
    const doubleResume = resumeSession();
    assert.ok(doubleResume.error);
  });

  await t.test('stopSession records completed session to history and calculates Pomodoro cycle', () => {
    startSession({ type: 'coding', durationMinutes: 25, task: 'Test Refactoring' });

    const stopped = stopSession({ completed: true, reason: 'goal_reached', elapsedMinutes: 25 });
    assert.equal(stopped.finishedSession.completed, true);
    assert.equal(stopped.finishedSession.task, 'Test Refactoring');

    const status = getStatus();
    assert.equal(status.active, false);

    const stats = getDailyStats();
    assert.equal(stats.sessionsCount, 1);
    assert.equal(stats.completedPomodoros, 1);
  });

  await t.test('logWater increments glasses count', () => {
    const first = logWater();
    assert.equal(first.glasses, 1);
    assert.ok(first.message.includes('Glass #1'));

    const second = logWater();
    assert.equal(second.glasses, 2);
  });

  await t.test('setDailyGoal validates and updates goal', () => {
    const updated = setDailyGoal(8);
    assert.equal(updated.dailyGoalPomodoros, 8);
    assert.ok(updated.message.includes('8 Pomodoro cycles'));

    const invalid = setDailyGoal(-2);
    assert.ok(invalid.error);
  });

  await t.test('getErgonomicTip returns tip and filters by category', () => {
    const randomTip = getErgonomicTip();
    assert.ok(randomTip.title);
    assert.ok(randomTip.action);

    const eyeTip = getErgonomicTip('eyes');
    assert.equal(eyeTip.category, 'eyes');
  });

  await t.test('exportHistory outputs JSON and CSV formats', () => {
    startSession({ type: 'coding', durationMinutes: 25, task: 'Export Feature', tag: 'export' });
    stopSession({ completed: true });

    const jsonExport = exportHistory('json');
    assert.ok(jsonExport.includes('Export Feature'));

    const csvExport = exportHistory('csv');
    assert.ok(csvExport.includes('session_id,date,type,task'));
    assert.ok(csvExport.includes('"Export Feature"'));
  });

  await t.test('getRecentSessions retrieves recorded sessions', () => {
    startSession({ type: 'coding', durationMinutes: 15, task: 'Recent Task 1' });
    stopSession({ completed: true });

    startSession({ type: 'coding', durationMinutes: 20, task: 'Recent Task 2' });
    stopSession({ completed: false });

    const recent = getRecentSessions(5);
    assert.ok(recent.length >= 2);
    assert.equal(recent[0].task, 'Recent Task 2');
    assert.equal(recent[1].task, 'Recent Task 1');
  });
});
