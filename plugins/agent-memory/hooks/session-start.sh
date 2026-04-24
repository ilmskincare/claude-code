#!/bin/bash
# SessionStart hook: inject stored memories as additional context

set -euo pipefail

MEMORY_DIR="${CLAUDE_PROJECT_DIR:-$PWD}/.claude/memories"

if [[ ! -d "$MEMORY_DIR" ]]; then
  exit 0
fi

# Collect all memories sorted by importance desc, then recency desc
memories=""
count=0
while IFS= read -r -d '' f; do
  entry=$(jq -r '"- [\(.importance)/10 importance] \(.content)"' "$f" 2>/dev/null) || continue
  memories="${memories}${entry}\n"
  count=$((count + 1))
done < <(find "$MEMORY_DIR" -name "*.json" -print0 2>/dev/null | \
  xargs -0 -I{} sh -c 'jq -r "\(.importance|tostring) {}" "$1" 2>/dev/null' _ {} | \
  sort -rn | sed 's/^[0-9]* //' | tr '\n' '\0')

if [[ $count -eq 0 ]]; then
  exit 0
fi

# Output SessionStart additionalContext
jq -n \
  --arg memories "$(printf '%b' "$memories")" \
  --argjson count "$count" \
  '{
    "hookSpecificOutput": {
      "hookEventName": "SessionStart",
      "additionalContext": ("## Agent Memory (" + ($count | tostring) + " stored memories)\n\nThe following memories were saved from previous sessions. Use them to inform your work:\n\n" + $memories + "\nUse /recall to search memories, /remember to save new ones, /forget to remove stale ones.")
    }
  }'
