import { execSync } from 'node:child_process';

export function getGitContext(cwd = process.cwd()) {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();

    const statusShort = execSync('git status --short', {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();

    const changedFiles = statusShort ? statusShort.split('\n').filter(Boolean) : [];

    return {
      isGitRepo: true,
      branch,
      changedFilesCount: changedFiles.length,
      changedFiles: changedFiles.slice(0, 10),
      suggestedTask: `Sprint on branch [${branch}]`
    };
  } catch (err) {
    return {
      isGitRepo: false,
      branch: null,
      changedFilesCount: 0,
      changedFiles: [],
      suggestedTask: null
    };
  }
}

export function generateCommitSuggestion(session) {
  if (!session || !session.task) return null;
  const task = session.task.toLowerCase();
  let type = 'feat';
  if (task.includes('fix') || task.includes('bug')) type = 'fix';
  else if (task.includes('refactor') || task.includes('clean')) type = 'refactor';
  else if (task.includes('test')) type = 'test';
  else if (task.includes('doc')) type = 'docs';
  else if (task.includes('perf')) type = 'perf';

  return `${type}: ${session.task} (${session.actualElapsedMinutes || session.targetDurationMinutes}m focus block)`;
}
