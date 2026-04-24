---
description: "Read pending mesh messages for this agent"
argument-hint: "[--identity <id>] [--ack] [--all]"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/mesh-bus.sh:*)"]
---

# Mesh Read

Read pending messages from the agent mesh bus.

Parse arguments from: $ARGUMENTS
- `--identity <id>` — which agent identity to read for (default: $CLAUDE_MESH_IDENTITY env var)
- `--ack` — automatically acknowledge all messages after reading
- `--all` — include already-acknowledged messages

If `--ack` flag is set, use `drain` to read and acknowledge atomically:
```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/mesh-bus.sh" drain "<identity>"
```

Otherwise, read without acknowledging:
```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/mesh-bus.sh" read "<identity>"
```

After reading, summarize the messages and indicate if any action is required.
Use `/mesh-send` to reply to any messages that expect a response.

**Arguments:** $ARGUMENTS
