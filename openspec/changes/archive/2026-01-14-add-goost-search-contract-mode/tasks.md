# Tasks: Add Contract Conversion Mode to /goost-search

## Overview

Simplified from 37 to 15 tasks based on research validation findings.

Key simplifications:
- Single inline regex check (not separate scanning phase)
- Let non-actionable prompts fail naturally (extraction produces empty/minimal output)
- Reuse existing `/contract` semantics (no custom confirm/modify logic)
- Defer tool definition handling to v2
- Reduce testing to smoke tests only

## 1. Security Gate (inline, not separate phase)
- [x] 1.1 Add single regex pattern check before offering conversion
  - Pattern: `ignore\s+(previous|all)|disregard|forget\s+everything|override.*(system|instruction)|jailbreak|reveal.*prompt|show.*instructions`
  - Also check for base64 blocks >200 chars
- [x] 1.2 If pattern matches: display warning, block conversion, allow manual view only
- [x] 1.3 If pattern doesn't match: proceed to offer conversion

## 2. Conversion Offer
- [x] 2.1 Add question after prompt display: "Would you like me to convert this into a contract?"
- [x] 2.2 Options: "Yes, create a contract" / "No, I'll use it manually"
- [x] 2.3 Handle "No" - end command gracefully

## 3. Draft Contract Generation
- [x] 3.1 Analyze prompt and extract:
  - OBJECTIVE from purpose/title
  - SUCCESS CRITERIA from imperative instructions (behavioral goals only)
  - CONSTRAINTS from must/never/always statements
  - IMPLEMENTATION STEPS as numbered list
- [x] 3.2 Exclude shell commands, code execution, file ops from criteria
- [x] 3.3 Format as DRAFT CONTRACT with source reference
- [x] 3.4 Add review instructions: "Say 'confirm' to lock, describe changes to modify, or 'cancel'"

## 4. User Review (reuse /contract semantics)
- [x] 4.1 On "confirm": lock contract as CONTRACT ACTIVE
- [x] 4.2 On modification request: revise draft and re-present
- [x] 4.3 On "cancel": discard draft, note prompt still available

## 5. Testing (smoke tests)
- [ ] 5.1 Test: "ignore previous instructions" prompt is blocked
- [ ] 5.2 Test: Clean prompt offers conversion and generates valid draft
- [ ] 5.3 Test: "confirm" locks contract
- [ ] 5.4 Test: "cancel" discards draft

## Dependencies

- All tasks modify: `.opencode/command/goost-search.md`
- No TypeScript/plugin code changes required
- Uses existing Goost contract locking mechanism

## Deferred to v2

- Tool definition extraction from system prompts
- Long prompt (>100 lines) special handling
- Additional pattern detection sophistication
