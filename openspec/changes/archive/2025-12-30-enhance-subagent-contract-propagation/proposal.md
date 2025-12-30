# Change: Enhance Sub-Agent Contract Propagation

## Why

When spawning sub-agents via the `task` tool while a contract is active, the current instructions provide guidance but lack failure handling and coordination mechanisms. This leads to:

1. Sub-agents spawned without contract context (no enforcement)
2. Repeated sub-agent failures without escalation to doom loop
3. No guidance for parallel sub-agent coordination
4. No conflict resolution when sub-agents return contradictory results

These gaps undermine Goost's core mission of preventing premature completion and ensuring verifiable criteria.

## What Changes

### Instructions Enhancements (`goost_instructions.md`)
- **ADDED**: When to use sub-agents guidance (decision criteria)
- **ADDED**: Contract context propagation guidance (flexible, not rigid)
- **ADDED**: Parallel sub-agent coordination (non-overlapping scope)
- **ADDED**: Failure escalation protocol (3 failures = doom loop)
- **ADDED**: Tight task scoping guidance
- **ADDED**: Conflict resolution with `[?]` marker
- **ADDED**: Documentation verification reminder for implementation sub-agents

### Plugin Enhancements (`plugin/index.ts`)
- **MODIFIED**: Enhanced `tool.execute.after` hook with improved failure detection logging
- **NOTE**: Failure tracking per criterion and doom loop triggering are instruction-based (agent behavior), not plugin-enforced. The plugin provides debug logging only.

## Impact

- Affected specs: `contract-system` (new capability for sub-agent handling)
- Affected code:
  - `goost_instructions.md` - New sections for sub-agent handling
  - `plugin/index.ts` - Failure tracking

## Acceptance Criteria

1. Sub-agents SHOULD include contract context (objective, criterion, constraints) in prompts when contract is active
2. 3 consecutive sub-agent failures for the same criterion MUST trigger `[GOOST:DOOM_LOOP]` state
3. Parallel sub-agents SHOULD have non-overlapping scope
4. Conflicting sub-agent results MUST be flagged with `[?]` status marker until resolved
5. Implementation sub-agents SHOULD be prompted to verify patterns against documentation when available

## Out of Scope

- Automatic prompt injection (contract context propagation remains instruction-based)
- MCP tool access configuration (sub-agents inherit full MCP access by default per OpenCode behavior)
- Sub-agent cancellation (OpenCode doesn't support this)
- Timeout detection mid-execution (plugin only sees before/after hooks)
- Duplicating OpenCode's existing agent capabilities (we guide, not re-implement)
