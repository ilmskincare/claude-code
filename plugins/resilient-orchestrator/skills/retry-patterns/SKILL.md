# Resilient Multi-Agent Orchestration Patterns

## Core Problem

When you launch multiple agents in parallel, any single failure can cascade silently:
- An agent returns empty output (tool error, timeout, context overflow)
- An agent produces partial output that looks complete
- Two agents produce conflicting results that cancel each other out
- A blocking agent stalls while others wait for its output

## Pattern 1: Defensive Agent Launch

Always launch agents with explicit success criteria and output validation:

```
Launch code-explorer agent to analyze authentication flow.
REQUIRED OUTPUT: A list of at least 5 files with their roles.
If the agent returns fewer than 5 files or an error, treat as FAILED and retry.
```

## Pattern 2: Parallel with Quorum

When launching N agents for the same task, require M-of-N to agree before proceeding:

```
Launch 3 code-architect agents in parallel, each designing the auth system.
QUORUM RULE: At least 2/3 must propose the same top-level approach.
If no quorum: synthesize the best elements and present to user.
```

## Pattern 3: Fallback Chain

Define a primary agent and one or more fallback strategies:

```
Primary: Launch code-reviewer agent for full review.
Fallback 1: If agent times out or fails, do a manual review of changed files.
Fallback 2: If manual review is incomplete, flag for human review and proceed.
Never silently skip the review step.
```

## Pattern 4: Circuit Breaker

Track agent failure counts; stop launching the same failing agent:

```
Keep a counter: failed_launches["code-explorer"] = 0
If counter >= 2: do NOT launch another code-explorer. 
Instead: perform the exploration manually or use a different agent.
Reset counter when an agent succeeds.
```

## Pattern 5: Timeout with Partial Results

Set explicit timeouts and define what to do with partial results:

```
Launch agent with 5-minute soft timeout.
If timeout fires:
  1. Check what the agent produced so far
  2. If output is 50%+ complete: use it with a warning
  3. If output is <50%: treat as failed, use fallback
  4. Log the timeout: record which agent failed and why
```

## Pattern 6: Output Validation Gates

Before using agent output, validate it against explicit criteria:

```
Agent output is VALID if:
  - Contains at least 3 concrete implementation steps
  - References actual file paths that exist
  - Does not contain "I cannot" or "I don't have access"

If INVALID: retry once, then escalate to user
```

## Pattern 7: Dependency Graph Execution

For sequential agent pipelines, make dependencies explicit:

```
Step 1: code-explorer (no dependencies)
Step 2: code-architect (depends on Step 1 output - file list)
Step 3: code-reviewer (depends on Step 2 output - architecture decision)

If Step 1 fails: STOP. Do not proceed to Step 2 with empty context.
If Step 2 fails: Retry Step 2 once with broader context. If still fails, STOP.
```

## Implementation with retry-helper.sh

For shell-level retries of subprocess calls:

```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/retry-helper.sh" 3 2 your-command --args
# 3 attempts, 2s/4s/8s exponential backoff
```

## Orchestration Checklist

Before launching parallel agents:
- [ ] Define success criteria for each agent
- [ ] Define fallback if agent fails
- [ ] Define quorum/consensus rules if agents may disagree
- [ ] Set explicit timeouts
- [ ] Define what happens if < all agents succeed
- [ ] Never proceed silently with empty agent output
