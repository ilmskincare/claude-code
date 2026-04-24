# Context Budget Management

## The Problem

Claude Code agents have a finite context window. When it fills up, compaction fires — older messages are summarized and context is lost. Agents that don't reason about their budget can:

- Start a large task and fail silently mid-way when context runs out
- Lose track of important decisions or todos after compaction
- Produce incomplete output that looks complete from the outside

## Estimating Your Budget

A rough heuristic for context consumption:

| Operation | Approximate tokens |
|-----------|-------------------|
| Reading a 100-line file | ~1,500 tokens |
| Reading a 500-line file | ~7,500 tokens |
| A full bash command output (100 lines) | ~2,000 tokens |
| A code-explorer agent result | ~5,000-15,000 tokens |
| An architect agent result | ~8,000-20,000 tokens |

For long tasks (> 5 agent launches + 10 file reads), proactively save state.

## Pattern 1: Checkpoint Before Large Operations

Before launching a large multi-agent workflow, write a checkpoint:

```
Before starting Phase 4 (Architecture Design), saving checkpoint to .claude/context-survival.md:
- Completed: Phase 1 (Discovery), Phase 2 (Exploration), Phase 3 (Questions)
- Key decision: Use Repository pattern over direct DB access
- Files changed so far: [none yet]
- Next step if context is lost: Resume at Phase 4, read CHECKPOINT
```

## Pattern 2: Progressive Disclosure Reading

Instead of reading full files upfront, read in layers:
1. Read first 50 lines to understand structure
2. Read specific sections only when needed
3. Use grep to find specific patterns rather than full file reads

This preserves context budget for later steps.

## Pattern 3: Summarize Agent Output Immediately

After receiving a large agent result, immediately summarize it before proceeding:

```
Code-explorer returned 15,000 tokens of analysis. Summarizing key points:
1. Auth flow: JWT in middleware → routes → handlers
2. DB layer: Prisma ORM with 3 models (User, Post, Comment)
3. Key files: src/auth/middleware.ts, src/db/client.ts, src/routes/
[Discarding full agent output from active context]
```

## Pattern 4: Budget-Aware Task Planning

For tasks with many phases, estimate budget allocation upfront:

```
Task: Implement user authentication (estimated 8 phases)
Budget allocation:
- Discovery + Exploration: 20%
- Architecture design: 20%
- Implementation: 40%
- Review + fixes: 20%

If I hit compaction during Implementation, the survival file will have:
- Architecture decision, key files to modify, current progress
```

## Pattern 5: Survival File Protocol

Before any operation that might push context past 70% of budget:

1. Write `.claude/context-survival.md` with:
   - Active todo list
   - Key decisions made
   - Files modified
   - Next immediate action
2. Proceed with the operation
3. After compaction fires, the SessionStart hook will inject the survival file

## Working with context-survival.md

The context-budget plugin's PreCompact hook will instruct you to write this file.
You can also write it proactively:

```markdown
# Context Survival - [timestamp]

## Active Todos
- [x] Completed: Set up auth middleware
- [ ] In Progress: Implement JWT validation
- [ ] Pending: Add refresh token logic

## Key Decisions
- Using jsonwebtoken v9 (not jose - team preference)
- Tokens expire in 15min, refresh tokens in 7 days
- Refresh tokens stored in Redis, not DB

## Files Modified
- src/auth/middleware.ts (new file)
- src/routes/auth.ts (added /login, /refresh)
- package.json (added jsonwebtoken)

## Next Step
Implement JWT validation in middleware.ts lines 45-80
```

## Anti-Patterns to Avoid

- Reading entire large files when you only need one function
- Keeping raw agent output in context after summarizing it
- Starting a new major phase without checkpointing
- Running 5+ agents in parallel without budget planning
