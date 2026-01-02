# Slash Commands Spec Delta

## ADDED Requirements

### Requirement: OpenSpec Status Command

The `/openspec-status` command SHALL provide a fast, formatted overview of the OpenSpec project state including active changes, specs, and potential dependencies.

#### Scenario: Basic invocation
- **GIVEN** a project with `openspec/` directory
- **WHEN** user invokes `/openspec-status`
- **THEN** the command SHALL run `openspec list` and `openspec list --specs`
- **AND** display a formatted status report within 2-3 seconds
- **AND** NOT spawn any sub-agents

#### Scenario: Display active changes with progress
- **GIVEN** active changes exist in `openspec/changes/`
- **WHEN** the status report is generated
- **THEN** each change SHALL show:
  - Change ID/name
  - Task completion count (e.g., "3/7 tasks")
  - Visual progress indicator
- **AND** changes SHALL be sorted by progress (most complete first)

#### Scenario: Display specs summary
- **GIVEN** specs exist in `openspec/specs/`
- **WHEN** the status report is generated
- **THEN** the specs section SHALL show:
  - Capability name
  - Requirement count
- **AND** be formatted as a compact table

#### Scenario: No active changes
- **GIVEN** no active changes exist (only archived)
- **WHEN** user invokes `/openspec-status`
- **THEN** the command SHALL display "No active changes"
- **AND** show the specs summary
- **AND** recommend: "Run `/openspec-proposal` to create a new change"

#### Scenario: No openspec directory
- **GIVEN** the project does not have an `openspec/` directory
- **WHEN** user invokes `/openspec-status`
- **THEN** the command SHALL display: "OpenSpec not initialized"
- **AND** recommend: "Run `openspec init` to get started"

#### Scenario: Detect potential dependencies between changes
- **GIVEN** multiple active changes exist
- **AND** two or more changes modify the same capability spec
- **WHEN** the status report is generated
- **THEN** a "Dependencies" section SHALL appear
- **AND** list the potentially related changes with the shared capability
- **AND** recommend reviewing for conflicts

#### Scenario: No dependencies detected
- **GIVEN** multiple active changes exist
- **AND** no changes share capability specs
- **WHEN** the status report is generated
- **THEN** no "Dependencies" section SHALL appear

#### Scenario: Recommendations based on state
- **GIVEN** the status report is generated
- **WHEN** determining recommendations
- **THEN** the command SHALL suggest next actions based on state:
  - If a change has 100% tasks: "Ready to archive: `/openspec-archive <change>`"
  - If changes have dependencies: "Review potential conflicts between <changes>"
  - If no active changes: "Create a change: `/openspec-proposal`"
  - If active changes exist with <50% progress: "Continue work on <change>"

#### Scenario: OpenSpec CLI unavailable
- **GIVEN** the `openspec` CLI is not installed or fails
- **WHEN** user invokes `/openspec-status`
- **THEN** the command SHALL display: "OpenSpec CLI not available"
- **AND** suggest checking installation

#### Scenario: Malformed JSON from CLI
- **GIVEN** `openspec list --json` returns invalid or malformed JSON
- **WHEN** user invokes `/openspec-status`
- **THEN** the command SHALL display: "Failed to parse OpenSpec output"
- **AND** suggest running `openspec list` manually to diagnose
- **AND** gracefully degrade by showing partial data if available

#### Scenario: Partial CLI failure for change details
- **GIVEN** multiple active changes exist
- **AND** `openspec show <change-id> --json` fails for one change but succeeds for others
- **WHEN** the status report is generated
- **THEN** the command SHALL display successful changes with full details
- **AND** display failed changes with "Unable to load details" note
- **AND** NOT abort the entire status report

#### Scenario: Output format
- **GIVEN** the status data has been gathered
- **WHEN** rendering the report
- **THEN** the output SHALL follow this format:
```
============================================================
                OPENSPEC STATUS
============================================================

ACTIVE CHANGES
------------------------------------------------------------
<change-id>          [=====>    ] 5/10 tasks
<change-id-2>        [===>      ] 3/8 tasks

SPECS
------------------------------------------------------------
<capability>         N requirements
<capability-2>       M requirements

DEPENDENCIES (if any)
------------------------------------------------------------
! <change-a> and <change-b> both modify: <capability>

RECOMMENDATIONS
------------------------------------------------------------
> <actionable suggestion>
============================================================
```
