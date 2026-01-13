## ADDED Requirements

### Requirement: Goost Improve Command

The `/goost-improve` command SHALL analyze codebases for architectural improvement opportunities and generate contextual `/goost-search` suggestions using AI-driven discovery with specification grounding.

<!-- Research Validated: 2026-01-13. Standalone command preferred over /openspec-audit integration per Unix philosophy and industry practice separating "code audit" from "architecture assessment". Simplified from original design: removed weighted scoring, added Reliability category, deferred --metadata-only mode. Sources: arXiv:2512.17540, Shuster et al. EMNLP 2021, CoVe 2023, CROKAGE 2020, ISO 25010:2023, AWS Well-Architected, OWASP -->

#### Scenario: Basic invocation
- **GIVEN** a project with source code
- **WHEN** user invokes `/goost-improve`
- **THEN** the command SHALL analyze the codebase for architectural gaps
- **AND** output improvement opportunities with `/goost-search` suggestions
- **AND** require no prior OpenSpec setup (works on any codebase)

<!-- Deferred to post-MVP per simplification analysis -->
<!-- #### Scenario: Targeted analysis with patterns
- **GIVEN** user wants to focus on specific areas
- **WHEN** user invokes `/goost-improve --include "src/**/*.ts" --exclude "**/*.test.ts"`
- **THEN** the command SHALL limit analysis to matching files
- **AND** NOT use sampling (analyze all matching files) -->

<!-- Note: --metadata-only mode also deferred to post-MVP per simplification analysis -->

#### Scenario: No significant gaps found
- **GIVEN** the codebase demonstrates strong architectural practices
- **WHEN** analysis completes without significant findings
- **THEN** the command SHALL note: "No significant architectural gaps identified"
- **AND** briefly summarize categories examined
- **AND** acknowledge analysis is not exhaustive

#### Scenario: Empty or invalid project
- **GIVEN** the project directory contains no source code files
- **OR** no recognizable project structure exists
- **WHEN** user invokes `/goost-improve`
- **THEN** the command SHALL display: "No source files found to analyze"
- **AND** suggest checking the working directory
- **AND** exit gracefully without analysis

#### Scenario: Analysis timeout
- **GIVEN** the codebase is very large or complex
- **WHEN** analysis exceeds a reasonable time limit (implementation-defined)
- **THEN** the command SHALL output partial findings gathered so far
- **AND** note: "Analysis truncated due to time constraints"
- **AND** suggest using `--include` patterns to narrow scope (when available)

### Requirement: Grounded Agent Discovery

The `/goost-improve` command SHALL use a dual-pathway approach combining specification grounding with open-ended discovery.

<!-- Research Validated: SGCR framework achieved 90.9% improvement over pure LLM discovery by grounding in specifications. Source: arXiv:2512.17540 -->

#### Scenario: Explicit path - critical area checks
- **GIVEN** the agent begins analysis
- **WHEN** examining the codebase
- **THEN** the agent SHALL check critical areas provided in instructions:
  - Security patterns (input validation, auth, secrets)
  - Reliability patterns (error handling, retries, circuit breakers, graceful degradation)
  - Testing practices (isolation, coverage, reliability)
  - Observability (logging, error tracking, debugging)
  - Developer experience (docs, setup, contribution)
- **AND** these checks are mandatory, not optional

<!-- Research Validated: 5 core categories aligned with ISO 25010 and AWS Well-Architected. Reliability was missing from original 4-category design. -->

#### Scenario: Implicit path - additional discovery
- **GIVEN** the agent has completed critical area checks
- **WHEN** continuing analysis
- **THEN** the agent MAY identify additional gaps beyond the 5 core categories
- **AND** discovered categories SHALL follow the same evidence and format requirements

#### Scenario: Evidence requirement for all findings
- **GIVEN** the agent identifies an architectural gap
- **WHEN** documenting the finding
- **THEN** the finding SHALL include specific evidence:
  | Claim Type | Required Evidence |
  |------------|-------------------|
  | "X exists" | File path where found |
  | "X does not exist" | Directories/patterns searched |
  | "Pattern Y is used" | 1-3 example file paths |
  | "Configuration Z is present" | Config file path + key |
- **AND** findings without evidence SHALL be rejected

#### Scenario: No verifiable findings in a category
- **GIVEN** the agent has completed checks for a core category
- **AND** no findings met the evidence requirements
- **WHEN** generating the report
- **THEN** the category SHALL NOT appear in findings (not counted as gap)
- **AND** the agent MAY note in verbose/debug output which categories were clean

### Requirement: Hybrid Query Generation

The `/goost-improve` command SHALL generate search queries using a hybrid approach combining tool names with context and temporal qualifiers.

<!-- Research Validated: Stack Overflow/CROKAGE research shows hybrid queries outperform pure problem-descriptions. Search engines already do semantic expansion from tool names. -->

#### Scenario: Query includes detected tools
- **GIVEN** the agent detects specific tools in use (e.g., Jest from package.json)
- **WHEN** generating a search query for a related gap
- **THEN** the query SHALL include the tool name
- **AND** add problem context and temporal qualifiers
- **Example**: "jest parallel testing typescript large suite 2024"

#### Scenario: Query for unknown tool space
- **GIVEN** the agent identifies a gap where no specific tool is detected
- **WHEN** generating a search query
- **THEN** the query SHALL use comparison format
- **AND** include "vs alternatives" or similar comparative terms
- **Example**: "zod vs yup vs joi typescript API validation 2024"

#### Scenario: Tech stack context in queries
- **GIVEN** the agent detects the project's technology stack
- **WHEN** generating search queries
- **THEN** queries SHALL include relevant stack context
- **AND** context SHALL be derived from actual codebase analysis (not assumed)

### Requirement: Simple Severity Ranking

The `/goost-improve` command SHALL prioritize findings using simple severity ranking, matching existing Goost commands.

<!-- Research Validated: 2026-01-13. Weighted scoring (Category × Severity) removed per simplification analysis. No precedent in SonarQube, ESLint, or existing Goost commands (/goost-slop-scan, /openspec-audit). Simple severity matches industry practice. -->

#### Scenario: Severity assignment
- **GIVEN** the agent has identified a finding
- **WHEN** assigning severity
- **THEN** severity SHALL be one of: Critical, High, Medium, Low
- **AND** severity definitions:
  | Severity | Criteria |
  |----------|----------|
  | Critical | Security vulnerabilities, data loss risks, system instability |
  | High | Significant gaps affecting reliability, maintainability, or velocity |
  | Medium | Notable improvements that would strengthen the codebase |
  | Low | Minor enhancements or best practice suggestions |

#### Scenario: Sorting findings
- **GIVEN** multiple findings have been identified
- **WHEN** generating the report
- **THEN** findings SHALL be sorted by:
  1. Severity (Critical first, then High, Medium, Low)
  2. Category (Security, Reliability, Testing, Observability, DX)

#### Scenario: Finding limit
- **GIVEN** many findings are identified
- **WHEN** generating the report
- **THEN** output SHALL be limited to the 7-10 highest-severity findings
- **AND** note if additional findings were truncated

### Requirement: Improvement Opportunities Report

The command SHALL output findings in a structured format with evidence and hybrid search queries.

#### Scenario: Finding format
- **GIVEN** findings have been prioritized
- **WHEN** generating output
- **THEN** each finding SHALL follow this format:
```
[SEVERITY] Brief Finding Title
  Category: Which area this falls under
  Observation: What the agent found or didn't find
  Evidence: Specific file paths, patterns, or search scope
  Impact: Why this matters (who affected, what problems, when manifest)
  → /goost-search <hybrid query with tool + context + year>
```

#### Scenario: Section header
- **GIVEN** findings exist
- **WHEN** rendering the report
- **THEN** the section SHALL begin with:
```
IMPROVEMENT OPPORTUNITIES
------------------------------------------------------------
Based on codebase analysis, the following improvements could
strengthen this project. Run the suggested searches to find
current best practices and solutions.
```

<!-- Note: JSON output deferred to post-MVP per simplification analysis -->

### Requirement: Dynamic Category Discovery

The command SHALL allow the agent to discover and report on categories beyond the 4 core categories.

#### Scenario: Agent identifies unlisted category
- **GIVEN** the agent notices a significant gap
- **AND** the gap doesn't fit into Security, Reliability, Testing, Observability, or DX
- **WHEN** documenting the finding
- **THEN** the agent MAY create an appropriate category label
- **AND** assign a reasonable weight (default: 0.5)
- **AND** the finding SHALL still follow the standard format

#### Scenario: Domain-specific concerns
- **GIVEN** the codebase has domain-specific characteristics
- **WHEN** performing analysis
- **THEN** the agent MAY identify domain-specific concerns
  (e.g., data privacy for healthcare, compliance for finance, accessibility for consumer apps)
- **AND** generate relevant search suggestions for those concerns

> **Cross-Cutting Concern: Observability**
> Debug output is NOT specified for MVP. The agent uses standard analysis patterns without dedicated debug/verbose flags. This may be added post-MVP if needed.

> **Cross-Cutting Concern: Timeout**
> No hard timeout is specified. The "Analysis timeout" scenario covers graceful handling of long-running analysis, but specific timeout values are implementation-defined based on typical analysis times.
