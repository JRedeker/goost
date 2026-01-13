# Design: Architectural Improvement Suggestions

## Research Validation Summary

This design was validated through architectural research on 2026-01-13. Key findings:

| Original Decision | Research Result | Action Taken |
|-------------------|-----------------|--------------|
| Integrate as Phase 4 of /openspec-audit | ⚠️ Violates Unix philosophy; industry separates audit from assessment | **Changed**: Create standalone `/goost-improve` command |
| Pure agent-driven discovery | ⚠️ Consistency issues; SGCR research shows 90.9% improvement with grounding | **Revised**: Add specification grounding |
| Problem-focused-only queries | ⚠️ Hybrid queries outperform pure abstraction (CROKAGE, NLP2API) | **Revised**: Use tool + context + temporal qualifiers |
| 3-tier depth (quick/default/deep) | ⚠️ Sampling creates false negatives per OWASP | **Simplified**: Single mode for MVP |
| Weighted priority scoring | ❌ Over-engineered; no precedent in SonarQube, ESLint, or Goost commands | **Removed**: Use simple severity ranking |
| 4 core categories | ⚠️ Missing Reliability - top-level in ISO 25010 and AWS | **Revised**: 5 core categories |
| Evidence-based findings | ✅ Validated (Shuster et al. 2021; CoVe 2023) | **Kept** |

Sources: arXiv:2512.17540, Shuster et al. EMNLP 2021, CoVe 2023, CROKAGE 2020, NLP2API 2018, ISO 25010:2023, AWS Well-Architected, OWASP

## Context

Rather than extending the existing `/openspec-audit` command (which focuses on spec/implementation drift), we're creating a **standalone `/goost-improve` command** that analyzes codebases for architectural improvement opportunities.

This separation follows the Unix philosophy ("do one thing well") and matches industry practice that distinguishes "code audits" (what IS vs what SHOULD BE) from "architecture assessments" (what COULD BE better).

## Goals / Non-Goals

**Goals:**
- Enable AI agent to discover architectural gaps with specification grounding
- Generate contextual, up-to-date `/goost-search` suggestions using hybrid queries
- Cover 5 core categories for MVP (Security, Reliability, Testing, Observability, DX)
- Require evidence for every finding to reduce hallucinations
- Use simple severity ranking (Critical/High/Medium/Low) matching existing commands
- Simple standalone command (~150 lines)

**Non-Goals:**
- Hardcoded checklists of specific tools (e.g., "use Jest", "install Zod")
- Replacing the agent's judgment with rigid detection rules
- Exhaustive static analysis (use dedicated tools like SonarQube for that)
- Integration with /openspec-audit (keep commands focused)
- Weighted priority scoring (over-engineered per research)
- `--metadata-only` mode for MVP (defer to post-MVP)

## Key Design Principle: Grounded Agent Discovery

**What:** Use a "dual-pathway" approach validated by SGCR research (arXiv:2512.17540):

1. **Explicit path**: Provide agent with project conventions and critical areas to check
2. **Implicit path**: Let agent discover additional issues beyond the guidance
3. **Evidence requirement**: Every finding must cite specific files/patterns
4. **Hybrid queries**: Include tool names + context + temporal qualifiers

**Why:**
- Pure discovery has consistency issues (LLMs vary even at temperature=0)
- Specification grounding achieved 90.9% improvement in adoption rates
- Evidence requirements reduce hallucinations (validated by EMNLP 2023)
- Hybrid queries outperform pure abstraction in search results

## Decisions

### Decision 1: Five Core Categories (MVP)

**What:** Start with 5 core categories aligned with ISO 25010 and AWS Well-Architected:

| Category | Guiding Questions for Agent |
|----------|---------------------------|
| **Security Posture** | What security practices are present or absent? Are there patterns that could lead to vulnerabilities? |
| **Reliability** | How does the system handle failures? Are there retry patterns, circuit breakers, graceful degradation? |
| **Testing Maturity** | How comprehensive is the test setup? What testing strategies are missing? Are tests configured for reliability and speed? |
| **Observability** | How would developers debug issues in production? What's missing? |
| **Developer Experience** | What would slow down a new contributor? What documentation or tooling gaps exist? |

**Additional categories the agent MAY discover:**
- Performance & Scalability
- Code Quality & Maintainability
- Dependency Health
- CI/CD Maturity
- Documentation & Compliance
- Disaster Recovery

**Why:** 
- 5 categories covers ~50-60% of ISO 25010 characteristics (9 total)
- Reliability is top-level in both ISO 25010 and AWS Well-Architected - cannot omit
- Dynamic discovery handles remaining concerns
- Simple severity ranking (not weighted) allows any critical finding to surface

### Decision 2: Hybrid Query Generation

**What:** The agent formulates search queries using a hybrid approach:
1. Include tool/library names when known or detected
2. Add problem/solution context
3. Include temporal qualifiers (year, "latest", "alternatives")
4. Include tech stack context

**Example Agent Reasoning:**
```
Observation: Found test files but no configuration for running tests in parallel.
             Test suite has 200+ test files, likely slow.
Stack: TypeScript with Jest (detected from jest.config.js)
Gap: Test execution speed at scale
Query: "/goost-search jest parallel testing typescript large test suite 2024"
       (NOT just "parallel test execution strategies")
```

**Research Validation:** 
- Stack Overflow/CROKAGE research shows hybrid queries outperform pure abstraction
- Search engines already do semantic expansion from tool names
- "zod vs alternatives 2024" yields comparisons, deprecation notices, newer tools
- Pure problem-descriptions add cognitive overhead without clear benefit

**Why:** Queries with tool names + context + year return authoritative, current documentation.

### Decision 3: Simple Severity Ranking (Simplified from Weighted Scoring)

**What:** Agent assesses each finding using standard severity levels:
- **Critical**: Security vulnerabilities, data loss risks, system instability
- **High**: Significant gaps affecting reliability, maintainability, or developer velocity
- **Medium**: Notable improvements that would strengthen the codebase
- **Low**: Minor enhancements or best practice suggestions

Findings are sorted by severity (Critical first), then by category (Security, Reliability, Testing, Observability, DX).

**Examples:**
| Finding | Severity | Category | Rank |
|---------|----------|----------|------|
| SQL injection risk | Critical | Security | 1st |
| No test isolation | Critical | Testing | 2nd |
| No retry patterns | High | Reliability | 3rd |
| Missing structured logging | Medium | Observability | 4th |

**Why (Research-Validated):** 
- **Removed weighted scoring**: Research showed the proposed 2-factor formula (Category × Severity) is neither simple nor industry-standard
- **Matches existing patterns**: `/goost-slop-scan` and `/openspec-audit` use simple severity ranking
- **Matches industry tools**: SonarQube, ESLint use severity without category weights
- **Reduces complexity**: ~30% fewer lines, easier to understand and maintain
- RICE/WSJF frameworks use 3-4 factors including Effort and Confidence - not applicable to this use case

### Decision 4: Hybrid Queries (Tool Names + Context)

**What:** Search queries should include tool names when known, plus context and temporal qualifiers:

| Original Approach | Revised Approach |
|-------------------|------------------|
| "parallel test execution for large test suites" | "jest parallel testing typescript large suite 2024" |
| "runtime type validation for API inputs" | "zod vs yup vs joi typescript API validation 2024" |
| "caching layer for database query optimization" | "redis vs memcached nodejs caching alternatives 2024" |
| "automated code quality and style enforcement" | "eslint vs biome typescript linting 2024" |

**Why (Research-Validated):** 
- CROKAGE (2020) and NLP2API (2018) confirm the "vocabulary mismatch" problem - abstract queries don't match solution terminology
- Tool-specific queries return authoritative official documentation
- Adding "vs alternatives" or year surfaces comparisons and deprecation notices

**Note on temporal qualifiers:** Adding years (e.g., "2024") is a heuristic, not universally beneficial:
- Useful for rapidly-evolving ecosystems (React, TypeScript tooling)
- Less useful for stable APIs (Node.js core, SQL)
- Serves as intent signal to search engines

## Agent Instructions Template

The agent receives guiding questions, not checklists:

```
## Architectural Analysis

Analyze this codebase for architectural strengths and weaknesses. For each 
category below, examine what exists and what's missing. Generate /goost-search 
queries for gaps that would meaningfully improve the project.

### Core Analysis Categories (Required)

For each category, ask yourself:
- What practices/patterns are present?
- What's notably absent that similar projects typically have?
- What could cause problems as the project scales?
- What would a senior engineer recommend improving?

**Security Posture**
- Input handling and validation patterns
- Authentication/authorization implementation
- Secrets management approach
- Dependency vulnerability exposure
- Common vulnerability patterns (injection, XSS, etc.)

**Reliability**
- Error handling and recovery patterns
- Retry logic and circuit breakers
- Graceful degradation strategies
- Fault isolation and blast radius
- Timeout handling for external calls

**Testing Maturity**
- Test organization and coverage strategy
- Test reliability (flakiness, isolation, determinism)  
- Test performance (speed, parallelization, CI efficiency)
- Testing depth (unit, integration, E2E, property-based, etc.)

**Observability & Operations**
- Logging strategy and structure
- Error tracking and reporting
- Metrics and monitoring hooks
- Debugging capabilities
- Health checks and readiness probes

**Developer Experience**
- Onboarding documentation
- Local development setup
- Contribution guidelines
- Test running convenience
- Debug tooling

### Additional Categories (Agent Discovery)

The agent MAY also discover gaps in:
- Performance & Scalability
- Code Quality & Maintainability
- Dependency Health
- CI/CD Maturity

### Output Format

For each significant finding:

1. **Severity**: CRITICAL | HIGH | MEDIUM | LOW
2. **Category**: Which area this falls under
3. **Observation**: What you found (or didn't find)
4. **Evidence**: Specific file paths or search scope
5. **Impact**: Why this matters (scale, security, velocity, etc.)
6. **Search Query**: A /goost-search query using hybrid format:
   - Include tool/library names when detected
   - Add problem context and tech stack
   - Include temporal qualifiers for fast-moving ecosystems

Limit to the 7-10 highest-severity findings. Sort by:
1. Severity (Critical first)
2. Category (Security, Reliability, Testing, Observability, DX)
```

## Data Flow

```
/goost-improve invocation
    |
    v
+--------------------------------+
| Codebase Analysis              |
+--------------------------------+
    |
    +-- Agent examines codebase structure
    |   (package files, configs, src layout, tests)
    |
    +-- Agent checks 5 core categories (grounded discovery)
    |   (Security, Reliability, Testing, Observability, DX)
    |
    +-- Agent discovers additional gaps (implicit path)
    |
    +-- Agent assigns severity and requires evidence
    |
    +-- Agent formulates hybrid search queries
    |
    v
+--------------------------------+
| IMPROVEMENT OPPORTUNITIES      |
| (sorted by severity, 7-10 max) |
+--------------------------------+
```

## Example Agent Output

```
IMPROVEMENT OPPORTUNITIES
------------------------------------------------------------
Based on codebase analysis, the following improvements could
strengthen this project. Run the suggested searches to find
current best practices and solutions.

[CRITICAL] Input Validation Gap
  Category: Security
  Observation: API endpoints accept request bodies without 
               schema validation. Found direct property access
               on req.body throughout src/routes/.
  Evidence: src/routes/users.ts:45, src/routes/orders.ts:23
  Impact: High risk of malformed data causing errors or 
          security vulnerabilities.
  → /goost-search zod vs yup typescript API validation 2024

[HIGH] No Error Recovery Patterns
  Category: Reliability
  Observation: External service calls have no retry logic or
               circuit breakers. Single failures will cascade.
  Evidence: Searched src/services/*.ts - direct await without try/catch
  Impact: System instability under partial failures.
  → /goost-search nodejs retry circuit breaker resilience patterns

[HIGH] Test Isolation Concerns  
  Category: Testing
  Observation: Tests share database state. Found no setup/
               teardown patterns. Some tests depend on order.
  Evidence: Searched test/*.ts - no beforeEach/afterEach patterns
  Impact: Flaky tests, false positives, debugging difficulty.
  → /goost-search jest test isolation database fixtures typescript

[MEDIUM] Minimal Error Context
  Category: Observability
  Observation: Errors logged with console.error, no structured
               format. No request correlation IDs.
  Evidence: grep "console.error" found 47 instances, no pino/winston
  Impact: Difficult to debug production issues, no audit trail.
  → /goost-search structured logging nodejs pino vs winston 2024

[LOW] Missing Development Documentation
  Category: DX
  Observation: No CONTRIBUTING.md or development setup guide.
               README focuses on usage, not contribution.
  Evidence: Searched root - no CONTRIBUTING.md, DEVELOPMENT.md
  Impact: Slower onboarding for new contributors.
  → /goost-search developer onboarding documentation templates
------------------------------------------------------------
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Agent misses important gaps | Categories provide comprehensive coverage prompts |
| Agent suggests irrelevant queries | Require observation + impact reasoning |
| Inconsistent output quality | Structured output format with required fields |
| Too many suggestions | Limit to 7-10 most impactful |
| Suggestions too vague | Require specific observations as evidence |

## Open Questions

- Should the agent be able to request additional file reads if initial scan is insufficient?
- Should line numbers be required in addition to file paths for specific claims?

## Resolved Questions

- ~~Should findings link back to specific files/lines as evidence?~~ **Yes** - evidence requirements are mandatory (research-validated)
- ~~Should there be a "quick scan" mode that only looks at config files?~~ **Deferred** - `--metadata-only` moved to post-MVP
- ~~Should we use weighted priority scoring?~~ **No** - removed per simplification analysis; use simple severity ranking
