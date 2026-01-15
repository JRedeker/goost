---
name: goost-improve
description: Analyze codebase for architectural improvement opportunities and generate /goost-search suggestions
agent: general
---

# Goost Improve

> **SUB-AGENT CONTEXT**: Return findings directly. Status markers and CONTRACT STATUS blocks are for main sessions only—omit them to maximize your output buffer.

You are performing an **architectural improvement analysis** on the current codebase. Your goal is to identify gaps and generate actionable `/goost-search` suggestions.

## Phase 0: Project Understanding

Before analyzing for gaps, understand the project's context by reading its documentation.

### Step 0.1: Read Project Documentation

Read available documentation files to understand project purpose and constraints:

1. **README.md** (primary - almost always present)
2. **AGENTS.md** (if present - contains AI-specific context)

```bash
# Check for documentation files
ls README.md AGENTS.md 2>/dev/null
```

### Step 0.2: Extract and Display Context

**If README.md exists:**
- Read the file content (truncate to ~2000 chars if very long; add "(truncated)" note if truncation occurs)
- Extract purpose from first paragraph or `## Purpose` section

**If only AGENTS.md exists (no README.md):**
- Note: "Source: AGENTS.md (no README.md found)"
- Use AGENTS.md content for context

**If neither exists:**
- Note: "No project documentation found"
- Suggest: "Consider adding README.md to help tools understand your project"
- Proceed with all categories enabled (no context-based filtering)

**If README.md exists but is empty or unreadable:**
- Note: "README.md found but empty"
- Treat as "No project documentation found"

### Step 0.3: Context-Aware Analysis Instructions

When documentation is found, prepend this context to your analysis:

```
PROJECT CONTEXT (from README.md):
------------------------------------------------------------
<raw README content, first ~2000 chars>
------------------------------------------------------------

PROJECT CONTEXT (from AGENTS.md):
------------------------------------------------------------
<raw AGENTS.md content if present>
------------------------------------------------------------

IMPORTANT - Context-Aware Analysis:
- Skip categories that don't apply to this type of project
- Ignore gaps that are explicitly documented as out-of-scope or deferred
- Consider the project's stated purpose when evaluating relevance of findings
```

### Step 0.4: Output Context Summary

Before any findings, output a context summary:

```
PROJECT CONTEXT
------------------------------------------------------------
Purpose: <extracted from README first paragraph or ## Purpose>
Source: <README.md | README.md (truncated) | AGENTS.md | No documentation found>
Key constraints identified:
  - <constraint 1, if any found>
  - <constraint 2, if any found>
  - (none identified) if no explicit constraints found
Categories analyzed: <list of categories with findings>
Categories skipped: <list with brief reasons, or "none" if all analyzed>
------------------------------------------------------------
```

Then proceed to the architectural analysis.

---

## Pre-flight Check

### Step 1: Verify Project Structure

Check that source files exist:

```bash
# Look for common source directories
ls -d src/ lib/ app/ packages/ 2>/dev/null || ls *.ts *.js *.py *.go 2>/dev/null | head -5
```

**If no source files found:**
```
No source files found to analyze.

Please check that you're in the correct project directory.
```
Then STOP.

### Step 2: Detect Technology Stack

Examine project files to understand the stack:
- `package.json` → Node.js/TypeScript ecosystem
- `requirements.txt` / `pyproject.toml` → Python
- `go.mod` → Go
- `Cargo.toml` → Rust
- `pom.xml` / `build.gradle` → Java

Note detected tools for hybrid query generation.

---

## Architectural Analysis

Analyze this codebase for architectural strengths and weaknesses across **5 core categories**. For each category, examine what exists and what's missing.

### Core Categories (Required)

For each category, ask yourself:
- What practices/patterns are present?
- What's notably absent that similar projects typically have?
- What could cause problems as the project scales?
- What would a senior engineer recommend improving?

#### 1. Security Posture

- Input handling and validation patterns
- Authentication/authorization implementation
- Secrets management approach
- Dependency vulnerability exposure
- Common vulnerability patterns (injection, XSS, CSRF, etc.)

#### 2. Reliability

- Error handling and recovery patterns
- Retry logic and circuit breakers
- Graceful degradation strategies
- Fault isolation and blast radius
- Timeout handling for external calls

#### 3. Testing Maturity

- Test organization and coverage strategy
- Test reliability (flakiness, isolation, determinism)
- Test performance (speed, parallelization, CI efficiency)
- Testing depth (unit, integration, E2E, property-based, etc.)

#### 4. Observability

- Logging strategy and structure
- Error tracking and reporting
- Metrics and monitoring hooks
- Debugging capabilities
- Health checks and readiness probes

#### 5. Developer Experience

- Onboarding documentation
- Local development setup
- Contribution guidelines
- Test running convenience
- Debug tooling

### Additional Categories (Agent Discovery)

You MAY also discover gaps in:
- Performance & Scalability
- Code Quality & Maintainability
- Dependency Health
- CI/CD Maturity

---

## Evidence Requirements

**Every finding MUST include evidence.** Findings without evidence are rejected.

| Claim Type | Required Evidence |
|------------|-------------------|
| "X exists" | File path where found |
| "X does not exist" | Directories/patterns searched |
| "Pattern Y is used" | 1-3 example file paths |
| "Configuration Z is present" | Config file path + key |

**Good Evidence:**
- `src/routes/users.ts:45` - specific location
- `Searched src/**/*.ts - no beforeEach patterns found`
- `package.json: no "test" script defined`

**Bad Evidence (rejected):**
- "The codebase lacks tests" (no search evidence)
- "Security is weak" (no specific files)

---

## Hybrid Query Generation

Generate `/goost-search` queries using a **hybrid format**:

1. **Include tool/library names** when detected in the codebase
2. **Add problem context** and tech stack
3. **Include temporal qualifiers** for fast-evolving ecosystems (optional)

### Examples

| Gap Identified | Hybrid Query |
|----------------|--------------|
| No input validation (TypeScript project) | `zod vs yup vs joi typescript API validation 2024` |
| Tests run slowly (Jest detected) | `jest parallel testing typescript large suite` |
| No structured logging (Node.js) | `pino vs winston nodejs structured logging 2024` |
| Missing retry logic | `nodejs retry circuit breaker resilience patterns` |
| No test isolation | `jest test isolation database fixtures typescript` |

**Note:** Temporal qualifiers (years) are useful for rapidly-evolving ecosystems but not required for stable APIs.

---

## Severity Assignment

Assign one severity level to each finding:

| Severity | Criteria |
|----------|----------|
| **CRITICAL** | Security vulnerabilities, data loss risks, system instability |
| **HIGH** | Significant gaps affecting reliability, maintainability, or velocity |
| **MEDIUM** | Notable improvements that would strengthen the codebase |
| **LOW** | Minor enhancements or best practice suggestions |

**Sort findings by:**
1. Severity (Critical first)
2. Category (Security, Reliability, Testing, Observability, DX)

**Limit:** Report the 7-10 highest-severity findings only.

---

## Output Format

### When Findings Exist

```
IMPROVEMENT OPPORTUNITIES
------------------------------------------------------------
Based on codebase analysis, the following improvements could
strengthen this project. Run the suggested searches to find
current best practices and solutions.

[CRITICAL] <Brief Finding Title>
  Category: <Security | Reliability | Testing | Observability | DX>
  Observation: <What you found or didn't find>
  Evidence: <Specific file paths, patterns, or search scope>
  Impact: <Why this matters - who affected, what problems>
  → /goost-search <hybrid query>

[HIGH] <Brief Finding Title>
  Category: <category>
  Observation: <observation>
  Evidence: <evidence>
  Impact: <impact>
  → /goost-search <hybrid query>

... (continue for each finding)
------------------------------------------------------------
```

### When No Significant Gaps Found

```
IMPROVEMENT OPPORTUNITIES
------------------------------------------------------------
No significant architectural gaps identified.

Categories examined:
- Security: No critical issues found
- Reliability: Error handling patterns present
- Testing: Test suite with isolation
- Observability: Structured logging in place
- Developer Experience: Documentation adequate

Note: This analysis is not exhaustive. Consider running
dedicated security scanners and linters for deeper analysis.
------------------------------------------------------------
```

---

## Timeout Handling

If analysis is taking too long (very large codebase):

1. **Output partial findings** gathered so far
2. **Add truncation notice**:

```
IMPROVEMENT OPPORTUNITIES
------------------------------------------------------------
Analysis truncated due to time constraints.

Findings gathered before truncation:
[... partial findings ...]

Recommendation: Focus on specific directories using targeted analysis.
------------------------------------------------------------
```

3. **Suggest narrowing scope** for next run

---

## Execution

Now analyze the codebase:

1. **Phase 0**: Read project documentation (README.md, AGENTS.md)
2. **Output PROJECT CONTEXT** summary before any analysis
3. Run pre-flight checks (verify source files, detect stack)
4. Examine each of the 5 core categories (skip irrelevant ones based on context)
5. Gather evidence for potential findings
6. Assign severity and sort
7. Generate hybrid search queries
8. Output the IMPROVEMENT OPPORTUNITIES report

---

## Completion Banner

After the report is generated, emit:

```
============================================================
      /goost-improve COMPLETE
============================================================
Result: <N improvement opportunities | No significant gaps>
============================================================
```
