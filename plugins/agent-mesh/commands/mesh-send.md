---
description: "Send a message to another agent on the mesh"
argument-hint: "--from <id> --to <id|broadcast> --topic <topic> <message>"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/mesh-bus.sh:*)"]
---

# Mesh Send

Send a message to another agent (or all agents via `broadcast`) on the agent mesh.

Parse the arguments from: $ARGUMENTS
- `--from <id>` — sender identity (required)
- `--to <id|broadcast>` — recipient identity or "broadcast" (required)
- `--topic <topic>` — message topic/type (required)
- remaining text — message content (required)

Send the message:
```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/mesh-bus.sh" send "<from>" "<to>" "<topic>" "<content>"
```

Report the message ID and confirm delivery.

**Use cases:**
- Send findings from one agent to another running in a different session
- Broadcast status updates to all listening agents
- Send partial results to an orchestrator while still working
- Coordinate task handoff between sequential agents

**Arguments:** $ARGUMENTS
