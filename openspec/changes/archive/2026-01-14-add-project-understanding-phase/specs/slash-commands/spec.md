## ADDED Requirements

### Requirement: Project Understanding Phase

The `/goost-improve` command SHALL understand project context before analyzing for architectural gaps to provide relevant, actionable suggestions.

<!-- Research Validated: 2026-01-13. Documentation-first approach validated against GitHub Copilot, Aider, Cody. Simplified from original 5-decision design to 2-step "prepend context to prompt" approach per industry best practices. Sources: GitHub Copilot docs, Aider docs, simonwillison.net, harper.blog -->

#### Scenario: Read project documentation
- **GIVEN** user invokes `/goost-improve`
- **WHEN** the command begins execution
- **THEN** the command SHALL first read available documentation:
  - `README.md` (primary)
  - `AGENTS.md` (if present)
- **AND** extract project purpose and any stated constraints
- **AND** complete this phase before gap analysis begins

#### Scenario: Inject context into analysis
- **GIVEN** documentation has been read
- **WHEN** beginning gap analysis
- **THEN** the command SHALL prepend documentation content to the analysis prompt
- **AND** instruct the LLM to skip categories irrelevant to the project
- **AND** instruct the LLM to respect documented constraints and deferrals
- **AND** let the LLM naturally infer project type from context (no explicit classification)

<!-- Research Note: Explicit project type classification removed. LLMs naturally recognize "this is a CLI tool" from README content without classification logic. Sources: GitHub Copilot, Cody, simonwillison.net -->

#### Scenario: Respect documented constraints
- **GIVEN** documentation has been prepended to the analysis prompt
- **WHEN** generating findings
- **THEN** the LLM SHALL identify and respect explicit constraints from documentation
- **AND** SHALL NOT suggest improvements for items documented as out-of-scope or deferred
- **Example**: If README states "auth is handled by the host", skip auth-related findings

<!-- Research Note: Pattern matching for constraints ("does not handle X") removed. LLM semantic understanding is more reliable and simpler. Sources: Requirements engineering research -->

#### Scenario: Output context summary
- **GIVEN** project understanding phase has completed
- **WHEN** generating the report
- **THEN** the command SHALL output a context summary before findings:
  ```
  PROJECT CONTEXT
  ------------------------------------------------------------
  Purpose: <extracted purpose statement>
  Key constraints identified:
    - <constraint 1>
    - <constraint 2>
  Categories analyzed: <list>
  Categories skipped: <list with reasons>
  ------------------------------------------------------------
  ```
- **AND** this summary SHALL appear before IMPROVEMENT OPPORTUNITIES

#### Scenario: No documentation found
- **GIVEN** no README.md exists
- **AND** no AGENTS.md exists
- **WHEN** beginning analysis
- **THEN** the command SHALL note: "No project documentation found"
- **AND** proceed with all categories enabled
- **AND** suggest: "Consider adding README.md to help tools understand your project"

<!-- Research Note: Hard-coded category filtering by project type removed. It's an anti-pattern - auth libraries need auth analysis, CLI tools handle credentials, etc. The LLM decides relevance dynamically based on context. Sources: ESLint docs, SonarQube docs, OWASP ASVS -->

#### Scenario: AGENTS.md only (no README)
- **GIVEN** no README.md exists
- **AND** AGENTS.md exists with project context
- **WHEN** beginning analysis
- **THEN** the command SHALL use AGENTS.md content for context
- **AND** note in context summary: "Source: AGENTS.md (no README.md found)"
- **AND** proceed with context-aware analysis based on AGENTS.md content

#### Scenario: Large documentation truncation
- **GIVEN** README.md or AGENTS.md exceeds 2000 characters
- **WHEN** prepending documentation to the analysis prompt
- **THEN** the command SHALL truncate content to approximately 2000 characters
- **AND** prefer truncating at paragraph or section boundaries
- **AND** note in context summary if truncation occurred: "(truncated)"

#### Scenario: Empty or unreadable documentation
- **GIVEN** README.md exists but is empty or contains only whitespace
- **WHEN** beginning analysis
- **THEN** the command SHALL treat this as "no documentation found"
- **AND** check for AGENTS.md as fallback
- **AND** note: "README.md found but empty"

## MODIFIED Requirements

### Requirement: Goost Improve Command

The `/goost-improve` command SHALL understand project context before analyzing for architectural gaps to provide relevant, actionable suggestions.

#### Scenario: Basic invocation (MODIFIED)
- **GIVEN** a project with source code
- **WHEN** user invokes `/goost-improve`
- **THEN** the command SHALL first complete the Project Understanding Phase
- **AND** THEN analyze the codebase for architectural gaps (with context-aware relevance)
- **AND** output improvement opportunities with `/goost-search` suggestions
- **AND** require no prior OpenSpec setup (works on any codebase)
