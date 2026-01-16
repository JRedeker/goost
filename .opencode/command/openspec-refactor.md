---
name: openspec-refactor
description: Refresh stale change proposals by aligning them with the current codebase via Bidirectional Reconciliation.
agent: general
---

# OpenSpec Refactor Command

> **SUB-AGENT CONTEXT**: Return findings directly. Status markers and CONTRACT STATUS blocks are for main sessions only—omit them to maximize your output buffer.

You are orchestrating a **Bidirectional Reconciliation** of the stale OpenSpec change: `$ARGUMENTS`

This command analyzes codebase drift, dependency shifts, and requirement obsolescence since the proposal was created, then updates the spec deltas and tasks to match current reality.

## Pre-flight Checks

### Target Resolution Protocol (State-Changing Operation)

Determine the target change ID:

1. **If $ARGUMENTS is provided and non-empty**: Use it directly as the target
2. **If $ARGUMENTS is empty or no target found**:
   a. Run `openspec list` to get active changes
   b. If exactly one active change exists:
      - Use `mcp_question` to confirm:
        ```
        header: "Confirm"
        question: "Refactor '<change-id>'?"
        options: "Yes (Recommended)", "Cancel"
        ```
      - If user cancels, stop execution
   c. If multiple active changes exist:
      - Use `mcp_question` to present selection
   d. If no active changes exist:
      - Display: "No active changes found"
      - Stop execution

### Step 2: Parse Flags

Extract these flags from `$ARGUMENTS`:
- `--execute`: Actually apply changes (default is dry-run)
- `--interactive`: Approve each category of fix
- `--force`: Skip recent-modification warnings

### Step 3: Fetch Change Context

```bash
openspec show <target> --json
```

Read these files for context:
- `openspec/changes/<target>/proposal.md`
- `openspec/changes/<target>/tasks.md`
- `openspec/changes/<target>/specs/*/spec.md`

---

## Phase 1: Staleness Analysis (Parallel Sub-Agents)

**Goal**: Spawn specialized sub-agents using a **tiered detection strategy**.

### Spawn Analysis Sub-Agents

#### Sub-Agent 1: Codebase Drift Scanner (Explore)
**Task**: Compare file references in spec to actual codebase.
1. **Pass 1 (Exact)**: Map missing spec paths to disk files using SHA-256 content hashes. (100% confidence)
2. **Pass 2 (Metadata)**: For remaining, match by Filename + Size + first 1KB hash. (70% confidence)
3. **Pass 3 (Fuzzy)**: Use TLSH / ssdeep similarity distance for renamed files with minor edits. (80-90% confidence)
**Return**: JSON list: `{"dimension": "drift", "items": [{"old": "path/a", "new": "path/b", "confidence": "HIGH", "evidence": "hash_match"}]}`

#### Sub-Agent 2: Dependency Scanner (Explore)
**Task**: Detect stale library patterns.
1. Run `npm outdated --json` (or equivalent) to find version deltas.
2. For mismatched versions, use `resolve-library-id` with ecosystem prefix (e.g. `npm:react`).
3. Use `get-library-docs` with query: "breaking changes and deprecated patterns from version X to Y".
**Return**: JSON list: `{"dimension": "deps", "updates": [{"library": "x", "current": "1.0", "latest": "2.0", "issue": "API changed"}]}`

#### Sub-Agent 3: Conflict Scanner (Explore)
**Task**: Find overlaps with archived changes.
1. Hot-Path Filter: Identify folders in `openspec/changes/archive/` matching capabilities in current proposal.
2. Temporal Sort: Focus on most recent 20% of archives first.
3. Compare requirement intent using semantic analysis.
**Return**: JSON list: `{"dimension": "conflicts", "overlaps": [{"id": "arch-123", "requirement": "R1", "reason": "superseded"}]}`

#### Sub-Agent 4: Task Validator (Explore)
**Task**: Verify task references exist.
1. Check file/function paths mentioned in `tasks.md`.
2. Flag orphaned or invalid tasks.
**Return**: JSON list of task status updates.

#### Sub-Agent 5: Obsolescence Detector (Explore)
**Task**: Detect requirements already implemented.
1. Exclude `/tests`, `__mocks__`, and `legacy/` paths.
2. Prioritize passing unit tests as "Primary Evidence."
3. Use LLM to verify if code satisfies ALL scenarios of a requirement.
**Return**: JSON findings with confidence (🟢 High | 🟡 Medium | 🔴 Low).

---

## Phase 2: Synthesis & Intent Verification

Aggregate sub-agent results.

### Intent Verification Gate (CRITICAL)

If detected code contradicts a core requirement:
1. Emit `[GOOST:MIC]` (Approval needed).
2. Use `mcp_question` to ask: "Code implements [X], but requirement says [Y]. Is the code a new requirement or a bug?"
3. If user says BUG: Note as conflict, do not auto-update.
4. If user says NEW REQUIREMENT: Proceed with spec update.

---

## Phase 3: Refactoring (Under Contract)

> **Skip if dry-run**.

Establish a contract tracking each fix category. You MUST update files while maintaining the following patterns:

### Update Patterns
1. **Path Alignment**: When a file move is detected, update ALL occurrences in `spec.md`, `tasks.md`, and `proposal.md`.
2. **Intent Guard**: If a requirement is updated, add a comment: `> Refactored: aligned with current implementation in <file>`.
3. **Obsolescence**: Mark requirements as `[OBSOLETE]` but do NOT delete them. Add a note: `> **Note**: Implementation found at <file:line>`.
4. **Task Derivation**: If a requirement is refactored, add a new validation task: `- [ ] Verify <requirement> matches refactored implementation`.

---

## Phase 4: Validation

1. **Strict Check**: Run `openspec validate <target> --strict`.
2. **Self-Healing**: If validation fails due to scenario formatting or missing headers, fix them automatically and retry once.
3. **Evidence**: Provide the validation output in the final report.

---

## Phase 5: Final Report

Display the comprehensive refactor report.

### Summary Header
```
============================================================
          REFACTOR REPORT: <target>
============================================================
STALENESS SUMMARY:
  - Age: <N> days since creation
  - Drift: <count> files moved/renamed
  - Obsolescence: <count> requirements implemented elsewhere
```

### Changes Breakdown
Group by confidence level:
- **✅ HIGH CONFIDENCE**: Path updates, task path corrections.
- **⚠️ MANUAL REVIEW RECOMMENDED**: Requirement behavioral shifts, API pattern updates.

### reasoning Snippets
For each major change, provide a one-line "Why":
- `specs/auth/spec.md`: Updated `login.ts` reference because content hash matched.
- `tasks.md`: Marked Task 3.1 as `[INVALID]` because target file was deleted.

### One-Click Rollback
```bash
# To revert all refactoring changes:
git restore .
```

============================================================
      /openspec-refactor <target> COMPLETE
============================================================
