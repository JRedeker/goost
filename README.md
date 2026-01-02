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
  A lightweight persistence mechanism for long-running AI agent tasks.<br>
  Solves the fundamental problem of LLM task completion: <strong>agents declaring "done" before work is actually complete.</strong>
</p>

<hr>

## 💥 The Problem

LLMs exhibit predictable failure modes in extended tasks. They get tired, they get lazy, or they just lose the plot.

| Failure Mode | Description |
|--------------|-------------|
| **🏁 Premature completion** | Declaring done at 70% because the last 30% is hard |
| **📉 Scope reduction** | Quietly dropping difficult requirements |
| **⛵ Goal drift** | Solving adjacent problems instead of the stated objective |
| **🎭 Completion theater** | Marking todos done without verification |

> Todo lists don't solve this because **the agent controls the todo list**. It can add, remove, or mark items complete without accountability.

## 🛡️ The Solution: Contracts

Goost introduces **immutable contracts** - success criteria that:

- ✅ **Are defined upfront** with user confirmation
- 🔒 **Cannot be modified** without explicit contract voiding
- 🔎 **Require verifiable evidence** before marking complete
- 🛑 **Block premature completion** declarations

---

## 🚀 Quick Start

Get up and running in seconds.

```bash
# 1. Clone the repo (if you haven't)
git clone https://github.com/JRedeker/goost.git ~/dev/oc-plugins/goost

# 2. Run the installer
cd ~/dev/oc-plugins/goost
./install.sh
```

Then add this to your `~/.config/opencode/opencode.json`:

```json
{
  "instructions": ["~/dev/oc-plugins/goost/goost_instructions.md"],
  "plugins": ["~/dev/oc-plugins/goost/plugin"]
}
```

<details>
<summary><strong>Manual Installation Options</strong> (Click to expand)</summary>

### 1. Copy Files Manually

**Slash Commands:**
```bash
cp .opencode/command/*.md ~/.config/opencode/command/
```

**Instructions:**
Add to `opencode.json`:
```json
{
  "instructions": ["/path/to/goost/goost_instructions.md"]
}
```

**Status Plugin:**
```bash
cd plugin && bun install
```
Add to `opencode.json`:
```json
{
  "plugins": ["/path/to/goost/plugin"]
}
```

### 2. Project-Level Installation

For per-project usage, just copy the `.opencode` directory:

```bash
cp -r goost/.opencode /path/to/your/project/
```
</details>

---

## 🎮 Usage

### Available Commands

| Command | Description | Confirmation |
|---------|-------------|--------------|
| `/contract` | Interactive contract creation with guided questions | Explicit |
| `/contract-quick <task>` | Quick contract inferred from task description | Explicit |
| `/openspec-prep <id>` | Add missing AC, scenarios, and tasks to spec | Implicit (contract) |
| `/openspec-apply <id>` | Implement an OpenSpec change under contract enforcement | Implicit (contract) |
| `/openspec-audit [scope]` | Project-wide audit: drift, orphans, conflicts | — |
| `/openspec-review <id>` | Post-implementation code review (correctness, security, architecture) | — |
| `/openspec-harden <id>` | Post-implementation hardening analysis | — |
| `/openspec-roadmap` | Display tiered progress dashboard | — |
| `/openspec-archive <id>` | Archive a completed OpenSpec change | — |
| `/openspec-proposal` | Create a new OpenSpec change proposal | — |

> **Migration Note**: `/openspec-review` was renamed to `/openspec-prep`. The new `/openspec-review` performs code review after implementation.

### Starting a Contract

Just type `/contract`. The agent will interview you to lock down the scope.

```text
User: /contract

Agent: Let's establish a contract.
       1. What does "done" look like in one sentence?
       ...
```

Or use `/contract-quick` for faster setup:

```text
User: /contract-quick Add JWT auth, don't break existing routes

Agent: Based on your request, here's a proposed contract:
       [CONTRACT ACTIVE block with inferred criteria]
       Does this capture your requirements? Say "confirm" to lock.
```

### The Contract Artifact

Once confirmed, the contract becomes the **law** of the session. It appears in the context and cannot be ignored.

```markdown
============================================================
                    CONTRACT ACTIVE
============================================================

OBJECTIVE: Add dark mode toggle to settings page.

SUCCESS CRITERIA:
- [x] Toggle component renders on settings page
- [x] Clicking toggle switches between light/dark themes
- [ ] Preference persists across page refreshes (localStorage)
- [ ] All existing tests pass

CONSTRAINTS:
- MUST NOT: Break existing light theme styles

============================================================
```

### 🛑 Completion Gate

You cannot say "Done!". The agent cannot say "Task complete!".
**Not until every box is checked.**

If the agent tries to exit early:
> "I can't declare this complete yet. The 'Persistence' criterion is still unchecked. Shall I implement that now?"

---

## 📊 Terminal Status

Goost lights up your Windows Terminal tab with real-time status.

### Status Icons

| Icon | State | Visual | Meaning |
|:----:|:------|:-------|:--------|
| 🚀 | **Working** | <img src="https://placehold.co/15x15/ED4245/ED4245.png" width="15" height="15"/> Red | Active work, launching agents |
| 🌕 | **Waiting** | <img src="https://placehold.co/15x15/5865F2/5865F2.png" width="15" height="15"/> Blue | Sub-agents running, awaiting results |
| 🌍 | **Ready** | <img src="https://placehold.co/15x15/57F287/57F287.png" width="15" height="15"/> Green | Complete or awaiting user input |
| 🔄 | **Stuck** | <img src="https://placehold.co/15x15/FFA500/FFA500.png" width="15" height="15"/> Orange | Doom Loop detected (retrying failed approach) |
| 🎤 | **Approval** | <img src="https://placehold.co/15x15/FF00FF/FF00FF.png" width="15" height="15"/> Magenta | **Needs user approval** (auto-detected) |

**Dynamic Title:**  
`🚀 projectname: Working [2/5]` — *Active, 2 of 5 criteria done*  
`🌕 projectname: Agent` — *Sub-agent running*  
`🎤 projectname: >>> APPROVAL NEEDED <<<` — *Shell permission required*

### Automatic Permission Detection

The plugin automatically detects when OpenCode requests permission for shell commands or other sensitive operations. When this happens:

- **Tab turns bright magenta** (highly visible)
- **Title shows `>>> APPROVAL NEEDED <<<`**
- **Returns to normal** after you approve or deny

This works through OpenCode's `permission.updated` and `permission.replied` events - no manual markers needed.

> **Note:** Requires `set -g allow-passthrough on` in your `.tmux.conf` if using tmux.

---

## 📋 OpenSpec Integration

Goost integrates with [OpenSpec](https://github.com/fission-ai/openspec) for change management and roadmap visibility.

### `/openspec-roadmap` Command

Display a tiered progress dashboard for all OpenSpec changes in your project:

```text
User: /openspec-roadmap

============================================================
                    PROJECT ROADMAP
============================================================

NOW (In Progress)
-----------------
  [████████░░] add-oauth-support (8/10 tasks)
    OAuth2 authentication flow

NEXT (Ready)
------------
  [░░░░░░░░░░] add-rate-limiting (0/5 tasks)
    API rate limiting

============================================================
Total: 2 items | 8/15 tasks (53%)
============================================================
```

**Features:**
- Works with OpenSpec changes out of the box (no config required)
- Optional `roadmap.yaml` for custom metadata and tiering
- Graceful fallback when OpenSpec CLI isn't available
- Progress bars with task completion counts

### OpenSpec Commands

| Command | Description |
|---------|-------------|
| `/openspec-prep <id>` | **Add missing AC, scenarios, and tasks** under contract enforcement |
| `/openspec-apply <id>` | Implement a change under contract enforcement (implicit approval) |
| `/openspec-audit [scope]` | **Project-wide audit** for spec/implementation drift, orphaned code, conflicts |
| `/openspec-review <id>` | **Post-implementation code review** for correctness, logic, security, architecture |
| `/openspec-harden <id>` | Post-implementation hardening with **comprehensive AI-slop detection** |
| `/openspec-archive <id>` | Archive a completed change |
| `/openspec-proposal` | Create a new change proposal |

**Recommended Workflow:**
```
/openspec-prep → /openspec-apply → /openspec-review → /openspec-harden → /openspec-archive
      ↑                 ↑                  ↑                    ↑
 Fill spec gaps    Implement code    Code correctness    Production ready
```

**Note:** Both `/openspec-prep` and `/openspec-apply` use **implicit approval** — invoking the command establishes a contract. The agent displays the contract for visibility but proceeds immediately.

### Project Audit (`/openspec-audit`)

The `/openspec-audit` command performs a **project-wide verification** that your codebase still matches its specifications. Run periodically to catch drift before it becomes technical debt.

```text
User: /openspec-audit

============================================================
               PROJECT AUDIT REPORT
============================================================

SCOPE: all
OVERALL HEALTH: DRIFT_DETECTED

SPECS AUDITED: 3 capabilities
REQUIREMENTS CHECKED: 15
SCENARIOS VERIFIED: 42

DRIFT SUMMARY
------------------------------------------------------------
Constraint Drift: 1 issue
Missing Implementation: 2 issues
Stale References: 1 issue

DETAILED FINDINGS
------------------------------------------------------------
## DRIFT: auth/1
### Requirement: Session Management
- **Spec**: "Sessions MUST expire after 30 minutes"
- **Code**: expiresIn: 3600000 // 60 minutes
- **Evidence**: src/auth/session.ts:23
- **Severity**: HIGH
- **Action**: Update code to match spec or update spec if 60 min is intentional
...
============================================================
```

**Analysis Phases:**

| Phase | What It Detects |
|-------|-----------------|
| **Spec Discovery** | Inventories all requirements and scenarios from `openspec/specs/` |
| **Implementation Mapping** | Maps specs to code files (explicit refs + inferred from names) |
| **Drift Detection** | Constraint violations, missing implementations, test-spec misalignment |
| **Orphan Detection** | Significant code modules without spec coverage |
| **Conflict Analysis** | Contradictory requirements, stale references, overlapping scope |

**Health Status:**
- **ALIGNED**: Zero HIGH findings, zero MUST/SHALL violations, 2 or fewer orphaned modules, zero unresolved conflicts
- **DRIFT_DETECTED**: Any HIGH severity drift OR 3+ orphaned modules OR any SHOULD violations OR stale references
- **MAJOR_DRIFT**: Any MUST/SHALL constraint violation OR contradictory requirements

**Scoped Audits:**
```text
User: /openspec-audit auth    # Audit only the auth capability
```

### AI-Slop Detection (`/openspec-harden`)

The `/openspec-harden` command includes **comprehensive AI-slop detection** based on academic research (arXiv 2024-2025) showing LLM-generated code has 63% more code smells than human-written code.

**Detection Categories:**

| Category | Patterns Detected |
|----------|-------------------|
| **Incomplete Implementations** | `pass` stubs, `NotImplementedError`, placeholder values, hardcoded IDs, incomplete refactors |
| **Exception Handling** | Silent `except: pass`, bare exception handlers, missing error handling, overly broad catches |
| **Lazy Typing** | Excessive `Any`, undocumented `**kwargs`, type safety bypasses (`as any`, `@ts-ignore`) |
| **Structural Smells** | God classes (>20 methods), long functions (>100 lines), deep nesting, magic numbers, duplicate code |
| **Documentation Issues** | Obvious comments, `# noqa` without explanation, stale TODOs, dead documentation |
| **Async/Concurrency** | Blocking in async, thread-unsafe singletons, missing `await`, sync I/O in async code |

**Severity Levels:**
- **BLOCKER**: Code will fail or has security implications
- **HIGH**: Significant quality issue requiring fix before merge  
- **MEDIUM**: Technical debt that should be addressed
- **LOW**: Minor style or preference issue

The command can optionally spawn sub-agents to automatically fix detected issues.

---

## 🤖 Sub-Agent Handling

When a contract is active and you spawn sub-agents, Goost provides guidance for:

- **Context Propagation**: Sub-agents SHOULD receive contract context (objective, criterion, constraints)
- **Failure Escalation**: 3 consecutive failures for the same criterion triggers doom loop
- **Conflict Resolution**: Contradictory results are flagged with `[?]` until resolved
- **Tight Scoping**: Prefer narrow tasks ("Search src/auth/") over broad ones ("Search entire codebase")

### Debug Logging

Enable `GOOST_DEBUG=1` to see sub-agent tracking:
```
[Goost] Sub-agent starting: Search for deprecated APIs (active: 1)
[Goost] Warning: Sub-agent prompt may lack contract context
[Goost] Sub-agent finished: Search for deprecated APIs (active: 0)
[Goost] Doom loop threshold reached for: Search for deprecated APIs
```

---

## 🏗️ Plugin Architecture

The Goost plugin follows a modular architecture for maintainability:

```
plugin/
├── index.ts       # Entry point, event dispatch, hook wiring
├── types.ts       # Types, constants, Zod schemas for validation
├── terminal.ts    # OSC escape sequences, tab color/title
└── contract.ts    # Contract parsing, state management
```

| Module | Responsibility |
|--------|----------------|
| **types.ts** | Type definitions, constants (STATUS_EMOJIS, TAB_COLORS, EVENT_TYPES), Zod schemas for runtime validation |
| **terminal.ts** | OSC escape sequence handling, tmux passthrough, tab color/title updates |
| **contract.ts** | Contract parsing, state factory functions, status detection, preservation context |
| **index.ts** | Plugin initialization, event handler dispatch map, hook implementations |

### Key Design Decisions

- **Runtime Validation**: Uses Zod schemas to validate SDK event properties before processing
- **Immutable State Updates**: State changes return new objects rather than mutating
- **Event Dispatch Map**: Clean separation of event handlers by type
- **Factory Functions**: Consistent state initialization via `createInitialState()`, `createEmptyContract()`, etc.

---

## 🧠 Design Philosophy

| Feature | Todo Lists | Goost Contracts |
|:--------|:-----------|:----------------|
| **Scope Control** | Mutable (Agent) | **Immutable (User)** |
| **Trust Model** | "Trust me" | **"Verify me"** |
| **Visibility** | Buried in logs | **Front & Center** |
| **Completion** | Subjective | **Objective** |

## 💡 Tips for Success

- **Be Specific:** "No ESLint errors" is better than "Code is clean".
- **Keep it Tight:** 3-5 criteria is the sweet spot.
- **Use Checkpoints:** For tasks >30 mins, break it into phases.

## ⚖️ License

MIT © [JRedeker](https://github.com/JRedeker)

<p align="center">
  <sub><strong>Goost</strong> = <strong>Go</strong>al B<strong>oost</strong> — Because sometimes you need a boost to finish the job.</sub>
</p>
