# Resilient Orchestrator Plugin

Retry and fallback patterns for multi-agent orchestration. Provides circuit-breaker logic, exponential backoff, and graceful degradation so that a failing subagent does not silently break a multi-step workflow.

## The Problem

Standard multi-agent patterns in Claude Code (`feature-dev`, `code-review`) launch parallel agents but have no documented recovery path if one fails. A silent failure propagates as empty output to downstream steps, which then either fail cryptically or produce incorrect results based on incomplete context.

## What This Plugin Provides

| Component | Purpose |
|-----------|---------|
| `resilient-runner` agent | Executes a subtask with explicit SUCCEEDED/FAILED reporting |
| `fallback-handler` agent | Recovers from a failed subtask using scope reduction, manual reconstruction, or graceful degradation |
| `/resilient-run` command | Orchestrates retry + fallback workflow for any task |
| `retry-patterns` skill | Patterns and checklists for defensive agent orchestration |
| `retry-helper.sh` | Shell-level exponential backoff (2s, 4s, 8s, 16s) for subprocess calls |

## Commands

| Command | Description |
|---------|-------------|
| `/resilient-run <task> [--retries N] [--fallback]` | Run a task with retry and optional fallback |

## Usage in Custom Workflows

### Using the skill (inject retry patterns into any command)

Add to your command or agent: reference the `retry-patterns` skill.

### Using resilient-runner in parallel orchestration

Instead of:
```
Launch 3 code-explorer agents in parallel.
```

Use:
```
Launch 3 resilient-runner agents in parallel, each with a code exploration task.
After all agents complete, check each TASK_RESULT block.
If any agent reports FAILED, launch a fallback-handler for that agent's task.
```

### Shell-level retries

```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/retry-helper.sh" 4 2 git push origin main
# 4 attempts with 2s/4s/8s/16s backoff
```

## Patterns Covered

1. Defensive agent launch with explicit success criteria
2. Parallel quorum (M-of-N must agree)
3. Primary + fallback chain
4. Circuit breaker (stop retrying after N failures)
5. Timeout with partial result handling
6. Output validation gates
7. Dependency graph execution (stop on upstream failure)
