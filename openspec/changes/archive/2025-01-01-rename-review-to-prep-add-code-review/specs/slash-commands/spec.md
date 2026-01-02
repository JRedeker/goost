# Slash Commands Capability Delta

## RENAMED Requirement: OpenSpec Review Command → OpenSpec Prep Command

The existing "OpenSpec Review Command" requirement is **renamed** to "OpenSpec Prep Command" with the command name changing from `/openspec-review` to `/openspec-prep`.

**Rationale**: The command performs pre-implementation preparation and validation, not code review. The new name clarifies its role in the workflow.

#### Scenario: Command rename
- **GIVEN** a user previously used `/openspec-review <change-id>` for pre-implementation validation
- **WHEN** the command is renamed
- **THEN** the user SHALL invoke `/openspec-prep <change-id>` for the same functionality
- **AND** all existing gap analysis, TDD readiness, and validation behaviors remain unchanged

---

## ADDED Requirements

### Requirement: OpenSpec Code Review Command

The `/openspec-review` command SHALL perform a comprehensive code review of an OpenSpec change implementation, analyzing correctness, logic, security, and architecture conformance.

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

### Requirement: Requirement Traceability Analysis

The code review command SHALL trace each spec requirement to its implementation.

#### Scenario: Trace requirements to code
- **GIVEN** the spec contains requirements with scenarios
- **WHEN** performing requirement traceability analysis
- **THEN** the command SHALL identify code that implements each scenario
- **AND** report coverage percentage (scenarios with traced implementation / total scenarios)

#### Scenario: Untraced scenario detection
- **GIVEN** the spec contains scenario "User login with invalid credentials"
- **WHEN** no implementation code addresses this scenario
- **THEN** the command SHALL flag the scenario as untraced
- **AND** include it in the review findings

#### Scenario: Trace evidence format
- **GIVEN** a scenario is traced to implementation code
- **WHEN** reporting the trace
- **THEN** the command SHALL include file path and line number references
- **AND** quote the relevant code snippet (5 lines or fewer)

### Requirement: Logic Review Analysis

The code review command SHALL analyze implementation logic for correctness and edge cases.

#### Scenario: Detect logic bugs
- **GIVEN** the implementation contains conditional logic
- **WHEN** performing logic review
- **THEN** the command SHALL check for:
  - Off-by-one errors in loops and array access
  - Incorrect boolean logic (AND/OR confusion)
  - Missing null/undefined checks before property access
  - Incorrect comparison operators (== vs ===, < vs <=)
  - Unreachable code paths
- **AND** flag potential issues with severity and file:line reference

#### Scenario: Edge case coverage
- **GIVEN** the spec defines boundary conditions
- **WHEN** performing logic review
- **THEN** the command SHALL verify implementation handles:
  - Empty inputs (empty arrays, empty strings, null)
  - Boundary values (0, -1, MAX_INT)
  - Invalid inputs (wrong types, malformed data)
  - Concurrent access scenarios (if applicable)
- **AND** flag missing edge case handling

#### Scenario: Error handling correctness
- **GIVEN** the implementation contains try/catch blocks or error callbacks
- **WHEN** performing logic review
- **THEN** the command SHALL verify:
  - Errors are caught at appropriate boundaries
  - Error information is preserved (not swallowed)
  - Recovery or graceful degradation is implemented
  - User-facing error messages are appropriate
- **AND** flag incomplete error handling

#### Scenario: State management review
- **GIVEN** the implementation manages state
- **WHEN** performing logic review
- **THEN** the command SHALL check for:
  - State mutations in unexpected places
  - Race conditions in async state updates
  - Stale state reads after async operations
  - Missing state cleanup or reset
- **AND** flag state management issues

### Requirement: Security Review Analysis

The code review command SHALL analyze implementation for security concerns.

#### Scenario: Authentication and authorization check
- **GIVEN** the implementation handles protected resources
- **WHEN** performing security review
- **THEN** the command SHALL verify:
  - Authentication is checked before authorization
  - Authorization checks use principle of least privilege
  - Session/token validation is present
  - Credential handling follows secure practices
- **AND** flag missing or incorrect auth patterns

#### Scenario: Input validation check
- **GIVEN** the implementation accepts user input
- **WHEN** performing security review
- **THEN** the command SHALL verify:
  - Input is validated before use
  - Validation rejects malformed data
  - No SQL injection, XSS, or command injection vectors
  - File path inputs are sanitized (no path traversal)
- **AND** flag missing or weak validation

#### Scenario: Secrets handling check
- **GIVEN** the implementation uses API keys, passwords, or tokens
- **WHEN** performing security review
- **THEN** the command SHALL verify:
  - Secrets are not hardcoded in source code
  - Secrets are loaded from environment or secure storage
  - Secrets are not logged or exposed in error messages
  - Secrets are not committed to version control
- **AND** flag secrets exposure risks

#### Scenario: Data exposure check
- **GIVEN** the implementation returns data to users
- **WHEN** performing security review
- **THEN** the command SHALL verify:
  - Sensitive fields are not inadvertently exposed
  - Response filtering is applied where needed
  - Debug information is not leaked in production
- **AND** flag potential data exposure

### Requirement: Architecture Conformance Analysis

The code review command SHALL verify implementation follows project architecture patterns.

#### Scenario: Project pattern conformance
- **GIVEN** the project has documented architecture patterns in AGENTS.md or CONTRIBUTING.md
- **WHEN** performing architecture review
- **THEN** the command SHALL verify implementation follows stated patterns
- **AND** flag deviations with reference to the violated pattern

#### Scenario: Module boundary check
- **GIVEN** the project has defined module boundaries
- **WHEN** performing architecture review
- **THEN** the command SHALL verify:
  - Imports respect module boundaries
  - No circular dependencies introduced
  - Public/private interfaces are respected
- **AND** flag boundary violations

#### Scenario: Naming convention check
- **GIVEN** the project has established naming conventions
- **WHEN** performing architecture review
- **THEN** the command SHALL verify:
  - File names follow conventions
  - Function/class names follow conventions
  - Variable names are descriptive and consistent
- **AND** flag naming violations

#### Scenario: Code organization check
- **GIVEN** the project has file organization patterns
- **WHEN** performing architecture review
- **THEN** the command SHALL verify:
  - New files are placed in appropriate directories
  - Related code is grouped together
  - No god files or god functions introduced
- **AND** flag organizational issues

### Requirement: Sub-Agent Orchestration for Code Review

The code review command SHALL use orchestrated sub-agents for scalable analysis while managing context token limitations.

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
- **THEN** the command SHALL prompt user with options:
  - A) Spawn sub-agents to fix CRITICAL issues
  - B) Spawn sub-agents to fix CRITICAL and MAJOR issues
  - C) Show detailed report only (manual fix)
  - D) Accept current state
- **AND** wait for user selection before proceeding

#### Scenario: Remediation sub-agent spawning
- **GIVEN** user selects option A or B
- **WHEN** spawning remediation sub-agents
- **THEN** the command SHALL spawn one sub-agent per issue
- **AND** each sub-agent SHALL receive:
  - The specific issue description and location
  - Relevant code context
  - Fix suggestion from discovery
  - Project style guidelines
- **AND** each sub-agent SHALL return structured fix results

#### Scenario: Sub-agent context management
- **GIVEN** the change affects many files
- **WHEN** spawning discovery sub-agents
- **THEN** each sub-agent prompt SHALL include only:
  - The specific files relevant to that scanner domain
  - The relevant spec scenarios
  - Focused search and analysis instructions
- **AND** NOT include the full codebase or all specs

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

#### Scenario: Discovery sub-agent invalid response
- **GIVEN** a discovery sub-agent returns malformed or invalid JSON
- **WHEN** parsing the sub-agent response
- **THEN** the command SHALL treat it as a failure for that scanner
- **AND** log the parse error for debugging
- **AND** continue with synthesis using other sub-agent results

#### Scenario: All discovery sub-agents fail
- **GIVEN** all 4 discovery sub-agents fail
- **WHEN** attempting to begin synthesis phase
- **THEN** the command SHALL display an error: "Code review failed - all scanners encountered errors"
- **AND** list each scanner failure reason
- **AND** suggest retrying or checking system status

#### Scenario: Remediation fix validation
- **GIVEN** a remediation sub-agent applies a fix
- **WHEN** the fix is complete
- **THEN** the command SHALL verify the fix by checking:
  - The original issue pattern no longer exists at that location
  - No new syntax errors were introduced
  - The file is still valid (parseable)
- **AND** mark the fix as VERIFIED or UNVERIFIED

#### Scenario: Remediation fix introduces new issues
- **GIVEN** a remediation sub-agent fix is applied
- **AND** the fix introduces a new issue (detected by validation)
- **WHEN** reporting remediation results
- **THEN** the command SHALL flag the fix as PROBLEMATIC
- **AND** include both the original issue and the new issue in the report
- **AND** suggest manual review of the fix

#### Scenario: Remediation rollback guidance
- **GIVEN** remediation sub-agents have modified files
- **WHEN** generating the final report
- **THEN** the command SHALL include rollback instructions:
  - List all files modified by remediation
  - Note that `git checkout -- <file>` can revert individual files
  - Note that `git stash` was NOT used (changes are unstaged)
- **AND** recommend reviewing changes before committing

### Requirement: Code Review Report Format

The code review command SHALL output a structured, actionable report.

#### Scenario: Report header
- **GIVEN** the code review analysis is complete
- **WHEN** generating the report
- **THEN** the header SHALL include:
  - Change ID and title
  - Overall verdict: APPROVED, CHANGES_REQUESTED, or BLOCKED
  - Summary counts per dimension

#### Scenario: Dimension sections
- **GIVEN** the code review analysis is complete
- **WHEN** generating the report
- **THEN** each dimension SHALL have a section with:
  - Dimension name and status (PASS/WARN/FAIL)
  - Summary metric (coverage percentage, issue count, etc.)
  - List of findings if status is not PASS

#### Scenario: Review comments format
- **GIVEN** issues were found during analysis
- **WHEN** generating review comments
- **THEN** each comment SHALL include:
  - Severity: CRITICAL, MAJOR, MINOR, or INFO
  - Location: file:line reference
  - Finding: description of the issue
  - Suggestion: how to fix (if applicable)
- **AND** comments SHALL be numbered for reference

#### Scenario: Verdict determination
- **GIVEN** all analyses are complete
- **WHEN** determining the overall verdict
- **THEN** the verdict SHALL be:
  - BLOCKED: Any CRITICAL issues present
  - CHANGES_REQUESTED: No CRITICAL but MAJOR issues present
  - APPROVED: Only MINOR or INFO issues (or no issues)

#### Scenario: Remediation results
- **GIVEN** remediation sub-agents were spawned
- **WHEN** generating the final report
- **THEN** the report SHALL include a Fixes Applied section showing:
  - Which issues were fixed
  - Which issues remain unresolved
  - Files modified by fixes

### Requirement: Integration with OpenSpec Workflow

The code review command SHALL integrate with the broader OpenSpec workflow.

#### Scenario: Review after apply
- **GIVEN** an OpenSpec change has been implemented via `/openspec-apply`
- **WHEN** user runs `/openspec-review <change-id>`
- **THEN** the command SHALL use the apply modifications as the review scope
- **AND** cross-reference findings with the original spec

#### Scenario: Review before harden
- **GIVEN** code review identifies issues
- **WHEN** user proceeds to `/openspec-harden`
- **THEN** the harden command SHOULD NOT re-analyze correctness issues
- **AND** harden focuses on production readiness concerns

#### Scenario: Review detects harden-relevant issues
- **GIVEN** review discovers issues that overlap with harden scope (e.g., missing tests)
- **WHEN** generating the review report
- **THEN** the command SHALL note: "This issue will also be flagged by /openspec-harden"
- **AND** recommend running harden after addressing critical review issues

#### Scenario: Archived change review
- **GIVEN** the change ID refers to an archived change
- **WHEN** user invokes `/openspec-review <change-id>`
- **THEN** the command SHALL note: "This change has been archived"
- **AND** proceed with review for post-hoc analysis purposes
