# Context Budget Plugin

Context window budget awareness for Claude Code agents. Prevents silent late-task failures by hooking into compaction events and providing patterns for agents to reason about their remaining budget.

## The Problem

When a long task fills the context window, Claude Code triggers compaction (summarization of older messages). Without intervention, this loses critical state: active todos, architectural decisions, file change lists, and "where we were." The agent then continues from a partial understanding, producing incorrect or incomplete output.

## How It Works

1. **PreCompact hook** — fires when compaction is imminent; injects instructions to write a survival file
2. **SessionStart hook** — injects the survival file's contents at the start of the next context window
3. **`/context-checkpoint` command** — manually save a checkpoint at any time
4. **`context-management` skill** — patterns for budget-aware agent behavior

## Commands

| Command | Description |
|---------|-------------|
| `/context-checkpoint [notes]` | Save current session state to survival file |

## Hooks

| Event | Action |
|-------|--------|
| `PreCompact` | Instructs agent to write `.claude/context-survival.md` before compaction |
| `SessionStart` | Injects survival file contents if present |

## Survival File

`.claude/context-survival.md` is a markdown file written by the agent before compaction. It contains:

- Active todo list
- Key decisions and rationale  
- Files modified
- Current workflow phase
- Next immediate action
- Blocking issues

The plugin automatically reads this file on the next session start and injects it as context.

## Budget Estimation

| Operation | ~Tokens |
|-----------|---------|
| 100-line file read | ~1,500 |
| 500-line file read | ~7,500 |
| Agent result (explorer) | ~5,000–15,000 |
| Agent result (architect) | ~8,000–20,000 |

For tasks with > 5 agent launches, use `/context-checkpoint` proactively between phases.
