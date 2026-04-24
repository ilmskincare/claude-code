# Eval Loop Plugin

Rubric-based evaluation loop that grades agent output against explicit success criteria before allowing task completion. Extends the Ralph Wiggum loop pattern with structured pass/fail scoring.

## How It Works

1. You define a task and rubric (list of pass/fail criteria)
2. Claude works on the task
3. When Claude tries to exit, the Stop hook fires and injects a grading prompt
4. Claude runs the `task-grader` agent to evaluate each criterion
5. Failed criteria are fed back as specific improvement instructions
6. The loop continues until all required criteria pass (or max iterations reached)

## Commands

| Command | Description |
|---------|-------------|
| `/eval-loop <task> --rubric <criteria>` | Start a rubric-graded loop |

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `--rubric <text>` | required | Newline-separated pass/fail criteria |
| `--max-iterations <n>` | 10 | Max grading cycles before force-stop |
| `--pass-threshold <n>` | all | Minimum criteria that must pass |
| `--grader-model <model>` | sonnet | Model to use for grading |

## Example

```
/eval-loop "Add user authentication" \
  --rubric "All existing tests still pass
Login endpoint returns JWT token
Protected routes return 401 without token
No hardcoded secrets in source files
README documents the auth flow" \
  --max-iterations 8 \
  --pass-threshold 5
```

## Agents

| Agent | Description |
|-------|-------------|
| `task-grader` | Evaluates work against rubric criteria, outputs structured PASS/FAIL JSON |

## State File

The loop state is stored in `.claude/eval-loop.local.md`. Delete this file to cancel an active eval loop.
