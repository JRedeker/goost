# Change: Add Automatic Commit and Changelog on Contract Completion

## Why

When a contract is fulfilled, the work is done but not formally recorded. Without an automatic commit:
- Changes may remain uncommitted, risking loss
- Git history lacks clear markers of completed contract work
- No audit trail of what contracts delivered

This creates friction and reduces the reliability of the contract system as a task completion mechanism.

## What Changes

- **Automatic atomic commit**: When all contract criteria are verified, automatically stage all changes and create a commit
- **Conventional commit message**: Derive commit type (feat/fix/refactor/docs/chore) from contract objective
- **CHANGELOG.md entry**: Append entry to project root CHANGELOG.md in Keep a Changelog format
- **Instruction updates**: Add contract completion commit behavior to `goost_instructions.md`

## Impact

- Affected specs: `contract-system` (new capability area)
- Affected files:
  - `goost_instructions.md` - add completion commit instructions
  - `plugin/index.ts` - potentially detect commit needs (future enhancement)
- No breaking changes - this is additive behavior on contract fulfillment
