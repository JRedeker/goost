# Design: OpenSpec Refactor Command

## Context

The `/openspec-refactor` command addresses the problem of stale change proposals. Unlike `/openspec-audit` which checks spec-to-code alignment for deployed specs, this command focuses on proposals that haven't been implemented yet but have become outdated.

### Related Commands Comparison

| Command | Scope | Purpose |
|---------|-------|---------|
| `/openspec-prep` | Single change | Prepare spec before implementation (add missing scenarios, tasks) |
| `/openspec-audit` | Deployed specs | Detect drift between specs/ and implementation |
| `/openspec-refactor` | Stale proposals | Refresh changes/ to align with current codebase |
| `/openspec-review` | Post-implementation | Code review of completed work |

## Goals / Non-Goals

### Goals
- Detect all types of staleness in a change proposal
- Automatically update spec deltas, tasks, and proposal metadata
- Preserve the original intent via **Bidirectional Reconciliation**
- Provide clear rollback path for all changes
- Support incremental refresh (run multiple times safely)

### Non-Goals
- Implementing the proposal (that's `/openspec-apply`)
- Rewriting the proposal from scratch
- Automatically deciding if a proposal should be abandoned
- Detecting staleness across multiple proposals simultaneously (use `/openspec-coordinate`)

## Decisions

### Decision: Bidirectional Reconciliation (formerly Spec-First)
**What**: When staleness is detected, propose updates to the spec deltas to match current codebase reality, but require an **Approval Gate (Mic State)** if the change contradicts a core requirement.

**Why**: Pure "Spec-First" (where code wins) leads to "Intent Erosion." If the codebase has a bug, auto-updating the spec would codify that bug as a requirement. By implementing an approval gate, we ensure the human verifies if the code reflects a new requirement or a mistake.

**Alternative considered**: Spec-First (Auto-update). Rejected due to high risk of recursive drift in AI agents.

### Decision: Auto-Fix with Review
**What**: Apply all detected fixes automatically, then present a comprehensive summary with reasoning snippets and a **One-Click Rollback** command.

**Why**: 
- Reduces user fatigue from approving many small changes
- Ensures consistency (partial updates could leave proposal in inconsistent state)
- Rollback is easy via `git restore .`
- User can review holistically and revert if needed

### Decision: Multi-Pass Tiered Drift Detection
**What**: Use SHA-256 for exact move detection, then Metadata/Size, then TLSH (Locality Sensitive Hashing) for fuzzy renames.

**Why**: High performance and reliability. SHA-256 handles moves with 100% confidence. TLSH handles renames with minor edits with 80-90% confidence.

### Decision: Local-First Dependency Scanning
**What**: Run `npm outdated` (or equivalent) before querying Context7.

**Why**: Drastically reduces latency and Context7 rate-limit usage. Only "confirmed stale" dependencies are sent to Context7 for deep pattern analysis.

### Decision: Support --dry-run as Default
**What**: Default behavior shows what would change without applying. Use `--execute` to apply.

**Why**: 
- Safe default prevents accidental changes
- Allows review before commitment
- Consistent with other commands that modify files

## Architecture

### Phase Flow

```
Phase 1: Staleness Analysis (5 parallel sub-agents)
    ├── Codebase Drift Scanner
    ├── Dependency Scanner (Context7)
    ├── Conflict Scanner (archived changes)
    ├── Task Validator
    └── Obsolescence Detector
            │
            ▼
Phase 2: Synthesis
    ├── Aggregate findings by severity
    ├── Cross-reference between dimensions
    └── Generate unified update plan
            │
            ▼
Phase 3: Refactoring (under contract)
    ├── Update spec deltas
    ├── Update tasks.md
    └── Update proposal.md metadata
            │
            ▼
Phase 4: Validation
    └── openspec validate --strict
            │
            ▼
Phase 5: Review
    ├── Summary of all changes
    └── Rollback commands
```

### Sub-Agent Specifications

#### Codebase Drift Scanner
- Tiered Detection Strategy:
  1. **Pass 1 (Exact)**: SHA-256 hash match (100% confidence)
  2. **Pass 2 (Metadata)**: Filename + Size + Path-context match (70% confidence)
  3. **Pass 3 (Fuzzy)**: TLSH / ssdeep similarity distance (80% confidence)
- Output: List of drift items with old path, new path, and reason

#### Dependency Scanner
- **Step 1**: Local check via `outdated` CLI tool
- **Step 2**: Ecosystem-prefixed resolution (`npm:react`) via Context7 `resolve-library-id`
- **Step 3**: Transition-specific queries ("breaking changes v4 to v5") via `get-library-docs`
- Output: List of dependency updates with reasoning and fix snippets

#### Conflict Scanner
- **Hot-Path Optimization**: Filter by Capability-directory overlap first
- **Temporal Prioritization**: Focus on most recent 20% of archived changes
- Output: List of conflicts with supersession suggestions

#### Task Validator
- For each task in tasks.md, extract file/function references
- Verify references exist in codebase
- Detect: orphaned tasks, invalid paths, non-existent functions
- Output: List of invalid tasks with current status and suggested update

#### Obsolescence Detector
- **Multi-Signal Validation**:
  1. **Path-Based Filtering**: Exclude `/tests`, `__mocks__`, and `legacy/` paths
  2. **Behavioral Grounding**: Prioritize passing tests as "Primary Evidence"
  3. **LLM Discriminator**: Verify if candidate code satisfies ALL scenarios of the requirement
- Output: List of obsolete requirements with evidence snippets and confidence scores

### Contract Structure

```
OBJECTIVE: Refactor stale proposal '<change-id>' to align with current codebase

SUCCESS CRITERIA:
- [ ] (R1) File references updated to match current paths
- [ ] (R2) API patterns aligned with current library versions  
- [ ] (R3) Conflicting requirements resolved or noted
- [ ] (R4) Tasks validated against current codebase
- [ ] (R5) Obsolete requirements marked or removed
- [ ] (R6) openspec validate --strict passes
```

## Risks / Trade-offs

### Risk: Loss of Original Intent
**Concern**: Automatic updates might change the proposal's meaning.
**Mitigation**: 
- Add `# Refactored` comments noting original vs updated text
- Preserve original requirements as comments when marking obsolete
- Summary shows exact changes for user review

### Risk: False Positives in Obsolescence Detection
**Concern**: Might incorrectly mark requirements as implemented.
**Mitigation**:
- Require high-confidence evidence (function name + behavior match)
- Use "POSSIBLY_OBSOLETE" status for uncertain cases
- Human review before final decisions

### Risk: Context7 Rate Limits
**Concern**: Dependency scanner might hit API limits.
**Mitigation**:
- Cache library lookups within session
- Limit to top 5 dependencies mentioned in spec
- Graceful degradation if Context7 unavailable

## Open Questions

1. **Staleness threshold**: Should we require a minimum age before suggesting refactor? (e.g., > 7 days since last modification)
2. **Partial obsolescence**: How to handle requirements that are 50% implemented? Mark as MODIFIED or split into sub-requirements?
3. **Archive integration**: Should we offer to merge with relevant archived changes if overlap is significant?
