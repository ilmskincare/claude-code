---
description: "Delete a stored memory by ID"
argument-hint: "<memory-id>"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/memory-store.sh:*)"]
---

# Forget

Delete a stored memory that is no longer accurate or relevant.

If no ID provided, first list all memories so the user can pick:
```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/memory-store.sh" list
```

Then delete the specified memory:
```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/memory-store.sh" delete "$ARGUMENTS"
```

Confirm deletion and suggest running /recall to verify the memory was removed.

**Arguments:** $ARGUMENTS
