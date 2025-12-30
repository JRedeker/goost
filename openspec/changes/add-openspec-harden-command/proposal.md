# Change: Add /openspec-harden Command

## Why

After implementing an OpenSpec change, there's often a gap between "tasks complete" and "production-ready." The current workflow lacks a systematic hardening step that verifies test coverage, implementation quality, documentation, and cleanup. Teams frequently ship code that passes basic criteria but lacks proper tests, leaves behind TODO comments, or forgets to remove obsolete files.

## What Changes

- Add `/openspec-harden <change-id>` slash command for post-implementation hardening
- Command analyzes a completed (or nearly completed) OpenSpec change
- Performs systematic checks across five hardening dimensions:
  1. **Test Coverage**: Verify tests exist for new/modified code
  2. **Implementation Quality**: Check for TODOs, FIXMEs, console.logs, incomplete error handling, hacky code patterns (magic numbers, deep nesting, ts-ignore), and AI slop (obvious comments, placeholders, over-abstraction, cargo-culted patterns)
  3. **Documentation**: Ensure READMEs, API docs, and inline comments are updated
  4. **Cleanup**: Identify obsolete files, dead code, and artifacts that should be removed
  5. **Spec Alignment**: Verify implementation matches spec requirements

## Impact

- Affected specs: `slash-commands`
- Affected code:
  - `.opencode/command/openspec-harden.md` (new file)
  - `goost_instructions.md` (documentation update)

## Rollback

Delete `.opencode/command/openspec-harden.md` and revert documentation changes.

## Success Criteria

- [x] Command correctly identifies the target change from argument
- [x] All five hardening dimensions are checked and reported
- [x] Report clearly indicates PASS/WARN/FAIL status per dimension
- [x] Actionable recommendations provided for each issue found
- [x] Command integrates with existing OpenSpec CLI for change context
