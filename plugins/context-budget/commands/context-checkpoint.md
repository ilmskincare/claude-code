---
description: "Save a context checkpoint to survive compaction"
argument-hint: "[optional notes]"
---

# Context Checkpoint

Save the current session state to `.claude/context-survival.md` so that if context compaction fires, the next context window can resume seamlessly.

Write the following to `.claude/context-survival.md`:

1. **Timestamp** — current date/time
2. **Active Todos** — current TodoWrite list with checked/unchecked items
3. **Key Decisions** — any architectural or implementation decisions made this session
4. **Files Modified** — list of changed files and their purpose
5. **Current Phase** — where in the workflow you are
6. **Next Step** — the single most important action after resuming
7. **Blocking Issues** — any unresolved problems

If the user provided notes via $ARGUMENTS, include them under "Session Notes".

After writing, confirm: "Checkpoint saved to .claude/context-survival.md. If context compacts, the next session will resume from this point."

**Arguments:** $ARGUMENTS
