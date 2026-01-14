# Tasks: Harden Loop Prevention in Goost Commands

## Tracking

- [x] All tasks complete
- [x] All acceptance criteria verified
- [x] No TypeScript/build errors

## Tasks

### Phase 1: Plugin State Infrastructure

- [x] 1.1 Add sub-agent work tracking to PluginState interface
  - Track processed files per sub-agent by criterion
  - File: `plugin/types.ts`
  - Tests: `plugin/types.test.ts` (new)

- [x] 1.2 Add `clearSubAgentFailures(criterionId)` function to contract.ts
  - Reset failure count when criterion marked complete
  - File: `plugin/contract.ts`
  - Tests: `plugin/contract.test.ts` (new)

- [x] 1.3 Add convergence checkpoint state to PluginState
  - Add enum for analysis phase states: `DISCOVERY`, `MAPPING`, `SYNTHESIS`, `COMPLETE`
  - Add `convergenceState` field to track per-criterion progress
  - File: `plugin/types.ts`
  - Tests: `plugin/types.test.ts`

### Phase 2: Command Updates - openspec-audit

- [x] 2.1 Add termination criteria to Phase 1 (Discovery)
  - Validate spec count before proceeding
  - Require at least one requirement extracted before continuing
  - File: `.opencode/command/openspec-audit.md`

- [x] 2.2 Add file deduplication for Phase 2 (Mapping)
  - Track which files each sub-agent processes
  - Skip files already analyzed by another sub-agent
  - File: `.opencode/command/openspec-audit.md`

- [x] 2.3 Add fallback strategy for failed sub-agents
  - Define alternative approach when retry fails
  - Do NOT continue without evidence - require explicit fallback or abort
  - File: `.opencode/command/openspec-audit.md`

- [x] 2.4 Add explicit synthesis termination checkpoint
  - Require all findings aggregated before synthesis
  - Add checkpoint: "All findings from all sub-agents collected"
  - File: `.opencode/command/openspec-audit.md`

### Phase 3: Command Updates - openspec-review

- [x] 3.1 Add synthesis phase termination criteria
  - Require all 4 sub-agents to respond OR be marked INCOMPLETE
  - Validate finding count matches expected from scope
  - File: `.opencode/command/openspec-review.md`

- [x] 3.2 Add deduplication of findings across scanners
  - Track findings by file:line to prevent duplicates
  - Skip findings already reported by another scanner
  - File: `.opencode/command/openspec-review.md`

### Phase 4: Command Updates - goost-slop-scan

- [x] 4.1 Add file coverage tracking for Phase 2
  - Track which files each scanner category has processed
  - Skip files assigned to another scanner
  - File: `.opencode/command/goost-slop-scan.md`

- [x] 4.2 Add novelty detection for scanner outputs
  - Skip findings that match previous scanner findings
  - Track unique issue counts per category
  - File: `.opencode/command/goost-slop-scan.md`

### Phase 5: Command Updates - openspec-prep

- [x] 5.1 Strengthen Phase 7 Gap Analysis termination
  - Add explicit: "Gap analysis complete when N files checked against spec"
  - Add checkpoint marker before Final Assessment
  - File: `.opencode/command/openspec-prep.md`

- [x] 5.2 Add Phase Transition: Synthesis -> Execution section
  - Include Anti-Loop Protocol instructions
  - Mandate immediate tool call after synthesis
  - File: `.opencode/command/openspec-prep.md`

- [x] 5.3 Add Contract Enforcement section
  - Mandate CONTRACT STATUS block in every response
  - Define rules for CONTRACT FULFILLED emission
  - File: `.opencode/command/openspec-prep.md`

### Phase 8: Plugin Implementation

- [x] 8.1 Implement anomaly detection in plugin/index.ts
  - Handle `message.updated` events
  - Run `detectLoopAnomaly` on large responses
  - Dispatch feedback via terminal.ts
  - File: `plugin/index.ts`

- [x] 8.2 Implement feedback mechanisms in plugin/terminal.ts
  - Implement `emitAnomalyFeedback()`
  - Add terminal bell support (OSC 7)
  - Update tab title on anomaly detection
  - File: `plugin/terminal.ts`

### Phase 9: Validation

- [x] 9.1 Run `npm run check` in plugin directory
  - TypeScript compilation
  - ESLint checks
  - Prettier formatting

- [x] 9.2 Test loop prevention manually
  - Run openspec-audit and verify no infinite phases
  - Run openspec-review and verify synthesis terminates
  - Run goost-slop-scan and verify no duplicate findings
  - Simulate a large repetitive response and verify anomaly detection triggers
  - Verify terminal bell and tab title change on anomaly

- [x] 9.3 Run openspec validate
  - `openspec validate harden-loop-prevention --strict`
