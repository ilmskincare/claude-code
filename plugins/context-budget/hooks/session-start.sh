#!/bin/bash
# SessionStart hook: inject context survival file if it exists from a previous compaction.

set -euo pipefail

SURVIVAL_FILE="${CLAUDE_PROJECT_DIR:-$PWD}/.claude/context-survival.md"

if [[ ! -f "$SURVIVAL_FILE" ]]; then
  exit 0
fi

# Read the survival file content
CONTENT=$(cat "$SURVIVAL_FILE")

if [[ -z "$CONTENT" ]]; then
  exit 0
fi

# Inject it as additional context
jq -n \
  --arg content "$CONTENT" \
  '{
    "hookSpecificOutput": {
      "hookEventName": "SessionStart",
      "additionalContext": ("## Context Survival Data (from previous compaction)\n\nThe following critical state was preserved before the last context compaction. Review it to restore continuity:\n\n" + $content + "\n\n---\nNote: This data was saved by the context-budget plugin. You can update .claude/context-survival.md as needed, or delete it once the session is back on track.")
    }
  }'
