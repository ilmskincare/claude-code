#!/bin/bash
# Stop hook: launch memory-curator agent to extract and save new learnings
# Only runs if auto-memory is enabled (.claude/agent-memory.local.md exists with auto_extract: true)

set -euo pipefail

CONFIG_FILE="${CLAUDE_PROJECT_DIR:-$PWD}/.claude/agent-memory.local.md"

if [[ ! -f "$CONFIG_FILE" ]]; then
  exit 0
fi

AUTO_EXTRACT=$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$CONFIG_FILE" | \
  grep '^auto_extract:' | sed 's/auto_extract: *//' | tr -d '"' | tr '[:upper:]' '[:lower:]')

if [[ "$AUTO_EXTRACT" != "true" ]]; then
  exit 0
fi

HOOK_INPUT=$(cat)
TRANSCRIPT_PATH=$(echo "$HOOK_INPUT" | jq -r '.transcript_path // ""')

if [[ -z "$TRANSCRIPT_PATH" ]] || [[ ! -f "$TRANSCRIPT_PATH" ]]; then
  exit 0
fi

# Extract the last assistant message from the transcript
LAST_MSG=$(grep '"role":"assistant"' "$TRANSCRIPT_PATH" 2>/dev/null | tail -1 | \
  jq -r '.message.content | map(select(.type == "text")) | map(.text) | join("\n")' 2>/dev/null || true)

if [[ -z "$LAST_MSG" ]]; then
  exit 0
fi

# Prompt the memory-curator via systemMessage to extract and save any new learnings
# Uses a non-blocking approach: just surfaces the suggestion to Claude
jq -n \
  --arg msg "Before ending this session, consider using /remember to save any important learnings, patterns, or project-specific facts discovered during this session. Use the memory-curator agent to auto-extract if needed." \
  '{
    "decision": "approve",
    "systemMessage": $msg
  }'
