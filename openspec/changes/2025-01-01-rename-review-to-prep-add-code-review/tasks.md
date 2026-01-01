# Tasks

## Phase 1: Command Rename

- [ ] Rename `.opencode/command/openspec-review.md` to `.opencode/command/openspec-prep.md`
- [ ] Update command metadata (name, description) in `openspec-prep.md`
- [ ] Update any internal references to "review" in the prep command content

## Phase 2: New Code Review Command

- [ ] Create `.opencode/command/openspec-review.md` with new code review implementation
- [ ] Implement Phase 1: Discovery sub-agent prompts
  - [ ] Requirement Traceability Scanner
  - [ ] Logic & Edge Case Scanner
  - [ ] Security Review Scanner
  - [ ] Architecture Conformance Scanner
- [ ] Implement Phase 2: Synthesis logic in main agent
- [ ] Implement Phase 3: Remediation sub-agent prompts
- [ ] Define structured output format

## Phase 3: Documentation Updates

- [ ] Update `goost_instructions.md` command table
  - [ ] Change `/openspec-review` description to code review
  - [ ] Add `/openspec-prep` with current review description
- [ ] Update `README.md` command documentation
  - [ ] Update command table
  - [ ] Update workflow description if present

## Phase 4: Spec Updates

- [ ] Update `openspec/specs/slash-commands/spec.md`
  - [ ] Modify "OpenSpec Review Command" requirement to reflect rename
  - [ ] Add new "OpenSpec Prep Command" requirement
  - [ ] Add new "OpenSpec Code Review Command" requirement with scenarios

## Phase 5: Validation

- [ ] Run `openspec validate 2025-01-01-rename-review-to-prep-add-code-review --strict`
- [ ] Manual test `/openspec-prep` command (should work like old review)
- [ ] Manual test `/openspec-review` command on a sample change
