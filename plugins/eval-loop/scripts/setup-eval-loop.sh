#!/bin/bash
# Initialize an eval loop with a rubric and task description.
# Writes state to .claude/eval-loop.local.md

set -euo pipefail

usage() {
  cat >&2 << 'EOF'
Usage: setup-eval-loop.sh <task> --rubric <criteria> [OPTIONS]

ARGUMENTS:
  task             Description of what needs to be accomplished

OPTIONS:
  --rubric <text>          Newline-separated pass criteria (REQUIRED)
  --pass-threshold <n>     Min criteria that must pass to complete (default: all)
  --max-iterations <n>     Max grading iterations before force-stop (default: 10)
  --grader-model <model>   Model for the grader agent (default: sonnet)
  -h, --help               Show this help

EXAMPLES:
  setup-eval-loop.sh "Add user auth" \
    --rubric "Tests pass
All endpoints require authentication
No hardcoded secrets
README updated" \
    --max-iterations 5

  setup-eval-loop.sh "Refactor cache layer" \
    --rubric "No test regressions
Cache hit rate metric exposed
Memory usage within 10% of baseline" \
    --pass-threshold 3

EOF
  exit 1
}

TASK=""
RUBRIC=""
MAX_ITERATIONS=10
PASS_THRESHOLD=-1  # -1 means all must pass
GRADER_MODEL="sonnet"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage ;;
    --rubric) RUBRIC="${2:-}"; shift 2 ;;
    --max-iterations) MAX_ITERATIONS="${2:-10}"; shift 2 ;;
    --pass-threshold) PASS_THRESHOLD="${2:--1}"; shift 2 ;;
    --grader-model) GRADER_MODEL="${2:-sonnet}"; shift 2 ;;
    *) TASK="${TASK} $1"; shift ;;
  esac
done

TASK="${TASK## }"  # trim leading space

[[ -z "$TASK" ]] && { echo "❌ Error: task description required" >&2; exit 1; }
[[ -z "$RUBRIC" ]] && { echo "❌ Error: --rubric required" >&2; exit 1; }

# Count criteria
CRITERIA_COUNT=$(echo "$RUBRIC" | grep -c '^.\+' || true)
[[ $PASS_THRESHOLD -lt 0 ]] && PASS_THRESHOLD=$CRITERIA_COUNT

mkdir -p .claude

# Escape rubric for YAML (store as base64 to avoid multiline YAML issues)
RUBRIC_B64=$(echo "$RUBRIC" | base64 -w 0 2>/dev/null || echo "$RUBRIC" | base64)

cat > .claude/eval-loop.local.md << EOF
---
active: true
iteration: 0
max_iterations: $MAX_ITERATIONS
pass_threshold: $PASS_THRESHOLD
criteria_count: $CRITERIA_COUNT
grader_model: $GRADER_MODEL
rubric_b64: "$RUBRIC_B64"
started_at: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
---

$TASK
EOF

cat << EOF
✅ Eval loop initialized!

Task: $TASK
Criteria: $CRITERIA_COUNT (need $PASS_THRESHOLD to pass)
Max iterations: $MAX_ITERATIONS
Grader model: $GRADER_MODEL

Rubric:
$(echo "$RUBRIC" | sed 's/^/  - /')

The stop hook will grade your work against these criteria before allowing completion.
Each iteration, you'll see which criteria passed and which need more work.

State file: .claude/eval-loop.local.md
EOF
