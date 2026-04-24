---
description: "Save a memory for future sessions"
argument-hint: "<content> [--tags tag1,tag2] [--importance 1-10]"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/memory-store.sh:*)"]
---

# Remember

Save an important fact, pattern, or learning to persistent memory for use in future sessions.

Parse the arguments: extract the content (everything before any flags), tags from `--tags`, and importance (1-10) from `--importance` (default: 5).

Then save the memory:

```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/memory-store.sh" save "<content>" "<tags_csv>" <importance>
```

Report the saved memory ID and confirm what was stored.

**Good memories to save:**
- Project-specific conventions or quirks
- Architectural decisions and their rationale
- Recurring bugs and their root causes
- Team preferences or workflow patterns
- Environment-specific gotchas

**Arguments:** $ARGUMENTS
