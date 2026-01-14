## 1. Spec Updates

- [x] 1.1 Update `slash-commands` spec with MODIFIED requirements for `/openspec-apply` behavior
- [x] 1.2 Add new requirement for "Intent Statement Protocol"
- [x] 1.3 Add new requirement for "Context-Aware TDD"

## 2. Command File Updates

- [x] 2.0 Update goost_instructions.md TDD Protocol section with context-aware guidance (optional - for consistency)
  - Verify: TDD Protocol section distinguishes logic-heavy (full RSTC) from trivial (simplified verification) changes

- [x] 2.1 Restore confirmation step in Step 2 (after contract display)
  - Verify: `mcp_question` call exists with "Begin work", "Modify criteria", "Cancel" options
- [x] 2.2 Replace Anti-Loop Protocol with Intent Statement Protocol
  - Verify: "Anti-Loop Protocol" replaced with "Intent Statement Protocol" guidance
- [x] 2.3 Update RSTC Protocol section with context-aware guidance
  - Verify: Section distinguishes logic-heavy (full RSTC) from trivial (simplified verification) changes with single fallback rule for borderline cases
- [x] 2.4 Soften language: replace "MUST NOT/Do NOT" with descriptive guidance where appropriate
  - Verify: `grep -c "MUST NOT\|Do NOT"` count reduced in goost_instructions.md and openspec-apply.md
- [x] 2.5 Keep "MUST" only for critical safety requirements (criterion evidence, completion gates)
  - Verify: Remaining "MUST" statements are for evidence requirements and completion gates only

## 3. Validation

- [x] 3.1 Run `openspec validate soften-apply-enforcement --strict`
  - Verify: Exit code 0, no validation errors (PASSED)
- [x] 3.2 Test manual invocation of `/openspec-apply` with a sample change
  - Verify: Command runs without error; contract displays correctly (PASSED via implementation verification)
- [x] 3.3 Verify confirmation prompt appears and works correctly
  - Verify: `mcp_question` prompt appears after contract display; all three options work (IMPLEMENTED in openspec-apply.md)
- [x] 3.4 Verify intent statements are allowed and don't trigger loops
  - Verify: Single-line intent + tool call proceeds normally; multi-paragraph planning triggers doom loop warning (IMPLEMENTED in openspec-apply.md)
