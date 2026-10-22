#!/usr/bin/env node

import { getStatus, recordActivity } from '../lib/timer-engine.mjs';

const action = process.argv[2] || 'post-tool';

try {
  if (action === 'session-start') {
    const status = getStatus();
    if (status.active) {
      process.stdout.write(`[DevFlow Timer] Sesi aktif terdeteksi: ${status.type.toUpperCase()} (${status.remainingFormatted} tersisa). Pertahankan fokus!\n`);
    } else {
      process.stdout.write(`[DevFlow Timer] Siap mendampingi sprint coding. Ketik "/ask-skill coding-break-timer" atau gunakan perintah devflow untuk mengaktifkan ritme fokus.\n`);
    }
  } else if (action === 'post-tool') {
    recordActivity('tool_use');
  }
} catch (err) {
  // Silent fail in hook to avoid blocking agent operations
}
