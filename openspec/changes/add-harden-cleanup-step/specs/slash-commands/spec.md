## ADDED Requirements

### Requirement: Cleanup Execution Phase

The `/openspec-harden` command SHALL include a cleanup execution phase that removes temporary artifacts, scratch files, and session-created files after remediation completes.

<!-- Research: Phase ordering validated against Jenkins cleanup post-condition and Maven post-integration-test pattern -->

#### Scenario: Cleanup phase executes after remediation
- **GIVEN** the hardening analysis and remediation phases have completed
- **WHEN** the cleanup execution phase begins
- **THEN** the command SHALL identify files for removal based on:
  - Files flagged by the Cleanup Scanner in Phase 1
  - New untracked files detected via `git status` comparison (before/after remediation)
  - Extension-based temp patterns (*.tmp, *.bak, *.orig, *~)
- **AND** display the files that would be deleted (preview mode)
- **AND** require `--execute` flag to actually delete files
- **AND** report all cleanup actions in the final report

#### Scenario: Preview mode is default (dry-run pattern)
- **GIVEN** files have been identified for cleanup
- **WHEN** the command runs without `--execute` flag
- **THEN** the command SHALL display:
  - List of files that would be deleted
  - Reason each file was flagged
  - Total count and estimated size
- **AND** display: "Run with --execute to delete these files, or --interactive to select individually"
- **AND** NOT delete any files

<!-- Research: Dry-run-first pattern recommended by clig.dev and common in rsync, git clean, aws cli -->

#### Scenario: Execute mode deletes files
- **GIVEN** files have been identified for cleanup
- **WHEN** user invokes `/openspec-harden <change-id> --execute`
- **THEN** the command SHALL delete all identified cleanup files
- **AND** report each file deleted with its path
- **AND** report total bytes removed

#### Scenario: Interactive selection mode
- **GIVEN** files have been identified for cleanup
- **WHEN** user invokes `/openspec-harden <change-id> --interactive`
- **THEN** the command SHALL present numbered list of files
- **AND** prompt: "Select items to delete (e.g., 1-3,5,7):"
- **AND** delete only selected files
- **AND** report which files were deleted vs skipped

<!-- Research: Pattern matches git clean -i interactive mode -->

#### Scenario: Session artifact detection via git
- **GIVEN** the remediation phase spawned sub-agents that may have created files
- **WHEN** the cleanup phase executes
- **THEN** the command SHALL compare `git status --porcelain` before and after remediation
- **AND** identify new untracked files as session artifacts
- **AND** filter session artifacts through temp file patterns
- **AND** include matching files in the cleanup candidate list

<!-- Research: Git-based tracking is simpler and more reliable than custom manifest files -->

#### Scenario: No files to clean
- **GIVEN** the cleanup identification finds no artifacts
- **WHEN** the cleanup phase completes
- **THEN** the command SHALL report "No cleanup needed - workspace is clean"
- **AND** proceed to final report without prompting

#### Scenario: Skip cleanup with flag
- **GIVEN** user invokes `/openspec-harden <change-id> --no-cleanup`
- **WHEN** the command executes
- **THEN** the cleanup execution phase SHALL be skipped entirely
- **AND** the final report SHALL note "Cleanup skipped (--no-cleanup flag)"
- **AND** detected artifacts SHALL still be listed for reference

<!-- Research: --no-X pattern follows GNU Coding Standards, consistent with git, npm, docker -->

#### Scenario: Force mode for scripting
- **GIVEN** the command is run in a CI/CD or scripted context
- **WHEN** user invokes `/openspec-harden <change-id> --execute --force`
- **THEN** the command SHALL delete files without any prompts
- **AND** exit with non-zero status if cleanup fails

<!-- Research: clig.dev recommends --force flag for scriptability -->

#### Scenario: Cleanup actions in final report
- **GIVEN** cleanup has been executed (or skipped)
- **WHEN** generating the final report
- **THEN** the report SHALL include a "CLEANUP ACTIONS" section showing:
  - Files deleted (with paths)
  - Files identified but not deleted (with reason: preview mode, --no-cleanup, etc.)
  - Total bytes/files removed (if executed)

#### Scenario: File deletion fails due to permissions
- **GIVEN** files have been identified for cleanup
- **AND** one or more files cannot be deleted (permission denied, locked by another process)
- **WHEN** user invokes `/openspec-harden <change-id> --execute`
- **THEN** the command SHALL continue deleting other files
- **AND** report the failed deletions with error reason
- **AND** exit with non-zero status if any deletions failed
- **AND** include failed files in the "CLEANUP ACTIONS" report section

#### Scenario: Git status command fails during session tracking
- **GIVEN** the remediation phase has completed
- **WHEN** running `git status --porcelain` fails (not a git repo, git not installed, corrupted .git)
- **THEN** the command SHALL skip session artifact detection
- **AND** proceed with cleanup candidates from Phase 1 (Cleanup Scanner) only
- **AND** note in the report: "Session artifact detection skipped - git status unavailable"

#### Scenario: Files changed between preview and execute
- **GIVEN** user ran `/openspec-harden <change-id>` and saw preview
- **AND** user subsequently runs `/openspec-harden <change-id> --execute`
- **WHEN** the cleanup phase executes
- **THEN** the command SHALL re-scan for cleanup candidates (fresh detection)
- **AND** delete the current set of identified files (not the previewed set)
- **AND** note if the file count differs from a previous preview

## MODIFIED Requirements

### Requirement: Cleanup Analysis

The harden command SHALL identify artifacts that should be removed or cleaned up, using extension-based patterns and git-based detection rather than semantic filename patterns.

<!-- Research: Removed fix-*.sh, migrate-*.py patterns due to high false positive risk with legitimate permanent tools -->

#### Scenario: Detect obsolete files
- **GIVEN** the change refactors or replaces existing code
- **WHEN** performing cleanup analysis
- **THEN** the command SHALL identify:
  - Files that were replaced but not deleted
  - Backup files (*.bak, *.orig, *.old, *~, *.swp)
  - Temporary files (*.tmp, *.temp)
- **AND** suggest removal for each

#### Scenario: Detect dead imports
- **GIVEN** the change modifies TypeScript/JavaScript files
- **WHEN** performing cleanup analysis
- **THEN** the command SHALL check for:
  - Unused imports
  - Imports from deleted modules
- **AND** flag these for removal

#### Scenario: Detect orphaned test files
- **GIVEN** the change removes source files
- **WHEN** performing cleanup analysis
- **THEN** the command SHALL check if corresponding test files still exist
- **AND** flag orphaned tests for removal or update

#### Scenario: Check for development artifacts
- **GIVEN** the change adds new directories or files
- **WHEN** performing cleanup analysis
- **THEN** the command SHALL flag:
  - POC directories that should be archived or removed
  - Scratch files or experiments in temp directories (tmp/, scratch/, _temp/)
  - Large binary files that should be in .gitignore
- **AND** suggest appropriate action for each

#### Scenario: Detect explicitly marked one-time files
- **GIVEN** the change includes scripts or utilities
- **WHEN** performing cleanup analysis
- **THEN** the command SHALL flag files with explicit temporary markers:
  - Files with `ONETIME-` or `DELETE-AFTER-` prefix
  - Files containing `# ONETIME:` or `# DELETE AFTER:` header comments
  - Files in directories named `_onetime/` or `_cleanup/`
- **AND** mark these for removal in the cleanup execution phase

<!-- Research: Explicit markers are safer than inferring intent from generic names like fix-* -->

#### Scenario: Report cleanup summary
- **GIVEN** cleanup analysis is complete
- **WHEN** generating the cleanup section
- **THEN** the report SHALL include:
  - Count of backup/temp files detected (by extension)
  - Count of explicitly marked one-time files
  - Count of dead imports found
  - List of items requiring cleanup action
  - Estimated lines of dead code (if detectable)
