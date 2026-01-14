# Tasks: Add Cleanup Step to /openspec-harden

## 1. Update Spec
- [x] 1.1 Add "Requirement: Cleanup Execution Phase" to slash-commands spec
- [x] 1.2 Add scenarios for extension-based temp file detection (*.tmp, *.bak, etc.)
- [x] 1.3 Add scenarios for git-based session artifact tracking
- [x] 1.4 Add scenarios for `--no-cleanup`, `--execute`, `--interactive`, `--force` flags
- [x] 1.5 Revise pattern detection to use explicit markers instead of risky prefix patterns

## 2. Update Command Implementation
- [x] 2.1 Add Phase 4: Cleanup Execution after remediation phase
- [x] 2.2 Implement git status snapshot before/after remediation for session tracking
- [x] 2.3 Implement preview mode as default (dry-run pattern)
- [x] 2.4 Add `--execute` flag to trigger actual deletion
- [x] 2.5 Add `--interactive` flag for numbered selection (git clean -i pattern)
- [x] 2.6 Add `--force` flag for scriptability (no prompts)
- [x] 2.7 Update final report to include "CLEANUP ACTIONS" section
- [x] 2.8 Implement extension-based pattern matching (*.tmp, *.bak, *.orig, *~)
- [x] 2.9 Implement explicit marker detection (ONETIME-, DELETE-AFTER-, # ONETIME:)

## 3. Validation
- [ ] 3.1 Run `openspec validate add-harden-cleanup-step --strict`
- [ ] 3.2 Manual test: verify preview mode shows files without deleting
- [ ] 3.3 Manual test: verify --execute deletes identified files
- [ ] 3.4 Manual test: verify --interactive allows selection
- [ ] 3.5 Manual test: verify --no-cleanup skips phase entirely
- [ ] 3.6 Manual test: verify git status diffing detects session artifacts
