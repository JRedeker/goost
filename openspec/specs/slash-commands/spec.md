# Slash Commands Capability

## Purpose

This spec defines slash commands provided by the Goost plugin ecosystem for OpenSpec workflow automation.
## Requirements

<!-- Requirements will be added via OpenSpec changes -->

### Requirement: OpenSpec Prep Command

The `/openspec-prep` command SHALL perform comprehensive pre-implementation preparation of an OpenSpec change including validation, research, and gap analysis to identify potentially missing or forgotten impacts.

> **Note**: This requirement was renamed from "OpenSpec Review Command". The command `/openspec-review` now refers to post-implementation code review (see separate requirement).

#### Scenario: Gap analysis before final assessment
- **GIVEN** the prep has completed phases 1-6 (Discovery, Research, Criteria, Rules, TDD, Research Gaps)
- **WHEN** Phase 7: Gap Analysis executes
- **THEN** the command SHALL analyze the spec for missing or forgotten impacts
- **AND** feed findings into Phase 8: Final Assessment

#### Scenario: Codebase impact discovery
- **GIVEN** the spec mentions specific technologies, features, or domain terms
- **WHEN** performing gap analysis
- **THEN** the command SHALL search the codebase for files containing those terms
- **AND** compare found files against the spec's "Affected code" section
- **AND** flag files that are potentially impacted but not mentioned

#### Scenario: Cross-cutting concerns check
- **GIVEN** the spec describes new functionality
- **WHEN** performing gap analysis
- **THEN** the command SHALL check for coverage of:
  - Error handling scenarios
  - Logging and observability
  - Security considerations (auth, validation, secrets)
  - Configuration requirements
- **AND** flag any concerns not addressed in the spec

#### Scenario: Related changes detection
- **GIVEN** other OpenSpec changes exist in `openspec/changes/`
- **WHEN** performing gap analysis
- **THEN** the command SHALL check for potential conflicts or dependencies
- **AND** flag changes that affect overlapping capabilities or files

#### Scenario: Commonly forgotten items checklist
- **GIVEN** the spec describes a change
- **WHEN** performing gap analysis
- **THEN** the command SHALL present a checklist of commonly forgotten items:
  - Database migrations (if data model changes)
  - API versioning (if endpoints change)
  - Feature flags (for gradual rollout)
  - Rollback plan
  - Documentation updates
  - Dependency updates
- **AND** mark items as applicable or not applicable based on spec content

#### Scenario: Gap analysis in final assessment report
- **GIVEN** Phase 7: Gap Analysis has completed
- **WHEN** Phase 8: Final Assessment generates the review report
- **THEN** the report SHALL include a "Gap Analysis" section with:
  - Potentially impacted files not in spec
  - Cross-cutting concerns status table
  - Related changes that may conflict
  - Commonly forgotten items checklist

#### Scenario: OpenSpec CLI unavailable during gap analysis
- **GIVEN** the `openspec` CLI is not installed or fails
- **WHEN** performing related changes detection
- **THEN** the command SHALL skip the related changes check
- **AND** note in the report that conflict detection is unavailable

#### Scenario: No matching files found in codebase
- **GIVEN** key terms are extracted from the spec
- **WHEN** searching codebase with grep/glob
- **AND** no files match the extracted terms
- **THEN** the command SHALL report "No additional impacted files found"

#### Scenario: Spec missing affected code section
- **GIVEN** the proposal.md lacks an "Affected code" section
- **WHEN** performing codebase impact discovery
- **THEN** the command SHALL note that affected code is not specified
- **AND** treat all found files as potentially impacted

#### Scenario: Large result set from codebase search
- **GIVEN** key term search returns more than 50 files
- **WHEN** performing codebase impact discovery
- **THEN** the command SHALL truncate results to top 50
- **AND** note that results were truncated
- **AND** suggest refining search terms or spec scope

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
- **THEN** the command SHALL prompt user with options:
  - A) Spawn sub-agents to fix CRITICAL issues
  - B) Spawn sub-agents to fix CRITICAL and MAJOR issues
  - C) Show detailed report only (manual fix)
  - D) Accept current state
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

### Requirement: OpenSpec Roadmap Command

The system SHALL provide a `/openspec-roadmap` slash command that displays a tiered progress dashboard for OpenSpec changes, with optional enhancement via `roadmap.yaml`.

#### Scenario: Display roadmap from OpenSpec only
- **GIVEN** the project has an `openspec/` directory with active changes
- **AND** no `roadmap.yaml` exists
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system displays active OpenSpec changes in a tiered dashboard
- **AND** each change shows its title, progress bar, and task completion count

#### Scenario: Display roadmap with roadmap.yaml
- **GIVEN** the project has both `openspec/` and `roadmap.yaml`
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system uses `roadmap.yaml` for item metadata and tiering
- **AND** enriches items with OpenSpec task progress when `change_spec` links exist

#### Scenario: Tiering based on status
- **GIVEN** items have status values
- **WHEN** the roadmap is rendered
- **THEN** items are tiered as follows:
  - NOW: `status: in_progress` OR `priority: critical`
  - NEXT: `status: proposed` OR `status: ready`
  - LATER: `status: deferred` OR `status: completed`

#### Scenario: OpenSpec-only tiering
- **GIVEN** no `roadmap.yaml` exists
- **WHEN** rendering OpenSpec changes directly
- **THEN** changes with >0% completion appear in NOW tier
- **AND** changes with 0% completion appear in NEXT tier

#### Scenario: No OpenSpec directory
- **GIVEN** the project does not have an `openspec/` directory
- **AND** no `roadmap.yaml` exists
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system displays a message: "No openspec/ directory found. Run `openspec init` to get started."

### Requirement: OpenSpec Integration

The system SHALL integrate with OpenSpec CLI to display task progress for changes.

#### Scenario: Item linked to OpenSpec change
- **GIVEN** a roadmap item has `change_spec: add-feature-x`
- **AND** OpenSpec has an active change named `add-feature-x` with 5/10 tasks complete
- **WHEN** the roadmap is rendered
- **THEN** the item shows "5/10 tasks" and 50% progress from OpenSpec

#### Scenario: OpenSpec change is archived
- **GIVEN** a roadmap item has `change_spec: completed-feature`
- **AND** that OpenSpec change has been archived
- **WHEN** the roadmap is rendered
- **THEN** the item shows as 100% complete

#### Scenario: OpenSpec CLI not available
- **GIVEN** the `openspec` CLI is not installed or not in PATH
- **AND** `roadmap.yaml` exists
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system displays the roadmap using only `roadmap.yaml` data
- **AND** shows a note that OpenSpec integration is unavailable

#### Scenario: Invalid change_spec reference
- **GIVEN** a roadmap item has `change_spec: non-existent-change`
- **WHEN** the roadmap is rendered
- **THEN** the item displays using its manual values
- **AND** shows a warning that the linked change was not found

### Requirement: Roadmap Progress Summary

The roadmap command SHALL include a summary showing aggregate progress.

#### Scenario: Summary content
- **GIVEN** there are N items with M total tasks and C completed tasks
- **WHEN** the roadmap is rendered
- **THEN** the header shows overall progress bar
- **AND** the footer shows "Total: N active | C/M tasks (X%)"

#### Scenario: Empty roadmap after filtering
- **GIVEN** `roadmap.yaml` exists with items
- **AND** all items have `status: archived` or are otherwise filtered out
- **WHEN** the roadmap is rendered
- **THEN** the system displays "No active roadmap items found"
- **AND** shows the count of filtered/archived items

#### Scenario: All items complete
- **GIVEN** all roadmap items have 100% task completion
- **WHEN** the roadmap is rendered
- **THEN** the header shows a full progress bar (100%)
- **AND** a congratulatory message: "All roadmap items complete!"
- **AND** items are still displayed in the LATER tier with DONE badges

### Requirement: Error Handling

The system SHALL handle error conditions gracefully with actionable messages.

#### Scenario: Malformed roadmap.yaml
- **GIVEN** `roadmap.yaml` contains invalid YAML syntax
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system displays a clear error message identifying the syntax issue

#### Scenario: Empty roadmap
- **GIVEN** `roadmap.yaml` exists but has no items defined
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system displays a message explaining no items are defined
- **AND** shows an example of how to add an item

#### Scenario: Malformed JSON from OpenSpec CLI
- **GIVEN** `openspec list --json` returns malformed or invalid JSON
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system displays an error: "OpenSpec CLI returned invalid data"
- **AND** falls back to `roadmap.yaml` if available
- **AND** suggests running `openspec list` manually to diagnose

#### Scenario: Empty openspec directory
- **GIVEN** the `openspec/` directory exists but contains no changes
- **AND** no `roadmap.yaml` exists
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system displays: "No OpenSpec changes found in openspec/"
- **AND** suggests running `openspec new <change-name>` to create one

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

### Requirement: Test Coverage Analysis

The harden command SHALL analyze test coverage for files affected by the change.

#### Scenario: Identify untested new code
- **GIVEN** the change adds new source files
- **WHEN** performing test coverage analysis
- **THEN** the command SHALL identify source files without corresponding test files
- **AND** report each untested file with suggested test file path

#### Scenario: Check test file existence patterns
- **GIVEN** the project follows standard test conventions
- **WHEN** analyzing test coverage
- **THEN** the command SHALL check for tests using common patterns:
  - `*.test.ts` / `*.spec.ts` for TypeScript
  - `test_*.py` / `*_test.py` for Python
  - `*_test.go` for Go
- **AND** report the detection pattern used

#### Scenario: Verify tests actually run
- **GIVEN** test files exist for changed code
- **WHEN** performing test coverage analysis
- **THEN** the command SHALL attempt to run tests (if test runner available)
- **AND** report pass/fail status
- **OR** note that test execution was skipped if no runner configured

#### Scenario: Report test coverage summary
- **GIVEN** analysis is complete
- **WHEN** generating the test coverage section
- **THEN** the report SHALL include:
  - Number of source files added/modified
  - Number of corresponding test files found
  - Coverage percentage (files with tests / total files)
  - List of untested files requiring attention

### Requirement: Implementation Quality Analysis

The harden command SHALL analyze code quality markers in affected files, including detection of hacky code and AI-generated slop.

#### Scenario: Detect incomplete work markers
- **GIVEN** the change modifies source files
- **WHEN** performing quality analysis
- **THEN** the command SHALL search for:
  - `TODO` comments
  - `FIXME` comments
  - `HACK` comments
  - `XXX` markers
- **AND** report each occurrence with file:line reference

#### Scenario: Detect debug artifacts
- **GIVEN** the change includes JavaScript/TypeScript files
- **WHEN** performing quality analysis
- **THEN** the command SHALL detect:
  - `console.log` statements (except in designated logging modules)
  - `debugger` statements
  - Commented-out code blocks (>3 consecutive commented lines)
- **AND** flag these for removal

#### Scenario: Detect hacky code patterns
- **GIVEN** the change modifies source files
- **WHEN** performing quality analysis
- **THEN** the command SHALL flag:
  - Magic numbers without named constants
  - Hardcoded strings that should be configurable
  - Type assertions/casts that bypass type safety (`as any`, `// @ts-ignore`)
  - Regex without explanatory comments for complex patterns
  - Deeply nested conditionals (>3 levels)
  - Functions exceeding reasonable length (>50 lines)
  - Copy-pasted code blocks (near-duplicate logic)
- **AND** report each with file:line reference and suggested fix

#### Scenario: Detect AI slop patterns
- **GIVEN** the change modifies source files
- **WHEN** performing quality analysis
- **THEN** the command SHALL detect signs of low-quality AI-generated code:
  - Overly verbose variable names that reduce readability
  - Excessive comments stating the obvious (e.g., `// increment counter` before `counter++`)
  - Placeholder implementations (`throw new Error("Not implemented")`, `pass`, `...`)
  - Generic error messages without context
  - Unnecessary abstractions or wrapper functions that add no value
  - Inconsistent naming conventions within the same file
  - Dead code paths that can never execute
  - Redundant null/undefined checks in already-guarded contexts
  - Over-documented trivial functions while complex ones lack docs
  - Cargo-culted patterns that don't fit the codebase style
- **AND** flag each with explanation of why it appears to be slop

#### Scenario: Check error handling completeness
- **GIVEN** the change adds async operations or API calls
- **WHEN** performing quality analysis
- **THEN** the command SHALL check for:
  - try/catch blocks around async operations
  - Error callbacks or .catch() handlers on promises
  - Proper error propagation (not swallowing errors silently)
  - Generic catch blocks that lose error context
  - Empty catch blocks
- **AND** flag incomplete error handling patterns

#### Scenario: Report quality summary
- **GIVEN** quality analysis is complete
- **WHEN** generating the quality section
- **THEN** the report SHALL include:
  - Count of TODO/FIXME/HACK markers found
  - Count of debug artifacts detected
  - Count of hacky code patterns found
  - Count of AI slop indicators detected
  - Error handling assessment (OK/WARN/REVIEW)
  - List of specific issues with file:line references

### Requirement: Documentation Analysis

The harden command SHALL verify documentation is updated for the change.

#### Scenario: Check README updates
- **GIVEN** the change adds new features or commands
- **WHEN** performing documentation analysis
- **THEN** the command SHALL check if relevant READMEs mention the new functionality
- **AND** flag if documentation appears outdated or missing

#### Scenario: Check inline documentation
- **GIVEN** the change adds public functions or APIs
- **WHEN** performing documentation analysis
- **THEN** the command SHALL check for:
  - JSDoc/TSDoc comments on exported functions
  - Docstrings on Python functions
  - Go doc comments on exported symbols
- **AND** report undocumented public interfaces

#### Scenario: Check CHANGELOG updates
- **GIVEN** the project has a CHANGELOG.md
- **AND** the change is user-facing
- **WHEN** performing documentation analysis
- **THEN** the command SHALL check if CHANGELOG has an entry for this change
- **AND** suggest adding an entry if missing

#### Scenario: Report documentation summary
- **GIVEN** documentation analysis is complete
- **WHEN** generating the documentation section
- **THEN** the report SHALL include:
  - README status (Updated/Needs Update/N/A)
  - API documentation coverage percentage
  - CHANGELOG status (Entry exists/Missing/N/A)
  - List of undocumented items

### Requirement: Cleanup Analysis

The harden command SHALL identify artifacts that should be removed or cleaned up.

#### Scenario: Detect obsolete files
- **GIVEN** the change refactors or replaces existing code
- **WHEN** performing cleanup analysis
- **THEN** the command SHALL identify:
  - Files that were replaced but not deleted
  - Backup files (*.bak, *.orig, *.old)
  - Temporary files that should not be committed
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
  - Scratch files or experiments
  - Large binary files that should be in .gitignore
- **AND** suggest appropriate action for each

#### Scenario: Report cleanup summary
- **GIVEN** cleanup analysis is complete
- **WHEN** generating the cleanup section
- **THEN** the report SHALL include:
  - Count of obsolete files detected
  - Count of dead imports found
  - List of items requiring cleanup action
  - Estimated lines of dead code (if detectable)

### Requirement: Spec Alignment Analysis

The harden command SHALL verify the implementation matches the spec requirements.

#### Scenario: Cross-reference tasks with implementation
- **GIVEN** the change has a tasks.md with checkboxes
- **WHEN** performing spec alignment analysis
- **THEN** the command SHALL verify each completed task has corresponding code
- **AND** flag tasks marked complete but lacking evidence

#### Scenario: Verify requirement scenarios
- **GIVEN** the change spec includes scenarios with WHEN/THEN conditions
- **WHEN** performing spec alignment analysis
- **THEN** the command SHALL check if tests exist that cover each scenario
- **AND** report scenario coverage percentage

#### Scenario: Detect scope creep
- **GIVEN** the change has defined scope in proposal.md
- **WHEN** performing spec alignment analysis
- **THEN** the command SHALL identify files modified outside the stated scope
- **AND** flag as potential scope creep or missing from impact list

#### Scenario: Report alignment summary
- **GIVEN** spec alignment analysis is complete
- **WHEN** generating the alignment section
- **THEN** the report SHALL include:
  - Task completion verification status
  - Scenario coverage percentage
  - Scope adherence assessment (OK/WARN/REVIEW)
  - List of misalignments found

### Requirement: Hardening Report Format

The harden command SHALL output a structured report with clear status indicators.

#### Scenario: Overall status determination
- **GIVEN** all analyses are complete
- **WHEN** generating the final report
- **THEN** the overall status SHALL be:
  - READY: All dimensions pass or have minor warnings only
  - NEEDS_WORK: One or more dimensions have issues requiring attention
  - BLOCKED: Critical issues prevent shipping

#### Scenario: Report structure
- **GIVEN** the hardening analysis is complete
- **WHEN** displaying results
- **THEN** the report SHALL follow this structure:
```
============================================================
              HARDENING REPORT: <change-id>
============================================================

OVERALL STATUS: [READY | NEEDS_WORK | BLOCKED]

TEST COVERAGE                                    [PASS|WARN|FAIL]
  Files with tests: X/Y (Z%)
  - [issue list if any]

IMPLEMENTATION QUALITY                           [PASS|WARN|FAIL]
  TODOs: N | Debug artifacts: N | Error handling: OK
  - [issue list if any]

DOCUMENTATION                                    [PASS|WARN|FAIL]
  README: Updated | API docs: X% | CHANGELOG: OK
  - [issue list if any]

CLEANUP                                          [PASS|WARN|FAIL]
  Obsolete files: N | Dead imports: N
  - [issue list if any]

SPEC ALIGNMENT                                   [PASS|WARN|FAIL]
  Tasks: X/Y verified | Scenarios: X% covered
  - [issue list if any]

============================================================
NEXT STEPS:
1. [Most critical action]
2. [Second priority]
...
============================================================
```

#### Scenario: Actionable next steps
- **GIVEN** issues are found during hardening
- **WHEN** generating the report
- **THEN** the command SHALL prioritize issues into actionable next steps
- **AND** order them by severity (blockers first, then warnings)
- **AND** limit to top 5 most important actions

#### Scenario: All dimensions pass
- **GIVEN** all hardening analyses complete without issues
- **WHEN** generating the report
- **THEN** the overall status SHALL be READY
- **AND** the NEXT STEPS section SHALL display "No issues found. Ready to ship!"
- **AND** each dimension SHALL show PASS status

### Requirement: OpenSpec CLI Integration

The harden command SHALL integrate with OpenSpec CLI for change context.

#### Scenario: Fetch change details
- **GIVEN** a valid change ID is provided
- **WHEN** the command starts
- **THEN** it SHALL run `openspec show <change-id> --json` to get change context
- **AND** use the response to identify affected files and specs

#### Scenario: OpenSpec CLI unavailable
- **GIVEN** the `openspec` CLI is not installed or fails
- **WHEN** the command attempts to fetch change details
- **THEN** it SHALL display an error: "OpenSpec CLI required for hardening analysis"
- **AND** suggest installing or checking the CLI

#### Scenario: Handle archived changes
- **GIVEN** the change ID refers to an archived change
- **WHEN** the command validates the target
- **THEN** it SHALL note the change is archived
- **AND** proceed with analysis using archived data
- **AND** include a note in the report that this is post-archive verification

### Requirement: OpenSpec Audit Command

The `/openspec-audit` command SHALL perform a project-wide audit to detect drift between specifications and implementation, identify unspecified code, and find conflicting requirements.

#### Scenario: Basic invocation without arguments
- **GIVEN** a project with `openspec/specs/` containing one or more capability specs
- **WHEN** user invokes `/openspec-audit`
- **THEN** the command SHALL audit all specs against the codebase
- **AND** output a structured audit report

#### Scenario: Scoped invocation with capability filter
- **GIVEN** a project with multiple capability specs
- **WHEN** user invokes `/openspec-audit auth`
- **THEN** the command SHALL audit only specs under `openspec/specs/auth/`
- **AND** limit drift detection to files referenced by that capability

#### Scenario: No specs directory
- **GIVEN** the project does not have an `openspec/specs/` directory
- **WHEN** user invokes `/openspec-audit`
- **THEN** the command SHALL display: "No specs found in openspec/specs/. Run `openspec init` to get started."

#### Scenario: Empty specs directory
- **GIVEN** `openspec/specs/` exists but contains no capability directories
- **WHEN** user invokes `/openspec-audit`
- **THEN** the command SHALL display: "No capability specs found in openspec/specs/"
- **AND** suggest creating specs or running `/openspec-proposal`

#### Scenario: JSON output format
- **GIVEN** a project with specs
- **WHEN** user invokes `/openspec-audit --json`
- **THEN** the command SHALL output the audit results as a JSON object
- **AND** the JSON SHALL include:
  - `health`: overall status (ALIGNED, DRIFT_DETECTED, MAJOR_DRIFT)
  - `summary`: object with specsAudited, requirementsChecked, scenariosVerified counts
  - `drift`: array of drift findings with severity, spec, code evidence
  - `orphans`: array of unspecified code modules
  - `conflicts`: array of spec conflicts
  - `recommendations`: array of prioritized actions

#### Scenario: Invalid scope argument
- **GIVEN** user invokes `/openspec-audit nonexistent`
- **AND** `openspec/specs/nonexistent/` does not exist
- **THEN** the command SHALL display an error message
- **AND** list available capability directories
- **AND** exit gracefully without proceeding to analysis

### Requirement: Spec Discovery Phase

The audit command SHALL inventory all specs and extract requirements with their scenarios as the first phase of analysis.

#### Scenario: Parse all capability specs
- **GIVEN** `openspec/specs/` contains directories `auth/`, `api/`, and `payments/`
- **WHEN** Phase 1: Discovery executes
- **THEN** the command SHALL read `spec.md` from each capability directory
- **AND** extract all `### Requirement:` blocks with their `#### Scenario:` blocks
- **AND** build an inventory with unique identifiers for each requirement

#### Scenario: Handle malformed spec files
- **GIVEN** a spec file contains invalid markdown or missing scenarios
- **WHEN** Phase 1: Discovery executes
- **THEN** the command SHALL log a warning for the malformed spec
- **AND** continue processing other specs
- **AND** include the warning in the final report

#### Scenario: Extract requirement metadata
- **GIVEN** a requirement block exists in a spec
- **WHEN** parsing the requirement
- **THEN** the command SHALL extract:
  - Requirement title
  - Normative language (SHALL, MUST, SHOULD)
  - All scenarios with Given/When/Then conditions
  - File references if mentioned in the requirement text

### Requirement: Implementation Mapping Phase

The audit command SHALL map specifications to their corresponding code implementations.

#### Scenario: Map specs to code via affected files
- **GIVEN** a spec references files in its text (e.g., "in `src/auth/session.ts`")
- **WHEN** Phase 2: Mapping executes
- **THEN** the command SHALL extract file references from spec text
- **AND** verify those files exist in the codebase
- **AND** build a bidirectional map: spec requirements to code files

#### Scenario: Infer code locations from capability name
- **GIVEN** a capability named `user-auth` has no explicit file references
- **WHEN** Phase 2: Mapping executes
- **THEN** the command SHALL search for files matching patterns:
  - `**/auth/**`, `**/*auth*`
  - Test files: `**/*.test.ts`, `**/*.spec.ts` containing "auth"
- **AND** present inferred mappings with confidence indicators

#### Scenario: Report unmappable specs
- **GIVEN** a spec has no file references and no matching code found
- **WHEN** Phase 2: Mapping completes
- **THEN** the command SHALL flag the spec as "unmapped"
- **AND** include this in the audit report as a potential gap

### Requirement: Drift Detection Phase

The audit command SHALL detect behavioral drift where implementation no longer matches spec requirements.

#### Scenario: Detect constraint drift
- **GIVEN** a spec states "Sessions MUST expire after 30 minutes"
- **AND** the implementation sets session expiry to 60 minutes
- **WHEN** Phase 3: Drift Detection executes
- **THEN** the command SHALL flag this as "constraint drift"
- **AND** include evidence: spec location, code location, expected vs actual values

#### Scenario: Detect missing implementation
- **GIVEN** a spec has a scenario "User receives email notification on login"
- **AND** no code implements email notification on login
- **WHEN** Phase 3: Drift Detection executes
- **THEN** the command SHALL flag this as "missing implementation"
- **AND** reference the unimplemented scenario

#### Scenario: Detect test-spec misalignment
- **GIVEN** a spec scenario states "THEN return 404 status"
- **AND** the corresponding test asserts status 400
- **WHEN** Phase 3: Drift Detection executes
- **THEN** the command SHALL flag this as "test-spec misalignment"
- **AND** include the spec scenario and test assertion locations

#### Scenario: Verify normative language compliance
- **GIVEN** a spec uses "MUST NOT" for a constraint
- **WHEN** Phase 3: Drift Detection executes
- **THEN** the command SHALL search for violations of the negative constraint
- **AND** flag any code that performs the prohibited action

#### Scenario: Handle ambiguous drift
- **GIVEN** drift detection finds a potential mismatch
- **AND** the mismatch cannot be conclusively determined
- **WHEN** reporting drift
- **THEN** the command SHALL mark the issue as "REVIEW" severity
- **AND** include context for manual verification

### Requirement: Orphan Detection Phase

The audit command SHALL identify code modules that lack specification coverage.

#### Scenario: Detect unspecified modules
- **GIVEN** `src/integrations/stripe.ts` exists with significant functionality
- **AND** no spec references Stripe integration
- **WHEN** Phase 4: Orphan Detection executes
- **THEN** the command SHALL flag `stripe.ts` as potentially unspecified
- **AND** suggest creating a spec for payment integration

#### Scenario: Filter noise from orphan detection
- **GIVEN** the codebase contains utility files, configs, and generated code
- **WHEN** Phase 4: Orphan Detection executes
- **THEN** the command SHALL exclude common non-specification targets:
  - Configuration files (`*.config.js`, `*.json`, `*.yaml`)
  - Type definitions (`*.d.ts`, `types.ts`)
  - Generated code (files with `// Generated` or `@generated` markers)
  - Test files (covered by their corresponding source specs)
- **AND** focus on business logic modules

#### Scenario: Identify orphaned by significance
- **GIVEN** a file has fewer than 20 lines of code
- **WHEN** evaluating for orphan status
- **THEN** the command SHALL deprioritize small files
- **AND** focus orphan warnings on substantial modules (>50 lines or multiple exports)

### Requirement: Conflict Analysis Phase

The audit command SHALL detect conflicts between specifications.

#### Scenario: Detect contradictory requirements
- **GIVEN** `specs/api/spec.md` states "API timeout MUST be 30 seconds"
- **AND** `specs/performance/spec.md` states "All operations MUST complete in 10 seconds"
- **WHEN** Phase 5: Conflict Analysis executes
- **THEN** the command SHALL flag this as a potential conflict
- **AND** ask "Which timeout applies to API calls?"

#### Scenario: Detect overlapping scope
- **GIVEN** two specs both define requirements for the same file or module
- **WHEN** Phase 5: Conflict Analysis executes
- **THEN** the command SHALL flag the overlap
- **AND** suggest consolidating into a single capability or clarifying boundaries

#### Scenario: Check for deprecated references
- **GIVEN** a spec references a function `validateUser()` 
- **AND** that function no longer exists in the codebase
- **WHEN** Phase 5: Conflict Analysis executes
- **THEN** the command SHALL flag the spec as "stale"
- **AND** include the missing reference

#### Scenario: No conflicts found
- **GIVEN** all specs are internally consistent
- **AND** no specs reference missing code
- **WHEN** Phase 5: Conflict Analysis completes
- **THEN** the command SHALL report "No conflicts detected"

### Requirement: Audit Report Format

The audit command SHALL produce a structured report with clear status indicators and remediation guidance.

#### Scenario: Report structure
- **GIVEN** all audit phases have completed
- **WHEN** generating the final report
- **THEN** the command SHALL output a report following this structure:
```
============================================================
               PROJECT AUDIT REPORT
============================================================

OVERALL HEALTH: [ALIGNED | DRIFT_DETECTED | MAJOR_DRIFT]

SPECS AUDITED: N
REQUIREMENTS CHECKED: M
SCENARIOS VERIFIED: K

DRIFT SUMMARY
------------------------------------------------------------
[Drift category]: N issues
...

DETAILED FINDINGS
------------------------------------------------------------

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

### Requirement: OpenSpec Coordinate Command

The `/openspec-coordinate` command SHALL synchronize multiple active OpenSpec changes to prevent requirement conflicts, task invalidation, and implementation drift during high-concurrency development.

#### Scenario: Detect overlapping file changes
- **GIVEN** two active changes `A` and `B` exist
- **AND** both changes list `src/core/engine.ts` in their "Affected code" section
- **WHEN** user invokes `/openspec-coordinate`
- **THEN** the command SHALL flag `src/core/engine.ts` as an overlapping file
- **AND** identify the specific requirements in each spec that affect this file

#### Scenario: Detect conflicting requirements
- **GIVEN** Change `A` adds a requirement to "Rename `getUser` to `fetchUser`"
- **AND** Change `B` adds a requirement to "Add `email` parameter to `getUser`"
- **WHEN** user invokes `/openspec-coordinate`
- **THEN** the command SHALL extract the identifier `getUser` and associated actions ("Rename", "Add parameter")
- **AND** flag a "Semantic Conflict" in the Identifier-Action Matrix
- **AND** suggest a synchronization meeting or priority resolution

#### Scenario: Detect task drift with hunk anchoring
- **GIVEN** Change `A` has a task with a stored anchor (pre-context, code-hash, post-context)
- **AND** Change `B` has modified the file such that the code has shifted by 15 lines
- **WHEN** user invokes `/openspec-coordinate`
- **THEN** the command SHALL perform a fuzzy search for the context anchor
- **AND** if found at a new location, mark the task as "MOVED" and update the reference
- **AND** if not found, mark the task as "DRIFTED" or "LOST"

#### Scenario: Enforce resource locking
- **GIVEN** Change `A` is actively being implemented and has locked `src/auth.ts`
- **AND** Change `B` also lists `src/auth.ts` in its affected code
- **WHEN** user invokes `/openspec-coordinate`
- **THEN** the command SHALL identify the resource contention
- **AND** mark the relevant tasks in Change `B` as `BLOCKED` by Change `A`
- **AND** display the lock status in the coordination report

#### Scenario: Task dependency alignment
- **GIVEN** Change `B` depends on a capability being implemented in Change `A`
- **WHEN** user invokes `/openspec-coordinate`
- **THEN** the command SHALL identify the dependency (via spec references or manual links)
- **AND** recommend that Change `B` tasks be deferred until Change `A` reaches a specific milestone
- **AND** visualize this in a cross-change roadmap

#### Scenario: Coordination report generation
- **GIVEN** coordination analysis is complete
- **WHEN** displaying results
- **THEN** the command SHALL output a "Coordination Dashboard" including:
  - Hot Files (overlapping files)
  - Semantic Conflicts (requirement collisions)
  - Task Drift status
  - Suggested Sequence (task ordering recommendations)

