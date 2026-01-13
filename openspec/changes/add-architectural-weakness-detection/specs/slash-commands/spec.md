## ADDED Requirements

### Requirement: Goost Improve Command

The `/goost-improve` command SHALL analyze codebases for architectural improvement opportunities and generate contextual `/goost-search` suggestions using AI-driven discovery with specification grounding.

<!-- Research Validated: 2026-01-12. Standalone command preferred over /openspec-audit integration per Unix philosophy and industry practice separating "code audit" from "architecture assessment". Sources: arXiv:2512.17540, Google SRE Book, AWS Well-Architected -->

#### Scenario: Basic invocation
- **GIVEN** a project with source code
- **WHEN** user invokes `/goost-improve`
- **THEN** the command SHALL analyze the codebase for architectural gaps
- **AND** output improvement opportunities with `/goost-search` suggestions
- **AND** require no prior OpenSpec setup (works on any codebase)

#### Scenario: Metadata-only mode
- **GIVEN** user wants a quick high-level scan
- **WHEN** user invokes `/goost-improve --metadata-only`
- **THEN** the command SHALL analyze only:
  - Package manifests (package.json, requirements.txt, go.mod, etc.)
  - Configuration files
  - Directory structure
  - README and documentation files
- **AND** NOT read source code files
- **AND** note in output that analysis depth is limited

#### Scenario: Targeted analysis with patterns
- **GIVEN** user wants to focus on specific areas
- **WHEN** user invokes `/goost-improve --include "src/**/*.ts" --exclude "**/*.test.ts"`
- **THEN** the command SHALL limit analysis to matching files
- **AND** NOT use sampling (analyze all matching files)

#### Scenario: No significant gaps found
- **GIVEN** the codebase demonstrates strong architectural practices
- **WHEN** analysis completes without significant findings
- **THEN** the command SHALL note: "No significant architectural gaps identified"
- **AND** briefly summarize categories examined
- **AND** acknowledge analysis is not exhaustive

### Requirement: Grounded Agent Discovery

The `/goost-improve` command SHALL use a dual-pathway approach combining specification grounding with open-ended discovery.

<!-- Research Validated: SGCR framework achieved 90.9% improvement over pure LLM discovery by grounding in specifications. Source: arXiv:2512.17540 -->

#### Scenario: Explicit path - critical area checks
- **GIVEN** the agent begins analysis
- **WHEN** examining the codebase
- **THEN** the agent SHALL check critical areas provided in instructions:
  - Security patterns (input validation, auth, secrets)
  - Testing practices (isolation, coverage, reliability)
  - Observability (logging, error tracking, debugging)
  - Developer experience (docs, setup, contribution)
- **AND** these checks are mandatory, not optional

#### Scenario: Implicit path - additional discovery
- **GIVEN** the agent has completed critical area checks
- **WHEN** continuing analysis
- **THEN** the agent MAY identify additional gaps beyond the 4 core categories
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

### Requirement: Weighted Priority Scoring

The `/goost-improve` command SHALL prioritize findings using weighted scoring rather than a fixed category hierarchy.

<!-- Research Validated: AWS Well-Architected, Google SRE, and RICE/WSJF frameworks all use context-dependent trade-offs rather than fixed hierarchies. Source: Google SRE Book Chapter 3 -->

#### Scenario: Priority calculation
- **GIVEN** the agent has identified multiple findings
- **WHEN** determining priority order
- **THEN** priority SHALL be calculated as: Category Weight × Severity Score
- **AND** Severity tiers: Critical (4), High (3), Medium (2), Low (1)
- **AND** Category weights: Security (1.0), Testing (0.9), Observability (0.7), DX (0.6)

#### Scenario: Critical items in lower-weight categories
- **GIVEN** a finding has Critical severity in a lower-weight category
- **WHEN** calculating priority
- **THEN** the finding MAY outrank lower-severity items in higher-weight categories
- **Example**: Critical DX (0.6 × 4 = 2.4) outranks Low Security (1.0 × 1 = 1.0)

#### Scenario: Finding limit
- **GIVEN** many findings are identified
- **WHEN** generating the report
- **THEN** output SHALL be limited to the 7-10 highest-priority findings
- **AND** note if additional findings were truncated

### Requirement: Improvement Opportunities Report

The command SHALL output findings in a structured format with evidence and hybrid search queries.

#### Scenario: Finding format
- **GIVEN** findings have been prioritized
- **WHEN** generating output
- **THEN** each finding SHALL follow this format:
```
[CATEGORY - Severity] Brief Finding Title
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

#### Scenario: JSON output
- **GIVEN** user invokes `/goost-improve --json`
- **WHEN** generating output
- **THEN** the JSON SHALL include:
```json
{
  "improvements": [
    {
      "category": "SECURITY",
      "severity": "Critical",
      "title": "Input Validation Gap",
      "observation": "API endpoints accept request bodies without schema validation",
      "evidence": ["src/routes/users.ts:45", "src/routes/orders.ts:23"],
      "impact": "Risk of malformed data causing errors or security vulnerabilities",
      "query": "/goost-search zod vs yup vs joi typescript API validation 2024",
      "priority": 4.0
    }
  ],
  "metadata": {
    "analysisDepth": "full",
    "filesAnalyzed": 47,
    "categoriesChecked": ["SECURITY", "TESTING", "OBSERVABILITY", "DX"]
  }
}
```

### Requirement: Dynamic Category Discovery

The command SHALL allow the agent to discover and report on categories beyond the 4 core categories.

#### Scenario: Agent identifies unlisted category
- **GIVEN** the agent notices a significant gap
- **AND** the gap doesn't fit into Security, Testing, Observability, or DX
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
