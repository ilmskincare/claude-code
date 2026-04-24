#!/bin/bash
# SessionStart hook: inject any pending mesh messages addressed to this session.
# Uses CLAUDE_MESH_IDENTITY env var (or defaults to "agent") as the recipient identity.

set -euo pipefail

MESH_DIR="${CLAUDE_PROJECT_DIR:-$PWD}/.claude/mesh"
IDENTITY="${CLAUDE_MESH_IDENTITY:-}"

if [[ -z "$IDENTITY" ]] || [[ ! -d "$MESH_DIR" ]]; then
  exit 0
fi

# Collect unread messages for this identity and broadcast
messages=""
count=0

for f in "$MESH_DIR"/*.json 2>/dev/null; do
  [[ -f "$f" ]] || continue
  to=$(jq -r '.to' "$f" 2>/dev/null) || continue
  acked=$(jq -r '.acked' "$f" 2>/dev/null) || continue
  [[ "$acked" == "true" ]] && continue
  [[ "$to" != "$IDENTITY" && "$to" != "broadcast" ]] && continue
  entry=$(jq -r '"From: " + .from + " | Topic: " + .topic + "\n" + .content + "\n[Message ID: " + .id + "]"' "$f" 2>/dev/null) || continue
  messages="${messages}\n---\n${entry}"
  count=$((count + 1))
done

if [[ $count -eq 0 ]]; then
  exit 0
fi

jq -n \
  --arg messages "$(printf '%b' "$messages")" \
  --arg identity "$IDENTITY" \
  --argjson count "$count" \
  '{
    "hookSpecificOutput": {
      "hookEventName": "SessionStart",
      "additionalContext": ("## Agent Mesh: " + ($count | tostring) + " pending message(s) for " + $identity + "\n" + $messages + "\n\nUse /mesh-ack <id> to acknowledge messages after reading, or /mesh-send to reply.")
    }
  }'
