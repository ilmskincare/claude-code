#!/bin/bash
# Agent mesh message bus — filesystem-based P2P communication for concurrent agents.
#
# Messages live in .claude/mesh/ as JSON files.
# Each message: { id, from, to, topic, content, sent_at, read_at, acked }
#
# Usage:
#   mesh-bus.sh send <from> <to|broadcast> <topic> <content>
#   mesh-bus.sh read <recipient>               # list unread messages for recipient
#   mesh-bus.sh ack <message-id>               # mark a message as read
#   mesh-bus.sh list [--all]                   # list all messages (--all includes read)
#   mesh-bus.sh drain <recipient>              # read + ack all pending messages
#   mesh-bus.sh purge [--older-than-hours N]   # delete acknowledged messages

set -euo pipefail

MESH_DIR="${CLAUDE_PROJECT_DIR:-$PWD}/.claude/mesh"
cmd="${1:-}"

usage() {
  cat >&2 << 'EOF'
Usage: mesh-bus.sh <command> [args]

Commands:
  send  <from> <to|broadcast> <topic> <content>  Send a message
  read  <recipient>                               List unread messages for recipient
  ack   <message-id>                              Acknowledge (mark read) a message
  drain <recipient>                               Read and ack all pending messages
  list  [--all]                                   List messages (--all includes acked)
  purge [--older-than-hours N]                    Delete old acked messages (default: 1h)
EOF
  exit 1
}

ensure_dir() {
  mkdir -p "$MESH_DIR"
}

new_id() {
  date -u +%Y%m%dT%H%M%SZ_$$_$RANDOM
}

case "$cmd" in
  send)
    from="${2:-}"
    to="${3:-}"
    topic="${4:-}"
    content="${5:-}"
    [[ -z "$from" || -z "$to" || -z "$topic" || -z "$content" ]] && {
      echo "send: from, to, topic, content all required" >&2; exit 1
    }
    ensure_dir
    id="$(new_id)"
    now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    jq -n \
      --arg id "$id" \
      --arg from "$from" \
      --arg to "$to" \
      --arg topic "$topic" \
      --arg content "$content" \
      --arg sent_at "$now" \
      '{
        id: $id,
        from: $from,
        to: $to,
        topic: $topic,
        content: $content,
        sent_at: $sent_at,
        read_at: null,
        acked: false
      }' > "$MESH_DIR/${id}.json"
    echo "Sent message $id to $to (topic: $topic)"
    ;;

  read)
    recipient="${2:-}"
    [[ -z "$recipient" ]] && { echo "read: recipient required" >&2; exit 1; }
    ensure_dir
    count=0
    for f in "$MESH_DIR"/*.json 2>/dev/null; do
      [[ -f "$f" ]] || continue
      # Match messages addressed to this recipient or broadcast
      to=$(jq -r '.to' "$f" 2>/dev/null) || continue
      acked=$(jq -r '.acked' "$f" 2>/dev/null) || continue
      [[ "$acked" == "true" ]] && continue
      [[ "$to" != "$recipient" && "$to" != "broadcast" ]] && continue
      jq -r '"[" + .id + "] FROM:" + .from + " TOPIC:" + .topic + "\n  " + .content' "$f" 2>/dev/null || true
      count=$((count + 1))
    done
    [[ $count -eq 0 ]] && echo "(no unread messages for: $recipient)"
    ;;

  ack)
    msg_id="${2:-}"
    [[ -z "$msg_id" ]] && { echo "ack: message-id required" >&2; exit 1; }
    f="$MESH_DIR/${msg_id}.json"
    [[ -f "$f" ]] || { echo "Message not found: $msg_id" >&2; exit 1; }
    now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    tmp="${f}.tmp.$$"
    jq --arg now "$now" '.acked = true | .read_at = $now' "$f" > "$tmp"
    mv "$tmp" "$f"
    echo "Acked: $msg_id"
    ;;

  drain)
    recipient="${2:-}"
    [[ -z "$recipient" ]] && { echo "drain: recipient required" >&2; exit 1; }
    ensure_dir
    count=0
    now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    for f in "$MESH_DIR"/*.json 2>/dev/null; do
      [[ -f "$f" ]] || continue
      to=$(jq -r '.to' "$f" 2>/dev/null) || continue
      acked=$(jq -r '.acked' "$f" 2>/dev/null) || continue
      [[ "$acked" == "true" ]] && continue
      [[ "$to" != "$recipient" && "$to" != "broadcast" ]] && continue
      # Print and ack
      jq -r '"[" + .id + "] FROM:" + .from + " TOPIC:" + .topic + "\n  " + .content' "$f" 2>/dev/null || true
      tmp="${f}.tmp.$$"
      jq --arg now "$now" '.acked = true | .read_at = $now' "$f" > "$tmp"
      mv "$tmp" "$f"
      count=$((count + 1))
    done
    echo "Drained $count message(s) for $recipient"
    ;;

  list)
    show_all=false
    [[ "${2:-}" == "--all" ]] && show_all=true
    ensure_dir
    count=0
    for f in "$MESH_DIR"/*.json 2>/dev/null; do
      [[ -f "$f" ]] || continue
      if [[ "$show_all" == false ]]; then
        acked=$(jq -r '.acked' "$f" 2>/dev/null) || continue
        [[ "$acked" == "true" ]] && continue
      fi
      jq -r '"[" + .id + "] " + .from + " → " + .to + " [" + .topic + "] " + (if .acked then "(acked)" else "(unread)" end)' "$f" 2>/dev/null || true
      count=$((count + 1))
    done
    [[ $count -eq 0 ]] && echo "(no messages)"
    ;;

  purge)
    older_hours="${2:-1}"
    [[ "${2:-}" == "--older-than-hours" ]] && older_hours="${3:-1}"
    ensure_dir
    count=0
    cutoff=$(date -u -d "${older_hours} hours ago" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || \
             date -u -v -"${older_hours}"H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "")
    for f in "$MESH_DIR"/*.json 2>/dev/null; do
      [[ -f "$f" ]] || continue
      acked=$(jq -r '.acked' "$f" 2>/dev/null) || continue
      [[ "$acked" != "true" ]] && continue
      if [[ -n "$cutoff" ]]; then
        read_at=$(jq -r '.read_at // ""' "$f" 2>/dev/null) || continue
        [[ "$read_at" > "$cutoff" ]] && continue
      fi
      rm "$f"
      count=$((count + 1))
    done
    echo "Purged $count message(s)"
    ;;

  *)
    usage
    ;;
esac
