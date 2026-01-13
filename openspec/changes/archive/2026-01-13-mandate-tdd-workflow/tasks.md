# Tasks: Mandate TDD Workflow

## Phase 1: Rules & Instructions
- [x] Add `P24: tdd-first` to `rules.yaml`
- [x] Update `P11: lifecycle` and `P07: verify` in `rules.yaml`
- [x] Update `goost_instructions.md` with `TEST PLAN` mandate and TDD protocol

## Phase 2: Command Templates
- [x] Update `/contract` template in `.opencode/command/contract.md`
- [x] Update `/contract-quick` template in `.opencode/command/contract-quick.md`
- [x] Update `/openspec-apply` to emphasize TDD first

## Phase 3: Plugin Implementation
- [x] Add TDD evidence detection logic to `plugin/contract.ts`
  - Verify: Unit tests for evidence parsing
- [x] Implement test runner detection (exit code/regex) in `plugin/index.ts`
  - Verify: Plugin detects `npm test` exit codes
- [x] Add `TDD_RED` and `TDD_GREEN` markers to `plugin/types.ts`
  - Verify: Compilation passes
- [x] Implement TDD visual feedback (tab title/color) in `plugin/terminal.ts`
  - Verify: Tab title changes to `🧪 RED` on failure
- [x] Update contract fulfillment logic to enforce TDD evidence
  - Verify: `CONTRACT FULFILLED` fails if evidence is missing
- [x] Remove old file-order monitoring logic (if any was added)
  - Verify: Clean codebase

## Phase 4: Verification & Hardening
- [x] Run `npm run check` in `plugin/`
  - Verify: 0 errors
- [x] Update `/openspec-harden` to audit TDD sequence
  - Verify: `/openspec-harden` flags missing Red phases
- [x] Manual test: Verify `/contract` links Criteria to Test Plan
- [x] Manual test: Verify plugin detects Red/Green phases
- [x] Run `openspec validate mandate-tdd-workflow --strict`
  - Verify: PASSED
