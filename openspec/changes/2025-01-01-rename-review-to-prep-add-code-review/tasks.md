# Tasks

## Phase 1: Command Rename

- [x] Rename `.opencode/command/openspec-review.md` to `.opencode/command/openspec-prep.md`
- [x] Update command metadata (name, description) in `openspec-prep.md`
- [x] Update any internal references to "review" in the prep command content

## Phase 2: New Code Review Command

- [x] Create `.opencode/command/openspec-review.md` with new code review implementation
- [x] Implement Phase 1: Discovery sub-agent prompts
  - [x] Requirement Traceability Scanner prompt
  - [x] Logic & Edge Case Scanner prompt
  - [x] Security Review Scanner prompt
  - [x] Architecture Conformance Scanner prompt
- [x] Implement Phase 2: Synthesis logic in main agent
  - [x] Aggregate findings by severity
  - [x] Cross-reference and deduplicate findings
  - [x] Determine overall verdict
- [x] Implement Phase 3: Remediation sub-agent prompts
  - [x] Fix sub-agent template
  - [x] Fix validation logic
  - [x] Rollback guidance output
- [x] Implement error handling
  - [x] Sub-agent timeout handling
  - [x] Partial failure handling (some sub-agents succeed)
  - [x] Invalid response handling
  - [x] All sub-agents fail scenario
- [x] Define structured output format

## Phase 3: Documentation Updates

- [x] Update `goost_instructions.md` command table
  - [x] Change `/openspec-review` description to code review
  - [x] Add `/openspec-prep` with pre-implementation validation description
- [x] Update `README.md` command documentation
  - [x] Update command table
  - [x] Update workflow description if present
  - [x] Add migration notes for breaking change

## Phase 4: Spec Updates

- [x] Update `openspec/specs/slash-commands/spec.md`
  - [x] Rename "OpenSpec Review Command" requirement to "OpenSpec Prep Command"
  - [x] Add new "OpenSpec Code Review Command" requirement with scenarios
  - [x] Add sub-agent orchestration requirement with error scenarios
  - [x] Add report format requirement
  - [x] Add workflow integration requirement

## Phase 5: Validation

- [x] Run `openspec validate 2025-01-01-rename-review-to-prep-add-code-review --strict`
- [ ] Manual test `/openspec-prep` command (should work like old review)
- [ ] Manual test `/openspec-review` command on a sample change
- [ ] Test error scenarios (timeout, partial failure) if possible
