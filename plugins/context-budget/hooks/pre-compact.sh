#!/bin/bash
# PreCompact hook: preserve critical state before context compaction fires.
# Reads .claude/context-budget.local.md for user-defined critical state keys,
# extracts them from the current session, and writes them to a survival file.

set -euo pipefail

CONFIG_FILE="${CLAUDE_PROJECT_DIR:-$PWD}/.claude/context-budget.local.md"
SURVIVAL_FILE="${CLAUDE_PROJECT_DIR:-$PWD}/.claude/context-survival.md"

# Read hook input
HOOK_INPUT=$(cat)

# Extract active todos from any TodoWrite state if transcript available
TRANSCRIPT_PATH=$(echo "$HOOK_INPUT" | jq -r '.transcript_path // ""')

# Emit PreCompact summary instructions to Claude
# This injects a summary request before the context is compacted
jq -n \
  '{
    "hookSpecificOutput": {
      "hookEventName": "PreCompact",
      "preservedContext": "CONTEXT COMPACTION WARNING: Before compaction, preserve these critical items by writing them to .claude/context-survival.md:\n\n1. **Active todos**: Current TodoWrite list with all pending/in_progress items\n2. **Key decisions**: Any architectural or implementation decisions made this session\n3. **Blocking issues**: Any unresolved problems or dependencies\n4. **Current file changes**: List of files modified and their purpose\n5. **Next immediate step**: The single most important thing to do after compaction\n\nFormat: Use clear markdown sections. This file will be injected at the start of the next context window."
    }
  }'
