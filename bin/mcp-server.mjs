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
    description: 'Mulai sesi timer fokus coding atau istirahat (Pomodoro 25m, Deep Work 50m, Short Break 5m, Long Break 15m, Eye Rest 20s). Membantu menjaga ritme produktivitas dan mencegah burnout.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['coding', 'short_break', 'long_break', 'eye_rest'],
          description: "Tipe sesi: 'coding' (fokus kerja), 'short_break' (5m), 'long_break' (15m), atau 'eye_rest' (20s mata rileks)."
        },
        duration_minutes: {
          type: 'number',
          description: 'Durasi dalam menit. Jika tidak diisi, menggunakan preset bawaan (25m untuk coding, 5m untuk break).'
        },
        task: {
          type: 'string',
          description: 'Deskripsi tugas yang sedang difokuskan (contoh: "Refactoring Auth Middleware").'
        },
        tag: {
          type: 'string',
          description: 'Kategori tugas (contoh: "feature", "bugfix", "refactor", "review").'
        }
      }
    }
  },
  {
    name: 'devflow_pause_timer',
    description: 'Jeda sementara sesi timer yang sedang berjalan (misal ada panggilan darurat atau interupsi).',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'devflow_resume_timer',
    description: 'Lanjutkan kembali sesi timer yang sedang dijeda.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'devflow_stop_timer',
    description: 'Selesaikan atau akhiri sesi timer saat ini dan simpan datanya ke riwayat produktivitas harian.',
    inputSchema: {
      type: 'object',
      properties: {
        completed: {
          type: 'boolean',
          description: 'Apakah sesi diselesaikan sesuai target durasi (true) atau dihentikan sebelum selesai (false).'
        },
        reason: {
          type: 'string',
          description: 'Alasan berhenti (opsional).'
        }
      }
    }
  },
  {
    name: 'devflow_get_status',
    description: 'Periksa status timer saat ini: waktu yang telah berjalan, sisa waktu, persentase progres, dan rekomendasi ritme istirahat.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'devflow_get_stats',
    description: 'Dapatkan statistik produktivitas dan ritme coding/istirahat hari ini (total menit coding, menit istirahat, siklus Pomodoro selesai, skor ritme ergonomis, dan rasio kerja vs istirahat).',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'devflow_open_dashboard',
    description: 'Buka Cockpit Dashboard visual interaktif DevFlow Timer di browser lokal. Dilengkapi ring melingkar real-time, Web Audio chime synthesizer, dan panel kontrol ergonomis.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'devflow_get_ergonomic_tip',
    description: 'Dapatkan panduan peregangan ergonomis ilmiah untuk developer (aturan mata 20-20-20, peregangan leher, pergelangan tangan, punggung, atau hidrasi).',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['eyes', 'posture', 'hands', 'back', 'health', 'mind'],
          description: 'Kategori panduan ergonomis.'
        }
      }
    }
  },
  {
    name: 'devflow_configure',
    description: 'Sesuaikan konfigurasi waktu fokus dan interval istirahat.',
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
    description: 'Hasilkan laporan analitik komprehensif terkait produktivitas coding, rasio istirahat, indeks risiko burnout, dan grade kepatuhan ergonomis dalam format Markdown.',
    inputSchema: {
      type: 'object',
      properties: {
        save_to_file: {
          type: 'boolean',
          description: 'Apakah menyimpan laporan ke file PRODUCTIVITY_REPORT.md (default: true).'
        }
      }
    }
  },
  {
    name: 'devflow_git_context',
    description: 'Dapatkan konteks Git aktif (nama cabang, jumlah file termodifikasi, dan saran pesan conventional commit berdasarkan sesi kerja).',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

export const MCP_RESOURCES = [
  {
    uri: 'devflow://status',
    name: 'DevFlow Timer Live Status',
    description: 'Snapshot status timer saat ini dan rekomendasi istirahat',
    mimeType: 'application/json'
  },
  {
    uri: 'devflow://today',
    name: 'DevFlow Productivity Summary',
    description: 'Ringkasan produktivitas harian dan rasio coding vs break',
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
      } else {
        throw new Error(`Tool '${name}' tidak dikenali.`);
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
