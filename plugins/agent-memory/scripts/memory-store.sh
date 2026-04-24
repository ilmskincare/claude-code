#!/bin/bash
# Shared utility for reading and writing the agent memory store.
# Memory files live in .claude/memories/ as JSON, one file per memory.
# Each memory: { "id", "content", "tags", "project", "created_at", "updated_at", "importance" }

set -euo pipefail

MEMORY_DIR="${CLAUDE_PROJECT_DIR:-$PWD}/.claude/memories"

cmd="${1:-}"

usage() {
  cat >&2 << 'EOF'
Usage: memory-store.sh <command> [args]

Commands:
  save  <content> <tags_csv> [importance 1-10]  Write a new memory
  list  [tag]                                    List all memories (optionally filtered)
  get   <id>                                     Print a single memory JSON
  delete <id>                                    Delete a memory by id
  search <keyword>                               Full-text search across memory content
EOF
  exit 1
}

ensure_dir() {
  mkdir -p "$MEMORY_DIR"
}

new_id() {
  # Portable short unique id
  date -u +%Y%m%dT%H%M%SZ_$$_$RANDOM
}

case "$cmd" in
  save)
    content="${2:-}"
    tags_csv="${3:-}"
    importance="${4:-5}"
    [[ -z "$content" ]] && { echo "save: content required" >&2; exit 1; }
    ensure_dir
    id="$(new_id)"
    now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    project="$(basename "${CLAUDE_PROJECT_DIR:-$PWD}")"
    # Build JSON with jq for safe escaping
    jq -n \
      --arg id "$id" \
      --arg content "$content" \
      --arg tags "$tags_csv" \
      --arg project "$project" \
      --arg now "$now" \
      --argjson importance "$importance" \
      '{
        id: $id,
        content: $content,
        tags: ($tags | split(",") | map(select(length > 0) | ltrimstr(" ") | rtrimstr(" "))),
        project: $project,
        created_at: $now,
        updated_at: $now,
        importance: $importance
      }' > "$MEMORY_DIR/${id}.json"
    echo "$id"
    ;;

  list)
    filter_tag="${2:-}"
    ensure_dir
    found=0
    for f in "$MEMORY_DIR"/*.json 2>/dev/null; do
      [[ -f "$f" ]] || continue
      if [[ -n "$filter_tag" ]]; then
        match=$(jq -r --arg t "$filter_tag" '.tags[] | select(. == $t)' "$f" 2>/dev/null | head -1)
        [[ -z "$match" ]] && continue
      fi
      jq -r '"[\(.id)] [\(.importance)/10] \(.content | .[0:120])"' "$f" 2>/dev/null || true
      found=1
    done
    [[ $found -eq 0 ]] && echo "(no memories stored)"
    ;;

  get)
    id="${2:-}"
    [[ -z "$id" ]] && { echo "get: id required" >&2; exit 1; }
    f="$MEMORY_DIR/${id}.json"
    [[ -f "$f" ]] || { echo "Memory not found: $id" >&2; exit 1; }
    cat "$f"
    ;;

  delete)
    id="${2:-}"
    [[ -z "$id" ]] && { echo "delete: id required" >&2; exit 1; }
    f="$MEMORY_DIR/${id}.json"
    [[ -f "$f" ]] || { echo "Memory not found: $id" >&2; exit 1; }
    rm "$f"
    echo "Deleted: $id"
    ;;

  search)
    keyword="${2:-}"
    [[ -z "$keyword" ]] && { echo "search: keyword required" >&2; exit 1; }
    ensure_dir
    found=0
    for f in "$MEMORY_DIR"/*.json 2>/dev/null; do
      [[ -f "$f" ]] || continue
      match=$(jq -r '.content' "$f" 2>/dev/null | grep -i "$keyword" || true)
      [[ -z "$match" ]] && continue
      jq -r '"[\(.id)] [\(.importance)/10] \(.content | .[0:120])"' "$f" 2>/dev/null || true
      found=1
    done
    [[ $found -eq 0 ]] && echo "(no matches for: $keyword)"
    ;;

  *)
    usage
    ;;
esac
