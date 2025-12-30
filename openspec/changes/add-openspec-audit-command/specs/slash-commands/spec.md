## ADDED Requirements

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
## DRIFT: [spec path]
### Requirement: [name]
- Spec: "[quoted spec text]"
- Code: [actual implementation]
- Evidence: [file:line]
- Severity: [HIGH|MEDIUM|LOW|REVIEW]
- Action: [remediation suggestion]

## CONFLICTS DETECTED
...

## ORPHANED CODE (Unspecified)
...

RECOMMENDATIONS
------------------------------------------------------------
1. [Prioritized action]
...
============================================================
```

#### Scenario: Overall health determination
- **GIVEN** audit analysis is complete
- **WHEN** determining overall health status
- **THEN** the command SHALL set status based on:
  - **ALIGNED**: No drift, no conflicts, <3 minor orphans
  - **DRIFT_DETECTED**: Any HIGH severity drift or >3 orphans
  - **MAJOR_DRIFT**: Any constraint violations of MUST/SHALL requirements

#### Scenario: Severity classification
- **GIVEN** an issue is detected during audit
- **WHEN** assigning severity
- **THEN** the command SHALL classify as:
  - **HIGH**: MUST/SHALL violation, security implication, or data integrity risk
  - **MEDIUM**: SHOULD violation, test-spec mismatch, or significant orphan
  - **LOW**: Minor inconsistency, stylistic drift, small orphan
  - **REVIEW**: Ambiguous case requiring manual verification

#### Scenario: Empty audit (all aligned)
- **GIVEN** no drift, conflicts, or significant orphans are found
- **WHEN** generating the report
- **THEN** the command SHALL display:
  - Overall health: ALIGNED
  - "All specifications align with implementation"
  - Summary statistics only (no detailed findings section)

### Requirement: Sub-Agent Orchestration

The audit command SHALL use parallel sub-agents for efficient analysis, consistent with the `/openspec-harden` pattern.

#### Scenario: Spawn analysis sub-agents
- **GIVEN** audit begins after pre-flight checks pass
- **WHEN** entering analysis phase
- **THEN** the command SHALL spawn parallel sub-agents:
  - Spec Parser (explore): Inventory requirements and scenarios
  - Code Mapper (explore): Map specs to implementation files
  - Drift Scanner (explore): Check each requirement against code
  - Conflict Detector (explore): Cross-reference specs

#### Scenario: Aggregate sub-agent results
- **GIVEN** all sub-agents have returned results
- **WHEN** synthesizing findings
- **THEN** the command SHALL:
  - Merge all issues by severity
  - Deduplicate overlapping findings
  - Cross-reference drift with conflicts
  - Generate prioritized recommendations

#### Scenario: Sub-agent failure handling
- **GIVEN** a sub-agent fails or times out
- **WHEN** processing results
- **THEN** the command SHALL:
  - Note the failed dimension in the report
  - Continue with results from successful sub-agents
  - Suggest re-running with `--scope` to narrow analysis

#### Scenario: Sub-agent timeout
- **GIVEN** a sub-agent is processing
- **AND** it exceeds the 5-minute timeout
- **WHEN** the orchestrator detects timeout
- **THEN** the command SHALL mark that dimension as "INCOMPLETE"
- **AND** continue with results from other sub-agents
- **AND** note the timeout in the final report

#### Scenario: Large codebase optimization
- **GIVEN** the codebase has more than 1000 source files
- **WHEN** performing orphan detection
- **THEN** the command SHALL limit analysis to top 100 largest modules by line count
- **AND** note in the report that results are sampled
- **AND** suggest using `--scope` for comprehensive analysis of specific capabilities

### Requirement: OpenSpec CLI Integration

The audit command SHALL integrate with the OpenSpec CLI for spec access.

#### Scenario: Fetch spec inventory via CLI
- **GIVEN** the OpenSpec CLI is installed
- **WHEN** Phase 1: Discovery begins
- **THEN** the command SHALL run `openspec list --specs --json`
- **AND** use the output to enumerate capabilities

#### Scenario: OpenSpec CLI unavailable
- **GIVEN** the `openspec` CLI is not installed or fails
- **WHEN** the audit command attempts CLI operations
- **THEN** the command SHALL fall back to direct file reading
- **AND** note in the report that CLI integration is unavailable

#### Scenario: Check for active changes
- **GIVEN** the OpenSpec CLI is available
- **WHEN** the audit begins
- **THEN** the command SHALL run `openspec list`
- **AND** warn if active changes exist that may affect audit accuracy
- **AND** suggest completing or archiving changes before audit
