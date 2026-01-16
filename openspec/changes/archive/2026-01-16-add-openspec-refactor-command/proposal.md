# Change: Add /openspec-refactor command for refreshing stale change proposals

## Why

Change proposals created weeks or months ago become stale as the codebase evolves. Files get moved, APIs change, dependencies update, and other changes get archived that overlap scope. Currently, there's no systematic way to:

1. Detect what has changed since a proposal was created
2. Update spec deltas to reflect current codebase reality
3. Identify requirements that are now obsolete or already implemented
4. Refresh tasks that reference non-existent files

This forces developers to manually audit stale proposals or abandon them entirely, losing valuable planning work.

## What Changes

- **New slash command**: `/openspec-refactor <change-id>` that analyzes and refreshes stale proposals
- **Five staleness detection dimensions**:
  - Codebase drift (tiered detection: SHA-256 → Metadata → TLSH)
  - Dependency updates (Local-first check + Context7 patterns)
  - Conflicting changes (Capability-based filtering)
  - Outdated tasks (references to non-existent files/functions)
  - Spec obsolescence (Multi-signal validation: Path + Behavioral + LLM)
- **Bidirectional Reconciliation**: Refresh specs based on current reality with an **Approval Gate** for intent verification
- **Auto-fix with Review**: Apply all fixes automatically (unstaged), then present summary with confidence scores and reasoning
- **Contract enforcement**: All changes tracked under contract with evidence

## Research Validation

Architectural decisions validated through industry research (SHA-256/TLSH for drift, SBE patterns for reconciliation). Concerns about recursive drift addressed by adding human intent verification gates.

## Impact

- Affected specs: `slash-commands`
- Affected code: `.opencode/command/openspec-refactor.md` (new file)
- Dependencies: OpenSpec CLI, Context7 MCP (for dependency research)
- Related commands: Complements `/openspec-prep` (pre-implementation) and `/openspec-audit` (project-wide)
