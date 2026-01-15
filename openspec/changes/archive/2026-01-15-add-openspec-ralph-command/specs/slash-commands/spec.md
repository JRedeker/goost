## ADDED Requirements

### Requirement: OpenSpec Ralph Command

The `/openspec-ralph` command SHALL implement an approved OpenSpec change under contract enforcement using an autonomous "Ralph Wiggum Loop" protocol for persistent iteration until verification success.

#### Scenario: Basic invocation with change ID
- **GIVEN** an approved OpenSpec change `feature-x` exists
- **WHEN** user invokes `/openspec-ralph feature-x`
- **THEN** the command SHALL derive a contract from the proposal
- **AND** wait for user confirmation before starting implementation

#### Scenario: Autonomous Fix Cycle with Error Classification
- **GIVEN** implementation of a task has started
- **WHEN** a verification command (e.g., test or build) fails
- **THEN** the agent SHALL classify the error type:
  - **SEMANTIC** (type error, logic bug, test failure): proceed to fix cycle
  - **TRANSIENT** (network timeout, flaky test): retry once with 5s delay
  - **ENVIRONMENTAL** (missing dependency, config error): escalate immediately
- **AND** for SEMANTIC errors, the agent SHALL verbalize its diagnosis before applying a fix
- **AND** it SHALL apply a targeted fix to the code
- **AND** it SHALL re-run the verification command
- **AND** it SHALL repeat this cycle up to 3 times per task for SEMANTIC errors
<!-- Source: LangGraph error handling taxonomy, Reflexion paper (arXiv:2303.11366) -->

#### Scenario: Retry budget exhaustion
- **GIVEN** the agent has attempted to fix a task failure 3 times
- **WHEN** the 4th verification attempt also fails
- **THEN** the agent SHALL stop the autonomous loop
- **AND** it SHALL report its attempts and the persistent error to the user
- **AND** it SHALL request human guidance

#### Scenario: Visual feedback with doom loop indicator
- **GIVEN** the agent is in an autonomous retry cycle
- **WHEN** the next response is generated
- **THEN** the response SHALL include the `[GOOST:DOOM_LOOP]` indicator
- **AND** the terminal tab title SHALL reflect the retry state (e.g., "RETRYING (2/3)")
<!-- Note: Fixed typo "RETRETING" → "RETRYING"; OSC title sequences validated per XTerm Control Sequences spec -->

#### Scenario: Incremental Task Verification
- **GIVEN** a task has been implemented
- **WHEN** marking the task complete in tasks.md
- **THEN** the agent SHOULD run relevant verification for that task
- **AND** this MAY include: typecheck, lint, unit tests for affected modules
- **AND** this provides early feedback without full suite overhead
<!-- Source: Martin Fowler "Continuous Integration", shift-left testing principle -->

#### Scenario: Mandatory Global Verification
- **GIVEN** all tasks in the proposal are marked complete
- **WHEN** preparing to declare the contract fulfilled
- **THEN** the agent SHALL run a full project verification suite (build + all tests)
- **AND** it SHALL ONLY declare CONTRACT FULFILLED if the entire suite passes
- **AND** it SHALL use the autonomous retry protocol for this final verification phase if it fails initially

#### Scenario: Contract derivation and confirmation
- **GIVEN** the command has started
- **WHEN** displaying the initial contract
- **THEN** the contract SHALL include a section "AUTONOMOUS RETRY ENABLED"
- **AND** define the retry budget (3 for semantic errors) and global verification requirement
- **AND** require explicit user confirmation to "Begin Autonomous Implementation"
<!-- Renamed from "WIGGUM PROTOCOL" to descriptive term per simplicity recommendation -->

#### Scenario: Change not found error
- **GIVEN** user invokes `/openspec-ralph nonexistent-change`
- **WHEN** the command attempts to load the change proposal
- **THEN** the command SHALL display: "Change 'nonexistent-change' not found"
- **AND** suggest: "Run `openspec list` to see available changes"
- **AND** stop execution without establishing a contract

#### Scenario: ENVIRONMENTAL error immediate escalation
- **GIVEN** implementation of a task has started
- **WHEN** a verification command fails with an ENVIRONMENTAL error (missing dependency, config error, permission denied)
- **THEN** the agent SHALL NOT attempt autonomous retry
- **AND** it SHALL immediately report the environmental blocker to the user
- **AND** it SHALL describe the required manual intervention (e.g., "Install missing package X", "Set environment variable Y")
- **AND** it SHALL wait for user confirmation before proceeding

> **Observability Note**: During autonomous retry cycles, agents SHOULD emit structured log entries (via stderr when GOOST_DEBUG=1) noting the retry attempt number, error classification, and diagnosis. This aids debugging of complex failure chains.

> **Inherited Protocols**: The `/openspec-ralph` command inherits the Target Resolution Protocol, Intent Statement Protocol, and Context-Aware TDD from `/openspec-apply`. The autonomous retry behavior is additive—it modifies only the failure handling, not the core implementation workflow.
