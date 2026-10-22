#!/usr/bin/env node

/**
 * DevFlow Timer - Native MCP Server (Model Context Protocol v1.x)
 * 
 * Provides intelligent coding duration & ergonomic break tracking tools for AI agents.
 */

import readline from 'node:readline';
import {
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
  recordActivity
} from '../lib/timer-engine.mjs';
import { saveAndOpenDashboard, generateDashboardHtml } from '../lib/dashboard-generator.mjs';
import { generateAnalyticsReport, exportReportToFile } from '../lib/analytics-reporter.mjs';
import { getGitContext, generateCommitSuggestion } from '../lib/git-integrator.mjs';

export const TOOLS = [
  {
    name: 'devflow_start_timer',
    description: 'Start a focus coding sprint or restorative break session (Pomodoro 25m, Deep Work 50m, Short Break 5m, Long Break 15m, Eye Rest 20s). Helps sustain productivity and eliminate burnout.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['coding', 'short_break', 'long_break', 'eye_rest'],
          description: "Session type: 'coding' (deep focus), 'short_break' (5m), 'long_break' (15m), or 'eye_rest' (20s eye relief)."
        },
        duration_minutes: {
          type: 'number',
          description: 'Duration in minutes. Defaults to preset intervals (25m for coding, 5m for break).'
        },
        task: {
          type: 'string',
          description: 'Description of the focused task (e.g., "Refactoring Auth Middleware").'
        },
        tag: {
          type: 'string',
          description: 'Task category tag (e.g., "feature", "bugfix", "refactor", "review").'
        }
      }
    }
  },
  {
    name: 'devflow_pause_timer',
    description: 'Temporarily pause the running timer session (e.g., emergency call or urgent interruption).',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'devflow_resume_timer',
    description: 'Resume the currently paused timer session.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'devflow_stop_timer',
    description: 'Stop or complete active timer session and log data to daily productivity history.',
    inputSchema: {
      type: 'object',
      properties: {
        completed: {
          type: 'boolean',
          description: 'Whether the session was completed to target duration (true) or stopped early (false).'
        },
        reason: {
          type: 'string',
          description: 'Reason for stopping (optional).'
        }
      }
    }
  },
  {
    name: 'devflow_get_status',
    description: 'Check active timer status: elapsed time, remaining time, progress percentage, and pacing recommendation.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'devflow_get_stats',
    description: "Get today's productivity and coding/break rhythm statistics (total coding minutes, break minutes, completed Pomodoro cycles, ergonomic rhythm score, and break-to-work ratio).",
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'devflow_open_dashboard',
    description: 'Open the interactive visual DevFlow Cockpit Dashboard in your local browser with real-time circular SVG ring, Web Audio chime synthesizer, and ergonomic control panel.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'devflow_get_ergonomic_tip',
    description: 'Get actionable scientific ergonomic guidance for developers (20-20-20 rule, neck relief, wrist stretches, back decompression, or hydration).',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['eyes', 'posture', 'hands', 'back', 'health', 'mind'],
          description: 'Ergonomic guidance category.'
        }
      }
    }
  },
  {
    name: 'devflow_configure',
    description: 'Customize default focus durations and break intervals.',
    inputSchema: {
      type: 'object',
      properties: {
        pomodoro_minutes: { type: 'number' },
        deep_work_minutes: { type: 'number' },
        short_break_minutes: { type: 'number' },
        long_break_minutes: { type: 'number' },
        eye_rest_interval_minutes: { type: 'number' }
      }
    }
  },
  {
    name: 'devflow_generate_report',
    description: 'Generate a comprehensive productivity and ergonomic report including burnout risk index and ergonomic compliance grade in Markdown format.',
    inputSchema: {
      type: 'object',
      properties: {
        save_to_file: {
          type: 'boolean',
          description: 'Whether to save the report to PRODUCTIVITY_REPORT.md (default: true).'
        }
      }
    }
  },
  {
    name: 'devflow_git_context',
    description: 'Get active Git context (branch name, modified file count, and recommended conventional commit message based on the focus session).',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'devflow_get_weekly_stats',
    description: 'Retrieve 7-day productivity trends: daily duration, active streak, and task tag category distribution.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'devflow_log_water',
    description: 'Log 1 glass of water intake (cellular hydration) to sustain cognitive stamina during coding.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'devflow_set_goal',
    description: 'Set target number of Pomodoro cycles to achieve in a workday.',
    inputSchema: {
      type: 'object',
      properties: {
        goal_pomodoros: {
          type: 'number',
          description: 'Target Pomodoro count (e.g., 6 or 8 cycles).'
        }
      },
      required: ['goal_pomodoros']
    }
  }
];

export const MCP_RESOURCES = [
  {
    uri: 'devflow://status',
    name: 'DevFlow Timer Live Status',
    description: 'Snapshot of current timer status and pacing recommendation',
    mimeType: 'application/json'
  },
  {
    uri: 'devflow://today',
    name: 'DevFlow Productivity Summary',
    description: 'Daily productivity summary and work vs break ratio',
    mimeType: 'application/json'
  }
];

export async function handleRpcRequest(request) {
  const { id, method, params } = request;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {}
        },
        serverInfo: {
          name: 'devflow-timer-mcp',
          version: '1.0.0'
        }
      }
    };
  }

  if (method === 'notifications/initialized') {
    return null;
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { tools: TOOLS }
    };
  }

  if (method === 'resources/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { resources: MCP_RESOURCES }
    };
  }

  if (method === 'resources/read') {
    const uri = params?.uri;
    if (uri === 'devflow://status') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(getStatus(), null, 2)
          }]
        }
      };
    }
    if (uri === 'devflow://today') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(getDailyStats(), null, 2)
          }]
        }
      };
    }
    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32602, message: `Resource not found: ${uri}` }
    };
  }

  if (method === 'tools/call') {
    const name = params?.name;
    const args = params?.arguments || {};

    try {
      let contentText = '';

      if (name === 'devflow_start_timer') {
        const res = startSession({
          type: args.type || 'coding',
          task: args.task,
          durationMinutes: args.duration_minutes,
          tag: args.tag
        });
        contentText = JSON.stringify(res, null, 2);
      } else if (name === 'devflow_pause_timer') {
        const res = pauseSession();
        contentText = JSON.stringify(res, null, 2);
      } else if (name === 'devflow_resume_timer') {
        const res = resumeSession();
        contentText = JSON.stringify(res, null, 2);
      } else if (name === 'devflow_stop_timer') {
        const res = stopSession({
          completed: args.completed !== undefined ? Boolean(args.completed) : true,
          reason: args.reason || 'manual_stop'
        });
        contentText = JSON.stringify(res, null, 2);
      } else if (name === 'devflow_get_status') {
        const res = getStatus();
        contentText = JSON.stringify(res, null, 2);
      } else if (name === 'devflow_get_stats') {
        const res = getDailyStats();
        contentText = JSON.stringify(res, null, 2);
      } else if (name === 'devflow_open_dashboard') {
        const res = saveAndOpenDashboard();
        contentText = JSON.stringify(res, null, 2);
      } else if (name === 'devflow_get_ergonomic_tip') {
        const res = getErgonomicTip(args.category);
        contentText = JSON.stringify(res, null, 2);
      } else if (name === 'devflow_configure') {
        const updates = {};
        if (args.pomodoro_minutes) updates.pomodoroMinutes = args.pomodoro_minutes;
        if (args.deep_work_minutes) updates.deepWorkMinutes = args.deep_work_minutes;
        if (args.short_break_minutes) updates.shortBreakMinutes = args.short_break_minutes;
        if (args.long_break_minutes) updates.longBreakMinutes = args.long_break_minutes;
        if (args.eye_rest_interval_minutes) updates.eyeRestIntervalMinutes = args.eye_rest_interval_minutes;
        const res = updatePreferences(updates);
        contentText = JSON.stringify(res, null, 2);
      } else if (name === 'devflow_generate_report') {
        const toFile = args.save_to_file !== undefined ? Boolean(args.save_to_file) : true;
        const res = toFile ? exportReportToFile() : { summary: generateAnalyticsReport() };
        contentText = JSON.stringify(res, null, 2);
      } else if (name === 'devflow_git_context') {
        const git = getGitContext();
        const curStatus = getStatus();
        git.commitSuggestion = curStatus.active ? generateCommitSuggestion(curStatus) : null;
        contentText = JSON.stringify(git, null, 2);
      } else if (name === 'devflow_get_weekly_stats') {
        const res = getWeeklyStats();
        contentText = JSON.stringify(res, null, 2);
      } else if (name === 'devflow_log_water') {
        const res = logWater();
        contentText = JSON.stringify(res, null, 2);
      } else if (name === 'devflow_set_goal') {
        const res = setDailyGoal(args.goal_pomodoros);
        contentText = JSON.stringify(res, null, 2);
      } else {
        throw new Error(`Unknown tool '${name}'.`);
      }

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: contentText }]
        }
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: err.message }
      };
    }
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method '${method}' not implemented.` }
  };
}

export function startStdioServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  process.stderr.write('⚡ [DevFlow Timer MCP Server v1.0.0] Listening on stdio...\n');

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const request = JSON.parse(trimmed);
      const response = await handleRpcRequest(request);
      if (response) {
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (e) {
      process.stderr.write(`[DevFlow MCP Error] Invalid JSON: ${e.message}\n`);
    }
  });

  process.on('SIGINT', () => process.exit(0));
  process.on('SIGTERM', () => process.exit(0));
}

// Start stdio server when executed directly
startStdioServer();
