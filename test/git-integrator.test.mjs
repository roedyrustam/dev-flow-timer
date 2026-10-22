import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';

const {
  getGitContext,
  generateCommitSuggestion
} = await import('../lib/git-integrator.mjs');

test('DevFlow Git Integrator Test Suite', async (t) => {
  await t.test('getGitContext handles active git repository gracefully', () => {
    const ctx = getGitContext(process.cwd());
    assert.equal(typeof ctx.isGitRepo, 'boolean');
    if (ctx.isGitRepo) {
      assert.ok(ctx.branch);
      assert.ok(Array.isArray(ctx.changedFiles));
    }
  });

  await t.test('getGitContext handles non-git directory gracefully', () => {
    const ctx = getGitContext(os.tmpdir());
    assert.equal(typeof ctx.isGitRepo, 'boolean');
    assert.equal(typeof ctx.changedFilesCount, 'number');
  });

  await t.test('generateCommitSuggestion infers correct conventional commit prefix', () => {
    const featSuggestion = generateCommitSuggestion({ task: 'Implement user login with OAuth2', targetDurationMinutes: 25 });
    assert.ok(featSuggestion.startsWith('feat: '));
    assert.ok(featSuggestion.includes('25m focus block'));

    const fixSuggestion = generateCommitSuggestion({ task: 'Fix memory leak in websocket handler', targetDurationMinutes: 20 });
    assert.ok(fixSuggestion.startsWith('fix: '));

    const refactorSuggestion = generateCommitSuggestion({ task: 'Refactor database models to clean architecture', targetDurationMinutes: 50 });
    assert.ok(refactorSuggestion.startsWith('refactor: '));

    const testSuggestion = generateCommitSuggestion({ task: 'Add integration test for timer engine', targetDurationMinutes: 25 });
    assert.ok(testSuggestion.startsWith('test: '));

    const docsSuggestion = generateCommitSuggestion({ task: 'Update API documentation and README', targetDurationMinutes: 15 });
    assert.ok(docsSuggestion.startsWith('docs: '));

    const nullSuggestion = generateCommitSuggestion(null);
    assert.equal(nullSuggestion, null);
  });
});
