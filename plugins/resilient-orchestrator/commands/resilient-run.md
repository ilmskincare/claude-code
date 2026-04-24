---
description: "Run a task with automatic retry and fallback on failure"
argument-hint: "<task description> [--retries N] [--fallback]"
---

# Resilient Run

Execute a task with built-in retry logic and fallback handling. Unlike a raw agent launch, this workflow enforces explicit success/failure reporting and recovers from failures rather than silently proceeding.

## Workflow

Parse the task and options from: $ARGUMENTS

**Options:**
- `--retries N` — number of retry attempts (default: 2)
- `--fallback` — if all retries fail, invoke fallback-handler instead of aborting

**Execution steps:**

1. Launch a `resilient-runner` agent with the task and any success criteria provided
2. Check the `TASK_RESULT` block in the agent's output
3. If `status: SUCCEEDED` → proceed normally, report the output
4. If `status: PARTIALLY_SUCCEEDED` → ask user whether to proceed or retry
5. If `status: FAILED` and retries remain → retry with the `retry_recommendation` from the failure report
6. If `status: FAILED` and no retries remain:
   - If `--fallback` flag: launch `fallback-handler` agent with the failure context
   - Otherwise: report failure clearly to user and stop

## Retry Protocol

On each retry, include the previous failure's `retry_recommendation` in the prompt so the next attempt can take a different approach.

Track retries with TodoWrite so progress is visible.

## Output

Always end with a clear summary:
- What was accomplished
- Any degradation or gaps
- Recommended next steps
