## MODIFIED Requirements

### Requirement: OpenSpec Audit Command

The `/openspec-audit` command SHALL perform a project-wide audit to detect spec/implementation drift, identify unspecified code, find conflicting requirements, AND perform AI-driven architectural analysis that generates contextual `/goost-search` suggestions.

#### Scenario: Basic invocation without arguments
- **GIVEN** a project with `openspec/specs/` containing one or more capability specs
- **WHEN** user invokes `/openspec-audit`
- **THEN** the command SHALL audit all specs against the codebase
- **AND** perform architectural analysis to identify improvement opportunities
- **AND** output a structured audit report with contextual search suggestions

#### Scenario: Scoped invocation with capability filter
- **GIVEN** a project with multiple capability specs
- **WHEN** user invokes `/openspec-audit auth`
- **THEN** the command SHALL audit only specs under `openspec/specs/auth/`
- **AND** limit drift detection to files referenced by that capability
- **AND** still perform full architectural analysis (project-wide)

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
  - `improvements`: array of architectural findings with goost-search queries

#### Scenario: Invalid scope argument
- **GIVEN** user invokes `/openspec-audit nonexistent`
- **AND** `openspec/specs/nonexistent/` does not exist
- **THEN** the command SHALL display an error message
- **AND** list available capability directories
- **AND** exit gracefully without proceeding to analysis

## ADDED Requirements

### Requirement: AI-Driven Architectural Analysis Phase

The `/openspec-audit` command SHALL include a Phase 4 where the AI agent analyzes the codebase for architectural gaps and generates contextual `/goost-search` suggestions without relying on hardcoded tool or library names.

#### Scenario: Open-ended codebase examination
- **GIVEN** the audit reaches Phase 4
- **WHEN** beginning architectural analysis
- **THEN** the agent SHALL examine the codebase holistically including:
  - Project structure and organization
  - Configuration files and build setup
  - Test directory structure and patterns
  - Source code patterns and practices
  - Documentation presence and quality
  - Dependency manifest contents
- **AND** identify what practices are present versus notably absent

#### Scenario: Analysis across multiple categories
- **GIVEN** the agent is performing architectural analysis
- **WHEN** examining the codebase
- **THEN** the agent SHALL consider findings across categories including but not limited to:
  - Testing maturity and reliability
  - Security posture and vulnerability patterns
  - Performance and scalability patterns
  - Observability and debugging capabilities
  - Code quality and maintainability
  - Developer experience and onboarding
  - Dependency health and maintenance
  - CI/CD maturity and deployment safety
- **AND** the agent MAY identify gaps in additional categories not listed

#### Scenario: Evidence-based findings
- **GIVEN** the agent identifies an architectural gap
- **WHEN** documenting the finding
- **THEN** the finding SHALL include:
  - Specific observation of what was found or not found
  - Evidence from the codebase (files examined, patterns noticed)
  - Assessment of impact (why this matters)
- **AND** findings SHALL NOT be based on assumptions without evidence

#### Scenario: Contextual search query generation
- **GIVEN** the agent has identified an architectural gap with evidence
- **WHEN** generating a `/goost-search` suggestion
- **THEN** the query SHALL:
  - Describe the problem or solution space (not specific tool names)
  - Include relevant context from the detected tech stack
  - Be specific enough to yield actionable search results
  - Avoid hardcoded library or tool recommendations

#### Scenario: Problem-focused query formulation
- **GIVEN** the agent needs to suggest a search query
- **WHEN** formulating the query
- **THEN** the agent SHALL phrase queries in terms of:
  - The problem to solve (e.g., "test isolation for shared database state")
  - The capability needed (e.g., "runtime type validation for API inputs")
  - The pattern to implement (e.g., "structured logging with request correlation")
- **AND** SHALL NOT phrase queries as tool recommendations (e.g., NOT "install jest-parallel")

#### Scenario: Impact-based prioritization
- **GIVEN** multiple architectural gaps are identified
- **WHEN** ordering findings for the report
- **THEN** the agent SHALL prioritize by impact:
  1. Security vulnerabilities and risks
  2. Reliability issues affecting users
  3. Scalability concerns for growth
  4. Developer productivity blockers
  5. Code quality and maintainability
- **AND** limit output to the 7-10 most impactful findings

#### Scenario: Tech stack context in suggestions
- **GIVEN** the agent detects the project's technology stack
- **WHEN** generating search queries
- **THEN** queries SHALL include relevant stack context where helpful
  (e.g., "for TypeScript APIs", "in Python async applications")
- **AND** the context SHALL be derived from actual codebase analysis
- **AND** SHALL NOT assume specific frameworks without evidence

#### Scenario: Skip suggestions flag
- **GIVEN** user invokes `/openspec-audit --skip-suggestions`
- **WHEN** the audit completes
- **THEN** the command SHALL omit the "IMPROVEMENT OPPORTUNITIES" section
- **AND** still perform all other audit phases normally

#### Scenario: No significant gaps found
- **GIVEN** the codebase demonstrates strong architectural practices
- **WHEN** Phase 4 completes without significant findings
- **THEN** the report SHALL note: "No significant architectural gaps identified"
- **AND** briefly summarize the categories that were examined
- **AND** acknowledge that the analysis is not exhaustive

### Requirement: Improvement Opportunities Report Section

The audit report SHALL include an `IMPROVEMENT OPPORTUNITIES` section with agent-generated findings and contextual `/goost-search` suggestions.

#### Scenario: Finding format structure
- **GIVEN** the agent has identified architectural gaps
- **WHEN** generating the report section
- **THEN** each finding SHALL follow this structure:
```
[CATEGORY] Brief Finding Title
  Observation: What the agent found or didn't find, with evidence
  Impact: Why this matters for the project
  → /goost-search <contextual query describing problem/solution space>
```

#### Scenario: Category labeling
- **GIVEN** findings span multiple categories
- **WHEN** displaying findings
- **THEN** each finding SHALL be labeled with its category
- **AND** categories SHALL use descriptive names (e.g., SECURITY, TESTING, PERFORMANCE, OBSERVABILITY, DX)
- **AND** category names MAY vary based on the actual findings

#### Scenario: Observation specificity
- **GIVEN** the agent documents an observation
- **WHEN** writing the observation text
- **THEN** the observation SHALL reference specific evidence:
  - File paths or directories examined
  - Patterns noticed in the code
  - Configuration presence or absence
  - Comparison to common practices
- **AND** SHALL NOT make vague claims without supporting evidence

#### Scenario: Impact explanation
- **GIVEN** the agent assesses impact of a gap
- **WHEN** writing the impact text
- **THEN** the impact SHALL explain:
  - Who or what is affected (users, developers, operations)
  - What problems could arise (bugs, slowness, security issues)
  - When problems might manifest (now, at scale, in production)

#### Scenario: Section header and introduction
- **GIVEN** improvement opportunities exist
- **WHEN** rendering the section
- **THEN** the section SHALL begin with:
```
IMPROVEMENT OPPORTUNITIES
------------------------------------------------------------
Based on codebase analysis, the following improvements could
strengthen this project. Run the suggested searches to find
current best practices and solutions.
```

#### Scenario: JSON output includes improvements
- **GIVEN** user invokes `/openspec-audit --json`
- **AND** architectural gaps are identified
- **WHEN** generating JSON output
- **THEN** the JSON SHALL include an `improvements` array:
```json
{
  "improvements": [
    {
      "category": "SECURITY",
      "title": "Input Validation Gap",
      "observation": "API endpoints accept request bodies without schema validation...",
      "impact": "High risk of malformed data causing errors or security vulnerabilities",
      "query": "/goost-search runtime schema validation for REST APIs",
      "priority": 1
    }
  ]
}
```

### Requirement: Dynamic Category Discovery

The architectural analysis SHALL allow the agent to discover and report on categories beyond a predefined list.

#### Scenario: Agent identifies unlisted category
- **GIVEN** the agent notices a significant gap
- **AND** the gap doesn't fit neatly into predefined categories
- **WHEN** documenting the finding
- **THEN** the agent MAY create an appropriate category label
- **AND** the finding SHALL still follow the standard format

#### Scenario: Project-specific concerns
- **GIVEN** the codebase has domain-specific characteristics
- **WHEN** performing analysis
- **THEN** the agent MAY identify concerns specific to that domain
  (e.g., data privacy for healthcare, compliance for finance, accessibility for consumer apps)
- **AND** generate relevant search suggestions for those concerns

#### Scenario: Emerging best practices
- **GIVEN** the agent is analyzing a modern codebase
- **WHEN** identifying gaps
- **THEN** the agent MAY consider emerging practices not in traditional checklists
  (e.g., AI/ML considerations, edge computing, sustainability)
- **AND** formulate search queries that would surface current guidance

### Requirement: Analysis Depth Control

The audit command SHALL support controlling the depth of architectural analysis.

#### Scenario: Default analysis depth
- **GIVEN** user invokes `/openspec-audit` without depth flags
- **WHEN** performing architectural analysis
- **THEN** the agent SHALL perform standard analysis examining:
  - Configuration files and manifests
  - Directory structure and organization
  - Sample of source files for patterns
  - Test directory structure
  - Documentation files

#### Scenario: Deep analysis flag
- **GIVEN** user invokes `/openspec-audit --deep`
- **WHEN** performing architectural analysis
- **THEN** the agent SHALL perform thorough analysis including:
  - Reading additional source files beyond samples
  - Examining CI/CD configuration in detail
  - Analyzing dependency trees
  - Checking for patterns across more files
- **AND** the analysis MAY take longer to complete
- **AND** the report SHALL note that deep analysis was performed

#### Scenario: Quick analysis flag
- **GIVEN** user invokes `/openspec-audit --quick`
- **WHEN** performing architectural analysis
- **THEN** the agent SHALL perform lightweight analysis limited to:
  - Package manifests and config files only
  - No source file examination
  - Structure-based observations only
- **AND** the report SHALL note that quick analysis has limited depth
