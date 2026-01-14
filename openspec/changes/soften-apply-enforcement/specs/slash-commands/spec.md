## ADDED Requirements

### Requirement: OpenSpec Apply Contract Confirmation

The `/openspec-apply` command SHALL establish a Goost contract from the approved proposal and require user confirmation before implementation begins, ensuring the derived Success Criteria accurately reflect the proposal's intent.

#### Scenario: Contract derived and confirmed

- **GIVEN** a user invokes `/openspec-apply` with a valid change ID
- **WHEN** the command reads the proposal, tasks, and design files
- **THEN** the command SHALL derive a contract with:
  - OBJECTIVE from proposal title/summary
  - SUCCESS CRITERIA from acceptance criteria in proposal.md with Test Plan links (C1, C2, etc.)
  - TEST PLAN derived from tasks.md and spec scenarios
  - CONSTRAINTS from MUST/MUST NOT requirements
  - CHECKPOINTS grouping tasks into logical phases
- **AND** display the contract using the standard Goost contract format
- **AND** emit `[GOOST:MIC]` status marker
- **AND** use `mcp_question` to request confirmation:
  - header: "Confirm"
  - question: "Does this contract accurately capture the proposal requirements?"
  - options: "Begin work (Recommended)", "Modify criteria", "Cancel"
- **AND** proceed with implementation only if user selects "Begin work"

#### Scenario: User requests criteria modification

- **GIVEN** contract has been displayed for confirmation
- **WHEN** user selects "Modify criteria"
- **THEN** the command SHALL ask what needs adjustment
- **AND** regenerate the contract with user's changes
- **AND** re-present for confirmation

#### Scenario: User cancels contract

- **GIVEN** contract has been displayed for confirmation
- **WHEN** user selects "Cancel"
- **THEN** the command SHALL abort without starting work
- **AND** display: "Contract cancelled. No changes made."

#### Scenario: mcp_question fails during contract confirmation

- **GIVEN** contract has been derived and displayed
- **WHEN** the `mcp_question` tool invocation fails (error, timeout, or unavailable)
- **THEN** the command SHALL fall back to text-based confirmation:
  ```
  Confirm contract (type option number):
  1. Begin work (Recommended)
  2. Modify criteria
  3. Cancel
  ```
- **AND** accept number or free text as response
- **AND** log a warning noting that structured question tool was unavailable

#### Scenario: Invalid response during text-based fallback

- **GIVEN** contract has been derived and displayed
- **AND** `mcp_question` tool is unavailable
- **WHEN** user provides an invalid response (non-numeric, unknown option, or empty input)
- **THEN** the command SHALL re-display the confirmation prompt
- **AND** display: "Invalid response. Please enter 1, 2, or 3."
- **AND** allow up to 3 retry attempts
- **AND** after 3 failed attempts, treat as cancellation
- **AND** display: "Too many invalid responses. Contract cancelled."

### Requirement: Intent Statement Protocol

During contract implementation, agents SHALL provide brief human-readable context before each major phase transition while maintaining strict progress toward tool execution to prevent planning loops.

The protocol relies on two mechanisms:

1. **Natural Language Convention** (human context):
   - Single-line intent statement describing the next action
   - Immediately followed by a tool call (Read, Edit, Write, Bash, etc.)
   - NOT multi-paragraph explanations, plans, or summaries

Intent statements serve as state markers (similar to `>>> SYNTHESIS COMPLETE <<<`), providing clear phase transitions for human readers.

#### Scenario: Phase transition with intent statement

- **GIVEN** agent is ready to begin a new implementation phase
- **WHEN** transitioning from contract display to work, or between checkpoints
- **THEN** agent SHALL output a single-line intent statement describing the next action
- **AND** immediately follow with a tool call (Read, Edit, Write, Bash, etc.)
- **AND** NOT include multi-paragraph explanations, plans, or summaries

#### Scenario: Valid intent statement examples

- **GIVEN** agent is starting implementation
- **THEN** acceptable formats include:
  - "Starting Phase 1: Database schema implementation" + [Read tool]
  - "Proceeding to Task 1.2: API endpoint creation" + [Edit tool]
  - "Implementing criterion C1: User authentication" + [Write tool]

#### Scenario: Invalid transition (planning loop)

- **GIVEN** agent is ready to start work
- **WHEN** agent outputs multiple paragraphs explaining the plan
- **OR** restates the contract contents
- **OR** describes what they will do without actually doing it (no tool call)
- **THEN** this violates the Intent Statement Protocol
- **AND** may trigger Goost doom loop detection if repeated

#### Scenario: Doom loop detection and recovery

- **GIVEN** agent violates the Intent Statement Protocol multiple times
- **WHEN** Goost plugin detects repeated planning without action
- **THEN** plugin SHALL emit `[GOOST:DOOM_LOOP]` marker
- **AND** agent SHALL present recovery options:
  - "Continue with current approach"
  - "Get more context"
  - "Simplify the task"

### Requirement: Context-Aware TDD

The RSTC (Requirement-Spec-Test-Code) protocol SHALL be applied with context sensitivity, requiring full Red/Green Phase Evidence for logic-heavy changes while allowing simplified verification for trivial changes.

"Simplified verification" means skipping formal test writing entirely for non-code changes, using build passes, linter clean, or manual inspection as verification. It does NOT mean skipping the Red phase when unit tests ARE appropriate for logic changes.

> **Cross-Spec Alignment Notes**:
> - **`tdd-enforcement` spec**: This requirement extends, not replaces, the base TDD protocol. Logic-heavy work still requires full Red/Green evidence per `tdd-enforcement`. This adds a narrowly-scoped exception for trivial changes with explicit rationale requirements.
> - **`contract-system` spec**: The contract-system requirement that evidence "SHALL be provided for all criteria" is satisfied because simplified verification still requires evidence (build passes, linter output, manual inspection notes). The difference is the form of evidence, not its absence.

#### Scenario: Logic-heavy change requires full RSTC

- **GIVEN** a success criterion involves:
  - New API endpoints or business logic
  - State management or data transformations
  - Breaking changes or security-critical code
  - Multi-system integration
- **WHEN** implementing the criterion
- **THEN** agent MUST follow full RSTC sequence:
  1. Requirement (R): Review criterion and linked test scenario
  2. Spec (S): Detail technical implementation and edge cases
  3. Test (T): Write/update test and provide Red Phase Evidence (failing logs)
  4. Code (C): Implement solution and provide Green Phase Evidence (passing logs)
- **AND** NOT mark criterion `[x]` until both Red and Green evidence are provided

#### Scenario: Trivial change allows simplified verification

- **GIVEN** a success criterion involves:
  - Documentation updates (README, comments, CHANGELOG)
  - Configuration changes (package.json version, .env.example)
  - Trivial UI changes (button labels, copy text)
  - Code formatting or style fixes
- **WHEN** implementing the criterion
- **THEN** agent MAY skip formal test writing entirely
- **AND** proceed with direct implementation followed by verification
- **AND** provide evidence of successful verification (build passes, linter clean, manual inspection)
- **AND** NOT require Red/Green phase cycles for changes that don't benefit from unit tests
- **OR** if uncertain whether tests are needed, default to full RSTC protocol

#### Scenario: TDD escape hatch rationale

- **GIVEN** agent determines a criterion qualifies for simplified verification
- **WHEN** marking the criterion complete
- **THEN** agent SHALL include brief rationale in CONTRACT STATUS:
  - Example: "- [x] (C3) Update README (trivial: documentation change, verified by manual review)"
- **AND** still provide verification evidence (not zero evidence, just simplified)

## MODIFIED Requirements

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
- **AND** on confirmation, proceed to contract derivation and display (contract has its own confirmation step)

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

#### Scenario: Explicit target provided, target does not exist

- **GIVEN** a user invokes an OpenSpec command with a non-existent target (e.g., `/openspec-apply nonexistent`)
- **WHEN** the command processes the arguments
- **THEN** the command SHALL display: "Change 'nonexistent' not found"
- **AND** suggest running `openspec list` to see available changes
- **AND** stop execution

#### Scenario: mcp_question tool unavailable or fails

- **GIVEN** a user invokes an OpenSpec command without a target
- **AND** multiple active changes exist or confirmation is required
- **WHEN** the `mcp_question` tool invocation fails (error, timeout, or unavailable)
- **THEN** the command SHALL fall back to numbered list format:
  ```
  Select a change (type number or enter change-id):
  1. <change-1> - <task progress>
  2. <change-2> - <task progress>
  3. Cancel
  ```
- **AND** accept number, change ID, or free text as response
- **AND** log a warning noting that structured question tool was unavailable

> **Observability Note**: When the fallback protocol is triggered, agents SHOULD log a warning to aid debugging. No metrics or tracing requirements apply to this change as it is purely a UX interaction pattern.
