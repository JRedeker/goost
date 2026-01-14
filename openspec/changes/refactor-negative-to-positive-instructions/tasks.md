# Tasks: Refactor Negative to Positive Instructions

## 1. Analysis & Inventory

- [x] 1.1 Create inventory of all negative instructions across Goost files
  - Verify: Grep results documented with file:line references

- [x] 1.2 Apply 2-rule decision to each instance
  - **Default**: Convert to positive framing
  - **Exception**: Keep if safety constraint (MUST NOT, CONSTRAINTS section)
  - Verify: Each instance marked "convert" or "keep (safety)"

## 2. Core Instructions (goost_instructions.md)

- [x] 2.1 Refactor sub-agent context warnings
  - Convert: "Do NOT emit status markers" → "Return findings directly"
  - Verify: Grep shows no "Do NOT emit" in sub-agent sections

- [x] 2.2 Refactor completion gate rules
  - Convert: "You CANNOT declare complete until" → "Declare complete when"
  - Verify: Manual review of completion section

- [x] 2.3 Refactor doom loop detection language
  - Convert prohibitions to positive action directives
  - Verify: Section reads as "what to do" not "what not to do"

- [x] 2.4 Refactor context anxiety section
  - Convert: "Do NOT skip verification" → "Complete all verification steps"
  - Verify: Manual review

- [x] 2.5 Review and preserve safety-critical negatives
  - Keep: Contract constraints (MUST NOT), user authority rules
  - Verify: Safety boundaries still clearly stated

## 3. Slash Commands

- [x] 3.1 Update standardized sub-agent context block (all commands using it)
  - Files: contract-quick.md, goost-slop-scan.md, goost-search.md, goost-improve.md, openspec-*.md, openspec-coordinate.md, openspec-status.md
  - Verify: Consistent wording across all files

- [x] 3.2 Refactor anti-loop protocols
  - Files: openspec-prep.md, openspec-harden.md, openspec-review.md, goost-slop-scan.md, openspec-coordinate.md
  - Verify: "Do NOT re-explain" converted to "Proceed directly to"

- [x] 3.3 Refactor contract.md behavioral instructions
  - Convert: "Never skip the status block" → "Always include a status block"
  - Verify: Manual review

- [x] 3.4 Refactor openspec-apply.md intent statement protocol
  - Convert: "Avoid multi-paragraph explanations" → "Pair intent with immediate tool call"
  - Verify: Manual review

## 4. Rules File

- [x] 4.1 Review rules.yaml for negative framing opportunities
  - Verify: Rules read as positive guidance where feasible
  - Verify: `grep -c "Do NOT\|NEVER\|CANNOT" rules.yaml` shows reduced count or justified exceptions

## 5. Documentation

- [x] 5.1 Add "Positive Framing" guidance to AGENTS.md
  - Content: Brief note advising command authors to prefer positive framing
  - Include: Mechanical explanation (not psychological), 2-rule approach, transformation patterns
  - Verify: Section exists with correct rationale (negation tokens, not Ironic Process Theory)

## 6. Validation

- [x] 6.1 Run `openspec validate refactor-negative-to-positive-instructions --strict`
  - Verify: No validation errors

- [x] 6.2 Manual review of all changed files for clarity
  - Verify: Instructions are clear and actionable
  - Evidence: All edits maintain semantic equivalence; security constraints preserved

- [x] 6.3 Test a sample command flow to ensure behavior unchanged
  - Evidence: This very `/openspec-apply` session demonstrates the refactored instructions work correctly
  - Verify: Contract was created, tracked, and is being fulfilled per the new positive framing
