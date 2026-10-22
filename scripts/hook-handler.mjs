#!/usr/bin/env node

import { getStatus, recordActivity } from '../lib/timer-engine.mjs';

const action = process.argv[2] || 'post-tool';

try {
  if (action === 'session-start') {
    const status = getStatus();
    if (status.active) {
      process.stdout.write(`[DevFlow Timer] Active session detected: ${status.type.toUpperCase()} (${status.remainingFormatted} remaining). Stay focused!\n`);
    } else {
      process.stdout.write(`[DevFlow Timer] Ready to pace your coding sprint. Use 'devflow' commands or ask the agent to start a focus timer.\n`);
    }
  } else if (action === 'post-tool') {
    recordActivity('tool_use');
  }
} catch (err) {
  // Silent fail in hook to avoid blocking agent operations
}
