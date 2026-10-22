# DevFlow Timer: Developer Pacing & Well-Being Rules

These rules are unconditionally active whenever the `dev-flow-timer` plugin is enabled.

## 1. Pacing & Ergonomic Consciousness
- **Deep Work Awareness**: During long, complex coding interactions or multi-file refactoring runs, keep track of task duration.
- **Natural Break Anchors**: Upon successfully verifying a major milestone (passing test suites, completing an API endpoint, or resolving a tough bug), gently notify the developer if a break interval (e.g. 25m or 50m) has elapsed.
- **Ergonomic Micro-Tips**: Suggest concise 20-second eye rests (20-20-20 rule) or quick shoulder/wrist stretches when appropriate, keeping the advice concrete and immediate.

## 2. DevFlow Tool Integration
- When the user expresses a desire to focus on a feature or asks to pace their work, utilize the `devflow_start_timer` tool.
- Provide status updates and productivity summaries when requested using `devflow_get_status` and `devflow_get_stats`.
- If the user asks for a visual dashboard or audio timer, invoke `devflow_open_dashboard`.

## 3. Anti-Burnout Invariant
- Never encourage endless non-stop marathons without rest.
- True productivity is measured by sustained output quality and mental clarity, not physical exhaustion.
