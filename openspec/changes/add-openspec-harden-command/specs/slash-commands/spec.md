## ADDED Requirements

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
