# Agent Memory Plugin

Cross-session persistent memory for Claude Code agents. Breaks the "goldfish memory" limitation by automatically injecting relevant learnings from past sessions at startup.

## How It Works

1. **SessionStart hook** — reads all stored memories and injects them as `additionalContext`
2. **Stop hook** — when auto-extract is enabled, prompts Claude to save new learnings before exiting
3. **Memory store** — JSON files in `.claude/memories/`, each with content, tags, importance (1-10), and timestamps

## Commands

| Command | Description |
|---------|-------------|
| `/remember <content> [--tags tag1,tag2] [--importance 1-10]` | Save a memory |
| `/recall [keyword]` | Search and display memories |
| `/forget <id>` | Delete a memory by ID |

## Agents

| Agent | Description |
|-------|-------------|
| `memory-curator` | Auto-extracts high-value learnings from a session transcript |

## Auto-Extract Mode

To enable automatic memory extraction prompts at session end, create `.claude/agent-memory.local.md`:

```markdown
---
auto_extract: true
---
```

## Memory Format

```json
{
  "id": "20240101T120000Z_1234_5678",
  "content": "The auth middleware expects JWT tokens in the Authorization header, not cookies",
  "tags": ["auth", "middleware", "jwt"],
  "project": "my-project",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z",
  "importance": 8
}
```

## Storage Location

Memories are stored in `.claude/memories/` within the project directory. Add `.claude/memories/` to `.gitignore` if memories should not be committed, or commit them to share across the team.
