# Change: Harden Loop Prevention in Goost Commands

## Why

Audit analysis identified 10 loop-inducing vulnerabilities across Goost slash commands and plugin state management. These cause agents to get stuck in repetitive planning, re-check files unnecessarily, retry failed operations indefinitely, or forget completed work.

**Risk Assessment:**
- HIGH: `openspec-audit` command - 4-phase parallel orchestration with no shared state
- MEDIUM: `openspec-review` command - Synthesis phase has no explicit termination
- MEDIUM: `goost-slop-scan` command - 9 parallel sub-agents with no novelty detection
- LOW: `openspec-prep` command - Has Anti-Loop but gap-fixing could cycle

**Root Causes:**
1. Commands lack explicit termination criteria (what "done" looks like)
2. Sub-agents have no shared memory - each starts fresh
3. Retry logic continues after failures without changing strategy
4. Template markers ("Phase 1", ">>> SYNTHESIS COMPLETE <<<") can be echoed back
5. No novelty penalty - parallel sub-agents may analyze same files redundantly
6. No convergence checkpoints - synthesis phases rely on agent judgment
7. Failure counters in plugin state are never cleared on success

## What Changes

This change adds loop prevention infrastructure to the Goost plugin and command suite:

### Plugin Changes (`plugin/`)

1. **State Tracking for Sub-Agents**
   - Track which files/requirements each sub-agent has processed
   - Prevent redundant analysis across parallel sub-agents
   - Clear failure counters when a criterion succeeds

2. **Convergence Checkpoints**
   - Add explicit state transitions for analysis completion
   - Require evidence before advancing to synthesis phases
   - Track sub-agent completion status per criterion

3. **Termination Criteria Validation**
   - Reject commands without explicit stop conditions
   - Validate exit criteria are measurable (not "analyze gaps" but "identify N gaps")

### Command Changes (`.opencode/command/`)

1. **openspec-audit.md**
   - Add explicit completion criteria for each phase
   - Add file deduplication to prevent redundant analysis
   - Add fallback strategy when sub-agents fail (not just continue)

2. **openspec-review.md**
   - Add explicit synthesis termination checkpoint
   - Add requirement count validation before synthesis

3. **goost-slop-scan.md**
   - Add file coverage tracking to prevent redundant sub-agent work
   - Add novelty detection for parallel scanner outputs

4. **openspec-prep.md**
   - Strengthen Anti-Loop with concrete "all gaps identified" criteria

## Impact

- **Affected specs**: `slash-commands`, `plugin`
- **Affected commands**: `openspec-audit`, `openspec-review`, `goost-slop-scan`, `openspec-prep`
- **Breaking changes**: None - additive only
- **Performance**: Minimal - adds lightweight state tracking

## Research References

- Analysis: `openspec/changes/harden-loop-prevention/design.md`
- Implementation: `openspec/changes/harden-loop-prevention/tasks.md`
