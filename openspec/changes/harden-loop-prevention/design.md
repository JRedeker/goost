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

**Deduplication with Fuzzy Line Matching**:
```typescript
interface Finding {
  file: string;
  line: number;
  type: string;
  severity: string;
}

const seenFindings = new Set<string>(); // "file:line:type"

// Fuzzy match within tolerance to handle AI precision variation (+/- 2 lines)
function isDuplicate(finding: Finding): boolean {
  for (let offset = -2; offset <= 2; offset++) {
    const key = `${finding.file}:${finding.line + offset}:${finding.type}`;
    if (seenFindings.has(key)) {
      return true;
    }
  }
  return false;
}
```

**Trade-offs**:
- Pro: Simple to implement, no coordination complexity
- Con: Each command run starts fresh - no persistent state across sessions
- Con: Memory grows over time - need to clear on session end (already happens)
- Con: Deduplication at command synthesis layer is primary; plugin is secondary guardrail

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
- Timeout fallback protection

**Implementation**: Commands emit markers that plugin validates:
```typescript
// In command output
[GOOST:CHECKPOINT:PHASE_COMPLETE phase=DISCOVERY findings=42]

// Plugin validates and updates state
if (validateCheckpoint(marker, state)) {
  state.convergenceState.phase = 'MAPPING';
}

// Timeout fallback (5 minutes default)
const PHASE_TIMEOUT_MS = 5 * 60 * 1000;
if (Date.now() - phaseState.startTime > PHASE_TIMEOUT_MS) {
  emitWarning(`Phase ${phase} timed out, proceeding with available findings`);
  advancePhase();
}
```

**Sub-Agent Response Tracking**:
```typescript
interface PhaseState {
  phase: 'DISCOVERY' | 'MAPPING' | 'SYNTHESIS' | 'COMPLETE';
  pendingSubAgents: Set<string>;
  expectedFindings: number;
  receivedFindings: number;
  startTime: number;
}
```

**Trade-offs**:
- Pro: Explicit, verifiable termination
- Con: Changes command flow - requires checkpoint markers
- Con: More complex to implement
- Con: Single-point-of-failure if markers are malformed

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

**Solution**: Track findings by file:line and skip duplicates with fuzzy line matching:

```typescript
interface Finding {
  file: string;
  line: number;
  type: string;
  severity: string;
}

const seenFindings = new Set<string>(); // "file:line:type"

// Fuzzy match within tolerance (+/- 2 lines) to handle AI precision variation
function addFinding(finding: Finding): boolean {
  // Check for near-duplicates within tolerance
  for (let offset = -2; offset <= 2; offset++) {
    const key = `${finding.file}:${finding.line + offset}:${finding.type}`;
    if (seenFindings.has(key)) {
      return false; // Duplicate within tolerance
    }
  }
  seenFindings.add(`${finding.file}:${finding.line}:${finding.type}`);
  return true; // Added
}
```

**Trade-offs**:
- Pro: Simple, effective deduplication with AI precision tolerance
- Con: Same issue reported at different severity counts as duplicate (within tolerance)
- Con: Requires coordination across sub-agents
- Con: Deduplication at command synthesis layer is primary; plugin is secondary guardrail

**Alternative Considered**: Semantic deduplication using embeddings - Rejected as too complex for current scope; consider future enhancement for conceptual loop detection.

### 6. Loop Anomaly Detection (Plugin)

**Problem**: Large agent responses (>20k chars) often indicate infinite loops where the agent is repeating the same content or planning indefinitely.

**Solution**: Implement real-time anomaly detection in the plugin. If a response exceeds a size threshold, scan for repetitive substrings (80+ characters appearing 3+ times).

**Feedback Mechanism**:
- Trigger terminal bell (OSC 7) if enabled
- Update tab title with anomaly indicator
- Append a suggestion to the agent response (hidden or system-visible) to consider doom loop state

**Implementation**:
```typescript
function detectLoopAnomaly(text: string): boolean {
  if (text.length < SIZE_THRESHOLD) return false;
  // Sliding window substring check for large repetitions
  // ... implementation details in plugin/index.ts
}
```

## File Changes Summary

| File | Change Type | Rationale |
|------|------------|-----------|
| `plugin/types.ts` | Modify | Add SubAgentWork, ConvergenceState, AnomalyState interfaces |
| `plugin/contract.ts` | Modify | Add clearSubAgentFailures function, convergence handlers |
| `plugin/index.ts` | Modify | Implement anomaly detection and feedback triggers |
| `plugin/terminal.ts` | Modify | Add terminal feedback and anomaly indicators |
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
