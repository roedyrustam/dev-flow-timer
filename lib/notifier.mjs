import { execFile } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NOTIFY_PS1 = path.resolve(__dirname, '../scripts/notify.ps1');

export function sendDesktopNotification({ title = 'DevFlow Timer', message = 'Waktu fokus telah selesai!' } = {}) {
  const platform = os.platform();

  if (platform === 'win32') {
    execFile('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', NOTIFY_PS1,
      '-Title', title,
      '-Message', message
    ], (err) => {
      if (err) {
        // Fallback bell
        process.stdout.write('\x07');
      }
    });
  } else if (platform === 'darwin') {
    const script = `display notification "${message.replace(/"/g, '\\"')}" with title "${title.replace(/"/g, '\\"')}" sound name "Glass"`;
    execFile('osascript', ['-e', script], () => {});
  } else if (platform === 'linux') {
    execFile('notify-send', [title, message], () => {});
  }
}
