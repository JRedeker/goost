## ADDED Requirements

### Requirement: Smart Target Resolution Protocol

All OpenSpec slash commands that operate on a specific change or spec target SHALL implement a standardized target resolution protocol using a two-priority algorithm with risk-based confirmation.

#### Scenario: Explicit target provided

- **GIVEN** a user invokes an OpenSpec command with an explicit target (e.g., `/openspec-apply feature-x`)
- **WHEN** the command processes the arguments
- **THEN** the command SHALL use the provided target directly
- **AND** validate it exists in the expected location (active changes, specs, or archive as appropriate)
- **AND** proceed with existing error handling if target is invalid

#### Scenario: No target provided, single active change exists, read-only operation

- **GIVEN** a user invokes a read-only OpenSpec command without a target (e.g., `/openspec-review`)
- **AND** exactly one active change exists in `openspec/changes/`
- **WHEN** the command processes the arguments
- **THEN** the command SHALL auto-proceed with that change
- **AND** display notification: "Using '<change-id>' (only active change)"
- **AND** proceed without requiring confirmation

#### Scenario: No target provided, single active change exists, state-changing operation

- **GIVEN** a user invokes a state-changing OpenSpec command without a target (e.g., `/openspec-apply`)
- **AND** exactly one active change exists in `openspec/changes/`
- **WHEN** the command processes the arguments
- **THEN** the command SHALL use `mcp_question` to confirm before proceeding:
  - header: "Confirm"
  - question: "Proceed with '<change-id>'?"
  - options: "Yes (Recommended)", "Cancel"
- **AND** proceed only if user confirms

#### Scenario: No target provided, multiple active changes exist

- **GIVEN** a user invokes an OpenSpec command without a target
- **AND** multiple active changes exist in `openspec/changes/`
- **WHEN** the command processes the arguments
- **THEN** the command SHALL use `mcp_question` to let user select:
  - header: "Select"
  - question: "Which change would you like to work with?"
  - options: list of active changes with task progress (e.g., "feature-x (3/8 tasks)")
- **AND** proceed with the user's selection

#### Scenario: No target provided, no active changes exist

- **GIVEN** a user invokes an OpenSpec command that requires a change target
- **AND** no active changes exist in `openspec/changes/`
- **WHEN** the command processes the arguments
- **THEN** the command SHALL display: "No active changes found"
- **AND** suggest running `/openspec-proposal` to create a new change

## MODIFIED Requirements

### Requirement: The `/openspec-apply` command SHALL implement an approved OpenSpec change under contract enforcement, with smart target resolution when no target is explicitly provided.

The `/openspec-apply` command SHALL implement an approved OpenSpec change under contract enforcement. When no target is provided, it SHALL use the Smart Target Resolution Protocol (state-changing variant) to determine which change to apply.

#### Scenario: Apply invoked without arguments, single change exists

- **GIVEN** user invokes `/openspec-apply` without arguments
- **AND** exactly one active change exists
- **WHEN** the command executes
- **THEN** the command SHALL use `mcp_question` to confirm (state-changing operation)
- **AND** proceed with the confirmed target
- **OR** abort if user cancels

#### Scenario: Apply invoked without arguments, multiple changes exist

- **GIVEN** user invokes `/openspec-apply` without arguments
- **AND** multiple active changes exist
- **WHEN** the command executes
- **THEN** the command SHALL present selection via `mcp_question`
- **AND** proceed with the selected target

#### Scenario: Apply invoked with explicit target

- **GIVEN** user invokes `/openspec-apply feature-x` with an explicit target
- **WHEN** the command executes
- **THEN** the command SHALL use `feature-x` directly without resolution prompts
- **AND** proceed with existing validation and implementation flow

### Requirement: The `/openspec-review` command SHALL perform a comprehensive post-implementation code review of an OpenSpec change, with smart target resolution when no target is explicitly provided.

The `/openspec-review` command SHALL perform a comprehensive post-implementation code review of an OpenSpec change. When no target is provided, it SHALL use the Smart Target Resolution Protocol (read-only variant) to determine which change to review.

#### Scenario: Review invoked without arguments, single change exists

- **GIVEN** user invokes `/openspec-review` without arguments
- **AND** exactly one active change exists
- **WHEN** the command executes
- **THEN** the command SHALL auto-proceed with that change (read-only operation)
- **AND** display: "Using '<change-id>' (only active change)"

#### Scenario: Review invoked without arguments, multiple changes exist

- **GIVEN** user invokes `/openspec-review` without arguments
- **AND** multiple active changes exist
- **WHEN** the command executes
- **THEN** the command SHALL present selection via `mcp_question`
- **AND** proceed with the selected target

#### Scenario: Review invoked with explicit target

- **GIVEN** user invokes `/openspec-review feature-x` with an explicit target
- **WHEN** the command executes
- **THEN** the command SHALL use `feature-x` directly without resolution prompts
- **AND** proceed with existing validation and review flow

### Requirement: The `/openspec-harden` command SHALL perform post-implementation hardening analysis on an OpenSpec change, with smart target resolution when no target is explicitly provided.

The `/openspec-harden` command SHALL perform post-implementation hardening analysis on an OpenSpec change. When no target is provided, it SHALL use the Smart Target Resolution Protocol (state-changing variant because it offers to apply fixes) to determine which change to harden.

#### Scenario: Harden invoked without arguments, single change exists

- **GIVEN** user invokes `/openspec-harden` without arguments
- **AND** exactly one active change exists
- **WHEN** the command executes
- **THEN** the command SHALL use `mcp_question` to confirm (state-changing operation)
- **AND** proceed with the confirmed target
- **OR** abort if user cancels

#### Scenario: Harden invoked without arguments, multiple changes exist

- **GIVEN** user invokes `/openspec-harden` without arguments
- **AND** multiple active changes exist
- **WHEN** the command executes
- **THEN** the command SHALL present selection via `mcp_question`
- **AND** proceed with the selected target

#### Scenario: Harden invoked with explicit target

- **GIVEN** user invokes `/openspec-harden feature-x` with an explicit target
- **WHEN** the command executes
- **THEN** the command SHALL use `feature-x` directly without resolution prompts
- **AND** proceed with existing validation and hardening flow

### Requirement: The `/openspec-archive` command SHALL archive a deployed OpenSpec change and update specs, with smart target resolution when no target is explicitly provided.

The `/openspec-archive` command SHALL archive a deployed OpenSpec change and update specs. When no target is provided, it SHALL use the Smart Target Resolution Protocol (state-changing variant) to determine which change to archive.

#### Scenario: Archive invoked without arguments, single change exists

- **GIVEN** user invokes `/openspec-archive` without arguments
- **AND** exactly one active change exists
- **WHEN** the command executes
- **THEN** the command SHALL use `mcp_question` to confirm (state-changing operation)
- **AND** proceed with the confirmed target
- **OR** abort if user cancels

#### Scenario: Archive invoked without arguments, multiple changes exist

- **GIVEN** user invokes `/openspec-archive` without arguments
- **AND** multiple active changes exist
- **WHEN** the command executes
- **THEN** the command SHALL present selection via `mcp_question`
- **AND** proceed with the selected target

#### Scenario: Archive invoked with explicit target

- **GIVEN** user invokes `/openspec-archive feature-x` with an explicit target
- **WHEN** the command executes
- **THEN** the command SHALL use `feature-x` directly without resolution prompts
- **AND** proceed with existing archive flow

### Requirement: The `/openspec-research` command SHALL research and validate architectural decisions with smart target resolution.

The `/openspec-research` command SHALL research and validate architectural decisions in an OpenSpec spec using sub-agents. When no target is provided, it SHALL use the Smart Target Resolution Protocol (state-changing variant because it updates files) to determine which spec or change to research.

#### Scenario: Research invoked without arguments, single candidate exists

- **GIVEN** user invokes `/openspec-research` without arguments
- **AND** exactly one active change OR spec exists as a candidate
- **WHEN** the command executes
- **THEN** the command SHALL use `mcp_question` to confirm (state-changing operation)
- **AND** proceed with the confirmed target

#### Scenario: Research invoked without arguments, multiple candidates exist

- **GIVEN** user invokes `/openspec-research` without arguments
- **AND** multiple active changes or specs exist
- **WHEN** the command executes
- **THEN** the command SHALL present selection via `mcp_question`
- **AND** include both specs and changes as options with type labels
- **AND** proceed with the selected target

#### Scenario: Research invoked with explicit target

- **GIVEN** user invokes `/openspec-research contract-system` with an explicit target
- **WHEN** the command executes
- **THEN** the command SHALL use the target directly
- **AND** proceed with existing resolution of spec vs change ambiguity if needed
