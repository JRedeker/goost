# Change: Add Architectural Improvement Suggestions

## Why

The current `/openspec-audit` command focuses on spec/implementation drift but misses broader architectural concerns. When developers run an audit, they should also learn about improvement opportunities - gaps in testing, security, performance, and other areas that could strengthen their project.

Rather than hardcoding specific tools or libraries to check for (which become outdated), this feature enables the AI agent to analyze the codebase holistically and generate contextual `/goost-search` suggestions based on what it actually observes. This creates a feedback loop: audit identifies gaps → suggests search queries → user discovers current best practices → applies relevant solutions.

## What Changes

- Add **standalone `/goost-improve` command** (not integrated into /openspec-audit)
  - Research validated: Unix "do one thing well" principle; industry separates "code audit" from "architecture assessment"
- Agent examines codebase and identifies gaps across 4 core categories (MVP):
  - Security posture and patterns
  - Testing maturity and reliability  
  - Observability and debugging
  - Developer experience
  - (Plus any other categories the agent identifies)
- Agent generates **hybrid** `/goost-search` queries (tool name + context + temporal qualifiers)
  - Research validated: hybrid queries outperform pure problem-descriptions
- Add `IMPROVEMENT OPPORTUNITIES` output section
- Two analysis modes: `--metadata-only` (configs only) and full (default)
  - Research validated: sampling creates false negatives; 3-tier model is uncommon

## Research Validation (2026-01-12)

| Decision | Status | Key Finding |
|----------|--------|-------------|
| Separate command vs Phase 4 | ✅ Changed | Matches project patterns, Unix philosophy, industry practice |
| Evidence-based findings | ✅ Validated | Academic research confirms citation requirements reduce hallucinations |
| Hybrid query generation | ⚠️ Revised | Research shows "zod vs alternatives 2024" outperforms pure abstraction |
| 2 depth modes (not 3) | ⚠️ Revised | Sampling middle ground creates unreliable results per OWASP |
| 4 core categories for MVP | ⚠️ Revised | Start smaller, expand based on feedback |

Sources: arXiv:2512.17540, arXiv:2305.14627, Google SRE Book, AWS Well-Architected, OWASP Static Analysis

## Key Design Principles

**1. Agent-driven discovery with specification grounding.**

Instead of pure free-form discovery (which has consistency issues per research), we:
- Provide the agent with project conventions and critical areas to check
- Let it discover additional issues beyond the guidance
- Require evidence (file paths, patterns) for every finding

Research shows this "dual-pathway" approach achieves 90.9% improvement over pure LLM discovery (arXiv:2512.17540).

**2. Hybrid search queries, not pure abstraction.**

Instead of only "runtime type validation for API inputs", use:
- "zod vs alternatives 2024" (includes tool name + comparison + year)
- "parallel test execution jest typescript" (includes context)

Research shows modern search engines do semantic expansion; adding tool names yields better results.

**3. Weighted prioritization, not fixed hierarchy.**

Instead of rigid "Security > Reliability > Scalability", use:
- Severity tiers within categories (Critical/High/Medium/Low)
- Priority = Category Weight × Severity Score
- Escape hatch: Critical items in any category can be elevated

This matches AWS Well-Architected and RICE/WSJF industry practices.

## Example Output

```
IMPROVEMENT OPPORTUNITIES
------------------------------------------------------------
Based on codebase analysis, the following improvements could
strengthen this project. Run the suggested searches to find
current best practices and solutions.

[SECURITY - Critical] Input Validation Gap
  Observation: API endpoints in src/routes/ accept request 
               bodies without schema validation. Direct 
               property access on req.body throughout.
  Evidence: src/routes/users.ts:45, src/routes/orders.ts:23
  Impact: Risk of malformed data causing errors or exploits.
  → /goost-search zod vs yup vs joi typescript API validation 2024

[TESTING - High] Test Isolation Concerns
  Observation: Tests share database state. No setup/teardown
               patterns found. Test order dependencies likely.
  Evidence: Searched test/*.ts - no beforeEach/afterEach patterns
  Impact: Flaky tests, false positives, debugging difficulty.
  → /goost-search jest test isolation database fixtures typescript

[OBSERVABILITY - Medium] Minimal Error Context
  Observation: Errors logged with console.error only. No 
               structured format. No request correlation IDs.
  Evidence: grep "console.error" found 47 instances, no pino/winston
  Impact: Difficult production debugging, no audit trail.
  → /goost-search structured logging nodejs pino vs winston 2024
------------------------------------------------------------
```

## Impact

- Affected specs: `slash-commands` (new Goost Improve Command)
- Affected code: New `.opencode/command/goost-improve.md` file (~200 lines)
- Dependencies: Suggestions work standalone; become actionable with `/goost-search`
- No breaking changes - completely new command
