# Design: Architectural Weakness Detection

## Context

The `/openspec-audit` command currently has 3 phases:
1. Analysis (sub-agent scanning for drift)
2. Orphan Detection
3. Synthesis

We're adding a **Phase 4: Architectural Weakness Detection** that runs after synthesis but before the final report, examining the codebase for common architectural problems and suggesting `/goost-search` queries for solutions.

## Goals / Non-Goals

**Goals:**
- Detect common architectural weaknesses in testing, security, and performance
- Generate actionable `/goost-search` suggestions for each weakness
- Integrate seamlessly into existing audit flow and report format
- Keep detection fast (heuristic-based, not exhaustive)

**Non-Goals:**
- Deep static analysis (use dedicated tools like ESLint, SonarQube)
- Auto-fixing detected issues
- Comprehensive vulnerability scanning (use security-focused tools)
- Replacing specialized audit tools

## Decisions

### Decision 1: Detection Strategy

**What:** Use lightweight heuristic detection based on file patterns, configuration presence, and code markers rather than deep AST analysis.

**Why:** 
- Fast execution (seconds, not minutes)
- Works across multiple languages
- Easy to extend with new patterns
- Sufficient for "is this pattern present?" questions

**Detection Signals:**

| Category | Signal Type | Example |
|----------|------------|---------|
| Testing | Config presence | `jest.config.js` exists but no `--parallel` |
| Testing | File patterns | No `*.property.test.*` files |
| Testing | Code markers | No timeout configuration in test setup |
| Security | Config absence | No `.env.example`, secrets in code |
| Security | Code patterns | `eval()`, SQL string concat |
| Performance | Code patterns | Nested loops with DB calls |
| Performance | Config absence | No caching layer config |

### Decision 2: Search Suggestion Mapping

**What:** Maintain a mapping of weakness types to suggested `/goost-search` queries.

**Why:** 
- Provides immediately actionable next steps
- Connects audit findings to prompt discovery
- Users can run suggestions or adapt them

**Example Mappings:**

| Weakness | Suggested Search |
|----------|-----------------|
| No test parallelization | `/goost-search test parallelization {stack}` |
| Missing test timeouts | `/goost-search test timeout configuration` |
| No property-based testing | `/goost-search property-based testing {stack}` |
| Missing rate limiting | `/goost-search api rate limiting` |
| No input validation | `/goost-search input validation security` |
| N+1 query patterns | `/goost-search n+1 query optimization` |
| Missing caching | `/goost-search caching strategy {stack}` |

### Decision 3: Stack Detection

**What:** Auto-detect the project's tech stack to customize search suggestions.

**Why:**
- Generic searches are less useful than stack-specific ones
- "test parallelization pytest" is more actionable than "test parallelization"

**Detection Method:**
- Check for `package.json` → JavaScript/TypeScript
- Check for `requirements.txt` / `pyproject.toml` → Python
- Check for `go.mod` → Go
- Check for `Cargo.toml` → Rust
- Fall back to generic if multiple or unclear

### Decision 4: Report Integration

**What:** Add `SUGGESTED IMPROVEMENTS` section to the audit report after recommendations.

**Why:**
- Separates actionable spec fixes (recommendations) from architectural suggestions
- Makes `/goost-search` suggestions discoverable but not overwhelming
- Users can ignore if they prefer manual research

## Data Flow

```
Phase 3: Synthesis (existing)
    |
    v
+----------------------------+
| Phase 4: Weakness Detection|
+----------------------------+
    |
    +-- Detect tech stack
    |
    +-- Run weakness detectors:
    |     - Testing infrastructure
    |     - Security patterns  
    |     - Performance anti-patterns
    |
    +-- Map weaknesses to search suggestions
    |
    v
+----------------------------+
| Final Report               |
| (existing sections)        |
| + SUGGESTED IMPROVEMENTS   |
+----------------------------+
```

## Weakness Detection Heuristics

### Testing Infrastructure

| Weakness | Detection Method | Search Query Template |
|----------|-----------------|----------------------|
| No parallelization | Jest: `maxWorkers` not in config. Pytest: `pytest-xdist` not in deps | `test parallelization {stack}` |
| No test timeouts | No `testTimeout` in Jest, no `timeout` in pytest.ini | `test timeout safety {stack}` |
| No property testing | No `fast-check`, `hypothesis`, `quickcheck` in deps | `property-based testing {stack}` |
| Low coverage tooling | No `coverage`, `nyc`, `c8` in deps | `test coverage setup {stack}` |
| No snapshot tests | No `*.snap` files, no snapshot deps | `snapshot testing {stack}` |
| No E2E tests | No playwright, cypress, selenium deps | `end-to-end testing {stack}` |

### Security Patterns

| Weakness | Detection Method | Search Query Template |
|----------|-----------------|----------------------|
| Hardcoded secrets | Grep for `password=`, `api_key=`, `secret=` with literal values | `secrets management security` |
| No input validation | No `zod`, `joi`, `yup`, `pydantic` in deps | `input validation {stack}` |
| SQL injection risk | String concat in SQL queries | `sql injection prevention` |
| No rate limiting | No rate limit middleware in API routes | `api rate limiting {stack}` |
| Unsafe eval | `eval()`, `exec()` in code | `eval alternatives security` |
| Missing HTTPS | `http://` URLs in production configs | `https configuration` |

### Performance Anti-patterns

| Weakness | Detection Method | Search Query Template |
|----------|-----------------|----------------------|
| N+1 queries | Loop with DB call inside | `n+1 query optimization {stack}` |
| No caching layer | No redis, memcached, cache config | `caching strategy {stack}` |
| Sync blocking calls | `readFileSync`, blocking I/O in async context | `async patterns {stack}` |
| No pagination | API endpoints returning unbounded lists | `api pagination best practices` |
| Large bundle | No code splitting, >1MB bundle | `code splitting optimization` |
| Memory leaks | Event listeners without cleanup | `memory leak prevention {stack}` |

## Report Format Addition

```
============================================================
               PROJECT AUDIT REPORT  
============================================================

[... existing sections ...]

SUGGESTED IMPROVEMENTS
------------------------------------------------------------
The following architectural improvements were detected. Run
the suggested /goost-search queries to find expert prompts.

TESTING INFRASTRUCTURE
  ! No test parallelization detected
    → /goost-search test parallelization typescript jest

  ! No property-based testing found
    → /goost-search property-based testing typescript

SECURITY PATTERNS
  ! Missing input validation library
    → /goost-search input validation zod typescript

PERFORMANCE
  ! No caching layer configured
    → /goost-search caching strategy nodejs redis

------------------------------------------------------------
Run `/goost-search <query>` to find prompts addressing these
concerns, or use --skip-suggestions to hide this section.
============================================================
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| False positives | Use conservative detection; label as "suggestions" not "problems" |
| Overwhelming output | Limit to top 5 suggestions; add `--skip-suggestions` flag |
| Outdated patterns | Document detection heuristics; easy to update |
| Goost-search not installed | Show suggestions anyway; they're educational even if command unavailable |

## Open Questions

- Should weakness detection run as a sub-agent or inline in the main flow?
- Should there be a `--only-suggestions` mode that skips spec audit and just finds weaknesses?
- Should confidence scores be shown for each detection?
