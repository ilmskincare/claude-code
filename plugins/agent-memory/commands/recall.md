---
description: "Search and display stored memories"
argument-hint: "[keyword or tag]"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/memory-store.sh:*)"]
---

# Recall

Search stored memories and display relevant ones.

If a keyword is provided, do a full-text search:
```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/memory-store.sh" search "$ARGUMENTS"
```

If no argument given, list all memories:
```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/memory-store.sh" list
```

Display the results clearly, grouped by importance. Summarize what was found and how it might be relevant to the current task.

**Arguments:** $ARGUMENTS
