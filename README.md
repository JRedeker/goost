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

### Recommended: AI-Assisted Installation

The easiest way to install Goost is to ask your AI agent to do it:

```bash
# 1. Clone the repo
git clone https://github.com/JRedeker/goost.git ~/dev/oc-plugins/goost

# 2. Start OpenCode in the Goost directory
cd ~/dev/oc-plugins/goost
opencode

# 3. Ask the agent to install Goost
> "Install Goost for me"
```

The agent will find [INSTALL.md](./INSTALL.md) and follow the installation steps, including:
- Installing plugin dependencies
- Updating your `opencode.json` automatically  
- Configuring tmux passthrough if needed
- Verifying the installation

### Alternative: Script Installation

For automated/CI environments, use the install script:

```bash
cd ~/dev/oc-plugins/goost
./install.sh
```

Then manually add to `~/.config/opencode/opencode.json`:

```json
{
  "instructions": ["/full/path/to/goost/goost_instructions.md"],
  "plugins": ["/full/path/to/goost/plugin"]
}
```

> **Note:** Use absolute paths (not `~`) in opencode.json.

<details>
<summary><strong>Manual Installation Options</strong> (Click to expand)</summary>

### 1. Minimal Setup (Instructions + Plugin Only)

Install dependencies:
```bash
cd ~/dev/oc-plugins/goost/plugin && npm install
```

Add to `~/.config/opencode/opencode.json`:
```json
{
  "instructions": ["/path/to/goost/goost_instructions.md"],
  "plugins": ["/path/to/goost/plugin"]
}
```

### 2. Global Slash Commands

Copy commands to make them available in all projects:
```bash
mkdir -p ~/.config/opencode/command
cp ~/dev/oc-plugins/goost/.opencode/command/*.md ~/.config/opencode/command/
```

### 3. Project-Level Only

For per-project usage without global installation:
```bash
cp -r ~/dev/oc-plugins/goost/.opencode /path/to/your/project/
```

### 4. tmux Users

Add to `~/.tmux.conf` for full Goost support:
```bash
# Allow escape sequences to pass through to terminal (for tab colors/titles)
set -g allow-passthrough on

# Pass ESC key immediately without delay (fixes Ctrl+C and vim mode delays)
set -g escape-time 0
```

Then reload: `tmux source-file ~/.tmux.conf`

**Recommended: Shell wrapper for crash isolation**

Add to `~/.zshrc` or `~/.bashrc`:
```bash
# Wrap opencode in tmux for crash isolation
oc() {
  local session_name="oc-$(date +%s)-$$"
  if command -v tmux &>/dev/null; then
    tmux new-session -d -s "$session_name" opencode "$@"
    tmux attach-session -t "$session_name"
  else
    command opencode "$@"
  fi
}

# List/kill opencode sessions
oc-list() { tmux ls 2>/dev/null | grep "^oc-" || echo "No sessions"; }
oc-killall() { tmux ls 2>/dev/null | grep "^oc-" | cut -d: -f1 | xargs -r -n1 tmux kill-session -t; }
```

Then just run `oc` instead of `opencode`. Benefits:
- Crash isolation (opencode crash won't kill your terminal)
- Session persistence (detach with `Ctrl+B D`, reattach later)
- Proper tab title/color support

</details>

### Terminal Compatibility

| Terminal | Tab Colors | Tab Titles |
|----------|------------|------------|
| Windows Terminal | Full support | Full support |
| iTerm2 | No | Full support |
| Ghostty/Kitty/Alacritty | Varies | Full support |
| tmux | Requires passthrough | Full support |

> Tab colors are visual enhancements. Core contract enforcement works in any terminal.

---

## 🗺️ Workflow

Goost integrates with [OpenSpec](https://github.com/fission-ai/openspec) to provide a complete spec-driven development workflow. Here's the recommended flow from planning to completion:

### Command Overview

| Category | Command | Purpose |
|----------|---------|---------|
| **Contract** | `/contract` | Establish formal contract with success criteria |
| | `/contract-quick` | Quick contract for simpler tasks |
| **Planning** | `/openspec-proposal` | Create new change proposal (design phase) |
| | `/openspec-clarify` | Socratic questions for acceptance criteria |
| | `/openspec-research` | Research and validate architectural decisions; identify simpler alternatives |
| | `/openspec-prep` | Pre-implementation gap analysis |
| | `/openspec-coordinate` | Cross-agent synchronization and conflict detection |
| | `/openspec-status` | Fast overview of project state |
| | `/openspec-roadmap` | Tiered progress dashboard |
| **Implementation** | `/openspec-apply` | Implement change under contract enforcement |
| **Quality** | `/openspec-review` | Post-implementation code review |
| | `/openspec-harden` | Production-readiness analysis |
| | `/openspec-audit` | Project-wide drift detection |
| | `/goost-slop-scan` | Scan for AI-generated code quality issues |
| | `/goost-improve` | Analyze codebase for architectural improvement opportunities |
| **Completion** | `/openspec-archive` | Archive completed change |

### OpenSpec CLI Commands

```bash
openspec list              # List active changes
openspec list --specs      # List specifications  
openspec show <item>       # View change or spec details
openspec validate <id>     # Validate (use --strict)
openspec archive <id>      # Archive completed change
```

### Recommended Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PLANNING PHASE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. /openspec-status          Quick project overview                 │
│         ↓                                                            │
│  2. /openspec-proposal        Create change proposal                 │
│         ↓                     (proposal.md, tasks.md, spec deltas)   │
│  3. /openspec-clarify <id>    Socratic questions for requirements    │
│         ↓                     (optional but recommended)             │
│  4. /openspec-research <id>   Validate architectural decisions       │
│         ↓                     (optional, uses Context7 + web search) │
│  5. openspec validate --strict  Validate structure                   │
│         ↓                                                            │
│  6. /openspec-prep <id>       Fill gaps in AC, scenarios, tasks      │
│         ↓                                                            │
│  7. [USER APPROVAL]           Review and approve proposal            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      IMPLEMENTATION PHASE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  8. /openspec-apply <id>      Implement under contract enforcement   │
│         │                     (tab shows change name while working)  │
│         │                                                            │
│         ├── Reads proposal.md, tasks.md, design.md                   │
│         ├── Creates CONTRACT from acceptance criteria                │
│         ├── Works through tasks sequentially                         │
│         ├── Shows CONTRACT STATUS in every response                  │
│         └── Commits on CONTRACT FULFILLED                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         QUALITY PHASE                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  7. /openspec-review <id>     Code review (correctness, security)    │
│         ↓                                                            │
│  8. /openspec-harden <id>     Production-readiness check             │
│         ↓                     (error handling, logging, edge cases)  │
│  9. [TESTS & CI]              Run tests, verify build                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        COMPLETION PHASE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  10. [DEPLOY]                 Ship to production                     │
│         ↓                                                            │
│  11. /openspec-archive <id>   Move to archive, update main specs     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### When to Use Planning Commands

| Command | When to Use | Why |
|---------|------------|-----|
| `/openspec-clarify` | Right after `/openspec-proposal` or after `/openspec-prep` | Uses Socratic questioning to uncover hidden assumptions, edge cases, and ambiguities in requirements before implementation |
| `/openspec-research` | After `/openspec-proposal`, before `/openspec-prep` | Validates architectural decisions using Context7 docs and web research; actively searches for simpler alternatives; findings are automatically incorporated into proposal/design/tasks |

#### Optimal Planning Flow

For complex changes with architectural decisions:
```
/openspec-proposal → /openspec-clarify → /openspec-research → /openspec-prep
```

For simpler changes:
```
/openspec-proposal → /openspec-prep
```

**Why research before prep?**
- Research validates the proposed architecture against best practices
- **Actively identifies simpler alternatives** that meet the same acceptance criteria
- Findings update the design.md and spec deltas automatically  
- Prep can then use validated patterns when filling gaps
- Prevents building implementation details on flawed or over-engineered foundations
- Questions complexity and recommends boring, proven solutions

**Why clarify early?**
- Surfaces requirement ambiguities before detailed planning
- Cheaper to fix assumptions now than during implementation
- Can run again after prep if gaps remain unclear

---

### Quick Reference

| I want to... | Use |
|--------------|-----|
| See what's in progress | `/openspec-status` or `openspec list` |
| Plan a new feature | `/openspec-proposal` |
| Check spec completeness | `/openspec-prep <id>` |
| Implement an approved change | `/openspec-apply <id>` |
| Do a simple task without OpenSpec | `/contract` or `/contract-quick` |
| Review code after implementation | `/openspec-review <id>` |
| Check production-readiness | `/openspec-harden <id>` |
| Find spec/code drift | `/openspec-audit` |
| See progress dashboard | `/openspec-roadmap` |
| Finish and archive | `/openspec-archive <id>` |

### When to Use Which Contract Command

| Situation | Command |
|-----------|---------|
| OpenSpec change with full spec | `/openspec-apply <id>` (contract auto-derived) |
| Ad-hoc task, needs clear criteria | `/contract` (full negotiation) |
| Simple task, obvious completion | `/contract-quick` (minimal overhead) |
| Just exploring/asking questions | No contract needed |

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

> **Note:** Requires `set -g allow-passthrough on` and `set -g escape-time 0` in your `.tmux.conf` if using tmux.

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

### Slop Scan (`/goost-slop-scan`)

The `/goost-slop-scan` command scans your codebase for AI-generated code quality issues ("slop") using patterns defined in `slop-smells.yaml`.

```text
User: /goost-slop-scan

============================================================
              SLOP SCAN REPORT
============================================================

SCAN SCOPE: 142 files in .
PHASE 1: 8 findings | PHASE 2: 12 findings

SUMMARY BY SEVERITY
------------------------------------------------------------
CRITICAL: 1 | HIGH: 5 | MEDIUM: 10 | LOW: 4

CRITICAL FINDINGS
------------------------------------------------------------
[QUAL-003] security_blindness
  src/api/auth.ts:42
  SQL query built with string concatenation
  FIX: Use parameterized queries or an ORM

HIGH FINDINGS
------------------------------------------------------------
[AI-007] type_evasion
  src/utils/parser.ts:89
  Excessive use of 'as any' bypassing type safety
  FIX: Define proper types or use type guards
...
============================================================
```

**Two-Phase Detection:**

| Phase | Type | What It Detects |
|-------|------|-----------------|
| **Phase 1** | Automatable | Debug artifacts, type evasion, TODO/FIXME, empty catch blocks, hardcoded paths, AI signatures |
| **Phase 2** | Heuristic | Happy path only, confident incorrectness, context amnesia, premature abstraction, missing corners |

**Command Options:**

| Flag | Description |
|------|-------------|
| `--phase 1` | Run Phase 1 only (fast, regex-based) |
| `--phase 2` | Run Phase 2 only (AI heuristic) |
| `--json` | Output in JSON format |
| `--verbose` | Show detailed scan progress |
| `--timeout N` | Sub-agent timeout in seconds (default: 120) |
| `--include-untracked` | Include untracked git files |
| `<path>` | Limit scan to specific directory |

**Examples:**
```bash
/goost-slop-scan                      # Full scan
/goost-slop-scan src/                 # Scan only src/
/goost-slop-scan --phase 1            # Fast automatable patterns only
/goost-slop-scan --phase 2            # Heuristic analysis only
/goost-slop-scan --json               # Machine-readable output
/goost-slop-scan --verbose --timeout 300  # Verbose with longer timeout
```

**Workflow Recommendation:**
1. Run `--phase 1` to catch obvious issues quickly
2. Fix Phase 1 findings
3. Run `--phase 2` for deeper heuristic analysis (less noise after Phase 1 fixes)

### Architectural Improvement (`/goost-improve`)

The `/goost-improve` command analyzes your codebase for architectural improvement opportunities and generates actionable `/goost-search` suggestions.

```text
User: /goost-improve

IMPROVEMENT OPPORTUNITIES
------------------------------------------------------------
Based on codebase analysis, the following improvements could
strengthen this project. Run the suggested searches to find
current best practices and solutions.

[CRITICAL] Input Validation Gap
  Category: Security
  Observation: API endpoints accept request bodies without
               schema validation. Direct property access on req.body.
  Evidence: src/routes/users.ts:45, src/routes/orders.ts:23
  Impact: Risk of malformed data causing errors or exploits.
  -> /goost-search zod vs yup vs joi typescript API validation 2024

[HIGH] No Error Recovery Patterns
  Category: Reliability
  Observation: External service calls have no retry logic or
               circuit breakers. Single failures will cascade.
  Evidence: Searched src/services/*.ts - direct await without try/catch
  Impact: System instability under partial failures.
  -> /goost-search nodejs retry circuit breaker resilience patterns
------------------------------------------------------------
```

**Core Analysis Categories:**

| Category | What It Checks |
|----------|----------------|
| **Security** | Input validation, auth, secrets, vulnerability patterns |
| **Reliability** | Error handling, retries, circuit breakers, graceful degradation |
| **Testing** | Coverage, isolation, speed, test depth |
| **Observability** | Logging, error tracking, metrics, debugging |
| **Developer Experience** | Docs, setup, contribution guidelines |

**Key Features:**
- **Evidence-based findings**: Every finding must cite specific files or search patterns
- **Hybrid queries**: Search suggestions include tool names + context for better results
- **Simple severity**: Critical/High/Medium/Low (matches `/goost-slop-scan`)
- **7-10 finding limit**: Focus on highest-impact improvements

**Workflow Recommendation:**
1. Run `/goost-improve` to identify architectural gaps
2. Use the generated `/goost-search` queries to research solutions
3. Create an `/openspec-proposal` for significant improvements

---

## 🤖 Sub-Agent Handling

When a contract is active and you spawn sub-agents, Goost provides guidance for:

- **Context Propagation**: Sub-agents SHOULD receive contract context (objective, criterion, constraints)
- **Failure Escalation**: 3 consecutive failures for the same criterion triggers doom loop
- **Conflict Resolution**: Contradictory results are flagged with `[?]` until resolved
- **Tight Scoping**: Prefer narrow tasks ("Search src/auth/") over broad ones ("Search entire codebase")

---

## 🔄 Loop Detection & Prevention

Goost provides two layers of loop protection:

### Response-Level: Loop Anomaly Detection

Goost automatically detects and terminates **runaway AI responses** containing repetitive content. This catches generation-level failures where models output the same phrase repeatedly (common with Gemini and other models).

Detection triggers when BOTH conditions are met:
1. Response exceeds **20,000 characters**
2. Any **80+ character substring** appears **3 or more times**

### Command-Level: Anti-Loop Protocol

Multi-phase commands with sub-agent orchestration include **anti-loop protections** to prevent planning loops during phase transitions. These occur when the model gets stuck repeating planning statements instead of emitting tool calls.

**Protected Commands:**
- `/openspec-prep` - SYNTHESIS COMPLETE marker + immediate tool call + sequential gap processing
- `/openspec-apply` - Immediate tool call after contract display
- `/openspec-research` - Synthesis marker after sub-agent completion
- `/openspec-audit`, `/openspec-harden`, `/openspec-review` - Direct aggregation after sub-agents
- `/openspec-coordinate`, `/goost-slop-scan` - Direct report/aggregation

**How It Works:**
1. Explicit state transition markers (e.g., `>>> SYNTHESIS COMPLETE <<<`)
2. Requirement to emit tool calls immediately after synthesis
3. Warnings against re-stating plans in prose
4. Word limits before requiring tool calls (500 words in some commands)

See `slop-smells.yaml` entry `AI-011: planning_loop` for the full pattern documentation.

When detected:
- Plugin calls `client.session.abort()` to terminate the response
- Status changes to `doom_loop` (🔄 orange tab)
- Terminal bell sounds (if enabled)
- Debug logs record the repeated substring

### Configuration

Set environment variables before starting OpenCode:

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOST_ANOMALY_SIZE` | `20000` | Size threshold in characters |
| `GOOST_ANOMALY_BELL` | `1` | Enable terminal bell (`1`) or disable (`0`) |

```bash
# Example: Higher threshold, no bell
GOOST_ANOMALY_SIZE=30000 GOOST_ANOMALY_BELL=0 opencode
```

### Safety Features

- **State-based throttle**: Only one abort per response
- **Tool execution protection**: Won't abort during tool execution
- **Automatic reset**: Throttle resets when new response starts

---

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

- Define concrete, measurable success criteria
- Include verification steps in your criteria
- Use `/contract-quick` for simple tasks, `/contract` for complex ones
- Void and restart if you realize the objective was wrong

## 🦆 Why "Goost"?

¯\\\_(ツ)\_/¯

**Goose** + **Boost** = **Goost**

It's a turbo-charged goose that keeps your AI agents honest and on task. Or something like that.

## ⚖️ License

MIT © [JRedeker](https://github.com/JRedeker)

<p align="center">
  <sub>Built with ❤️ and a bit of confusion about the name.</sub>
</p>
