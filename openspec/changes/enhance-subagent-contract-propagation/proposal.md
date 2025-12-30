# Change: Enhance Sub-Agent Contract Propagation

## Why

When spawning sub-agents via the `task` tool while a contract is active, the current instructions provide guidance but lack enforcement, failure handling, and coordination mechanisms. This leads to:

1. Sub-agents spawned without contract context (no enforcement)
2. Repeated sub-agent failures without escalation to doom loop
3. No guidance for parallel sub-agent orchestration
4. No timeout awareness for stuck sub-agents
5. No conflict resolution when sub-agents return contradictory results

These gaps undermine Goost's core mission of preventing premature completion and ensuring verifiable criteria.

## What Changes

### Instructions Enhancements (`goost_instructions.md`)
- **ADDED**: Contract context enforcement with self-check before spawning
- **ADDED**: Parallel sub-agent orchestration with dispatch registry
- **ADDED**: Failure escalation protocol (3 failures = doom loop)
- **ADDED**: Timeout awareness and recovery options
- **ADDED**: Criteria conflict resolution protocol

### Plugin Enhancements (`plugin/index.ts`)
- **ADDED**: Sub-agent registry with criterion tracking
- **ADDED**: Failure tracking per criterion
- **ADDED**: Timeout detection with periodic checks
- **ADDED**: Warning state for stuck sub-agents
- **MODIFIED**: Enhanced `tool.execute.before` and `tool.execute.after` hooks

## Impact

- Affected specs: `contract-system` (new capability for sub-agent handling)
- Affected code:
  - `goost_instructions.md` - New sections for sub-agent handling
  - `plugin/index.ts` - Enhanced hooks and state tracking

## Acceptance Criteria

1. Sub-agents MUST include Contract Context Block (objective, criterion, constraints, evidence needed) in prompts when contract is active
2. 3 consecutive sub-agent failures for the same criterion MUST trigger `[GOOST:DOOM_LOOP]` state
3. Parallel sub-agents MUST have documented Sub-Agent Dispatch Plan with non-overlapping scope
4. Sub-agents exceeding timeout threshold (3 min for explore, 5 min for general) MUST trigger warning log and recovery options
5. Conflicting sub-agent results MUST be flagged with `[?]` status marker until resolved
6. Partial parallel failures MUST be tracked per-criterion (not counted as doom loop until retried)

## Out of Scope

- Automatic sub-agent prompt injection (remains instruction-based)
- Sub-agent cancellation (OpenCode doesn't support this)
- Cross-session sub-agent tracking
