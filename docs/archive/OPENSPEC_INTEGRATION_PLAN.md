# Goost + OpenSpec Integration Plan

## Option A: Full Absorption of OpenSpec Extended into Goost

This document outlines the complete integration of all OpenSpec Extended commands into Goost, establishing OpenSpec as a core dependency and creating a unified contract-based workflow for spec-driven development.

---

## Executive Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Goost scope** | General task contracts | Contracts + OpenSpec-aware orchestration |
| **OpenSpec Extended** | Standalone plugin | Absorbed into Goost |
| **Dependencies** | None | OpenSpec CLI (required), Context7 MCP (recommended) |
| **Commands** | `/contract`, `/contract-quick` | + `/openspec-apply`, `/openspec-contract`, `/openspec-review`, `/openspec-poc`, `/openspec-status` |
| **Tracking** | Goost status blocks | Unified contract + OpenSpec task tracking |

---

## Phase 1: Foundation (Dependency & Structure)

### 1.1 Establish OpenSpec as Dependency

**Update documentation to reflect OpenSpec requirement:**

```markdown
## Dependencies

### Required
- **OpenSpec CLI**: `npm install -g @fission-ai/openspec`
  - Required for `/openspec-*` commands
  - Provides `openspec list`, `openspec show`, `openspec validate`

### Recommended  
- **Context7 MCP**: For documentation lookup during review/POC
  - Tools: `resolve-library-id`, `get-library-docs`
  - Enables best-practice research
```

**Add detection in plugin:**

```typescript
// plugin/index.ts additions

interface OpenSpecState {
  detected: boolean
  activeChanges: string[]
  lastCheck: number
}

let openspec: OpenSpecState = {
  detected: false,
  activeChanges: [],
  lastCheck: 0
}

// Check for OpenSpec in project on session start
const detectOpenSpec = async (): Promise<boolean> => {
  // Check for openspec/ directory or openspec.yaml
  // Cache result to avoid repeated checks
}
```

### 1.2 New Directory Structure

```
goost/
├── .opencode/
│   ├── command/
│   │   ├── contract.md              # Existing
│   │   ├── contract-quick.md        # Existing
│   │   ├── openspec-apply.md         # NEW: Apply change with auto-contract
│   │   ├── openspec-contract.md      # NEW: Contract from OpenSpec change
│   │   ├── openspec-review.md        # NEW: Absorbed from openspec-review
│   │   ├── openspec-poc.md           # NEW: Absorbed from openspec-poc
│   │   └── openspec-status.md        # NEW: Absorbed from openspec-status
│   ├── rules/
│   │   └── status-indicator.md      # Existing
│   ├── package.json
│   └── bun.lock
├── plugin/
│   └── index.ts                     # Enhanced with OpenSpec awareness
├── goost_instructions.md            # Updated with OpenSpec sections
├── README.md                        # Updated installation/usage
├── CLAUDE.md
└── OPENSPEC_INTEGRATION_PLAN.md     # This file
```

### 1.3 Updated goost_instructions.md Structure

Add new sections to the instructions:

```markdown
## OpenSpec Integration

When working in a project with OpenSpec initialized (`openspec/` directory exists):

### Auto-Detection
- On session start, check for `openspec/` directory
- If found, run `openspec list` to identify active changes
- Suggest relevant commands based on context

### Contract-OpenSpec Linkage
When a contract is active AND an OpenSpec change is being worked:
- Contract criteria can map to OpenSpec acceptance criteria
- Status blocks show both contract progress AND task completion
- `/openspec-status` reconciles both systems
```

---

## Phase 2: Command Absorption

### 2.1 `/openspec-review` (from openspec-extended)

**Purpose:** Deep validation of an OpenSpec change with research, acceptance criteria, and TDD verification.

**File:** `.opencode/command/openspec-review.md`

**Key Changes from Original:**
1. Add Goost status markers (`[GOOST:ROCKET]`, etc.)
2. Check for active contracts and relate findings to criteria
3. Suggest `/openspec-contract` if change is complex
4. Use unified evidence format

```markdown
---
name: openspec-review
description: Deep review of an OpenSpec change with research and validation
agent: general
---

# /openspec-review - OpenSpec Change Review

[GOOST:ROCKET]

You are performing a **deep review** of the OpenSpec change: `$ARGUMENTS`

## Pre-Review Check

1. Check if a Goost contract is currently active
   - If YES: Note which contract criteria relate to this review
   - If NO: Consider suggesting `/openspec-contract $ARGUMENTS` after review

2. Verify OpenSpec is available: `openspec list`
   - If command fails, inform user to install: `npm install -g @fission-ai/openspec`

## Review Framework

Track ALL review steps as TODOs. Be **methodical and thorough**.

### Phase 1: Spec Discovery & Context
1. **Locate the spec**: Read `openspec/changes/$ARGUMENTS/proposal.md`, `design.md`, `tasks.md`
2. **Read capability specs**: Check `openspec/changes/$ARGUMENTS/specs/*/spec.md`
3. **Review project context**: Read `openspec/project.md`
4. **Check current state**: Run `openspec show $ARGUMENTS --json`

### Phase 2: Documentation Research (Context7)
For EVERY library/framework/technology mentioned:
1. Use `resolve-library-id` to find Context7 library ID
2. Use `get-library-docs` to fetch current documentation
3. **Verify version compatibility** with project requirements
4. **Check for breaking changes** in recent versions
5. **Validate API patterns** match documented best practices

Document findings:
```
| Technology | Version | Context7 ID | Verified | Notes |
|------------|---------|-------------|----------|-------|
| [lib] | X.Y.Z | /org/lib | [yes/no] | [findings] |
```

### Phase 3: Acceptance Criteria Validation
For each requirement in the spec:
- [ ] Has clear, testable success criteria
- [ ] Has at least one `#### Scenario:` with Given/When/Then
- [ ] Scenarios cover happy path AND error cases
- [ ] Edge cases documented
- [ ] Performance requirements specified (if applicable)

### Phase 4: Core Rules Compliance
Validate against core rules (P01-P23):

| Rule | Status | Evidence |
|------|--------|----------|
| **P01 Security** | | Least privilege enforced? |
| **P02 Collaboration** | | Plan before execution? |
| **P05 Ship-Complete** | | Tests, observability, feature flags? |
| **P07 Verify** | | Verification criteria for each task? |
| **P12 Dependencies** | | Versions verified? |
| **P19 Simplicity** | | Avoids over-engineering? |

### Phase 5: TDD Readiness
- [ ] Unit test targets identified
- [ ] Integration test boundaries defined
- [ ] Acceptance tests mapped to requirements
- [ ] Mock/stub strategy for dependencies
- [ ] Test paths follow conventions

### Phase 6: Final Assessment

```markdown
## OpenSpec Review: $ARGUMENTS

### Summary
- **Status**: [APPROVED | NEEDS_REVISION | BLOCKED]
- **Completeness**: X/10
- **TDD Readiness**: X/10
- **Rules Compliance**: X/22

### Critical Issues
1. [Issue + remediation]

### Recommendations
1. [Improvement]

### Contract Recommendation
[If complex]: This change would benefit from a Goost contract.
Run `/openspec-contract $ARGUMENTS` to establish binding criteria.
```

---
[Include standard Goost status block if contract active]
---
```

### 2.2 `/openspec-poc` (from openspec-extended)

**Purpose:** Create a proof of concept with research documentation.

**File:** `.opencode/command/openspec-poc.md`

**Key Changes:**
1. Goost status markers throughout
2. Contract-aware scoping
3. POC completion can satisfy contract criteria

```markdown
---
name: openspec-poc
description: Create a proof of concept for an OpenSpec change with research
agent: general
---

# /openspec-poc - OpenSpec Proof of Concept

[GOOST:ROCKET]

You are creating a **proof of concept (POC)** for: `$ARGUMENTS`

## Contract Check

If a Goost contract is active:
- Map POC deliverables to contract criteria
- POC completion should satisfy at least one criterion
- Update contract status as POC progresses

## POC Framework

### Phase 1: Scope Definition
1. Read the spec: `openspec/changes/$ARGUMENTS/proposal.md`, `design.md`, `tasks.md`
2. Identify 2-3 **core proof points**
3. Define explicit scope:

```markdown
## POC Scope: $ARGUMENTS

### In Scope (Core Proof Points)
1. [Critical feature to validate]
2. [Core integration to prove]
3. [Key technical challenge]

### Out of Scope (Deferred)
- [ ] [Feature deferred]
- [ ] [Edge case handling]
- [ ] [Production hardening]
```

### Phase 2: Technology Research (Context7 + Web)
For EACH technology:
1. `resolve-library-id` → `get-library-docs`
2. Research best practices
3. Check version compatibility
4. Find reference implementations

Document:
```markdown
## Technology Research

### Core Technologies
| Technology | Version | Purpose | Docs Verified | Notes |
|------------|---------|---------|---------------|-------|

### Best Practices Identified
1. **[Pattern]**: [Description + source]

### Anti-Patterns to Avoid
1. **[Anti-pattern]**: [Why + alternative]
```

### Phase 3: Architecture Decisions
Create ADR before coding:

```markdown
## POC Architecture: $ARGUMENTS

### Key Decisions

#### Decision 1: [Title]
- **Context**: [Why needed]
- **Options**: 
  1. [Option A]: [pros/cons]
  2. [Option B]: [pros/cons]
- **Decision**: [Chosen]
- **Rationale**: [Why]
```

### Phase 4: Implementation
Create POC structure:
```
poc/$ARGUMENTS/
├── README.md
├── RESEARCH.md
├── ARCHITECTURE.md
├── src/
├── tests/
├── examples/
└── requirements.txt
```

Implementation checklist:
- [ ] Core data structures defined
- [ ] Primary happy-path implemented
- [ ] Basic error handling
- [ ] Demo script working
- [ ] Basic tests passing

### Phase 5: Validation
```bash
cd poc/$ARGUMENTS
python -m pytest tests/ -v
python examples/demo.py
```

### Phase 6: Findings Report

```markdown
## POC Findings: $ARGUMENTS

### Summary
- **Status**: [VALIDATED | PARTIALLY_VALIDATED | BLOCKED]
- **Core Concept Proven**: [Yes/No + explanation]
- **Complexity**: [Low | Medium | High]

### What Worked
1. [Finding with evidence]

### Challenges
1. [Challenge]: [Impact + mitigation]

### Spec Updates Needed
- [ ] [Change 1]
- [ ] [Change 2]

### Risks
1. **[Risk]**: [Description + mitigation]
```

## Contract Status Update

If contract active, update status:
```
---
CONTRACT STATUS:
- [x] POC validates core approach (evidence: poc/$ARGUMENTS/ working)
- [ ] ... remaining criteria
---
```
```

### 2.3 `/openspec-status` (from openspec-extended)

**Purpose:** Audit and reconcile task progress with contract awareness.

**File:** `.opencode/command/openspec-status.md`

**Key Changes:**
1. Detect and integrate with active Goost contracts
2. Unified reconciliation of contract criteria AND OpenSpec tasks
3. Map task completion to contract criteria
4. Suggest contract updates based on findings

```markdown
---
name: openspec-status
description: Audit and reconcile OpenSpec task progress with contract awareness
agent: general
---

# /openspec-status - OpenSpec Status Reconciliation

[GOOST:ROCKET]

You are performing a **comprehensive audit** of all OpenSpec changes with contract awareness.

## Pre-Audit: Contract Detection

1. Check for active Goost contract
2. If active:
   - Map contract criteria to OpenSpec tasks
   - Reconciliation will update BOTH systems
   - Contract status block will reflect OpenSpec task state

## Reconciliation Process

### Phase 0: Contract Mapping (if contract active)

```markdown
## Contract ↔ OpenSpec Mapping

| Contract Criterion | OpenSpec Task(s) | Current State |
|-------------------|------------------|---------------|
| [criterion 1] | [task 1.2, 1.3] | [matched/unmatched] |
```

### Phase 1: Discovery
1. Run `openspec list` to get all active changes
2. **Count total changes** - audit ALL of them
3. Create tracking table:

| Change | Total Tasks | Complete | Incomplete | Status |
|--------|-------------|----------|------------|--------|
| [name] | ? | ? | ? | [PENDING] |

### Phase 2: Per-Change Deep Audit

For EACH change, IN ORDER:

#### 2.1 Parse Task State
Extract every task from `tasks.md`:
- Task ID, Description, Checkbox state, Annotations

#### 2.2 Verify "Complete" Tasks
For EACH `[x]` task:
1. **Locate implementation**: Find actual code/files
2. **Verify exists**: Use `glob`, `grep`, `read`
3. **Verify works**: Check for issues
4. **Check tests**: Verify test coverage

Evidence required:
```markdown
- [x] Task 1.2.3: Implement auth
  - **Verified**: `src/auth/handler.py:45-120`
  - **Tests**: `tests/test_auth.py` - 5 tests passing
  - **Status**: CONFIRMED COMPLETE
```

Or if issues:
```markdown
- [x] Task 1.2.3: Implement auth
  - **Issue**: `verify_token()` stubbed (line 78: `pass # TODO`)
  - **Status**: INCOMPLETE - revert to [ ]
```

#### 2.3 Verify "Incomplete" Tasks
For EACH `[ ]` task:
1. Check if actually implemented
2. Check if partially done
3. Check dependencies

#### 2.4 Identify Skipped Tasks
Look for:
- Later tasks complete, earlier incomplete
- Phases complete with incomplete subtasks
- Dependency violations

#### 2.5 Update Contract Mapping
After auditing each change:
- Update contract criteria status based on task findings
- Evidence from task verification flows to contract

#### 2.6 Mark Audited
Update tracking: `[PENDING]` → `[AUDITED]`

**DO NOT proceed to Phase 3 until ALL changes are [AUDITED].**

### Phase 3: Generate Corrections

For EACH change:
```markdown
## Corrections: [change-name]

### Tasks to Mark Complete
- [ ] → [x] Task 1.2.3: [reason - file:line]

### Tasks to Mark Incomplete  
- [x] → [ ] Task 2.1.1: [reason - missing/incomplete]

### Skipped Tasks
- Task 1.4: Needs completion before continuing

### Contract Criteria Updates
- Criterion 2: Now verified (evidence from task 1.2.3)
```

### Phase 4: Apply Corrections

[GOOST:MIC]

**Present ALL corrections, then wait for approval:**

1. Show proposed `tasks.md` diffs
2. Show proposed contract status updates
3. Wait for user confirmation
4. Apply approved changes
5. Add reconciliation comment:
```markdown
<!-- Reconciliation: YYYY-MM-DD HH:MM -->
<!-- Tasks: +X complete, -Y incomplete -->
<!-- Contract criteria updated: Z -->
```

### Phase 5: Unified Report

```markdown
## Status Reconciliation Report

**Date**: YYYY-MM-DD HH:MM
**Changes Audited**: X
**Contract**: [Active/None]

### Summary by Change

| Change | Before | After | Corrections | Contract Impact |
|--------|--------|-------|-------------|-----------------|
| [name] | 15/30 | 18/30 | +3, -0 | Criteria 2 verified |

### Contract Status After Reconciliation

---
CONTRACT STATUS:
- [x] Criterion 1 (verified via task 1.2.3)
- [x] Criterion 2 (verified via task 2.1.1)
- [ ] Criterion 3 (blocked: task 3.1 incomplete)
Phase: 2 of 3 | Criteria: 2/3 complete
---

### Critical Issues
1. [Issue description]

### Next Steps
1. Complete skipped tasks before continuing
2. Address blocked contract criteria
```
```

### 2.4 `/openspec-contract` (NEW - Contract from OpenSpec)

**Purpose:** Create a Goost contract directly from an OpenSpec change's acceptance criteria.

**File:** `.opencode/command/openspec-contract.md`

```markdown
---
name: openspec-contract
description: Create a Goost contract from an OpenSpec change's acceptance criteria
agent: general
---

# /openspec-contract - Contract from OpenSpec

[GOOST:ROCKET]

You are creating a **Goost contract** from the OpenSpec change: `$ARGUMENTS`

## Process

### Step 1: Load OpenSpec Change

1. Run `openspec show $ARGUMENTS --json` to get full context
2. Read `openspec/changes/$ARGUMENTS/proposal.md` for:
   - Objective / Overview
   - Acceptance criteria
   - Scope boundaries
3. Read `openspec/changes/$ARGUMENTS/tasks.md` for phases

### Step 2: Extract Contract Elements

Map OpenSpec elements to contract:

| OpenSpec | Contract |
|----------|----------|
| Overview | OBJECTIVE |
| Acceptance Criteria | SUCCESS CRITERIA |
| Out of Scope | CONSTRAINTS (MUST NOT) |
| Requirements | CONSTRAINTS (MUST) |
| Task Phases | CHECKPOINTS |

### Step 3: Generate Contract

```
============================================================
                    CONTRACT ACTIVE
============================================================

OBJECTIVE: [from proposal.md overview]

SUCCESS CRITERIA: (from acceptance criteria)
- [ ] <criterion 1>
- [ ] <criterion 2>
- [ ] <criterion 3>

CONSTRAINTS:
- MUST NOT: [from out of scope]
- MUST: [from requirements]

CHECKPOINTS: (from tasks.md phases)
- [ ] Phase 1: [phase name from tasks.md]
- [ ] Phase 2: [phase name from tasks.md]

LINKED OPENSPEC CHANGE: openspec/changes/$ARGUMENTS/

============================================================
```

### Step 4: Confirm

[GOOST:MIC]

```
This contract was generated from OpenSpec change: $ARGUMENTS

The contract criteria are linked to OpenSpec tasks.
When tasks are verified complete, criteria will be updated.

Accept this contract? (confirm/modify/cancel)
```

### Step 5: Persist (on confirmation)

1. Lock the contract (immutable)
2. Create `.goost/active-contract.md` with:
   - Full contract text
   - OpenSpec change linkage
   - Criteria-to-task mapping

```markdown
# Active Contract

## Contract
[full contract text]

## OpenSpec Linkage
- **Change**: $ARGUMENTS
- **Mapping**:
  - Criterion 1 → Task 1.1, 1.2
  - Criterion 2 → Task 2.1
  - Criterion 3 → Task 3.1, 3.2, 3.3
```

### After Confirmation

Begin work. Every response must include:

---
CONTRACT STATUS:
- [ ] Criterion 1 (pending - linked to tasks 1.1, 1.2)
- [ ] Criterion 2 (pending - linked to task 2.1)
Phase: 1 of N | Criteria: 0/X complete
---
```

### 2.5 `/openspec-apply` (NEW - Apply with Auto-Contract)

**Purpose:** Implement an OpenSpec change with automatic Goost contract establishment.

**File:** `.opencode/command/openspec-apply.md`

This is the primary "do the work" command that combines contract creation with implementation.

```markdown
---
name: openspec-apply
description: Apply an OpenSpec change with automatic Goost contract establishment
agent: general
---

# /openspec-apply - Apply OpenSpec Change

[GOOST:ROCKET]

You are applying the OpenSpec change: `$ARGUMENTS`

This command automatically establishes a Goost contract before implementation begins.

## Process

### Step 1: Validate Change Exists

1. Run `openspec show $ARGUMENTS --json` to verify change exists
2. If not found, error: "Change '$ARGUMENTS' not found. Run `openspec list` to see available changes."
3. Read the full change context:
   - `openspec/changes/$ARGUMENTS/proposal.md`
   - `openspec/changes/$ARGUMENTS/design.md` (if exists)
   - `openspec/changes/$ARGUMENTS/tasks.md`
   - `openspec/changes/$ARGUMENTS/specs/*/spec.md`

### Step 2: Check for Existing Contract

1. Check if a Goost contract is already active
2. If YES:
   - Check if it's linked to THIS change
   - If same change: "Contract already active for this change. Continuing..."
   - If different change: 
     ```
     [GOOST:MIC]
     
     A contract is already active for a different task.
     Options:
     1. Void current contract and create new one for $ARGUMENTS
     2. Complete current contract first
     3. Cancel this apply command
     ```
3. If NO: Proceed to contract creation

### Step 3: Auto-Generate Contract

Extract contract elements from the OpenSpec change:

| OpenSpec Source | Contract Element |
|-----------------|------------------|
| `proposal.md` Overview | OBJECTIVE |
| `proposal.md` Acceptance Criteria | SUCCESS CRITERIA |
| `proposal.md` Out of Scope | CONSTRAINTS (MUST NOT) |
| `proposal.md` Requirements | CONSTRAINTS (MUST) |
| `tasks.md` Phase headers | CHECKPOINTS |

Generate the contract:

```
============================================================
                    CONTRACT ACTIVE
============================================================

OBJECTIVE: [from proposal.md overview - one sentence]

SUCCESS CRITERIA: (from acceptance criteria)
- [ ] <criterion 1>
- [ ] <criterion 2>
- [ ] <criterion 3>
[... all acceptance criteria ...]

CONSTRAINTS:
- MUST NOT: [from out of scope items]
- MUST: [from requirements/non-negotiables]

CHECKPOINTS: (from tasks.md)
- [ ] Phase 1: [first phase from tasks.md]
- [ ] Phase 2: [second phase from tasks.md]
[... all phases ...]

LINKED OPENSPEC CHANGE: openspec/changes/$ARGUMENTS/

============================================================
```

### Step 4: Confirm Contract

[GOOST:MIC]

```
Ready to apply OpenSpec change: $ARGUMENTS

A Goost contract will be established with:
- X success criteria (from acceptance criteria)
- Y checkpoints (from task phases)
- Linked to: openspec/changes/$ARGUMENTS/

This contract ensures ALL acceptance criteria are met before completion.

Proceed? (confirm/review-first/cancel)
```

**If user says "review-first"**: Run `/openspec-review $ARGUMENTS` before continuing.

### Step 5: Lock Contract & Begin Work

On confirmation:

1. Lock the contract (immutable)
2. Persist to `.goost/active-contract.md`
3. Begin implementation following `tasks.md` order

### Step 6: Implementation Loop

For each task in `tasks.md`:

1. Read the task requirements
2. Implement the task
3. Verify implementation (tests, manual check)
4. Update task checkbox in `tasks.md`: `[ ]` → `[x]`
5. Update contract status if task completes a criterion
6. Output status block

```
[GOOST:ROCKET]

Completed task 1.2: Implement user authentication endpoint

Updated tasks.md: Task 1.2 marked complete
Evidence: src/auth/routes.py:45-120, tests/test_auth.py passing

---
CONTRACT STATUS:
- [x] Auth endpoint accepts credentials (evidence: tests passing)
- [ ] JWT token generation (in progress - task 1.3)
- [ ] Protected routes enforce auth (pending - task 2.1)
Phase: 1 of 3 | Criteria: 1/3 | Tasks: 2/12
---
```

### Step 7: Completion

When ALL tasks complete AND ALL criteria verified:

```
[GOOST:EARTH]

============================================================
                  CONTRACT FULFILLED
============================================================

All acceptance criteria verified:
- [x] Criterion 1 (evidence: ...)
- [x] Criterion 2 (evidence: ...)
- [x] Criterion 3 (evidence: ...)

OpenSpec change '$ARGUMENTS' fully applied.

Next steps:
- Run `openspec validate $ARGUMENTS` to verify
- Run `openspec archive $ARGUMENTS` when ready to merge to main specs

============================================================
```

## Error Handling

### Change Not Found
```
Error: OpenSpec change '$ARGUMENTS' not found.

Available changes:
[output of openspec list]

Did you mean one of these?
```

### Tasks Already Complete
```
OpenSpec change '$ARGUMENTS' appears to be already complete.
Tasks: 12/12 complete

Options:
1. Run `/openspec-status` to verify
2. Run `openspec archive $ARGUMENTS` to finalize
3. Force re-apply (will reset task checkboxes)
```

### Partial Progress
```
OpenSpec change '$ARGUMENTS' has partial progress.
Tasks: 7/12 complete

Creating contract for REMAINING work:
- Criteria will reflect unfinished acceptance items
- Completed tasks will be preserved

Proceed? (confirm/cancel)
```

## Rules Compliance

- **P02 Collaboration**: Contract confirmation before work begins
- **P05 Ship-Complete**: All criteria must be met, not just tasks
- **P07 Verify**: Every criterion needs evidence
- **P11 Lifecycle**: Follows Understand → Plan (contract) → Implement → Verify
- **P17 Track-Progress**: Status blocks on every response
```

---

## Phase 3: Plugin Enhancements

### 3.1 OpenSpec State Tracking

Add to `plugin/index.ts`:

```typescript
// =============================================================================
// OpenSpec Integration
// =============================================================================

interface OpenSpecChange {
  name: string
  taskCount: number
  completedTasks: number
  lastSeen: number
}

interface OpenSpecState {
  detected: boolean
  initialized: boolean
  activeChanges: Map<string, OpenSpecChange>
  linkedChange: string | null  // Change linked to current contract
}

let openspec: OpenSpecState = {
  detected: false,
  initialized: false,
  activeChanges: new Map(),
  linkedChange: null
}

// Detect OpenSpec in project
const checkOpenSpecPresence = (): boolean => {
  // This would be called via the shell or file system checks
  // For now, we detect via message content patterns
  return openspec.detected
}

// Parse openspec list output
const parseOpenSpecList = (output: string): void => {
  // Parse the output of `openspec list` to populate activeChanges
  const changePattern = /^\s*[-*]\s+(\S+)\s+.*?(\d+)\/(\d+)/gm
  let match
  while ((match = changePattern.exec(output)) !== null) {
    openspec.activeChanges.set(match[1], {
      name: match[1],
      completedTasks: parseInt(match[2]),
      taskCount: parseInt(match[3]),
      lastSeen: Date.now()
    })
  }
  openspec.detected = true
}
```

### 3.2 Contract-OpenSpec Linkage

```typescript
// Extended ContractState
interface ContractState {
  active: boolean
  text: string | null
  objective: string | null
  criteriaStatus: string[]
  progress: string
  // NEW: OpenSpec linkage
  linkedOpenSpecChange: string | null
  criteriaToTaskMap: Map<number, string[]>  // criterion index -> task IDs
}

// When contract is created from OpenSpec
const linkContractToOpenSpec = (changeName: string, mappings: Map<number, string[]>): void => {
  contract.linkedOpenSpecChange = changeName
  contract.criteriaToTaskMap = mappings
  openspec.linkedChange = changeName
  
  log(`Contract linked to OpenSpec change: ${changeName}`)
}
```

### 3.3 Unified Status Display

```typescript
// Enhanced title with OpenSpec info
const updateTitle = (): void => {
  let display = `${currentIcon} ${currentStats}`
  
  // Add contract progress
  if (contract.progress) {
    display += ` [${contract.progress}]`
  }
  
  // Add OpenSpec task progress if linked
  if (contract.linkedOpenSpecChange && openspec.activeChanges.has(contract.linkedOpenSpecChange)) {
    const change = openspec.activeChanges.get(contract.linkedOpenSpecChange)!
    display += ` 📋${change.completedTasks}/${change.taskCount}`
  }
  
  writeOSC(`\x1b]0;${display}\x07`)
}
```

### 3.4 Preservation Context Enhancement

```typescript
const buildPreservationContext = (): string => {
  if (!contract.text) return ""
  
  let context = `
╔══════════════════════════════════════════════════════════════════╗
║             CRITICAL: ACTIVE CONTRACT - MUST PRESERVE            ║
╚══════════════════════════════════════════════════════════════════╝

${contract.text}

CURRENT PROGRESS:
${contract.criteriaStatus.map(c => `  ${c}`).join('\n') || '  No criteria tracked yet'}

PROGRESS SUMMARY: ${contract.progress || 'Not yet determined'}
${contract.objective ? `OBJECTIVE: ${contract.objective}` : ''}
`

  // Add OpenSpec linkage if present
  if (contract.linkedOpenSpecChange) {
    const change = openspec.activeChanges.get(contract.linkedOpenSpecChange)
    context += `
LINKED OPENSPEC CHANGE: ${contract.linkedOpenSpecChange}
OpenSpec Task Progress: ${change ? `${change.completedTasks}/${change.taskCount}` : 'Unknown'}

Criteria-to-Task Mapping:
${Array.from(contract.criteriaToTaskMap.entries())
  .map(([idx, tasks]) => `  Criterion ${idx + 1} → Tasks: ${tasks.join(', ')}`)
  .join('\n')}
`
  }

  context += `
⚠️  This contract MUST be maintained after compaction.
⚠️  All criteria status must be preserved.
⚠️  OpenSpec task linkage must be maintained.
`

  return context
}
```

---

## Phase 4: Instruction Updates

### 4.1 New Section in goost_instructions.md

Add after the existing content:

```markdown
## OpenSpec Integration

Goost provides deep integration with OpenSpec for spec-driven development.

### Detection

When working in a project:
1. Check for `openspec/` directory
2. If found, OpenSpec integration is active
3. Suggest relevant `/openspec-*` commands

### Available Commands

| Command | Purpose |
|---------|---------|
| `/openspec-apply <change>` | Apply change with automatic contract creation |
| `/openspec-contract <change>` | Create contract from OpenSpec acceptance criteria (no auto-apply) |
| `/openspec-review <change>` | Deep review with research and validation |
| `/openspec-poc <change>` | Create proof of concept with documentation |
| `/openspec-status` | Audit and reconcile task progress |

### Contract-OpenSpec Linkage

When a contract is created via `/openspec-contract`:
1. Contract criteria map to OpenSpec tasks
2. Task completion updates contract criteria
3. Status blocks show both systems:

```
---
CONTRACT STATUS:
- [x] Criterion 1 (verified: task 1.2.3 complete - src/auth.py:45)
- [ ] Criterion 2 (in progress: task 2.1 at 50%)
Phase: 1 of 2 | Criteria: 1/3 | Tasks: 8/15
---
```

### When to Use Each Command

| Scenario | Command |
|----------|---------|
| Ready to implement a change | `/openspec-apply` (auto-creates contract) |
| Want contract without starting work | `/openspec-contract` |
| Starting new OpenSpec change | `/openspec-review` first, then `/openspec-apply` |
| Need to validate approach | `/openspec-poc` |
| Progress seems off | `/openspec-status` |
| Quick task without OpenSpec | `/contract` or `/contract-quick` |

### Evidence Format (Unified)

Both contract criteria and OpenSpec tasks use the same evidence format:
```
- **Verified**: `file_path:line_number` [exists|functional|tested]
- **Tests**: `test_file.py` - N tests passing
- **Status**: CONFIRMED COMPLETE | INCOMPLETE | BLOCKED
```

### Reconciliation Flow

When running `/openspec-status`:
1. Audits ALL OpenSpec tasks against actual code
2. Verifies contract criteria based on task completion
3. Presents unified correction plan
4. Updates both `tasks.md` AND contract status
5. Requires user approval before changes

### Doom Loop + OpenSpec

When in a doom loop while working on an OpenSpec change:
1. Suggest running `/openspec-status` to check if a task was skipped
2. Verify prerequisite tasks are actually complete
3. Check if task dependencies are satisfied

### Auto-Contract on /openspec-apply

The `/openspec-apply` command is the **primary workflow** for implementing OpenSpec changes.
It automatically establishes a Goost contract before any implementation begins.

**Behavior:**
1. User runs `/openspec-apply my-feature`
2. Goost reads the OpenSpec change's `proposal.md` and `tasks.md`
3. A contract is auto-generated from:
   - Acceptance criteria → SUCCESS CRITERIA
   - Out of scope → CONSTRAINTS (MUST NOT)
   - Task phases → CHECKPOINTS
4. User confirms the contract
5. Implementation begins with full contract tracking

**Why auto-contract?**
- Prevents "implement first, track later" anti-pattern
- Ensures acceptance criteria are explicit before work starts
- Links every task to a verifiable criterion
- Makes completion unambiguous

**If user wants manual control:**
- Use `/openspec-contract` to create contract without auto-apply
- Use plain task work without Goost if truly needed (not recommended)
```

---

## Phase 5: Documentation Updates

### 5.1 README.md Updates

Add new installation and usage sections:

```markdown
## Installation

### Core (Required)
```bash
# Clone or download goost
git clone https://github.com/your-org/goost.git

# Copy to your project
cp -r goost/.opencode your-project/

# Or install globally
mkdir -p ~/.config/opencode
cp goost/goost_instructions.md ~/.config/opencode/rules/
```

### OpenSpec Integration (Optional but Recommended)
```bash
# Install OpenSpec CLI
npm install -g @fission-ai/openspec

# Verify installation
openspec --version

# Initialize OpenSpec in your project
cd your-project
openspec init
```

### Context7 MCP (Recommended for Research Commands)
Configure Context7 MCP in your OpenCode settings for best-practice research during `/openspec-review` and `/openspec-poc`.

## Commands

### Core Commands
| Command | Description |
|---------|-------------|
| `/contract` | Interactive contract creation |
| `/contract-quick <task>` | Quick contract from task description |

### OpenSpec Commands (requires OpenSpec CLI)
| Command | Description |
|---------|-------------|
| `/openspec-apply <change>` | Apply change with auto-contract (primary workflow) |
| `/openspec-contract <change>` | Create contract only (no auto-apply) |
| `/openspec-review <change>` | Deep review with Context7 research |
| `/openspec-poc <change>` | Proof of concept with documentation |
| `/openspec-status` | Audit and reconcile all changes |

## Workflows

### Standard Workflow
1. Run `/contract` or `/contract-quick`
2. Work with status blocks
3. Complete all criteria
4. Contract fulfilled

### OpenSpec Workflow
1. Create OpenSpec change: `openspec create my-feature`
2. (Optional) Review: `/openspec-review my-feature`
3. Apply with contract: `/openspec-apply my-feature` (auto-creates contract)
4. Work on tasks (contract tracks progress automatically)
5. (If needed) Reconcile: `/openspec-status`
6. Contract fulfilled when all criteria met
```

### 5.2 CLAUDE.md Updates

```markdown
## OpenSpec Integration

Goost now includes full absorption of OpenSpec Extended commands:

### For Agents Working on /openspec-* Commands:
- All `/openspec-*` commands must emit Goost status markers
- Contract linkage is bi-directional (criteria <-> tasks)
- Evidence format is shared between systems
- Reconciliation updates both systems atomically

### Dependencies:
- OpenSpec CLI: Required for `/openspec-*` commands
- Context7 MCP: Recommended for `/openspec-review` and `/openspec-poc`

### Design Principles (Extended):
- **Unified Tracking**: Contract + OpenSpec = single source of truth
- **Evidence-Based**: All verification requires `file:line` proof
- **Reconciliation**: `/openspec-status` heals drift between systems
```

---

## Phase 6: Implementation Checklist

### P0: Critical Path
- [ ] Create `/openspec-apply.md` command (primary workflow)
- [ ] Create `/openspec-contract.md` command
- [ ] Create `/openspec-status.md` command (absorb openspec-status)
- [ ] Update `goost_instructions.md` with OpenSpec section
- [ ] Update plugin to track OpenSpec linkage
- [ ] Update compaction preservation for OpenSpec state

### P1: High Value
- [ ] Create `/openspec-review.md` command (absorb openspec-review)
- [ ] Create `/openspec-poc.md` command (absorb openspec-poc)
- [ ] Add OpenSpec detection to plugin
- [ ] Unified status display (contract + tasks)
- [ ] Update README with new commands

### P2: Polish
- [ ] Criteria-to-task mapping persistence
- [ ] Auto-suggest `/openspec-*` commands when OpenSpec detected
- [ ] Enhanced doom loop detection with task awareness
- [ ] CLAUDE.md updates

### P3: Future
- [ ] OpenSpec task creation from contract criteria
- [ ] Automatic task checkbox updates when criteria verified
- [ ] Metrics/reporting on contract fulfillment rates

---

## Effort Estimate

| Phase | Description | Effort |
|-------|-------------|--------|
| Phase 1 | Foundation (deps, structure) | 2-3 hours |
| Phase 2 | Command absorption (4 commands) | 6-8 hours |
| Phase 3 | Plugin enhancements | 4-5 hours |
| Phase 4 | Instruction updates | 2 hours |
| Phase 5 | Documentation | 2 hours |
| Phase 6 | Testing & polish | 3-4 hours |
| **Total** | | **19-24 hours** |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OpenSpec CLI not installed | Medium | Commands fail | Clear error messages, install instructions |
| Context7 not available | Low | Research limited | Fallback to web search, graceful degradation |
| Criteria-task mapping drift | Medium | Incorrect status | `/openspec-status` reconciliation |
| Plugin complexity increase | Medium | Bugs | Thorough testing, feature flags |
| Breaking existing `/contract` users | Low | User frustration | Backward compatibility, optional OpenSpec |

---

## Success Criteria

After implementation:

1. **Unified Workflow**: Users can work entirely within Goost for spec-driven development
2. **Zero Drift**: `/openspec-status` always reconciles reality with tracked state
3. **Evidence Chain**: Every criterion completion has `file:line` proof
4. **Backward Compatible**: Existing `/contract` users unaffected
5. **Clear Documentation**: Users know when to use which command
