# CLAUDE.md — AI Assistant Guide for `anthropics/claude-code`

This file provides context for AI assistants (Claude Code and others) working inside this repository. Read it before making changes.

---

## Repository Overview

This is the **official public repository for Claude Code** — Anthropic's AI-powered CLI tool. The repo does **not** contain the Claude Code binary source code. Instead, it serves as:

- The home of the **plugin ecosystem** (13 bundled plugins in `plugins/`)
- A **plugin marketplace registry** (`.claude-plugin/marketplace.json`)
- **GitHub automation scripts** for issue management (`scripts/`)
- **CI/CD workflows** for AI-powered issue triage and lifecycle management (`.github/workflows/`)
- **Documentation** and example configurations (`examples/`, `README.md`, `CHANGELOG.md`)
- **DevContainer** setup for sandboxed development (`.devcontainer/`)

The Claude Code binary itself is distributed separately via curl installer, Homebrew, WinGet, or npm.

---

## Repository Structure

```
/
├── .claude/                  # Project-level Claude Code config
│   └── commands/             # Custom slash commands (dedupe.md, oncall-triage.md, commit-push-pr.md)
├── .claude-plugin/
│   └── marketplace.json      # Plugin marketplace registry (lists all bundled plugins)
├── .devcontainer/            # VS Code DevContainer config + Dockerfile + firewall script
├── .github/
│   ├── ISSUE_TEMPLATE/       # Bug report, feature request, model behavior, docs templates
│   └── workflows/            # 12 GitHub Actions workflows for issue automation
├── .vscode/
│   └── extensions.json       # Recommended VS Code extensions
├── Script/                   # Windows-specific scripts (PowerShell)
├── examples/
│   ├── hooks/                # Example hook scripts (Python)
│   └── settings/             # Example settings.json files (lax, strict, sandbox)
├── plugins/                  # 13 official Claude Code plugins (see below)
├── scripts/                  # GitHub automation scripts (TypeScript, run with Bun)
├── CHANGELOG.md              # Detailed release notes
├── CLAUDE.md                 # This file
├── LICENSE.md
├── README.md
└── SECURITY.md
```

---

## Technology Stack

| Technology | Where Used |
|---|---|
| **Bun** (JS runtime) | All automation scripts in `scripts/*.ts` |
| **TypeScript** | `scripts/` — GitHub API automation |
| **Python 3** (stdlib only) | Plugin hooks in `plugins/hookify/`, `plugins/security-guidance/`, `examples/hooks/` |
| **Bash/Shell** | Plugin hooks in `plugins/ralph-wiggum/`, `plugins/explanatory-output-style/`, `plugins/learning-output-style/` |
| **Markdown + YAML frontmatter** | All plugin commands, agents, and skills |
| **JSON** | Plugin manifests (`plugin.json`, `hooks.json`), marketplace registry, settings |
| **GitHub Actions / YAML** | All CI/CD workflows in `.github/workflows/` |
| **Docker/Podman** | DevContainer environment |

There is **no `package.json`, `tsconfig.json`, ESLint/Prettier config, or test framework** at the repo root. Bun executes TypeScript scripts natively without compilation.

---

## Plugin System

### Structure

Every plugin lives under `plugins/<plugin-name>/` and follows this layout:

```
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json           # Metadata: name, version, author, description, tags
├── commands/
│   └── <command>.md          # Slash command definitions (YAML frontmatter + Markdown body)
├── agents/
│   └── <agent>.md            # Agent definitions (YAML frontmatter + system prompt)
├── skills/
│   └── <skill-name>/
│       ├── SKILL.md          # Skill trigger phrases and content description
│       └── <content>.md      # Actual skill content
└── hooks/
    ├── hooks.json            # Hook event registrations
    └── <event>.py|.sh        # Hook handler scripts
```

### Bundled Plugins

| Plugin | Purpose |
|---|---|
| `agent-sdk-dev` | Guidance for building Claude Agent SDK applications |
| `claude-opus-4-5-migration` | Migration guide for claude-opus-4-5 |
| `code-review` | AI-powered code review commands and agents |
| `commit-commands` | Git commit workflow commands |
| `explanatory-output-style` | Verbose/educational output style |
| `feature-dev` | Feature development workflow |
| `frontend-design` | Frontend/UI design guidance |
| `hookify` | User-configurable hook rule engine (no-code customization) |
| `learning-output-style` | Learning-focused response style |
| `plugin-dev` | Plugin development guide and scaffolding |
| `pr-review-toolkit` | Pull request review tools |
| `ralph-wiggum` | Randomizes Claude's personality |
| `security-guidance` | Monitors and warns about insecure code patterns |

### Plugin Conventions

- **Commands** are pure Markdown files. YAML frontmatter specifies `allowed-tools`, `description`, and optionally dynamic context via `!`-prefixed bash commands (e.g., `` !`git status` ``).
- **Hooks** communicate via stdin/stdout JSON. Exit codes have semantic meaning:
  - `0` — allow the action
  - `1` — show stderr output to user only (log/warn)
  - `2` — block the action and show output to Claude
- Hook scripts use `${CLAUDE_PLUGIN_ROOT}` for portable absolute paths.
- **Skills** use `SKILL.md` with trigger phrases for progressive disclosure — the system only loads relevant skills based on keyword matching.
- **Agents** use YAML frontmatter with `name`, `description`, `model`, `color`, and `tools` fields.

### Installing a Plugin Locally

```bash
cc --plugin-dir /path/to/plugin
```

---

## Automation Scripts

All scripts are in `scripts/` and run with Bun:

| Script | Purpose | Trigger |
|---|---|---|
| `sweep.ts` | Marks stale issues; closes expired lifecycle-labeled issues | Twice daily (10:00, 22:00 UTC) |
| `auto-close-duplicates.ts` | Auto-closes confirmed duplicates after 3-day grace period | Daily (09:00 UTC) |
| `backfill-duplicate-comments.ts` | Retroactively runs duplicate detection on old issues | Manual `workflow_dispatch` |
| `issue-lifecycle.ts` | Shared lifecycle constants (labels, timeouts, messages) — **imported module** | N/A |
| `lifecycle-comment.ts` | Generates lifecycle nudge comment text — **imported module** | N/A |
| `comment-on-duplicates.sh` | Posts duplicate detection comments via GitHub API | Called by `dedupe.md` command |

### Running Scripts

```bash
bun run scripts/sweep.ts
bun run scripts/sweep.ts --dry-run          # Logs actions without making changes
bun run scripts/auto-close-duplicates.ts
```

Requires a `GITHUB_TOKEN` environment variable with appropriate repository permissions.

### Script Conventions

- Use native `fetch` API — no external HTTP libraries.
- Declare globals inline: `declare global { var process: { env: Record<string, string>; argv: string[] } }`.
- Use `#!/usr/bin/env bun` shebang.
- Paginate GitHub API with a safety limit: `if (page > 20) break`.
- Support `--dry-run` mode via `process.argv.includes("--dry-run")`.
- Single source of truth: shared constants live in `issue-lifecycle.ts` and are imported.

### Issue Lifecycle Labels and Timeouts

Defined in `scripts/issue-lifecycle.ts`:

| Label | Auto-close after |
|---|---|
| `invalid` | 3 days |
| `needs-repro` | 7 days |
| `needs-info` | 7 days |
| `stale` | 14 days |
| `autoclose` | 14 days |

Issues with ≥10 upvotes are protected from auto-close.

---

## CI/CD Workflows

All 12 workflows are in `.github/workflows/`. Key patterns:

### AI-Powered Workflows

| Workflow | Model | Purpose |
|---|---|---|
| `claude.yml` | `claude-sonnet-4-5-20250929` | Responds to `@claude` mentions in issues/PRs |
| `claude-issue-triage.yml` | `claude-opus-4-6` | Labels new issues with type, platform, and lifecycle labels |
| `oncall-triage.yml` | (via MCP GitHub server) | Labels blocking bugs for oncall attention every 6 hours |
| `claude-dedupe-issues.yml` | Claude | Finds and marks duplicate issues |

All Claude workflows use the `anthropics/claude-code-action@v1` action.

### Non-AI Workflows

| Workflow | Purpose |
|---|---|
| `sweep.yml` | Runs `scripts/sweep.ts` on schedule |
| `auto-close-duplicates.yml` | Runs `scripts/auto-close-duplicates.ts` daily |
| `lock-closed-issues.yml` | Locks closed issues on schedule |
| `log-issue-events.yml` | Logs issue activity |
| `remove-autoclose-label.yml` | Removes autoclose label when issue has new activity |
| `issue-opened-dispatch.yml` | Dispatches events for new issues |

### Workflow Conventions

- Permissions are minimal and scoped (e.g., `issues: write`, `contents: read`).
- Use `oven-sh/setup-bun@v2` for TypeScript script execution.
- Use `actions/checkout@v4` for repository access.
- Claude workflows restrict tools via `allowed_tools` configuration.

---

## DevContainer

The `.devcontainer/` setup provides a sandboxed development environment:

- **Base**: Node.js image with zsh shell and git-delta
- **User**: `node` (non-root)
- **Heap**: `NODE_OPTIONS=--max-old-space-size=4096`
- **Claude config**: Mounted at `/home/node/.claude` via volume
- **Firewall**: `init-firewall.sh` runs on container start (requires `NET_ADMIN`, `NET_RAW` capabilities)
- **VS Code extensions**: ESLint, Prettier, Remote Containers, GitLens

To start on Windows:
```powershell
.\Script\run_devcontainer_claude_code.ps1
```

---

## Python Hook Conventions

Python hooks in this repo follow strict conventions:

- **No external dependencies** — stdlib only (`json`, `re`, `sys`, `os`, `datetime`, `functools`).
- **stdin/stdout JSON protocol**: Read hook input from `sys.stdin`, write output to `sys.stdout`, errors to `sys.stderr`.
- **Exit codes**: `0` = allow, `1` = warn (user only), `2` = block.
- **Session state** stored in `~/.claude/<plugin>_state_<session_id>.json`.
- **Cleanup probability**: Use `random.random() < 0.10` for occasional cleanup of old state files to avoid per-call overhead.
- **LRU cache** compiled regex patterns: `@functools.lru_cache(maxsize=128)`.

### hookify Rule Engine

The `hookify` plugin provides a no-code rule system. Rules are defined in `.claude/hookify.*.local.md` files with YAML frontmatter. Supported operators:

| Operator | Description |
|---|---|
| `regex_match` | Match against a regex pattern |
| `contains` | Substring match |
| `equals` | Exact match |
| `not_contains` | Negative substring match |
| `starts_with` | Prefix match |
| `ends_with` | Suffix match |

---

## Security Patterns

The `security-guidance` plugin monitors these patterns in code edits:

- GitHub Actions expression injection (untrusted input in `${{ }}`)
- `child_process.exec` (Node.js command injection)
- `new Function(...)` (dynamic code execution)
- `eval(...)`
- `dangerouslySetInnerHTML`
- `document.write`
- `.innerHTML` assignment
- Python `pickle.loads` / `pickle.load`
- Python `os.system`

When contributing code, avoid these patterns or add explicit justification.

---

## Making Changes to This Repository

### Adding a New Plugin

1. Create `plugins/<plugin-name>/` following the standard structure above.
2. Add a `plugin.json` with `name`, `version`, `author`, `description`, and `tags`.
3. Register the plugin in `.claude-plugin/marketplace.json`.
4. Add a `README.md` to the plugin directory.
5. If adding hooks, ensure `hooks.json` uses regex tool matchers and `${CLAUDE_PLUGIN_ROOT}` for paths.

### Modifying Automation Scripts

1. Scripts run with Bun — no compilation needed, but maintain TypeScript types.
2. Always import shared constants from `issue-lifecycle.ts` rather than duplicating them.
3. Test with `--dry-run` before deploying changes.
4. Update the corresponding GitHub Actions workflow if the script interface changes.

### Updating Issue Lifecycle Rules

Edit `scripts/issue-lifecycle.ts` — all other scripts import from it. This is the single source of truth for label names, timeouts, and comment templates.

### Modifying GitHub Workflows

- Keep permissions minimal and scoped.
- Pin action versions (e.g., `@v4`, `@v2`).
- For Claude-powered workflows, prefer `claude-opus-4-6` for complex reasoning tasks and `claude-sonnet-4-5` for faster, simpler tasks.

---

## What This Repo Does NOT Contain

- The Claude Code CLI binary or its source code
- npm/Node.js package infrastructure (`package.json`, `node_modules`)
- A test suite (no Jest, Vitest, pytest, etc.)
- A build pipeline (no compilation, bundling, or transpilation)
- Backend API code

---

## Key Files Quick Reference

| File | Purpose |
|---|---|
| `README.md` | User-facing installation and overview docs |
| `CHANGELOG.md` | Release history (current version: 2.1.47+) |
| `SECURITY.md` | Security policy and reporting |
| `.claude-plugin/marketplace.json` | Plugin registry — update when adding plugins |
| `scripts/issue-lifecycle.ts` | Single source of truth for lifecycle constants |
| `examples/settings/README.md` | Settings hierarchy and configuration reference |
| `plugins/README.md` | Plugin catalog and development guide |
| `plugins/plugin-dev/` | Plugin development documentation and scaffolding |
| `plugins/hookify/` | User-configurable hook rule engine |
