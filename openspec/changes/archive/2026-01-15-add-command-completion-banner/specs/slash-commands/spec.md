## ADDED Requirements

### Requirement: Command Completion Banner

All OpenSpec slash commands SHALL emit a standardized completion banner when they finish execution, making command boundaries visually scannable in conversation history.

#### Scenario: Contract-based command completion
- **GIVEN** a contract-based command has finished
- **WHEN** the CONTRACT FULFILLED block has been emitted
- **THEN** the command SHALL emit a completion banner immediately after
- **AND** there SHALL be exactly one blank line between CONTRACT FULFILLED and the banner
- **AND** the banner header SHALL contain the command name, target, and "COMPLETE" (e.g., "/openspec-apply add-feature-x COMPLETE")
- **AND** the banner SHALL include a "Next" suggestion for follow-up action

#### Scenario: Read-only command completion
- **GIVEN** a read-only command (`/openspec-status`, `/openspec-roadmap`) has finished
- **WHEN** the output has been displayed
- **THEN** the command MAY emit a minimal completion banner
- **AND** the minimal banner SHALL contain only the header line with command name and "COMPLETE"

#### Scenario: Banner format structure
- **GIVEN** a completion banner is being emitted
- **WHEN** formatting the banner
- **THEN** the banner SHALL use the standard Goost delimiter style (`============...`)
- **AND** the header SHALL be centered with the pattern `/<command-name> COMPLETE`
- **AND** the banner SHALL be grep-friendly (searchable for "COMPLETE" or command name)
- **AND** the Duration field SHALL be omitted when duration tracking is unavailable or command ran < 30 seconds

#### Scenario: User scans conversation for command completion
- **GIVEN** a user is scrolling through conversation history
- **WHEN** they search for where a specific command completed
- **THEN** they SHALL find a visually distinct banner with the command name
- **AND** the banner SHALL be distinguishable from CONTRACT FULFILLED blocks
- **AND** the banner SHALL indicate what the command accomplished

### Requirement: Analysis Commands Contract Flow

Analysis commands (`/openspec-review`, `/openspec-harden`, `/openspec-audit`, `/openspec-research`) that offer to apply fixes SHALL use contract tracking for the remediation phase.

#### Scenario: Analysis with fixes requested
- **GIVEN** an analysis command has completed its analysis phase
- **AND** the report identifies issues requiring fixes
- **WHEN** the user confirms they want fixes applied (via mcp_question)
- **THEN** the command SHALL establish a CONTRACT ACTIVE with fix criteria
- **AND** track each fix to completion
- **AND** emit CONTRACT FULFILLED when all fixes are verified
- **AND** emit the completion banner after CONTRACT FULFILLED

#### Scenario: Analysis with no fixes needed
- **GIVEN** an analysis command has completed its analysis phase
- **WHEN** the report shows no issues (e.g., "APPROVED" verdict)
- **THEN** the command SHALL skip the contract phase
- **AND** emit the completion banner directly after the report

#### Scenario: Analysis with fixes declined
- **GIVEN** an analysis command has completed its analysis phase
- **AND** issues were identified
- **WHEN** the user declines to apply fixes (via mcp_question)
- **THEN** the command SHALL skip the contract phase
- **AND** emit the completion banner with result "Report only - no fixes applied"

#### Scenario: Fix contract criteria
- **GIVEN** an analysis command is establishing a fix contract
- **WHEN** deriving success criteria
- **THEN** each identified issue SHALL become a criterion
- **AND** criteria SHALL be marked complete only when the fix is verified
- **AND** verification SHALL include re-running relevant checks (build, lint, test)

#### Scenario: Contract voided mid-remediation
- **GIVEN** a fix contract is active during remediation phase
- **WHEN** the user voids the contract mid-remediation
- **THEN** the command SHALL emit a completion banner with result "CONTRACT VOIDED"
- **AND** the banner SHALL note that partial fixes may have been applied
- **AND** the command SHALL suggest reviewing changes with `git diff`
