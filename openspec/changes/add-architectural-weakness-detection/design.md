# Design: Architectural Improvement Suggestions

## Research Validation Summary

This design was validated through architectural research on 2026-01-12. Key findings:

| Original Decision | Research Result | Action Taken |
|-------------------|-----------------|--------------|
| Integrate as Phase 4 of /openspec-audit | ⚠️ Violates Unix philosophy; industry separates audit from assessment | **Changed**: Create standalone `/goost-improve` command |
| Pure agent-driven discovery | ⚠️ Consistency issues; SGCR research shows 90.9% improvement with grounding | **Revised**: Add specification grounding |
| Problem-focused-only queries | ⚠️ Hybrid queries outperform pure abstraction | **Revised**: Use tool + context + temporal qualifiers |
| 3-tier depth (quick/default/deep) | ⚠️ Sampling creates false negatives per OWASP | **Revised**: 2 modes only |
| Fixed priority hierarchy | ⚠️ Industry uses weighted scoring (RICE/WSJF) | **Revised**: Category × Severity scoring |
| Evidence-based findings | ✅ Validated by academic research (EMNLP 2023, NAACL 2024) | **Kept** |

Sources: arXiv:2512.17540, arXiv:2305.14627, Google SRE Book, AWS Well-Architected, OWASP

## Context

Rather than extending the existing `/openspec-audit` command (which focuses on spec/implementation drift), we're creating a **standalone `/goost-improve` command** that analyzes codebases for architectural improvement opportunities.

This separation follows the Unix philosophy ("do one thing well") and matches industry practice that distinguishes "code audits" (what IS vs what SHOULD BE) from "architecture assessments" (what COULD BE better).

## Goals / Non-Goals

**Goals:**
- Enable AI agent to discover architectural gaps with specification grounding
- Generate contextual, up-to-date `/goost-search` suggestions using hybrid queries
- Cover 4 core categories for MVP (Security, Testing, Observability, DX)
- Require evidence for every finding to reduce hallucinations
- Simple standalone command (~200 lines)

**Non-Goals:**
- Hardcoded checklists of specific tools (e.g., "use Jest", "install Zod")
- Replacing the agent's judgment with rigid detection rules
- Exhaustive static analysis (use dedicated tools like SonarQube for that)
- Integration with /openspec-audit (keep commands focused)
- Sampling-based analysis (creates false negatives)

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

### Decision 1: Four Core Categories (MVP)

**What:** Start with 4 core categories, expand based on feedback:

| Category | Guiding Questions for Agent | Weight |
|----------|---------------------------|--------|
| **Security Posture** | What security practices are present or absent? Are there patterns that could lead to vulnerabilities? | 1.0 |
| **Testing Maturity** | How comprehensive is the test setup? What testing strategies are missing? Are tests configured for reliability and speed? | 0.9 |
| **Observability** | How would developers debug issues in production? What's missing? | 0.7 |
| **Developer Experience** | What would slow down a new contributor? What documentation or tooling gaps exist? | 0.6 |

**Additional categories the agent MAY discover:**
- Performance & Scalability
- Code Quality & Maintainability
- Dependency Health
- CI/CD Maturity
- Documentation & Compliance
- Disaster Recovery

**Why:** 
- 4 categories keeps MVP focused (~200 line command)
- Research shows 8 categories covers ~70-80% of audit concerns (ISO 25010 has 9)
- Dynamic discovery handles the remaining 20-30%
- Weights enable nuanced prioritization (Critical DX can outrank Low Security)

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

### Decision 3: Weighted Priority Scoring

**What:** Agent assesses each finding using weighted scoring:
- **Severity**: Critical (4), High (3), Medium (2), Low (1)
- **Category Weight**: Security (1.0), Testing (0.9), Observability (0.7), DX (0.6)
- **Priority Score**: Category Weight × Severity

**Examples:**
| Finding | Category | Severity | Score | Rank |
|---------|----------|----------|-------|------|
| SQL injection risk | Security | Critical (4) | 1.0 × 4 = 4.0 | 1st |
| No test isolation | Testing | Critical (4) | 0.9 × 4 = 3.6 | 2nd |
| Missing CONTRIBUTING.md | DX | High (3) | 0.6 × 3 = 1.8 | 4th |
| No HTTPS in dev | Security | Low (1) | 1.0 × 1 = 1.0 | 5th |

**Why:** 
- Research shows fixed hierarchies are too rigid (AWS, Google SRE, RICE/WSJF all use context-dependent trade-offs)
- A critical DX issue can legitimately outrank a low security papercut
- This matches industry practices for technical debt prioritization

### Decision 4: Hybrid Queries (Tool Names + Context)

**What:** Search queries should include tool names when known, plus context and temporal qualifiers:

| Original Approach | Revised Approach |
|-------------------|------------------|
| "parallel test execution for large test suites" | "jest parallel testing typescript large suite 2024" |
| "runtime type validation for API inputs" | "zod vs yup vs joi typescript API validation 2024" |
| "caching layer for database query optimization" | "redis vs memcached nodejs caching alternatives 2024" |
| "automated code quality and style enforcement" | "eslint vs biome typescript linting 2024" |

**Why (Research-Validated):** 
- Search engines already do semantic expansion from tool names
- Tool-specific queries return authoritative official documentation
- Adding "vs alternatives" or year surfaces comparisons and deprecation notices
- Pure abstraction adds cognitive overhead without yielding better results

## Agent Instructions Template

The agent receives guiding questions, not checklists:

```
## Phase 4: Architectural Analysis

Analyze this codebase for architectural strengths and weaknesses. For each 
category below, examine what exists and what's missing. Generate /goost-search 
queries for gaps that would meaningfully improve the project.

### Analysis Categories

For each category, ask yourself:
- What practices/patterns are present?
- What's notably absent that similar projects typically have?
- What could cause problems as the project scales?
- What would a senior engineer recommend improving?

**Testing Maturity**
- Test organization and coverage strategy
- Test reliability (flakiness, isolation, determinism)  
- Test performance (speed, parallelization, CI efficiency)
- Testing depth (unit, integration, E2E, property-based, etc.)

**Security Posture**
- Input handling and validation patterns
- Authentication/authorization implementation
- Secrets management approach
- Dependency vulnerability exposure
- Common vulnerability patterns (injection, XSS, etc.)

**Performance & Scalability**
- Database query patterns and optimization
- Caching strategies
- Async/concurrent operation handling
- Resource cleanup and memory management
- API design for scale (pagination, rate limiting, etc.)

**Observability & Operations**
- Logging strategy and structure
- Error tracking and reporting
- Metrics and monitoring hooks
- Debugging capabilities
- Health checks and readiness probes

**Code Quality & Maintainability**
- Static analysis and linting setup
- Type safety enforcement
- Code formatting consistency
- Documentation practices
- Dead code and technical debt indicators

**Developer Experience**
- Onboarding documentation
- Local development setup
- Contribution guidelines
- Test running convenience
- Debug tooling

**Dependency Health**
- Outdated or unmaintained dependencies
- Duplicate or conflicting dependencies
- Heavy dependencies that could be lighter
- Missing dependency auditing

**CI/CD Maturity**
- Build reliability and speed
- Deployment safety (rollback, canary, etc.)
- Environment parity
- Automated checks coverage

### Output Format

For each significant finding:

1. **Category**: Which area this falls under
2. **Observation**: What you found (or didn't find)
3. **Impact**: Why this matters (scale, security, velocity, etc.)
4. **Search Query**: A /goost-search query to find solutions
   - Describe the problem/solution space, not specific tools
   - Include relevant context (e.g., "for TypeScript APIs")
   - Keep queries searchable and specific

Limit to the 7-10 most impactful findings. Prioritize:
1. Security gaps (highest risk)
2. Reliability issues (affect users)
3. Scalability concerns (future problems)
4. Developer velocity (team productivity)
```

## Data Flow

```
Phase 3: Synthesis (existing)
    |
    v
+--------------------------------+
| Phase 4: Architectural Analysis|
+--------------------------------+
    |
    +-- Agent examines codebase structure
    |   (package files, configs, src layout, tests)
    |
    +-- Agent identifies patterns & anti-patterns
    |   (what exists vs what's missing)
    |
    +-- Agent assesses impact of each gap
    |
    +-- Agent formulates contextual search queries
    |
    v
+--------------------------------+
| Final Report                   |
| + IMPROVEMENT OPPORTUNITIES    |
|   (agent-generated suggestions)|
+--------------------------------+
```

## Example Agent Output

```
IMPROVEMENT OPPORTUNITIES
------------------------------------------------------------
Based on codebase analysis, the following improvements could
strengthen this project. Run the suggested searches to find
current best practices and solutions.

[SECURITY] Input Validation Gap
  Observation: API endpoints accept request bodies without 
               schema validation. Found direct property access
               on req.body throughout src/routes/.
  Impact: High risk of malformed data causing errors or 
          security vulnerabilities.
  → /goost-search runtime schema validation for REST APIs

[TESTING] Test Isolation Concerns  
  Observation: Tests share database state. Found no setup/
               teardown patterns. Some tests depend on order.
  Impact: Flaky tests, false positives, debugging difficulty.
  → /goost-search test isolation patterns database fixtures

[PERFORMANCE] Unbounded Queries
  Observation: List endpoints return all records. No pagination
               in src/routes/users.ts, src/routes/orders.ts.
  Impact: Performance degradation as data grows, potential OOM.
  → /goost-search API pagination strategies cursor offset

[OBSERVABILITY] Minimal Error Context
  Observation: Errors logged with console.error, no structured
               format. No request correlation IDs.
  Impact: Difficult to debug production issues, no audit trail.
  → /goost-search structured logging error tracking Node.js

[DX] Missing Development Documentation
  Observation: No CONTRIBUTING.md or development setup guide.
               README focuses on usage, not contribution.
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
- Should findings link back to specific files/lines as evidence?
- Should there be a "quick scan" mode that only looks at config files?
