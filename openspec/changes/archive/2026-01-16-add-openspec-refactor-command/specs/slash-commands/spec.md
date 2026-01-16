## ADDED Requirements

### Requirement: OpenSpec Refactor Command

The `/openspec-refactor` command SHALL refresh stale OpenSpec change proposals via **Bidirectional Reconciliation**, detecting codebase changes since proposal creation and updating spec deltas, tasks, and metadata while enforcing an **Intent Verification Gate** for significant behavior shifts.

#### Scenario: Basic invocation with change ID
- **GIVEN** an OpenSpec change `feature-x` exists in `openspec/changes/`
- **AND** the codebase has changed since the proposal was created
- **WHEN** user invokes `/openspec-refactor feature-x`
- **THEN** the command SHALL analyze the proposal for staleness across all dimensions
- **AND** output a structured refactoring report

#### Scenario: Intent Verification Gate (Approval Gate)
- **GIVEN** staleness detection identifies a code implementation that contradicts a core requirement
- **WHEN** refactoring phase begins
- **THEN** the command SHALL emit `[GOOST:MIC]` (Approval state)
- **AND** use `mcp_question` to ask the user: "Code implements [X], but requirement says [Y]. Is the code a new requirement or a bug?"
- **AND** proceed only after user confirms the intent

#### Scenario: Change not found
- **GIVEN** no OpenSpec change matches the provided ID
- **WHEN** user invokes `/openspec-refactor non-existent`
- **THEN** the command SHALL display an error: "Change 'non-existent' not found"
- **AND** suggest running `openspec list` to see available changes

#### Scenario: No argument provided with single active change
- **GIVEN** user invokes `/openspec-refactor` without arguments
- **AND** exactly one active change exists
- **WHEN** the command executes
- **THEN** the command SHALL use `mcp_question` to confirm: "Proceed with '<change-id>'?"
- **AND** wait for user confirmation before proceeding

#### Scenario: No argument provided with multiple active changes
- **GIVEN** user invokes `/openspec-refactor` without arguments
- **AND** multiple active changes exist
- **WHEN** the command executes
- **THEN** the command SHALL use `mcp_question` to present selection
- **AND** proceed with user's selection

#### Scenario: No active changes exist
- **GIVEN** user invokes `/openspec-refactor`
- **AND** no active changes exist
- **WHEN** the command executes
- **THEN** the command SHALL display: "No active changes found"
- **AND** suggest: "Run `/openspec-proposal` to create a new change"

#### Scenario: Dry-run mode (default)
- **GIVEN** user invokes `/openspec-refactor feature-x` without flags
- **WHEN** the analysis completes
- **THEN** the command SHALL display what changes would be made
- **AND** SHALL NOT modify any files
- **AND** suggest running with `--execute` to apply changes

#### Scenario: Execute mode
- **GIVEN** user invokes `/openspec-refactor feature-x --execute`
- **WHEN** staleness is detected
- **THEN** the command SHALL apply all detected fixes automatically
- **AND** establish a contract tracking each fix criterion
- **AND** present a summary with rollback guidance after completion

#### Scenario: Interactive mode
- **GIVEN** user invokes `/openspec-refactor feature-x --interactive`
- **WHEN** staleness is detected
- **THEN** the command SHALL present each category of updates separately
- **AND** use `mcp_question` to allow user to approve/skip each category
- **AND** apply only approved categories

### Requirement: Staleness Analysis Phase

The refactor command SHALL spawn parallel sub-agents to detect staleness across five dimensions using a **tiered detection strategy** to maximize confidence and minimize latency.

#### Scenario: Multi-pass codebase drift detection
- **GIVEN** the proposal spec references file `src/auth/login.ts`
- **AND** that file has been moved to `src/services/auth/login.ts`
- **WHEN** Phase 1: Staleness Analysis executes
- **THEN** the Codebase Drift Scanner SHALL perform tiered matching:
  - **Pass 1**: SHA-256 content hash (Exact match, 100% confidence)
  - **Pass 2**: Filename + Size + Path context (70% confidence)
  - **Pass 3**: TLSH / ssdeep fuzzy hashing (80-90% confidence)
- **AND** report the best match with evidence

#### Scenario: Local-first dependency scanning
- **GIVEN** the proposal design.md references library versions
- **WHEN** Phase 1: Staleness Analysis executes
- **THEN** the Dependency Scanner SHALL first run `npm outdated` (or equivalent)
- **AND** escalate only confirmed stale dependencies to Context7 for pattern analysis
- **AND** use ecosystem-prefixed resolution (e.g., `npm:react`) for 100% accuracy

#### Scenario: Capability-based conflict pruning
- **GIVEN** many archived changes exist in `openspec/changes/archive/`
- **WHEN** Phase 1: Staleness Analysis executes
- **THEN** the Conflict Scanner SHALL first filter archives by Capability-directory overlap
- **AND** perform deep semantic analysis only on overlapping archives

#### Scenario: Multi-signal obsolescence detection
- **GIVEN** the proposal spec includes requirements
- **WHEN** Phase 1: Staleness Analysis executes
- **THEN** the Obsolescence Detector SHALL use multi-signal validation:
  - **Path Filtering**: Exclude `/tests`, `__mocks__`, and `legacy/` paths
  - **Behavioral Grounding**: Search for passing unit tests as "Primary Evidence"
  - **LLM Discriminator**: Verify if candidate code satisfies ALL scenarios of the requirement
- **AND** report findings with confidence scores (🟢 High | 🟡 Medium | 🔴 Low)

#### Scenario: Context7 unavailable
- **GIVEN** Context7 MCP is not available or fails
- **WHEN** the Dependency Scanner attempts to check patterns
- **THEN** the scanner SHALL mark dependency analysis as SKIPPED
- **AND** note in the report that dependency verification was unavailable
- **AND** continue with other staleness dimensions

#### Scenario: Conflicting archived change detection
- **GIVEN** the proposal affects capability `user-auth`
- **AND** archived change `add-auth-system` also modified `user-auth`
- **WHEN** Phase 1: Staleness Analysis executes
- **THEN** the Conflict Scanner SHALL detect the overlap
- **AND** report the archived change ID and overlapping requirements

#### Scenario: Outdated task detection
- **GIVEN** task 2.3 in tasks.md references "Update `src/old/module.ts`"
- **AND** that file no longer exists
- **WHEN** Phase 1: Staleness Analysis executes
- **THEN** the Task Validator SHALL flag task 2.3 as INVALID
- **AND** suggest removal or provide alternative if similar file found

#### Scenario: Obsolescence detection - fully implemented
- **GIVEN** the proposal spec includes requirement "Add user email validation"
- **AND** the codebase already contains email validation in `src/validators/email.ts`
- **WHEN** Phase 1: Staleness Analysis executes
- **THEN** the Obsolescence Detector SHALL flag the requirement as POSSIBLY_OBSOLETE
- **AND** provide evidence: file path and relevant code snippet

#### Scenario: Obsolescence detection - partially implemented
- **GIVEN** the proposal spec includes requirement with 3 scenarios
- **AND** the codebase implements 2 of the 3 scenarios
- **WHEN** Phase 1: Staleness Analysis executes
- **THEN** the Obsolescence Detector SHALL flag the requirement as PARTIALLY_IMPLEMENTED
- **AND** identify which scenarios are implemented vs remaining

#### Scenario: Sub-agent timeout handling
- **GIVEN** a sub-agent exceeds the timeout threshold (5 minutes)
- **WHEN** the main agent is waiting for results
- **THEN** the command SHALL mark that dimension as TIMEOUT
- **AND** proceed with available results from other sub-agents
- **AND** note the timeout in the final report

#### Scenario: All sub-agents fail
- **GIVEN** all 5 sub-agents fail (timeout, error, or invalid response)
- **WHEN** attempting to proceed to synthesis
- **THEN** the command SHALL display: "Staleness analysis failed - all scanners encountered errors"
- **AND** suggest retrying or checking system status
- **AND** NOT proceed to refactoring phase

### Requirement: Synthesis Phase

The refactor command SHALL aggregate findings from all sub-agents, classify by severity, and generate a unified update plan.

#### Scenario: Severity classification - CRITICAL
- **GIVEN** sub-agents report that >80% of file references are invalid
- **OR** a core requirement is fully obsolete
- **WHEN** Phase 2: Synthesis executes
- **THEN** the finding SHALL be classified as CRITICAL
- **AND** the command SHALL suggest considering proposal abandonment

#### Scenario: Severity classification - MAJOR
- **GIVEN** sub-agents report moved files, API changes, or significant task invalidity
- **WHEN** Phase 2: Synthesis executes
- **THEN** findings SHALL be classified as MAJOR
- **AND** require updates to spec deltas and tasks

#### Scenario: Severity classification - MINOR
- **GIVEN** sub-agents report only cosmetic issues (path corrections, terminology)
- **WHEN** Phase 2: Synthesis executes
- **THEN** findings SHALL be classified as MINOR

#### Scenario: Cross-reference analysis
- **GIVEN** the Codebase Drift Scanner reports file `src/a.ts` moved to `src/b/a.ts`
- **AND** the Task Validator reports task 2.1 references `src/a.ts` as invalid
- **WHEN** Phase 2: Synthesis executes
- **THEN** the command SHALL link these findings
- **AND** generate a single update action that fixes both

#### Scenario: Staleness summary display
- **GIVEN** all sub-agents have reported
- **WHEN** generating the synthesis summary
- **THEN** the command SHALL display:
  - Proposal creation date and age in days
  - Finding counts by dimension
  - Overall staleness assessment (FRESH, STALE, VERY_STALE)

### Requirement: Refactoring Phase

The refactor command SHALL update spec deltas, tasks, and proposal metadata under contract enforcement when `--execute` flag is provided.

#### Scenario: Contract establishment
- **GIVEN** user runs `/openspec-refactor feature-x --execute`
- **AND** staleness findings exist
- **WHEN** Phase 3: Refactoring begins
- **THEN** the command SHALL establish a contract with criteria:
  - (R1) File references updated to match current paths
  - (R2) API patterns aligned with current library versions
  - (R3) Conflicting requirements resolved or noted
  - (R4) Tasks validated against current codebase
  - (R5) Obsolete requirements marked or removed
  - (R6) openspec validate --strict passes

#### Scenario: Spec delta file reference update
- **GIVEN** spec delta references `src/old/path.ts`
- **AND** Codebase Drift Scanner found it moved to `src/new/path.ts`
- **WHEN** refactoring executes
- **THEN** the command SHALL update the spec delta with new path
- **AND** add comment: `> Refactored: path updated from src/old/path.ts`

#### Scenario: Obsolete requirement handling
- **GIVEN** a requirement is flagged as POSSIBLY_OBSOLETE
- **WHEN** refactoring executes
- **THEN** the command SHALL add a note to the requirement:
  ```
  > **Note**: This requirement may already be implemented in `<file>`.
  > Review before implementation to avoid duplication.
  ```
- **AND** NOT remove the requirement (preserve for user review)

#### Scenario: Task update with new paths
- **GIVEN** task references invalid file path
- **AND** the file was found at a new location
- **WHEN** refactoring executes
- **THEN** the command SHALL update the task with the correct path
- **AND** preserve the task's checkbox state

#### Scenario: Task marked invalid when unfixable
- **GIVEN** task references a file that was deleted with no replacement
- **WHEN** refactoring executes
- **THEN** the command SHALL add `[INVALID]` prefix to the task
- **AND** add note explaining why the task is invalid

#### Scenario: Proposal metadata update
- **GIVEN** refactoring makes changes to spec deltas
- **WHEN** updating proposal.md
- **THEN** the command SHALL update "Affected code" section with current paths
- **AND** add "Last refactored" timestamp
- **AND** add "Refactoring notes" section if conflicts were found

### Requirement: Validation Phase

The refactor command SHALL validate the updated proposal using OpenSpec CLI.

#### Scenario: Successful validation
- **GIVEN** all refactoring changes have been applied
- **WHEN** Phase 4: Validation executes
- **THEN** the command SHALL run `openspec validate <change-id> --strict`
- **AND** report: "Validation passed"

#### Scenario: Validation failure with retry
- **GIVEN** initial validation fails due to formatting issues
- **WHEN** Phase 4: Validation executes
- **THEN** the command SHALL attempt to fix common issues (missing scenarios, malformed headers)
- **AND** retry validation up to 2 times
- **AND** report final status

#### Scenario: Validation failure unrecoverable
- **GIVEN** validation fails after retry attempts
- **WHEN** reporting results
- **THEN** the command SHALL list validation errors
- **AND** mark criterion (R6) as failed in contract status
- **AND** suggest manual fixes

### Requirement: Review Phase

The refactor command SHALL present a comprehensive summary of all changes with rollback guidance.

#### Scenario: Change summary format
- **GIVEN** refactoring has completed
- **WHEN** generating the final report
- **THEN** the command SHALL display:
  ```
  ============================================================
            REFACTOR REPORT: <change-id>
  ============================================================
  
  STALENESS SUMMARY:
    Proposal created: YYYY-MM-DD (N days ago)
    Last codebase change: YYYY-MM-DD
  
  FINDINGS BY DIMENSION:
    CODEBASE DRIFT                               [N issues]
    DEPENDENCY UPDATES                           [N issues]
    CONFLICTING CHANGES                          [N issues]
    OUTDATED TASKS                               [N issues]
    SPEC OBSOLESCENCE                            [N issues]
  
  CHANGES APPLIED (Summary by confidence):
    ✅ [N] High confidence updates (File moves, outdated tasks)
    ⚠️ [M] Manual review recommended (API shifts, obsolescence)
  
  REASONING SNIPPETS:
    - <file>: updated path from <old> to <new> because hash matched
    - <requirement>: marked partially obsolete; implementation found in <file>
  
  VALIDATION: [PASSED | FAILED with errors]
  
  ROLLBACK:
    git restore .
  
  ============================================================
  ```

#### Scenario: One-click rollback guidance
- **GIVEN** files were modified during refactoring
- **WHEN** displaying the final report
- **THEN** the command SHALL provide exactly `git restore .` as the rollback command

#### Scenario: No staleness detected
- **GIVEN** all sub-agents report no issues
- **WHEN** generating the report
- **THEN** the command SHALL display: "Proposal is current - no staleness detected"
- **AND** skip refactoring phase entirely
- **AND** suggest proceeding with `/openspec-apply <change-id>`

#### Scenario: Rollback guidance
- **GIVEN** files were modified during refactoring
- **WHEN** displaying rollback guidance
- **THEN** the command SHALL list all modified files
- **AND** provide git checkout command to revert all changes
- **AND** note that changes are unstaged

#### Scenario: Completion banner
- **GIVEN** refactoring has completed (success or dry-run)
- **WHEN** emitting the completion banner
- **THEN** the command SHALL output:
  ```
  ============================================================
        /openspec-refactor <change-id> COMPLETE
  ============================================================
  Result: <N findings | No staleness | Dry-run preview>
  ============================================================
  ```

### Requirement: Error Handling

The refactor command SHALL handle error conditions gracefully with actionable messages.

#### Scenario: OpenSpec CLI unavailable
- **GIVEN** the `openspec` CLI is not installed or fails
- **WHEN** user invokes `/openspec-refactor`
- **THEN** the command SHALL display: "OpenSpec CLI required for refactor command"
- **AND** suggest installation instructions

#### Scenario: Change has no spec deltas
- **GIVEN** the change directory exists but has no specs/ subdirectory
- **WHEN** attempting to analyze
- **THEN** the command SHALL display: "Change has no spec deltas to refactor"
- **AND** suggest running `/openspec-prep <change-id>` first

#### Scenario: Proposal recently modified
- **GIVEN** the proposal was modified within the last 24 hours
- **WHEN** user invokes `/openspec-refactor`
- **THEN** the command SHALL display a warning: "Proposal was recently modified"
- **AND** proceed with analysis (do not block)

### Requirement: Logging and Observability

The refactor command SHALL emit structured logs for all significant actions, including sub-agent spawns, findings detection, and file modifications, to aid debugging and audit trails.

#### Scenario: Sub-agent execution logging
- **GIVEN** Phase 1: Staleness Analysis begins
- **WHEN** each sub-agent is spawned
- **THEN** the command SHALL log the sub-agent type, target files, and start time
- **AND** log the completion status and finding count upon return
