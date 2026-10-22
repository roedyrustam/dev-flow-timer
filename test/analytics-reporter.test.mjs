import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const testStatePath = path.join(os.tmpdir(), `devflow-test-analytics-${Date.now()}-${Math.random().toString(36).substring(2)}.json`);
process.env.DEVFLOW_STATE_FILE = testStatePath;

const {
  startSession,
  stopSession,
  clearStateForTesting
} = await import('../lib/timer-engine.mjs');

const {
  generateAnalyticsReport,
  exportReportToFile
} = await import('../lib/analytics-reporter.mjs');

test('DevFlow Analytics Reporter Test Suite', async (t) => {
  t.beforeEach(() => {
    clearStateForTesting();
  });

  t.after(() => {
    clearStateForTesting();
  });

  await t.test('generates valid markdown report with empty or new state', () => {
    const report = generateAnalyticsReport();
    assert.ok(report.markdownReport);
    assert.ok(report.markdownReport.includes('DevFlow Productivity & Ergonomic Analytics Report'));
    assert.ok(report.ergonomicGrade);
    assert.ok(report.burnoutRisk);
  });

  await t.test('aggregates sessions and calculates metrics accurately', () => {
    startSession({ type: 'coding', durationMinutes: 25, task: 'Feature A', tag: 'feature' });
    stopSession({ completed: true, elapsedMinutes: 25 });

    startSession({ type: 'short_break', durationMinutes: 5, task: 'Rest Break' });
    stopSession({ completed: true, elapsedMinutes: 5 });

    const report = generateAnalyticsReport();
    assert.equal(report.totalPomodoros, 1);
    assert.ok(report.daySummaries.length > 0);
    assert.ok(report.markdownReport.includes('Executive Summary'));
    assert.ok(report.markdownReport.includes('Daily Session Breakdown'));
  });

  await t.test('exportReportToFile writes markdown report to target path', () => {
    const customExportPath = path.join(os.tmpdir(), `devflow-export-report-${Date.now()}.md`);
    const result = exportReportToFile(customExportPath);

    assert.equal(result.filePath, customExportPath);
    assert.ok(fs.existsSync(customExportPath));

    const content = fs.readFileSync(customExportPath, 'utf8');
    assert.ok(content.includes('# 📊 DevFlow Productivity & Ergonomic Analytics Report'));

    // Cleanup
    fs.unlinkSync(customExportPath);
  });
});
