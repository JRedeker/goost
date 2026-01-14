# Design: Loop Prevention Hardening for Goost

## Architectural Overview

This change adds a lightweight state tracking layer to the Goost plugin that enables commands to detect and prevent loop conditions. The design prioritizes:

1. **Minimal plugin changes** - Most loop prevention happens in command prompts, not plugin code
2. **Backward compatibility** - Existing commands work unchanged; loop prevention is additive
3. **Testability** - State changes are observable and verifiable

## Key Design Decisions

### 1. Sub-Agent Work Tracking

**Problem**: Parallel sub-agents in `openspec-audit` and `goost-slop-scan` may analyze the same files redundantly, wasting tokens and potentially causing conflicting findings.

**Solution**: Track processed files per sub-agent by criterion. Before spawning a sub-agent or assigning work, check if files are already processed.

**Data Structure**:
```typescript
interface SubAgentWork {
  criterionId: string;
  subAgentType: string; // 'spec-parser', 'code-mapper', etc.
  processedFiles: Map<string, number>; // file path -> line count
  findings: Finding[];
}

interface PluginState {
  // ... existing fields
  subAgentWork: Map<string, SubAgentWork>; // key = criterionId
}
```

**Trade-offs**:
- Pro: Simple to implement, no coordination complexity
- Con: Each command run starts fresh - no persistent state across sessions
- Con: Memory grows over time - need to clear on session end (already happens)

**Alternative Considered**: Shared memory via MCP - Rejected because it adds coordination complexity and failure modes.

### 2. Failure Counter Reset

**Problem**: The plugin tracks sub-agent failures per criterion but never clears them on success. This causes spurious doom loop warnings.

**Solution**: Add `clearSubAgentFailures(criterionId)` function that resets the counter when:
- Criterion is marked complete in contract
- Contract is fulfilled
- Contract is voided

**Implementation**:
```typescript
function recordSubAgentFailure(criterionId: string): void {
  const current = state.subAgentFailures.get(criterionId) || 0;
  state.subAgentFailures.set(criterionId, current + 1);
}

function clearSubAgentFailures(criterionId: string): void {
  state.subAgentFailures.delete(criterionId);
}
```

**Trade-offs**:
- Pro: Simple change with immediate benefit
- Con: Requires command cooperation - must call clear function when marking criterion complete

### 3. Convergence Checkpoints

**Problem**: Commands like `openspec-review` have synthesis phases that rely on agent judgment for "when done" instead of explicit criteria.

**Solution**: Add explicit state machine for analysis completion:

```
DISCOVERY -> MAPPING -> SYNTHESIS -> COMPLETE
```

Each transition requires:
- All required sub-agents responded (or timed out)
- Findings count matches expected from scope
- Explicit checkpoint marker in output

**Implementation**: Commands emit markers that plugin validates:
```typescript
// In command output
[GOOST:CHECKPOINT:PHASE_COMPLETE phase=DISCOVERY findings=42]

// Plugin validates and updates state
if (validateCheckpoint(marker, state)) {
  state.convergenceState.phase = 'MAPPING';
}
```

**Trade-offs**:
- Pro: Explicit, verifiable termination
- Con: Changes command flow - requires checkpoint markers
- Con: More complex to implement

**Alternative Considered**: Automated counting - Rejected because content varies too much for reliable counting.

### 4. Termination Criteria Validation

**Problem**: Commands like "Build the Gap List" have no explicit termination - agent keeps working until it decides done.

**Solution**: Add required validation in command prompts:

```
VALIDATION REQUIRED before proceeding:
- [ ] At least N requirements extracted from specs
- [ ] At least M files checked against requirements
- [ ] No files unaccounted for in scope

If validation fails: Output "INCOMPLETE - missing X" and continue working.
```

**Implementation**: Added to command prompts as explicit steps with checkpoint markers.

### 5. Deduplication Strategy

**Problem**: Multiple scanners finding the same issue wastes tokens and creates noise.

**Solution**: Track findings by file:line and skip duplicates:

```typescript
interface Finding {
  file: string;
  line: number;
  type: string;
  severity: string;
}

const seenFindings = new Set<string>(); // "file:line:type"

function addFinding(finding: Finding): boolean {
  const key = `${finding.file}:${finding.line}:${finding.type}`;
  if (seenFindings.has(key)) {
    return false; // Duplicate
  }
  seenFindings.add(key);
  return true; // Added
}
```

**Trade-offs**:
- Pro: Simple, effective deduplication
- Con: Same issue reported at different severity counts as duplicate
- Con: Requires coordination across sub-agents

**Alternative Considered**: Semantic deduplication - Rejected as too complex for current scope.

## File Changes Summary

| File | Change Type | Rationale |
|------|------------|-----------|
| `plugin/types.ts` | Modify | Add SubAgentWork, ConvergenceState interfaces |
| `plugin/contract.ts` | Modify | Add clearSubAgentFailures function |
| `.opencode/command/openspec-audit.md` | Modify | Add termination criteria, deduplication, fallback strategy |
| `.opencode/command/openspec-review.md` | Modify | Add synthesis termination, deduplication |
| `.opencode/command/goost-slop-scan.md` | Modify | Add coverage tracking, novelty detection |
| `.opencode/command/openspec-prep.md` | Modify | Strengthen gap analysis termination |

## Testing Strategy

1. **Unit Tests** - Test state tracking functions in plugin/contract.ts
2. **Integration Tests** - Manual testing of each command with loop scenarios
3. **Chaos Testing** - Verify commands terminate when sub-agents fail repeatedly

## Migration Path

This change is additive only. Existing commands continue to work. Loop prevention activates when:
1. Plugin is updated with new state tracking
2. Commands are updated with termination criteria

No migration steps required.
