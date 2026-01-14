# Slash Commands Capability - Spec Delta

## ADDED Requirements

### Requirement: Structured Question Interaction

All Goost commands SHALL use the OpenCode `mcp_question` tool for user-facing questions that require a choice from predefined options. This ensures consistent UX and eliminates ambiguous text parsing.

> **Note**: `mcp_question` is an OpenCode-specific built-in tool, not part of the MCP specification. It provides similar functionality to MCP Elicitation but is implemented as a tool for CLI environments.

#### Scenario: Question tool parameter structure
- **GIVEN** any scenario requiring user choice from predefined options
- **WHEN** constructing the question tool call
- **THEN** the parameters SHALL follow this structure:
  - `questions`: array with a single question object
  - `question.header`: max 25 characters, action-oriented (prefer 2-4 words)
  - `question.question`: full context including current state
  - `question.options`: 2-5 options with clear labels (1-5 words) and descriptions
  - `question.multiple`: false (single selection) unless explicitly needed
- **AND** the recommended option SHALL be listed first with "(Recommended)" suffix
- **AND** the "Other" option (auto-provided by tool) allows free-form text

#### Scenario: Fallback when question tool unavailable
- **GIVEN** the `mcp_question` tool invocation fails (error, timeout, or unavailable)
- **WHEN** the agent needs user input
- **THEN** the agent SHALL fall back to numbered list format:
  ```
  Select an option (type number or describe your choice):
  1. [Option A] - Description
  2. [Option B] - Description
  3. [Other] - Type custom response
  ```
- **AND** accept number, option label, or free text as response
- **AND** log a warning noting that structured question tool was unavailable

#### Scenario: Question tool returns unexpected response format
- **GIVEN** the `mcp_question` tool invocation succeeds
- **WHEN** the response format is unexpected (missing selection, invalid structure)
- **THEN** the agent SHALL treat it as if the user selected "Other"
- **AND** prompt the user for clarification using plain text

### Requirement: Goost Instructions Question Protocol

The `goost_instructions.md` file SHALL include a dedicated section mandating the use of the `mcp_question` tool for all user-facing questions.

#### Scenario: Question protocol section exists
- **GIVEN** the `goost_instructions.md` file is read by an agent
- **WHEN** the agent needs to ask the user a question with predefined choices
- **THEN** the instructions SHALL contain a "User Interaction Protocol" section
- **AND** this section SHALL mandate `mcp_question` usage
- **AND** include examples for: contract confirmation, doom loop recovery, remediation options

#### Scenario: Question protocol defines exceptions
- **GIVEN** some questions require open-ended responses
- **WHEN** an agent needs to ask clarifying questions
- **THEN** the protocol SHALL specify that `mcp_question` is NOT required for:
  - Socratic clarifying questions (e.g., `/openspec-clarify`)
  - Open-ended requirements gathering
  - Debugging questions where the answer space is unlimited
- **AND** agents SHALL use plain text prompts for these cases

> **Observability Note**: When the fallback protocol is triggered, agents SHOULD log a warning to aid debugging. No metrics or tracing requirements apply to this change as it is purely a UX interaction pattern.

## MODIFIED Requirements

### Requirement: OpenSpec Code Review Command

The `/openspec-review` command SHALL perform a comprehensive post-implementation code review of an OpenSpec change, analyzing correctness, logic, security, and architecture conformance using orchestrated sub-agents.

#### Scenario: Basic invocation with change ID
- **GIVEN** an OpenSpec change `feature-x` exists with implementation code
- **WHEN** user invokes `/openspec-review feature-x`
- **THEN** the command SHALL analyze the implementation across all review dimensions
- **AND** output a structured code review report

#### Scenario: Change not found
- **GIVEN** no OpenSpec change matches the provided ID
- **WHEN** user invokes `/openspec-review non-existent`
- **THEN** the command SHALL display an error: "Change 'non-existent' not found"
- **AND** suggest running `openspec list` to see available changes

#### Scenario: No argument provided
- **GIVEN** user invokes `/openspec-review` without arguments
- **WHEN** the command executes
- **THEN** the command SHALL display usage: "/openspec-review <change-id>"
- **AND** list active changes if any exist

#### Scenario: No implementation exists
- **GIVEN** an OpenSpec change exists but no implementation code has been written
- **WHEN** user invokes `/openspec-review <change-id>`
- **THEN** the command SHALL report: "No implementation found for this change"
- **AND** suggest running `/openspec-apply <change-id>` first

#### Scenario: Discovery phase sub-agents
- **GIVEN** user invokes `/openspec-review <change-id>`
- **WHEN** Phase 1 (Discovery) begins
- **THEN** the command SHALL spawn 4 parallel sub-agents:
  - Requirement Traceability Scanner
  - Logic and Edge Case Scanner
  - Security Review Scanner
  - Architecture Conformance Scanner
- **AND** each sub-agent SHALL have focused scope on affected files only
- **AND** each sub-agent SHALL return structured JSON findings

#### Scenario: Synthesis phase
- **GIVEN** all discovery sub-agents have returned
- **WHEN** Phase 2 (Synthesis) begins
- **THEN** the main agent SHALL:
  - Aggregate findings by severity (CRITICAL > MAJOR > MINOR > INFO)
  - Cross-reference findings to identify root causes
  - Deduplicate overlapping findings
  - Determine overall verdict
- **AND** display an intermediate review summary

#### Scenario: Remediation phase prompt
- **GIVEN** issues are found during discovery
- **AND** synthesis phase is complete
- **WHEN** Phase 3 (Remediation) begins
- **THEN** the command SHALL use `mcp_question` with:
  - header: "Fix Issues"
  - question: "Found N issues requiring attention. How would you like to proceed?"
  - options:
    - "Fix critical only" - Spawn sub-agents to fix CRITICAL issues
    - "Fix critical and major" - Spawn sub-agents to fix CRITICAL and MAJOR issues
    - "Show report only" - Display detailed report for manual fixing
    - "Accept current state" - Skip fixes and proceed
- **AND** wait for user selection before proceeding

#### Scenario: Discovery sub-agent timeout
- **GIVEN** a discovery sub-agent exceeds the timeout threshold
- **WHEN** the main agent is waiting for results
- **THEN** the command SHALL mark that scanner as TIMEOUT
- **AND** proceed with synthesis using available results from other sub-agents
- **AND** note the timeout in the report with the affected dimension

#### Scenario: Partial discovery failure
- **GIVEN** one or more discovery sub-agents fail (timeout, error, or invalid response)
- **AND** at least one discovery sub-agent succeeds
- **WHEN** synthesis phase begins
- **THEN** the command SHALL synthesize findings from successful sub-agents
- **AND** mark failed dimensions as INCOMPLETE in the report
- **AND** list which scanners failed and why

#### Scenario: All discovery sub-agents fail
- **GIVEN** all 4 discovery sub-agents fail
- **WHEN** attempting to begin synthesis phase
- **THEN** the command SHALL display an error: "Code review failed - all scanners encountered errors"
- **AND** list each scanner failure reason
- **AND** suggest retrying or checking system status

#### Scenario: Verdict determination
- **GIVEN** all analyses are complete
- **WHEN** determining the overall verdict
- **THEN** the verdict SHALL be:
  - BLOCKED: Any CRITICAL issues present
  - CHANGES_REQUESTED: No CRITICAL but MAJOR issues present
  - APPROVED: Only MINOR or INFO issues (or no issues)

#### Scenario: Remediation rollback guidance
- **GIVEN** remediation sub-agents have modified files
- **WHEN** generating the final report
- **THEN** the command SHALL include rollback instructions:
  - List all files modified by remediation
  - Note that `git checkout -- <file>` can revert individual files
  - Note that `git stash` was NOT used (changes are unstaged)
- **AND** recommend reviewing changes before committing

### Requirement: OpenSpec Harden Command

The `/openspec-harden` command SHALL perform post-implementation hardening analysis on an OpenSpec change to verify production-readiness across test coverage, implementation quality, documentation, cleanup, and spec alignment.

#### Scenario: Basic invocation with change ID
- **GIVEN** an OpenSpec change `feature-x` exists with completed tasks
- **WHEN** user invokes `/openspec-harden feature-x`
- **THEN** the command SHALL analyze the change across all hardening dimensions
- **AND** output a structured hardening report

#### Scenario: Change not found
- **GIVEN** no OpenSpec change matches the provided ID
- **WHEN** user invokes `/openspec-harden non-existent`
- **THEN** the command SHALL display an error: "Change 'non-existent' not found"
- **AND** suggest running `openspec list` to see available changes

#### Scenario: No argument provided
- **GIVEN** user invokes `/openspec-harden` without arguments
- **WHEN** the command executes
- **THEN** the command SHALL display usage: "/openspec-harden <change-id>"
- **AND** list active changes if any exist

#### Scenario: Remediation phase prompt
- **GIVEN** hardening analysis has found issues requiring attention
- **AND** the report has been generated
- **WHEN** presenting remediation options
- **THEN** the command SHALL use `mcp_question` with:
  - header: "Fix Issues"
  - question: "Found N hardening issues. How would you like to proceed?"
  - options:
    - "Fix all issues" - Spawn sub-agents to fix all issues automatically
    - "Fix blockers and high only" - Spawn sub-agents for BLOCKER and HIGH issues only
    - "Show report only" - Display detailed report for manual fixing
    - "Accept current state" - Skip fixes and proceed
- **AND** wait for user selection before proceeding

### Requirement: Contract Command

The `/contract` command SHALL establish a binding task contract with verifiable success criteria, using structured question interactions for user confirmation.

#### Scenario: Contract confirmation
- **GIVEN** a contract has been formatted and presented
- **WHEN** asking for user confirmation
- **THEN** the command SHALL use `mcp_question` with:
  - header: "Confirm"
  - question: "Contract ready. Do you accept these terms?"
  - options:
    - "Accept contract" - Lock the contract and begin work
    - "Suggest changes" - Modify criteria before locking
    - "Cancel" - Discard the contract
- **AND** only proceed with work after "Accept contract" is selected
- **AND** if "Suggest changes" is selected, apply modifications and re-present

#### Scenario: Ambiguous request clarification
- **GIVEN** the user's request is ambiguous or missing critical information
- **WHEN** the command needs to ask clarifying questions
- **THEN** the command SHALL use plain text prompts (NOT `mcp_question`)
- **AND** wait for user response before generating the contract

### Requirement: Contract Quick Command

The `/contract-quick` command SHALL quickly create a contract by inferring criteria from the user's request, using structured question interactions for confirmation.

#### Scenario: Quick contract confirmation
- **GIVEN** a contract has been inferred from the user's request
- **WHEN** presenting for confirmation
- **THEN** the command SHALL emit `[GOOST:MIC]` status marker
- **AND** use `mcp_question` with:
  - header: "Confirm"
  - question: "Does this capture your requirements?"
  - options:
    - "Accept contract (Recommended)" - Lock the contract and begin work
    - "Suggest changes" - Modify criteria before locking
    - "Cancel" - Discard and optionally use full /contract flow
- **AND** wait for user selection before proceeding

### Requirement: Goost Search Command

The `/goost-search` command SHALL search curated prompt libraries and present results using structured question interactions for selection and contract conversion.

#### Scenario: Multiple matches found
- **GIVEN** multiple prompts match the user's search query
- **WHEN** presenting options to the user
- **THEN** the command SHALL use `mcp_question` with:
  - header: "Select"
  - question: "Found several prompts matching your query:"
  - options: top 5 matches with title as label, source as description
- **AND** include "Show more results" option if >5 matches exist
- **AND** proceed to fetch and display the selected prompt

#### Scenario: Single strong match
- **GIVEN** exactly one prompt clearly matches the query
- **WHEN** presenting the result
- **THEN** the command SHALL proceed directly to display without question prompt
