# Tasks: Add /openspec-refactor Command

## 1. Command Infrastructure

- [x] 1.1 Create `.opencode/command/openspec-refactor.md` with frontmatter and structure
  - Verify: File exists with correct YAML frontmatter (name, description, agent: general)
  
- [x] 1.2 Add target resolution protocol (state-changing operation pattern)
  - Verify: Handles empty arguments, single change, multiple changes, invalid target

- [x] 1.3 Add flag parsing (--dry-run default, --execute, --interactive)
  - Verify: Flags are parsed correctly from $ARGUMENTS

- [x] 1.4 Implement error handling for system prerequisites
  - Verify: Correct error when `openspec` CLI is missing or fails
  - Verify: Warning displayed when proposal was recently modified (<24h)

## 2. Phase 1: Staleness Analysis Sub-Agents

- [x] 2.1 Implement Codebase Drift Scanner
  - [x] Define sub-agent prompt with tiered detection strategy (SHA-256 → Metadata → TLSH)
  - [x] Verify JSON output with moved files and minor edits
  
- [x] 2.2 Implement Dependency Scanner
  - [x] Implement local `outdated` check
  - [x] Define sub-agent prompt for Context7 pattern analysis
  - [x] Verify handling of Context7 unavailability
  
- [x] 2.3 Implement Conflict Scanner
  - [x] Implement capability-based directory filtering
  - [x] Define sub-agent prompt for deep semantic analysis
  - [x] Verify detection of overlapping archived changes
  
- [x] 2.4 Implement Task Validator
  - [x] Implement file/function reference extraction from tasks.md
  - [x] Define sub-agent prompt for validation and suggestions
  - [x] Verify identification of orphaned tasks
 
- [x] 2.5 Implement Obsolescence Detector
  - [x] Implement path-based filtering (exclude tests, mocks)
  - [x] Define sub-agent prompt with behavioral grounding (tests) and LLM discriminator
  - [x] Verify classification (POSSIBLY_OBSOLETE vs PARTIALLY_IMPLEMENTED)

 
## 3. Phase 2: Synthesis

- [x] 3.1 Implement sub-agent result collection and error handling
  - Verify: Handles timeout, empty response, invalid JSON gracefully

- [x] 3.2 Implement severity classification logic
  - CRITICAL: Proposal fundamentally invalid
  - MAJOR: Significant updates needed
  - MINOR: Cosmetic updates
  - Verify: Correct classification based on finding types

- [x] 3.3 Implement cross-reference analysis
  - Verify: Links related findings (e.g., moved file affects task)

- [x] 3.4 Implement staleness summary generation
  - Verify: Shows age, finding counts, and confidence-grouped summary

- [x] 3.5 Implement structured logging
  - [x] Add logging for sub-agent lifecycle (spawn, return, error)
  - [x] Add logging for synthesis decisions and severity classification
  - [x] Add logging for file modifications during refactoring
  - Verify: Logs appear in debug output with correct levels
 
## 4. Phase 3: Refactoring (Contract-Enforced)

- [x] 4.1 Implement Intent Verification Gate (Approval Gate)
  - Pattern: Detect contradiction, emit [GOOST:MIC], use mcp_question
  - Verify: Blocks refactoring until intent is confirmed

- [x] 4.2 Implement contract generation from findings
  - Verify: Contract criteria match detected staleness types

- [x] 4.3 Implement spec delta updater
  - Update file references to current paths
  - Add notes for obsolete requirements
  - Verify: Changes are minimal and preserve intent

- [x] 4.4 Implement tasks.md updater
  - Update file paths in tasks
  - Add tasks for newly discovered work
  - Mark tasks as invalid if unfixable
  - Verify: Task structure preserved, only references updated

- [x] 4.5 Implement proposal.md updater
  - Update "Affected code" section
  - Add "Refactored on" timestamp
  - Note any scope changes
  - Verify: Metadata accurate, impact section current

## 5. Phase 4: Validation

- [x] 5.1 Run `openspec validate <target> --strict`
  - Verify: Command executes without errors

- [x] 5.2 Implement validation error handling
  - Retry fixes for validation failures
  - Verify: Errors surfaced clearly with suggested fixes

## 6. Phase 5: Final Report

- [x] 6.1 Implement change summary display
  - Group changes by confidence level (✅ High | ⚠️ Review)
  - Show Reasoning Snippets for each change
  - Verify: All changes visible and understandable

- [x] 6.2 Implement rollback guidance
  - Provide `git restore .` command
  - Verify: Command is correct for the modified files

- [x] 6.3 Implement completion banner
  - Verify: Standard format with result summary

## 7. Testing & Documentation

- [x] 7.1 Manual test with a known stale proposal
  - Create a proposal, modify codebase, run refactor
  - Verify: Detects changes and updates correctly

- [x] 7.2 Update goost_instructions.md to include /openspec-refactor in command list
  - Verify: Command appears in "Available Commands" section

- [x] 7.3 Update README.md command table
  - Verify: Description matches actual behavior
