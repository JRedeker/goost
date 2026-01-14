# Tasks: Harden Loop Prevention in Goost Commands

## Tracking

- [ ] All tasks complete
- [ ] All acceptance criteria verified
- [ ] No TypeScript/build errors

## Tasks

### Phase 1: Plugin State Infrastructure

- [ ] 1.1 Add sub-agent work tracking to PluginState interface
  - Track processed files per sub-agent by criterion
  - File: `plugin/types.ts`
  - Tests: `plugin/types.test.ts` (new)

- [ ] 1.2 Add `clearSubAgentFailures(criterionId)` function to contract.ts
  - Reset failure count when criterion marked complete
  - File: `plugin/contract.ts`
  - Tests: `plugin/contract.test.ts` (new)

- [ ] 1.3 Add convergence checkpoint state to PluginState
  - Add enum for analysis phase states: `DISCOVERY`, `MAPPING`, `SYNTHESIS`, `COMPLETE`
  - Add `convergenceState` field to track per-criterion progress
  - File: `plugin/types.ts`
  - Tests: `plugin/types.test.ts`

### Phase 2: Command Updates - openspec-audit

- [ ] 2.1 Add termination criteria to Phase 1 (Discovery)
  - Validate spec count before proceeding
  - Require at least one requirement extracted before continuing
  - File: `.opencode/command/openspec-audit.md`

- [ ] 2.2 Add file deduplication for Phase 2 (Mapping)
  - Track which files each sub-agent processes
  - Skip files already analyzed by another sub-agent
  - File: `.opencode/command/openspec-audit.md`

- [ ] 2.3 Add fallback strategy for failed sub-agents
  - Define alternative approach when retry fails
  - Do NOT continue without evidence - require explicit fallback or abort
  - File: `.opencode/command/openspec-audit.md`

- [ ] 2.4 Add explicit synthesis termination checkpoint
  - Require all findings aggregated before synthesis
  - Add checkpoint: "All findings from all sub-agents collected"
  - File: `.opencode/command/openspec-audit.md`

### Phase 3: Command Updates - openspec-review

- [ ] 3.1 Add synthesis phase termination criteria
  - Require all 4 sub-agents to respond OR be marked INCOMPLETE
  - Validate finding count matches expected from scope
  - File: `.opencode/command/openspec-review.md`

- [ ] 3.2 Add deduplication of findings across scanners
  - Track findings by file:line to prevent duplicates
  - Skip findings already reported by another scanner
  - File: `.opencode/command/openspec-review.md`

### Phase 4: Command Updates - goost-slop-scan

- [ ] 4.1 Add file coverage tracking for Phase 2
  - Track which files each scanner category has processed
  - Skip files assigned to another scanner
  - File: `.opencode/command/goost-slop-scan.md`

- [ ] 4.2 Add novelty detection for scanner outputs
  - Skip findings that match previous scanner findings
  - Track unique issue counts per category
  - File: `.opencode/command/goost-slop-scan.md`

### Phase 5: Command Updates - openspec-prep

- [ ] 5.1 Strengthen Phase 7 Gap Analysis termination
  - Add explicit: "Gap analysis complete when N files checked against spec"
  - Add checkpoint marker before Final Assessment
  - File: `.opencode/command/openspec-prep.md`

### Phase 6: Spec Deltas

- [ ] 6.1 Add spec delta for slash-commands capability
  - New requirement: "Termination Criteria Validation"
  - New requirement: "Sub-Agent Work Deduplication"
  - New requirement: "Convergence Checkpoints"
  - File: `openspec/changes/harden-loop-prevention/specs/slash-commands/spec.md`

- [ ] 6.2 Add spec delta for plugin capability
  - New requirement: "Sub-Agent Work Tracking"
  - New requirement: "Failure Counter Reset on Success"
  - New requirement: "Convergence State Management"
  - File: `openspec/changes/harden-loop-prevention/specs/plugin/spec.md`

### Phase 7: Validation

- [ ] 7.1 Run `npm run check` in plugin directory
  - TypeScript compilation
  - ESLint checks
  - Prettier formatting

- [ ] 7.2 Test loop prevention manually
  - Run openspec-audit and verify no infinite phases
  - Run openspec-review and verify synthesis terminates
  - Run goost-slop-scan and verify no duplicate findings

- [ ] 7.3 Run openspec validate
  - `openspec validate harden-loop-prevention --strict`
