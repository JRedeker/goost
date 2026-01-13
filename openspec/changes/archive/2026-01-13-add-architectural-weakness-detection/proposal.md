# Change: Add Architectural Improvement Suggestions

## Why

The current `/openspec-audit` command focuses on spec/implementation drift but misses broader architectural concerns. When developers run an audit, they should also learn about improvement opportunities - gaps in testing, security, performance, and other areas that could strengthen their project.

Rather than hardcoding specific tools or libraries to check for (which become outdated), this feature enables the AI agent to analyze the codebase holistically and generate contextual `/goost-search` suggestions based on what it actually observes. This creates a feedback loop: audit identifies gaps → suggests search queries → user discovers current best practices → applies relevant solutions.

## What Changes

- Add **standalone `/goost-improve` command** (not integrated into /openspec-audit)
  - Research validated: Unix "do one thing well" principle; industry separates "code audit" from "architecture assessment"
- Agent examines codebase and identifies gaps across 5 core categories (MVP):
  - Security posture and patterns
  - Reliability and fault tolerance (added per ISO 25010/AWS research)
  - Testing maturity and coverage
  - Observability and debugging
  - Developer experience
  - (Plus any other categories the agent identifies)
- Agent generates **hybrid** `/goost-search` queries (tool name + context + temporal qualifiers)
  - Research validated: hybrid queries outperform pure problem-descriptions (CROKAGE 2020)
- Add `IMPROVEMENT OPPORTUNITIES` output section with simple severity ranking (Critical/High/Medium/Low)
  - Research validated: matches SonarQube, ESLint, and existing Goost commands
- Single analysis mode for MVP (full codebase analysis)
  - `--metadata-only` deferred to post-MVP per simplification analysis

## Research Validation (2026-01-13)

| Decision | Status | Key Finding |
|----------|--------|-------------|
| Separate command vs Phase 4 | ✅ Validated | Matches project patterns, Unix philosophy, industry practice |
| Evidence-based findings | ✅ Validated | Retrieval grounding reduces hallucinations (Shuster et al. 2021; CoVe 2023) |
| Hybrid query generation | ✅ Validated | CROKAGE/NLP2API research confirms tool names bridge vocabulary mismatch |
| 2 depth modes (not 3) | ✅ Validated | Sampling creates false negatives per OWASP |
| 5 core categories for MVP | ⚠️ Revised | Added Reliability - top-level in ISO 25010 and AWS Well-Architected |
| Weighted priority scoring | ❌ Removed | Over-engineered; no precedent in SonarQube, ESLint, or existing Goost commands |
| Simple severity ranking | ✅ Added | Matches project patterns (`/goost-slop-scan`, `/openspec-audit`) |

Sources: arXiv:2512.17540, Shuster et al. EMNLP 2021, CoVe 2023, CROKAGE 2020, ISO 25010:2023, AWS Well-Architected, OWASP

## Key Design Principles

**1. Agent-driven discovery with specification grounding.**

Instead of pure free-form discovery (which has consistency issues per research), we:
- Provide the agent with project conventions and critical areas to check
- Let it discover additional issues beyond the guidance
- Require evidence (file paths, patterns) for every finding

Research shows this "dual-pathway" approach achieves 90.9% relative improvement over pure LLM discovery (arXiv:2512.17540). Note: SGCR validated for code review; adapted for architectural analysis.

**2. Hybrid search queries, not pure abstraction.**

Instead of only "runtime type validation for API inputs", use:
- "zod vs alternatives 2024" (includes tool name + comparison + year)
- "parallel test execution jest typescript" (includes context)

Research shows the "vocabulary mismatch" problem - abstract queries don't match solution terminology. Tool names bridge this gap (CROKAGE 2020, NLP2API 2018).

**3. Simple severity ranking, not weighted scoring.**

Use standard severity tiers (Critical/High/Medium/Low) sorted highest-first:
- Matches existing Goost commands (`/goost-slop-scan`, `/openspec-audit`)
- Matches industry tools (SonarQube, ESLint)
- Avoids over-engineering with category weights

Research note: RICE/WSJF frameworks use 3-4 factors including Effort and Confidence. A 2-factor weighted formula is neither simple nor industry-standard - removed.

## Example Output

```
IMPROVEMENT OPPORTUNITIES
------------------------------------------------------------
Based on codebase analysis, the following improvements could
strengthen this project. Run the suggested searches to find
current best practices and solutions.

[CRITICAL] Input Validation Gap
  Category: Security
  Observation: API endpoints in src/routes/ accept request 
               bodies without schema validation. Direct 
               property access on req.body throughout.
  Evidence: src/routes/users.ts:45, src/routes/orders.ts:23
  Impact: Risk of malformed data causing errors or exploits.
  → /goost-search zod vs yup vs joi typescript API validation 2024

[HIGH] No Error Recovery Patterns
  Category: Reliability
  Observation: No retry logic, circuit breakers, or graceful
               degradation patterns found in external service calls.
  Evidence: Searched src/services/*.ts - direct await without try/catch
  Impact: Single failures cascade; no resilience to transient errors.
  → /goost-search nodejs retry circuit breaker resilience patterns

[HIGH] Test Isolation Concerns
  Category: Testing
  Observation: Tests share database state. No setup/teardown
               patterns found. Test order dependencies likely.
  Evidence: Searched test/*.ts - no beforeEach/afterEach patterns
  Impact: Flaky tests, false positives, debugging difficulty.
  → /goost-search jest test isolation database fixtures typescript

[MEDIUM] Minimal Error Context
  Category: Observability
  Observation: Errors logged with console.error only. No 
               structured format. No request correlation IDs.
  Evidence: grep "console.error" found 47 instances, no pino/winston
  Impact: Difficult production debugging, no audit trail.
  → /goost-search structured logging nodejs pino vs winston 2024
------------------------------------------------------------
```

## Impact

- Affected specs: `slash-commands` (new Goost Improve Command)
- Affected code: 
  - New `.opencode/command/goost-improve.md` file (~150 lines)
  - Update `README.md` with new command documentation
- Dependencies: Suggestions work standalone; become actionable with `/goost-search`
- No breaking changes - completely new command
