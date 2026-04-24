---
description: "Start a rubric-graded eval loop for a task"
argument-hint: "<task> --rubric <criteria> [--max-iterations N] [--pass-threshold N]"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/setup-eval-loop.sh:*)"]
---

# Eval Loop

Start a rubric-graded evaluation loop. Claude will work on the task, then get graded against explicit pass/fail criteria before being allowed to complete. Failed criteria are fed back as specific improvement instructions.

Run the setup script with the provided arguments:

```!
"${CLAUDE_PLUGIN_ROOT}/scripts/setup-eval-loop.sh" $ARGUMENTS
```

After setup, begin working on the task. When you try to exit, the eval stop hook will inject a grading prompt. You MUST:

1. Run the `task-grader` agent to evaluate each criterion
2. Fix any FAIL criteria
3. Only exit after all required criteria pass

**Grading format**: The grader will output JSON with per-criterion PASS/FAIL results and reasons. Address each FAIL before attempting to exit again.

**Arguments:** $ARGUMENTS
