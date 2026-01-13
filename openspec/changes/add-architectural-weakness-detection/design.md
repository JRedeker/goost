# Design: Architectural Weakness Detection

## Context

The `/openspec-audit` command currently has 3 phases:
1. Analysis (sub-agent scanning for drift)
2. Orphan Detection
3. Synthesis

We're adding a **Phase 4: Architectural Weakness Detection** that runs after synthesis. Rather than checking for hardcoded patterns, this phase instructs the AI agent to analyze the codebase holistically and generate contextual `/goost-search` suggestions based on what it observes.

## Goals / Non-Goals

**Goals:**
- Enable AI agent to discover architectural gaps dynamically
- Generate contextual, up-to-date `/goost-search` suggestions
- Cover broad categories without hardcoding specific tools/libraries
- Let the agent adapt suggestions to what it actually finds

**Non-Goals:**
- Hardcoded checklists of specific tools (e.g., "use Jest", "install Zod")
- Static pattern matching against known library names
- Replacing the agent's judgment with rigid detection rules
- Exhaustive static analysis

## Key Design Principle: Agent-Driven Discovery

**What:** Instead of "check if X library exists", we instruct the agent:
1. Examine the codebase structure and practices
2. Identify gaps, missing patterns, or weak areas
3. Formulate search queries that would help address those gaps
4. Present findings with reasoning

**Why:**
- Libraries and best practices evolve constantly
- Hardcoded lists become stale
- The agent can notice nuances a checklist would miss
- Search queries find current solutions, not outdated ones

## Decisions

### Decision 1: Open-Ended Analysis Categories

**What:** Provide the agent with analysis categories (not checklists) and let it explore:

| Category | Guiding Questions for Agent |
|----------|---------------------------|
| **Testing Maturity** | How comprehensive is the test setup? What testing strategies are missing? Are tests configured for reliability and speed? |
| **Security Posture** | What security practices are present or absent? Are there patterns that could lead to vulnerabilities? |
| **Performance Patterns** | Are there architectural decisions that could cause performance issues at scale? What optimizations are missing? |
| **Code Quality** | What tooling exists for maintaining code quality? What gaps exist? |
| **Observability** | How would developers debug issues in production? What's missing? |
| **Developer Experience** | What would slow down a new contributor? What documentation or tooling gaps exist? |
| **Dependency Health** | Are dependencies maintained? Are there risks in the dependency tree? |
| **CI/CD Maturity** | How robust is the deployment pipeline? What could fail silently? |

**Why:** Categories guide without constraining. The agent can discover issues we didn't anticipate.

### Decision 2: Contextual Query Generation

**What:** The agent formulates search queries based on:
1. What it observed (or didn't observe) in the codebase
2. The detected tech stack
3. The specific gap identified
4. Modern terminology that would yield good results

**Example Agent Reasoning:**
```
Observation: Found test files but no configuration for running tests in parallel.
             Test suite has 200+ test files, likely slow.
Stack: TypeScript with Jest (detected from jest.config.js)
Gap: Test execution speed at scale
Query: "/goost-search parallel test execution strategies"
```

**Why:** Queries generated from actual observations are more relevant than generic suggestions.

### Decision 3: Severity and Impact Assessment

**What:** Agent assesses each finding by:
- **Impact**: How much does this affect the project?
- **Effort**: How hard would it be to address?
- **Risk**: What's the risk of not addressing it?

**Why:** Helps users prioritize. A security gap is more urgent than a DX improvement.

### Decision 4: No Hardcoded Tool Names in Suggestions

**What:** Search queries should describe the problem/solution space, not specific tools:

| Instead of | Use |
|------------|-----|
| "jest parallel testing" | "parallel test execution for large test suites" |
| "install zod validation" | "runtime type validation for API inputs" |
| "add redis caching" | "caching layer for database query optimization" |
| "use eslint" | "automated code quality and style enforcement" |

**Why:** 
- Avoids recommending outdated/deprecated tools
- Search results will surface current best practices
- Works across different tech stacks

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
