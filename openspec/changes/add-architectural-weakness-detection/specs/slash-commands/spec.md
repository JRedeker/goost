## MODIFIED Requirements

### Requirement: OpenSpec Audit Command

The `/openspec-audit` command SHALL perform a project-wide audit to detect spec/implementation drift, identify unspecified code, find conflicting requirements, AND detect architectural weaknesses with actionable `/goost-search` suggestions.

#### Scenario: Basic invocation without arguments
- **GIVEN** a project with `openspec/specs/` containing one or more capability specs
- **WHEN** user invokes `/openspec-audit`
- **THEN** the command SHALL audit all specs against the codebase
- **AND** detect architectural weaknesses in testing, security, and performance
- **AND** output a structured audit report with improvement suggestions

#### Scenario: Scoped invocation with capability filter
- **GIVEN** a project with multiple capability specs
- **WHEN** user invokes `/openspec-audit auth`
- **THEN** the command SHALL audit only specs under `openspec/specs/auth/`
- **AND** limit drift detection to files referenced by that capability
- **AND** still perform full architectural weakness detection (project-wide)

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
  - `suggestions`: array of architectural weakness suggestions with goost-search queries

#### Scenario: Invalid scope argument
- **GIVEN** user invokes `/openspec-audit nonexistent`
- **AND** `openspec/specs/nonexistent/` does not exist
- **THEN** the command SHALL display an error message
- **AND** list available capability directories
- **AND** exit gracefully without proceeding to analysis

## ADDED Requirements

### Requirement: Architectural Weakness Detection Phase

The `/openspec-audit` command SHALL include a Phase 4 that detects architectural weaknesses and suggests `/goost-search` queries for remediation.

#### Scenario: Testing infrastructure weakness detection
- **GIVEN** the audit reaches Phase 4
- **WHEN** analyzing testing infrastructure
- **THEN** the command SHALL detect:
  - Missing test parallelization configuration
  - Absence of test timeout settings
  - No property-based testing libraries
  - Missing coverage tooling
  - No snapshot testing setup
  - No E2E testing framework
- **AND** generate a `/goost-search` suggestion for each detected weakness

#### Scenario: Security pattern weakness detection
- **GIVEN** the audit reaches Phase 4
- **WHEN** analyzing security patterns
- **THEN** the command SHALL detect:
  - Hardcoded secrets in source files
  - Missing input validation libraries
  - SQL injection risk patterns (string concatenation in queries)
  - No rate limiting middleware
  - Unsafe eval/exec usage
  - HTTP URLs in production configuration
- **AND** generate a `/goost-search` suggestion for each detected weakness

#### Scenario: Performance anti-pattern detection
- **GIVEN** the audit reaches Phase 4
- **WHEN** analyzing performance patterns
- **THEN** the command SHALL detect:
  - N+1 query patterns (database calls inside loops)
  - Missing caching layer
  - Synchronous blocking calls in async context
  - Unbounded API responses (no pagination)
  - Large bundle without code splitting
  - Potential memory leaks (event listeners without cleanup)
- **AND** generate a `/goost-search` suggestion for each detected weakness

#### Scenario: Stack-specific search suggestions
- **GIVEN** architectural weaknesses are detected
- **WHEN** generating `/goost-search` suggestions
- **THEN** the command SHALL auto-detect the project's tech stack
- **AND** include stack-specific terms in suggestions (e.g., "jest" for JS, "pytest" for Python)
- **AND** fall back to generic terms if stack is unclear

#### Scenario: Suggestion limit
- **GIVEN** many architectural weaknesses are detected
- **WHEN** generating the suggestions section
- **THEN** the command SHALL limit output to top 5-7 most impactful suggestions
- **AND** prioritize by category: Security > Testing > Performance
- **AND** note if additional suggestions were truncated

#### Scenario: Skip suggestions flag
- **GIVEN** user invokes `/openspec-audit --skip-suggestions`
- **WHEN** the audit completes
- **THEN** the command SHALL omit the "SUGGESTED IMPROVEMENTS" section
- **AND** still perform all other audit phases normally

#### Scenario: No weaknesses detected
- **GIVEN** the project has good architectural practices
- **WHEN** Phase 4 completes without findings
- **THEN** the suggestions section SHALL display: "No architectural weaknesses detected"
- **AND** note the categories that were checked

### Requirement: Suggestions Report Format

The audit report SHALL include a `SUGGESTED IMPROVEMENTS` section with actionable `/goost-search` queries.

#### Scenario: Suggestions section structure
- **GIVEN** architectural weaknesses were detected
- **WHEN** generating the final report
- **THEN** the report SHALL include a `SUGGESTED IMPROVEMENTS` section containing:
  - Category headers (Testing Infrastructure, Security Patterns, Performance)
  - Weakness description for each finding
  - Corresponding `/goost-search <query>` command
  - Brief explanation of why this matters

#### Scenario: Suggestion format
- **GIVEN** a weakness is detected (e.g., no test parallelization)
- **WHEN** displaying the suggestion
- **THEN** the format SHALL be:
```
! <Weakness description>
  → /goost-search <stack-specific query>
```

#### Scenario: JSON output includes suggestions
- **GIVEN** user invokes `/openspec-audit --json`
- **AND** architectural weaknesses are detected
- **WHEN** generating JSON output
- **THEN** the JSON SHALL include a `suggestions` array:
```json
{
  "suggestions": [
    {
      "category": "testing",
      "weakness": "No test parallelization detected",
      "query": "/goost-search test parallelization typescript jest",
      "priority": 1
    }
  ]
}
```

#### Scenario: Goost-search command not available
- **GIVEN** `/goost-search` command is not installed
- **WHEN** displaying suggestions
- **THEN** the command SHALL still show the suggestions
- **AND** note: "Run `/goost-search <query>` to find expert prompts (install goost-search command if not available)"

### Requirement: Tech Stack Detection

The audit command SHALL auto-detect the project's technology stack to customize suggestions.

#### Scenario: JavaScript/TypeScript detection
- **GIVEN** the project contains `package.json`
- **WHEN** detecting tech stack
- **THEN** the command SHALL identify JavaScript/TypeScript stack
- **AND** detect specific frameworks (React, Next.js, Express) from dependencies
- **AND** use appropriate terms in suggestions (e.g., "jest", "vitest", "mocha")

#### Scenario: Python detection
- **GIVEN** the project contains `requirements.txt`, `pyproject.toml`, or `setup.py`
- **WHEN** detecting tech stack
- **THEN** the command SHALL identify Python stack
- **AND** detect frameworks (Django, Flask, FastAPI) from dependencies
- **AND** use appropriate terms in suggestions (e.g., "pytest", "hypothesis")

#### Scenario: Go detection
- **GIVEN** the project contains `go.mod`
- **WHEN** detecting tech stack
- **THEN** the command SHALL identify Go stack
- **AND** use appropriate terms in suggestions (e.g., "go test", "testify")

#### Scenario: Multiple or unclear stack
- **GIVEN** the project has mixed or unclear technology indicators
- **WHEN** detecting tech stack
- **THEN** the command SHALL use generic terms in suggestions
- **AND** note: "Multiple stacks detected - suggestions are generic"
