# Change: Add Architectural Weakness Detection to OpenSpec Audit

## Why

The current `/openspec-audit` command focuses on spec/implementation drift but misses broader architectural concerns. When developers run an audit, they should also learn about improvement opportunities - gaps in testing, security, performance, and other areas that could strengthen their project.

Rather than hardcoding specific tools or libraries to check for (which become outdated), this feature enables the AI agent to analyze the codebase holistically and generate contextual `/goost-search` suggestions based on what it actually observes. This creates a feedback loop: audit identifies gaps → suggests search queries → user discovers current best practices → applies relevant solutions.

## What Changes

- Add **Phase 4: Architectural Analysis** to `/openspec-audit`
- Agent examines codebase and identifies gaps across categories:
  - Testing maturity and reliability
  - Security posture and patterns
  - Performance and scalability
  - Observability and debugging
  - Code quality and maintainability
  - Developer experience
  - Dependency health
  - CI/CD maturity
  - (Plus any other categories the agent identifies)
- Agent generates **problem-focused** `/goost-search` queries (not tool recommendations)
- Add `IMPROVEMENT OPPORTUNITIES` section to audit report
- Add flags: `--skip-suggestions`, `--deep`, `--quick`

## Key Design Principle

**Agent-driven discovery, not hardcoded checklists.**

Instead of "check if Jest is configured for parallel testing", we instruct the agent:
- Examine how tests are organized and configured
- Identify what testing practices are present vs absent
- Assess impact of any gaps found
- Generate a search query describing the problem space

This keeps suggestions current and contextual rather than prescriptive and stale.

## Example Output

```
IMPROVEMENT OPPORTUNITIES
------------------------------------------------------------
Based on codebase analysis, the following improvements could
strengthen this project. Run the suggested searches to find
current best practices and solutions.

[SECURITY] Input Validation Gap
  Observation: API endpoints in src/routes/ accept request 
               bodies without schema validation. Direct 
               property access on req.body throughout.
  Impact: Risk of malformed data causing errors or exploits.
  → /goost-search runtime schema validation for REST APIs

[TESTING] Test Isolation Concerns
  Observation: Tests share database state. No setup/teardown
               patterns found. Test order dependencies likely.
  Impact: Flaky tests, false positives, debugging difficulty.
  → /goost-search test isolation patterns database fixtures

[OBSERVABILITY] Minimal Error Context
  Observation: Errors logged with console.error only. No 
               structured format. No request correlation IDs.
  Impact: Difficult production debugging, no audit trail.
  → /goost-search structured logging error tracking patterns
------------------------------------------------------------
```

## Impact

- Affected specs: `slash-commands` (OpenSpec Audit Command)
- Affected code: `.opencode/command/openspec-audit.md`
- Dependencies: Suggestions work standalone; become actionable with `/goost-search`
- No breaking changes - adds new optional phase to existing command
