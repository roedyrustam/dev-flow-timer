# ⚡ DevFlow - Coding & Break Timer Plugin

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Antigravity Plugin](https://img.shields.io/badge/Antigravity-Plugin-emerald.svg)](https://antigravity.google)
[![MCP v1.x](https://img.shields.io/badge/MCP-v1.x_Compliant-purple.svg)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org)
[![Author](https://img.shields.io/badge/Author-Roedy_Rustam-cyan.svg)](https://github.com/roedyrustam)

> **Penghitung & Pelacak Durasi Waktu Coding dan Istirahat Cerdas untuk Antigravity AI**  
> *Sustain High Productivity, Eliminate Mental Fatigue, and Protect Developer Health.*

---

## 🚀 Panduan Instalasi Cepat (Quick Installation)

Pengembang mana pun dapat memasang plugin ini dengan **1 baris perintah saja**:

### A. Windows (PowerShell)
Buka terminal PowerShell dan jalankan:
```powershell
irm https://raw.githubusercontent.com/roedyrustam/dev-flow-timer/main/install.ps1 | iex
```

### B. macOS & Linux (Bash / Zsh)
Buka terminal dan jalankan:
```bash
curl -fsSL https://raw.githubusercontent.com/roedyrustam/dev-flow-timer/main/install.sh | bash
```

### C. Manual via Git Clone
```bash
# Clone langsung ke direktori plugin Antigravity
git clone https://github.com/roedyrustam/dev-flow-timer.git ~/.gemini/config/plugins/dev-flow-timer

# Inisialisasi CLI launcher
node ~/.gemini/config/plugins/dev-flow-timer/bin/cli.mjs install
```

Setelah instalasi selesai, cukup **restart Antigravity** dan buka menu `Overview > Plugins > DevFlow Timer`!

---

**DevFlow** adalah plugin terpadu untuk Antigravity yang dirancang khusus untuk memonitor durasi coding dan mengatur ritme istirahat terencana. Terinspirasi dari riset neurosains dan ergonomi modern, produktivitas terbaik diraih bukan dengan bekerja berjam-jam tanpa henti (*burnout trap*), melainkan melalui ritme gelombang fokus tinggi (*Deep Work*) yang diimbangi dengan jeda pemulihan terstruktur (*Active Recovery*).

### ✨ Fitur Utama
1. **Multi-Mode Timer Ilmiah**:
   - 🍅 **Pomodoro Klasik (25m Fokus / 5m Istirahat)**: Cocok untuk implementasi harian dan sprint terarah.
   - 🧠 **Ritme Ultradian (50m Deep Work / 10m Istirahat)**: Dirancang untuk arsitektur kompleks dan debugging intensif.
   - 👁️ **Aturan 20-20-20 (Eye Relief 20s)**: Mengistirahatkan otot siliaris mata setiap 20 menit menatap layar.
   - ☕ **Istirahat Panjang (15m–30m)**: Reset menyeluruh setiap 4 siklus Pomodoro selesai.
2. **Cockpit Dashboard Visual Interaktif**:
   - Antarmuka web modern dengan circular ring SVG real-time.
   - Web Audio Synthesizer: Chime bel harmonik 528Hz ramah telinga tanpa perlu file audio eksternal.
   - Panel metrik harian (total menit coding, menit istirahat, rasio kerja, skor ritme).
3. **9 Alat MCP Native (Model Context Protocol)**:
   - Agen AI dapat mengontrol, memeriksa, menjeda, dan menyarankan istirahat secara otonom.
4. **Ergonomic Sentinel & Tips Cepat**:
   - Panduan peregangan leher (*chin tuck*), pergelangan tangan (*carpal tunnel prevention*), pinggang, dan pengingat hidrasi air putih.
5. **CLI Terintegrasi**:
   - Dapat dioperasikan langsung dari terminal/PowerShell dengan sintaks ringkas: `node bin/cli.mjs start 25`.

---

## 🇬🇧 Overview (English)

**DevFlow** is a comprehensive productivity and ergonomic pacing plugin for Antigravity AI. It helps engineers balance high-output coding blocks with restorative recovery periods to maintain sustainable focus and eliminate cognitive fatigue.

### Core Architecture
- **State Store**: Persistent, thread-safe JSON store (`~/.gemini/antigravity/devflow-state.json`).
- **MCP Server**: Pure Node.js stdio server implementing Model Context Protocol v1.x with 9 dedicated tools and 2 live resources.
- **Visual Cockpit**: Standalone single-file HTML5 app with Web Audio synthesis and local time synchronization.
- **Flow Coach Subagent**: Dedicated companion persona assisting developers during long sessions.
- **Lifecycle Hooks**: Automatically updates activity heartbeats and reports session status on startup.

---

## 🛠️ MCP Tools Reference

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `devflow_start_timer` | `type`, `duration_minutes`, `task`, `tag` | Starts a focus coding sprint or break session |
| `devflow_get_status` | *(none)* | Returns current session status, remaining time, and pacing advice |
| `devflow_pause_timer` | *(none)* | Temporarily pauses the running timer |
| `devflow_resume_timer` | *(none)* | Resumes the paused timer |
| `devflow_stop_timer` | `completed`, `reason` | Completes/stops active session and logs to daily history |
| `devflow_get_stats` | *(none)* | Returns today's metrics: total coding time, break ratio, score |
| `devflow_open_dashboard` | *(none)* | Generates and launches the visual HTML cockpit in your default browser |
| `devflow_get_ergonomic_tip`| `category` | Provides quick actionable stretch/health exercises for developers |
| `devflow_configure` | `pomodoro_minutes`, etc. | Customizes default timer intervals |

---

## 💻 CLI Usage (Terminal / PowerShell)

Anda dapat menjalankan perintah langsung melalui terminal:

```bash
# Mulai sesi Pomodoro 25 menit
node "C:\Users\roedy\.gemini\config\plugins\dev-flow-timer\bin\cli.mjs" start 25 "Refactor Auth Middleware"

# Mulai istirahat singkat 5 menit
node "C:\Users\roedy\.gemini\config\plugins\dev-flow-timer\bin\cli.mjs" break 5

# Jalankan aturan mata 20-20-20
node "C:\Users\roedy\.gemini\config\plugins\dev-flow-timer\bin\cli.mjs" eye

# Cek status dan sisa waktu
node "C:\Users\roedy\.gemini\config\plugins\dev-flow-timer\bin\cli.mjs" status

# Buka Dashboard Cockpit visual di browser
node "C:\Users\roedy\.gemini\config\plugins\dev-flow-timer\bin\cli.mjs" dashboard

# Lihat statistik harian
node "C:\Users\roedy\.gemini\config\plugins\dev-flow-timer\bin\cli.mjs" stats

# Dapatkan tips peregangan
node "C:\Users\roedy\.gemini\config\plugins\dev-flow-timer\bin\cli.mjs" tip posture
```

---

## 📂 Struktur Direktori Plugin

```text
~/.gemini/config/plugins/dev-flow-timer/
├── plugin.json                 # Manifest plugin (metadata & suggested prompts)
├── README.md                   # Dokumentasi lengkap
├── mcp_config.json             # Pendaftaran MCP server lokal
├── hooks.json                  # Lifecycle hooks (SessionStart & PostToolUse)
├── assets/
│   └── logo.svg                # Logo vektor high-contrast (Dark/Light mode)
├── bin/
│   ├── mcp-server.mjs          # Server MCP v1.x stdio (Zero dependencies)
│   └── cli.mjs                 # CLI interaktif untuk terminal
├── lib/
│   ├── timer-engine.mjs        # Mesin state & kalkulasi metrik ergonomis
│   └── dashboard-generator.mjs # Generator Cockpit HTML + Web Audio Chime
├── skills/
│   └── coding-break-timer/
│       └── SKILL.md            # Panduan keahlian AI untuk ritme kerja
├── agents/
│   └── flow-coach.md           # Definisi subagent Flow Coach
├── rules/
│   └── AGENTS.md               # Aturan kesadaran ritme & anti-burnout
└── scripts/
    └── hook-handler.mjs        # Handler eksekusi event lifecycle
```

---

## 🌿 Ergonomic & Health Reference

1. **Aturan 20-20-20**: Setiap 20 menit, tatap objek 6 meter jauhnya selama 20 detik.
2. **De-stress Leher**: Tarik dagu ke belakang (*chin tuck*) 5 detik untuk meredakan beban serviks.
3. **Pencegahan Carpal Tunnel**: Lenturkan pergelangan tangan ke depan dan belakang setiap jeda 5 menit.
4. **Hidrasi Otak**: 1 gelas air putih di setiap siklus Pomodoro menjaga kecepatan transmisi sinapsis.
