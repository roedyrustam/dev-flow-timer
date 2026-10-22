---
name: coding-break-timer
description: "Expert guide for coding duration tracking, Pomodoro rhythm, and ergonomic break intervals to sustain high developer productivity and prevent mental/physical burnout / Panduan ahli pelacakan durasi coding, ritme Pomodoro, dan istirahat ergonomis cerdas untuk menjaga produktivitas pengembang dan mencegah burnout."
author: "Roedy Rustam"
version: "1.1.0"
---

# Coding & Ergonomic Break Timer (DevFlow Sentinel)

> **💡 Core Principle / Prinsip Utama:**
> Long-term software engineering productivity is not an uninterrupted marathon in front of a monitor; it is an **oscillating rhythm of energy waves** alternating between high cognitive focus (*Deep Work*) and neurological-ergonomic recovery (*Active Rest*). Sustaining this cadence dramatically boosts code architectural quality, curtails fatigue-induced bugs, and protects developer physical health.
> *(Produktivitas jangka panjang dicapai melalui ritme osilasi antara Deep Work dan Active Rest terencana).*

---

## 1. Scientific Pacing Protocols / Protokol Ilmiah Ritme Kerja

DevFlow implements 4 protocols grounded in cognitive neuroscience and workplace ergonomics:

### A. Classic Pomodoro (25m Focus / 5m Break)
- **Profile**: Ideal for daily feature implementation, component refactoring, and focused sprint tickets.
- **Cadence**: 4 consecutive sprints followed by a 15–30 minute long reset.
- **Benefit**: Sustains dopamine baseline and minimizes task initiation friction.

### B. Ultradian Rhythm (50m Deep Work / 10m Break)
- **Profile**: Engineered for complex architectural design, deep algorithmic debugging, and system specifications.
- **Cadence**: Harmonizes with human 90–120 minute ultradian brain-wave cycles.

### C. 20-20-20 Rule (Eye Fatigue Defense)
- **Protocol**: Every 20 minutes of screen work, look at an object 20 feet (6 meters) away for at least 20 seconds.
- **Target**: Prevents Computer Vision Syndrome (CVS), ciliary muscle strain, and dry eyes.

### D. Ergonomic Micro-Resets (Posture & Hydration)
- Wrist and tendon flexes (carpal tunnel syndrome / CTS prevention).
- Chin tucks & backward shoulder rolls (neutralizes cervical spine load).
- 200–300 ml water hydration during every break to maintain synaptic speed.

---

## 2. DevFlow MCP Tools Quick Reference

The AI agent autonomously inspects, starts, and adjusts timers via the following tools:

| Tool | Primary Function | Key Parameters |
| :--- | :--- | :--- |
| `devflow_start_timer` | Starts a focus sprint or break session | `type` ('coding', 'short_break', 'long_break', 'eye_rest'), `duration_minutes`, `task`, `tag` |
| `devflow_get_status` | Inspects elapsed time, remaining duration, and active advice | *(none)* |
| `devflow_pause_timer` | Pauses timer during urgent interruptions | *(none)* |
| `devflow_resume_timer` | Resumes a paused timer session | *(none)* |
| `devflow_stop_timer` | Completes session and logs metrics to daily history | `completed` (boolean), `reason` |
| `devflow_get_stats` | Fetches daily metrics (coding hours, break ratio, score) | *(none)* |
| `devflow_open_dashboard` | Launches the visual Cockpit Dashboard in local browser | *(none)* |
| `devflow_get_ergonomic_tip` | Retrieves tailored ergonomic and stretch exercises | `category` ('eyes', 'posture', 'hands', 'back', 'health') |
| `devflow_configure` | Customizes default timer intervals | `pomodoro_minutes`, `short_break_minutes`, etc. |
| `devflow_generate_report` | Generates comprehensive productivity report (Markdown) | `save_to_file` (boolean) |
| `devflow_git_context` | Inspects Git branch and suggests commit message | *(none)* |
| `devflow_get_weekly_stats` | Retrieves 7-day trend, streak, and tag breakdown | *(none)* |
| `devflow_log_water` | Logs 1 glass of water intake | *(none)* |
| `devflow_set_goal` | Sets target daily Pomodoro count | `goal_pomodoros` (number) |

---

## 3. Agent Integration Workflow in Coding Sessions

### Step 1: Task Initiation & Timer Attachment
When the user assigns a feature development, refactoring, or debugging task, attach a focus timer:
```markdown
I will begin implementing this JWT authentication module.
Let's initiate a 25-minute Pomodoro focus block to complete this feature cleanly.
```

Invoke tool:
```json
{
  "name": "devflow_start_timer",
  "arguments": {
    "type": "coding",
    "duration_minutes": 25,
    "task": "JWT Authentication & Middleware Implementation",
    "tag": "feature"
  }
}
```

### Step 2: Cycle Monitoring & Milestone Completion
Upon completing and verifying the feature or milestone:
1. Call `devflow_get_status` to inspect remaining duration.
2. If the sprint is completed or >80% elapsed, politely recommend a break:
```markdown
> [!TIP]
> 🍅 **Pomodoro Session Completed!**
> We have verified the test suites and finalized the authentication middleware.
> Now is an ideal moment for a 5-minute restorative break: stretch your neck, drink a glass of water, and look away from your display.
```

### Step 3: Launching Visual Cockpit Dashboard
When the user desires visual tracking or audio chime notifications:
Invoke `devflow_open_dashboard` to render and launch the standalone visual cockpit with real-time SVG progress ring and Web Audio synthesis.

---

## 4. Human-Centric Mentorship Ethics

1. **Performance Partner, Not a Time Cop**:
   - Never interrupt intense developer flow states abruptly.
   - Offer timely, polite advice: *"Whenever you are ready to commit this milestone, let's take a quick 5-minute pause."*
2. **Cognitive Compensation**:
   - If a developer finishes an arduous debugging session (>45 minutes), recommend a 15-minute long reset rather than a brief pause.
3. **Concise Data Presentation**:
   - Present session statistics via compact tables or metric badges, eliminating conversational fluff.

---

## 5. Orchestration & Integration / Integrasi Orkestrasi

This skill seamlessly collaborates across the ecosystem:
- **`session-memory-manager`**: Persists deep work durations and session checkpoints across multi-turn workflows.
- **`zero-to-prod-orchestrator`**: Injects ergonomic pauses between major phase transitions (Architecture -> Database -> API -> UI).
- **`flow-coach`**: Specialized subagent guiding ergonomic pacing and cognitive stamina.
- **`generative_ui`**: Visualizes real-time progress widgets directly in chat environments.
