<p align="center">
  <img src="assets/goost-logo.svg" alt="Goost Logo" width="128" height="128">
</p>

<h1 align="center">Goost</h1>

<p align="center">
  <strong>Contract-Based Persistence for OpenCode</strong>
</p>

<p align="center">
  <a href="https://opencode.ai"><img src="https://img.shields.io/badge/OpenCode-Plugin-7C3AED?style=for-the-badge&logo=code&logoColor=white" alt="OpenCode Plugin"></a>
  <a href="#"><img src="https://img.shields.io/badge/Status-Stable-22c55e?style=for-the-badge" alt="Status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License"></a>
</p>

<p align="center">
  Stop AI agents from declaring "done" when they're only 70% finished.<br>
  <strong>Goost enforces immutable contracts with verifiable success criteria.</strong>
</p>

---

## Why Goost?

AI coding agents have predictable failure modes:

| Problem | What Happens |
|---------|--------------|
| **Premature completion** | Agent declares "done" because the remaining 30% is hard |
| **Scope reduction** | Requirements quietly get dropped mid-task |
| **Goal drift** | Agent solves adjacent problems instead of yours |
| **Completion theater** | Todos marked complete without verification |

**Todo lists don't fix this** - the agent controls the todo list. It can mark items done whenever it wants.

**Contracts fix this.** Goost introduces immutable success criteria that:
- Are defined upfront with your confirmation
- Cannot be modified without explicit voiding
- Require evidence before marking complete
- Block premature "I'm done!" declarations

---

## What's Included

Goost is an OpenCode plugin that adds:

| Feature | Description |
|---------|-------------|
| **Contract System** | Immutable success criteria with verification gates |
| **19 Slash Commands** | Planning, implementation, review, and quality tools |
| **OpenSpec Integration** | Full spec-driven development workflow |
| **Terminal Status** | Real-time progress in your terminal tab |
| **Loop Detection** | Auto-terminates runaway responses |
| **AI Slop Scanner** | Catches common AI code quality issues |

(screenshot)

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/JRedeker/goost.git ~/dev/oc-plugins/goost
```

### 2. Install with AI Assistance (Recommended)

The easiest way - let your agent handle it:

```bash
cd ~/dev/oc-plugins/goost
opencode
```

Then ask: **"Install Goost for me"**

The agent will read [INSTALL.md](./INSTALL.md) and configure everything automatically.

### 3. Or Run the Install Script

```bash
cd ~/dev/oc-plugins/goost
./install.sh
```

This handles dependencies, configuration, and tmux setup.

### 4. Verify Installation

Restart OpenCode and type `/contract`. If you see the contract interview, you're ready.

(screenshot)

---

## Commands at a Glance

### Core Contracts

| Command | Purpose |
|---------|---------|
| `/contract` | Full contract with guided interview |
| `/contract-quick <task>` | Fast contract from description |

### OpenSpec Planning

| Command | Purpose |
|---------|---------|
| `/openspec-proposal` | Create a change proposal |
| `/openspec-clarify` | Socratic questions for requirements |
| `/openspec-research` | Validate architecture with docs/web |
| `/openspec-prep` | Pre-implementation preparation |
| `/openspec-refactor` | Refresh stale change proposals via Bidirectional Reconciliation |
| `/openspec-status` | Fast overview of OpenSpec project state |
| `/openspec-roadmap` | Visual progress dashboard |

### Implementation & Quality

| Command | Purpose |
|---------|---------|
| `/openspec-apply` | Implement under contract enforcement |
| `/openspec-ralph` | Implement with autonomous retry (walk-away) |
| `/openspec-review` | Post-implementation code review |
| `/openspec-harden` | Production-readiness analysis |
| `/openspec-audit` | Detect spec/code drift |
| `/openspec-coordinate` | Multi-agent synchronization |
| `/openspec-archive` | Archive completed changes |

### Code Quality

| Command | Purpose |
|---------|---------|
| `/goost-slop-scan` | Scan for AI code smell patterns |
| `/goost-improve` | Find architectural improvements |
| `/goost-search` | Search curated prompt libraries |

---

## How Contracts Work

### Starting a Contract

Type `/contract` and answer a few questions:

```
User: /contract

Agent: Let's establish a contract.
       1. What does "done" look like in one sentence?
       2. What are the specific success criteria?
       3. What constraints must I follow?
```

Or use `/contract-quick` for speed:

```
User: /contract-quick Add JWT auth without breaking existing routes

Agent: Here's a proposed contract:
       [Shows criteria derived from your request]
       Say "confirm" to lock this contract.
```

### The Locked Contract

Once confirmed, the contract appears in every response:

```
============================================================
                    CONTRACT ACTIVE
============================================================

OBJECTIVE: Add JWT authentication to the API

SUCCESS CRITERIA:
- [x] (C1) JWT middleware validates tokens on protected routes
- [x] (C2) Invalid tokens return 401 with error message
- [ ] (C3) Tokens expire after 24 hours
- [ ] (C4) All existing tests still pass

CONSTRAINTS:
- MUST NOT: Break existing session-based auth
- MUST: Use RS256 algorithm

============================================================
```

### The Completion Gate

The agent **cannot** declare "done" until every criterion shows `[x]`.

If it tries:
> "I can't complete yet - criterion C3 (token expiration) is still unchecked. Want me to implement that now?"

### Changing Scope

Need to modify the contract? Only you can do that:

1. Say "void contract" or "modify the criteria"
2. Agent shows progress summary
3. Create a new contract with updated scope

---

## Terminal Status Indicators

Goost updates your terminal tab with real-time status:

| Icon | State | Meaning |
|:----:|:------|:--------|
| 🚀 | Working | Active work in progress |
| 🌕 | Waiting | Sub-agents running |
| 🌍 | Ready | Awaiting your input |
| 🔄 | Stuck | Loop detected - needs direction |
| 🎤 | Approval | Permission required |

**Tab title example:**
```
🚀 myproject: Working [2/5]
```

(screenshot)

### tmux Users

Add to `~/.tmux.conf`:

```bash
set -g allow-passthrough on
set -g escape-time 0
```

Then reload: `tmux source-file ~/.tmux.conf`

---

## OpenSpec Workflow

For larger features, use the full spec-driven workflow:

```
Planning                    Implementation              Quality
────────                    ──────────────              ───────
/openspec-proposal    →     /openspec-apply      →     /openspec-review
/openspec-clarify     →                          →     /openspec-harden
/openspec-research    →                          →     /openspec-audit
/openspec-prep        →                          →     /openspec-archive
```

### Quick Reference

| I want to... | Use |
|--------------|-----|
| Plan a new feature | `/openspec-proposal` |
| Clarify requirements | `/openspec-clarify` |
| Validate my architecture | `/openspec-research` |
| Fill spec gaps | `/openspec-prep` |
| Implement with enforcement | `/openspec-apply` |
| Review my code | `/openspec-review` |
| Check production-readiness | `/openspec-harden` |
| Find spec/code drift | `/openspec-audit` |
| See project progress | `/openspec-roadmap` |
| Complete and archive | `/openspec-archive` |

### When to Use Which

| Situation | Command |
|-----------|---------|
| OpenSpec change with full spec | `/openspec-apply` |
| Ad-hoc task, needs clear criteria | `/contract` |
| Simple task, obvious completion | `/contract-quick` |
| Just asking questions | No contract needed |

---

## Code Quality Tools

### AI Slop Scanner

Catch common AI code quality issues:

```bash
/goost-slop-scan              # Full scan
/goost-slop-scan src/         # Scan specific directory
/goost-slop-scan --phase 1    # Fast regex-based only
```

**What it catches:**

| Category | Examples |
|----------|----------|
| Incomplete code | `pass` stubs, `NotImplementedError`, TODOs |
| Exception handling | Silent `except: pass`, overly broad catches |
| Type evasion | Excessive `Any`, `as any`, `@ts-ignore` |
| Structural issues | God classes, deep nesting, magic numbers |

(screenshot)

### Architectural Improvements

Find opportunities to strengthen your codebase:

```bash
/goost-improve
```

Returns evidence-based findings with search suggestions:

```
[CRITICAL] Input Validation Gap
  Category: Security
  Evidence: src/routes/users.ts:45
  -> /goost-search zod typescript API validation
```

### Prompt Discovery

Search curated prompt libraries:

```bash
/goost-search code review
/goost-search typescript debugging
```

All prompts go through security scanning and contract conversion.

---

## Loop Detection

Goost protects against two types of loops:

### Response-Level Loops

Auto-terminates responses with repetitive content (common with some models):
- Triggers when response > 20K characters
- AND any 80+ character substring repeats 3+ times

### Planning Loops

Multi-phase commands include anti-loop protections:
- Explicit state markers (`>>> SYNTHESIS COMPLETE <<<`)
- Required tool calls after synthesis phases
- Word limits before requiring action

When a loop is detected, the tab turns orange (🔄) and the agent asks for direction.

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOST_DEBUG` | `0` | Enable debug logging |
| `GOOST_ANOMALY_SIZE` | `20000` | Loop detection threshold |
| `GOOST_ANOMALY_BELL` | `1` | Terminal bell on loop |

### Debug Mode

```bash
GOOST_DEBUG=1 opencode
```

Check logs at `/tmp/goost-debug.log`.

---

## Terminal Compatibility

| Terminal | Tab Titles | Notes |
|----------|------------|-------|
| Windows Terminal | Full support | Best experience |
| iTerm2 | Full support | Works great |
| Ghostty/Kitty | Full support | Works great |
| tmux | Full support | Needs `allow-passthrough on` |

---

## Manual Installation

<details>
<summary>Click to expand manual steps</summary>

### 1. Install Dependencies

```bash
cd ~/dev/oc-plugins/goost/plugin
npm install
npm run check
```

### 2. Configure opencode.json

Add to `~/.config/opencode/opencode.json`:

```json
{
  "instructions": ["/full/path/to/goost/goost_instructions.md"],
  "plugins": ["/full/path/to/goost/plugin"]
}
```

Use absolute paths (not `~`).

### 3. Install Slash Commands

```bash
mkdir -p ~/.config/opencode/command
cp ~/dev/oc-plugins/goost/.opencode/command/*.md ~/.config/opencode/command/
```

### 4. Install Rules

```bash
mkdir -p ~/.config/opencode/rules
cp ~/dev/oc-plugins/goost/.opencode/rules/*.md ~/.config/opencode/rules/
```

</details>

---

## Why "Goost"?

**Goose** + **Boost** = **Goost**

It's a turbo-charged goose that keeps your AI agents honest.

---

## License

MIT - [JRedeker](https://github.com/JRedeker)

<p align="center">
  <sub>Built with care and a commitment to getting things actually done.</sub>
</p>
