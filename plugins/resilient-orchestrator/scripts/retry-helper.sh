#!/bin/bash
# Exponential backoff retry helper for agent orchestration scripts.
# Usage: retry-helper.sh <max_attempts> <base_delay_s> <command...>
#
# Exit codes:
#   0 - command succeeded within retries
#   1 - all retries exhausted
#   2 - usage error

set -euo pipefail

MAX_ATTEMPTS="${1:-3}"
BASE_DELAY="${2:-2}"
shift 2 2>/dev/null || { echo "Usage: retry-helper.sh <max_attempts> <base_delay_s> <command...>" >&2; exit 2; }

if [[ $# -eq 0 ]]; then
  echo "retry-helper.sh: no command given" >&2
  exit 2
fi

attempt=1
delay=$BASE_DELAY

while [[ $attempt -le $MAX_ATTEMPTS ]]; do
  if "$@"; then
    exit 0
  fi

  exit_code=$?

  if [[ $attempt -ge $MAX_ATTEMPTS ]]; then
    echo "❌ retry-helper: command failed after $MAX_ATTEMPTS attempts (exit $exit_code): $*" >&2
    exit 1
  fi

  echo "⚠️  retry-helper: attempt $attempt/$MAX_ATTEMPTS failed (exit $exit_code). Retrying in ${delay}s..." >&2
  sleep "$delay"
  delay=$((delay * 2))
  attempt=$((attempt + 1))
done
