#!/bin/bash
# Stop hook: grade the current work against the eval rubric.
# Blocks exit if criteria are not met; allows exit when all criteria pass.

set -euo pipefail

EVAL_STATE_FILE="${CLAUDE_PROJECT_DIR:-$PWD}/.claude/eval-loop.local.md"

if [[ ! -f "$EVAL_STATE_FILE" ]]; then
  exit 0
fi

# Parse frontmatter
FRONTMATTER=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$EVAL_STATE_FILE")

ITERATION=$(echo "$FRONTMATTER" | grep '^iteration:' | sed 's/iteration: *//')
MAX_ITERATIONS=$(echo "$FRONTMATTER" | grep '^max_iterations:' | sed 's/max_iterations: *//')
PASS_THRESHOLD=$(echo "$FRONTMATTER" | grep '^pass_threshold:' | sed 's/pass_threshold: *//')
CRITERIA_COUNT=$(echo "$FRONTMATTER" | grep '^criteria_count:' | sed 's/criteria_count: *//')
GRADER_MODEL=$(echo "$FRONTMATTER" | grep '^grader_model:' | sed 's/grader_model: *//')
RUBRIC_B64=$(echo "$FRONTMATTER" | grep '^rubric_b64:' | sed 's/rubric_b64: *//' | tr -d '"')

# Validate numerics
for var in ITERATION MAX_ITERATIONS PASS_THRESHOLD CRITERIA_COUNT; do
  val="${!var}"
  if [[ ! "$val" =~ ^[0-9]+$ ]]; then
    echo "⚠️  Eval loop: state file corrupted (field $var = '$val')" >&2
    rm "$EVAL_STATE_FILE"
    exit 0
  fi
done

NEXT_ITERATION=$((ITERATION + 1))

# Max iterations guard
if [[ $MAX_ITERATIONS -gt 0 ]] && [[ $NEXT_ITERATION -gt $MAX_ITERATIONS ]]; then
  echo "🛑 Eval loop: max iterations ($MAX_ITERATIONS) reached. Stopping regardless of grade."
  rm "$EVAL_STATE_FILE"
  exit 0
fi

# Decode rubric
RUBRIC=$(echo "$RUBRIC_B64" | base64 -d 2>/dev/null || echo "$RUBRIC_B64")

# Extract task from state file (everything after closing ---)
TASK=$(awk '/^---$/{i++; next} i>=2' "$EVAL_STATE_FILE")

# Get transcript path
HOOK_INPUT=$(cat)
TRANSCRIPT_PATH=$(echo "$HOOK_INPUT" | jq -r '.transcript_path // ""')

# Build grading prompt for the grader agent
GRADE_PROMPT="You are a strict rubric grader. Evaluate the current state of the work against each criterion.

TASK: $TASK

RUBRIC CRITERIA (grade each as PASS or FAIL):
$RUBRIC

Review the recent work (check files, run tests if needed) and grade each criterion.
Output ONLY a JSON object in this exact format:
{
  \"grades\": [
    {\"criterion\": \"<criterion text>\", \"result\": \"PASS\", \"reason\": \"<brief reason>\"},
    {\"criterion\": \"<criterion text>\", \"result\": \"FAIL\", \"reason\": \"<what's missing>\"}
  ],
  \"passed\": <number>,
  \"total\": <number>,
  \"summary\": \"<one sentence overall assessment>\"
}"

# Update iteration counter
TEMP="$EVAL_STATE_FILE.tmp.$$"
sed "s/^iteration: .*/iteration: $NEXT_ITERATION/" "$EVAL_STATE_FILE" > "$TEMP"
mv "$TEMP" "$EVAL_STATE_FILE"

# Output blocking decision with grading instructions
# The reason field is fed back to Claude, which will run the grader
SYSTEM_MSG="🔬 Eval loop iteration $NEXT_ITERATION/$MAX_ITERATIONS | Need $PASS_THRESHOLD/$CRITERIA_COUNT criteria to pass"

jq -n \
  --arg reason "$GRADE_PROMPT" \
  --arg msg "$SYSTEM_MSG" \
  '{
    "decision": "block",
    "reason": $reason,
    "systemMessage": $msg
  }'
