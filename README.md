# ⚡ DevFlow - Coding & Break Timer Plugin

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Antigravity Plugin](https://img.shields.io/badge/Antigravity-Plugin-emerald.svg)](https://antigravity.google)
[![MCP v1.x](https://img.shields.io/badge/MCP-v1.x_Compliant-purple.svg)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![Author](https://img.shields.io/badge/Author-Roedy_Rustam-cyan.svg)](https://github.com/roedyrustam)

> **Intelligent Coding Duration Tracker & Ergonomic Break Sentinel for Antigravity AI**  
> *Sustain High Productivity, Eliminate Mental Fatigue, and Protect Developer Health.*

---

## 🚀 Quick Installation

Any developer can install this plugin with a single command:

### A. Windows (PowerShell)
Open PowerShell and run:
```powershell
irm https://raw.githubusercontent.com/roedyrustam/dev-flow-timer/main/install.ps1 | iex
```

### B. macOS & Linux (Bash / Zsh)
Open terminal and run:
```bash
curl -fsSL https://raw.githubusercontent.com/roedyrustam/dev-flow-timer/main/install.sh | bash
```

### C. Manual Installation via Git Clone
```bash
# Clone directly into the Antigravity plugins directory
git clone https://github.com/roedyrustam/dev-flow-timer.git ~/.gemini/config/plugins/dev-flow-timer

# Run the installer setup
node ~/.gemini/config/plugins/dev-flow-timer/bin/cli.mjs install
```

Once installed, **restart Antigravity** and open `Overview > Plugins > DevFlow Timer`!

---

## 📖 Overview

**DevFlow** is a comprehensive productivity and ergonomic pacing plugin for Antigravity AI. Grounded in neuroscience and ergonomic research, peak cognitive performance is achieved not through marathon non-stop sessions (*burnout trap*), but through an oscillating rhythm of high-intensity focus blocks (*Deep Work*) balanced by deliberate restorative breaks (*Active Recovery*).

### ✨ Core Features
1. **Scientific Multi-Mode Pacing**:
   - 🍅 **Classic Pomodoro (25m Focus / 5m Rest)**: Ideal for daily feature implementation, refactoring, and focused task tickets.
   - 🧠 **Ultradian Rhythm (50m Deep Work / 10m Rest)**: Designed for complex architectural decisions, algorithmic debugging, and system specs.
   - 👁️ **20-20-20 Rule (20s Eye Relief)**: Relaxes ciliary eye muscles every 20 minutes to prevent digital eye strain.
   - ☕ **Long Break (15m–30m)**: Complete cognitive reset every 4 completed Pomodoro cycles.
2. **Interactive Visual Cockpit Dashboard**:
   - Standalone HTML5 web application with real-time SVG circular progress ring.
   - **Ambient Focus Sound Generator**: Pure Web Audio synthesis for Brown Noise (deep cognitive masking), Gentle Rain, and 40Hz Gamma Binaural Beats (flow state).
   - Web Audio Synthesizer: 528Hz Solfeggio harmonic bell chime with zero external audio dependencies.
   - Daily performance metrics: focus time, rest duration, work ratio, and rhythm score.
3. **Embedded Sidecar UI Panel**:
   - Integrated auxiliary pane inside Antigravity IDE (`sidecars/devflow-panel`).
   - Built-in ambient sound player, daily Pomodoro goal progress bar, hydration logger, and 7-day trend sparklines.
   - Live synchronization with CLI commands and AI agent tool calls.
4. **15 Native MCP Tools (Model Context Protocol v1.x)**:
   - Enables AI agents to autonomously manage timers, evaluate workload duration, log water intake, export history, and suggest pacing pauses.
5. **Interactive Live Terminal Watcher (`devflow watch`)**:
   - In-place real-time countdown display in your terminal with hotkey controls (`p` pause, `r` resume, `s` stop, `q` quit).
6. **Comprehensive Automated Test Suite**:
   - Full native unit and integration test suite via `node:test` covering the timer engine, analytics reporter, Git integrator, and MCP server RPC.

---

## 🛠️ MCP Tools Reference

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `devflow_start_timer` | `type`, `duration_minutes`, `task`, `tag` | Starts a focus coding sprint or restorative break session |
| `devflow_get_status` | *(none)* | Returns current session status, remaining time, and pacing advice |
| `devflow_pause_timer` | *(none)* | Temporarily pauses the running timer |
| `devflow_resume_timer` | *(none)* | Resumes the paused timer |
| `devflow_stop_timer` | `completed`, `reason` | Completes/stops active session and logs to daily history |
| `devflow_get_stats` | *(none)* | Returns today's metrics: total coding time, break ratio, and score |
| `devflow_open_dashboard` | *(none)* | Generates and launches the visual HTML cockpit in your default browser |
| `devflow_get_ergonomic_tip` | `category` | Provides quick actionable stretch/health exercises for developers |
| `devflow_configure` | `pomodoro_minutes`, etc. | Customizes default timer intervals and durations |
| `devflow_generate_report` | `save_to_file` | Exports comprehensive productivity and ergonomic report in Markdown |
| `devflow_git_context` | *(none)* | Inspects active Git branch and generates conventional commit suggestions |
| `devflow_get_weekly_stats` | *(none)* | Retrieves 7-day trend, active streak, and tag breakdown |
| `devflow_log_water` | *(none)* | Logs 1 glass of water intake to track cellular hydration |
| `devflow_set_goal` | `goal_pomodoros` | Sets target number of daily Pomodoro cycles |
| `devflow_export_history` | `format` ('json' or 'csv') | Exports full session history and duration records |

---

## 💻 CLI Usage (Terminal / PowerShell)

Run commands directly from any terminal or PowerShell prompt:

```bash
# Start a 25-minute Pomodoro focus sprint
devflow start 25 "Refactor Authentication Middleware"

# Launch real-time in-terminal countdown watcher
devflow watch

# Start a 5-minute short break
devflow break 5

# Trigger 20-20-20 eye relief (20 seconds)
devflow eye

# Check current status and remaining time
devflow status

# Open visual Cockpit Dashboard with Ambient Sounds in browser
devflow dashboard

# View recent session history log
devflow history 10

# Export session history to CSV or JSON file
devflow export csv ./my-focus-history.csv

# View daily productivity metrics
devflow stats

# View 7-day productivity trend and tag distribution
devflow week

# Set daily Pomodoro goal
devflow goal 8

# Log a glass of water
devflow water

# Generate full Markdown report
devflow report

# Get ergonomic stretching tips
devflow tip posture

# Run automated tests
npm test
```

---

## 📂 Plugin Directory Structure

```text
~/.gemini/config/plugins/dev-flow-timer/
├── plugin.json                 # Plugin manifest & suggested prompts
├── README.md                   # Comprehensive documentation
├── mcp_config.json             # Local MCP server registration
├── hooks.json                  # Lifecycle hooks (SessionStart & PostToolUse)
├── assets/
│   └── logo.svg                # High-contrast vector icon (Dark/Light mode)
├── bin/
│   ├── mcp-server.mjs          # Native stdio MCP v1.x server
│   └── cli.mjs                 # Interactive CLI tool for terminal
├── lib/
│   ├── timer-engine.mjs        # Core timer state engine & metric calculations
│   ├── dashboard-generator.mjs # Visual HTML cockpit generator with Web Audio chime
│   ├── analytics-reporter.mjs  # Markdown productivity & ergonomic reports
│   ├── git-integrator.mjs      # Git branch context & commit generator
│   └── notifier.mjs            # Cross-platform desktop notifications
├── sidecars/
│   └── devflow-panel/          # Sidecar UI server & embedded auxiliary pane
├── skills/
│   └── coding-break-timer/
│       └── SKILL.md            # Agent skill guide for pacing & ergonomics
├── agents/
│   └── flow-coach.md           # Flow Coach companion subagent
├── rules/
│   └── AGENTS.md               # Universal pacing & anti-burnout guidelines
└── scripts/
    ├── hook-handler.mjs        # Lifecycle event execution handler
    └── notify.ps1              # Windows Toast notification script
```

---

## 🌿 Ergonomic & Health Guidelines

1. **20-20-20 Rule**: Every 20 minutes, focus on an object 20 feet (6 meters) away for 20 seconds.
2. **Cervical De-stress**: Perform gentle chin tucks for 5 seconds to reduce cervical spine tension.
3. **Carpal Tunnel Defense**: Flex and extend wrists during each 5-minute break.
4. **Hydration**: Drink 1 glass of water per Pomodoro cycle to maintain neurotransmitter efficiency.

---

## 📄 License

MIT © [Roedy Rustam](https://github.com/roedyrustam)
