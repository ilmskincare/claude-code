# Agent Mesh Plugin

Peer-to-peer communication channel for concurrent Claude Code agents. Enables agents running in parallel sessions to coordinate, share findings, and hand off work via a lightweight filesystem message bus.

## The Problem

Current multi-agent patterns (e.g., `feature-dev`'s parallel agent dispatch) are one-directional: the parent launches agents and collects their results, but agents cannot communicate with each other. This prevents:

- Agent A telling Agent B "I'm taking ownership of auth, you handle data models"
- An agent broadcasting partial findings to all others
- Streaming intermediate results to an orchestrator without waiting for completion
- Sequential handoff: Agent A finishing and passing a structured artifact to Agent B

## How It Works

1. Agents write messages to `.claude/mesh/` as JSON files
2. Each message has a `to` field (specific agent ID or `broadcast`)
3. The `SessionStart` hook reads pending messages for the current agent's identity
4. Messages are acknowledged with `ack` so they're only processed once

## Setup

Each agent session needs a `CLAUDE_MESH_IDENTITY` environment variable set to its unique ID. Set this in your orchestration command or via `SessionStart` hooks.

## Commands

| Command | Description |
|---------|-------------|
| `/mesh-send --from <id> --to <id\|broadcast> --topic <topic> <message>` | Send a message |
| `/mesh-read [--identity <id>] [--ack] [--all]` | Read pending messages |

## Message Format

```json
{
  "id": "20240101T120000Z_1234_5678",
  "from": "code-explorer-1",
  "to": "code-architect-1",
  "topic": "exploration-complete",
  "content": "Auth files: src/auth/middleware.ts, src/auth/tokens.ts. DB layer: Prisma. Key pattern: middleware-first.",
  "sent_at": "2024-01-01T12:00:00Z",
  "read_at": null,
  "acked": false
}
```

## Multi-Agent Workflow Example

```
# Orchestrator launches 3 agents with identities:
CLAUDE_MESH_IDENTITY=explorer-1 claude "Explore auth module" &
CLAUDE_MESH_IDENTITY=explorer-2 claude "Explore data models" &

# Each explorer sends findings when done:
/mesh-send --from explorer-1 --to broadcast --topic findings "Auth: JWT middleware, 3 endpoints..."
/mesh-send --from explorer-2 --to broadcast --topic findings "Models: User, Post, Comment (Prisma)..."

# Architect reads all findings:
CLAUDE_MESH_IDENTITY=architect-1 claude "Design the auth system"
# SessionStart hook injects broadcast messages automatically
```

## Storage

Messages are stored in `.claude/mesh/`. Use `/mesh-read --ack` or the `mesh-bus.sh purge` command to clean up old messages.
