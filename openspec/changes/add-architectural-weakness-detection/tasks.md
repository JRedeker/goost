# Tasks: Add Architectural Weakness Detection

## 1. Tech Stack Detection
- [ ] 1.1 Add stack detection logic checking for:
  - `package.json` → JavaScript/TypeScript
  - `requirements.txt` / `pyproject.toml` → Python
  - `go.mod` → Go
  - `Cargo.toml` → Rust
- [ ] 1.2 Extract framework info from dependencies (React, Django, etc.)
- [ ] 1.3 Handle multi-stack or ambiguous projects gracefully
- [ ] 1.4 Store detected stack for use in suggestion generation

## 2. Testing Infrastructure Detection
- [ ] 2.1 Check for test parallelization:
  - Jest: `maxWorkers` in config
  - Pytest: `pytest-xdist` in dependencies
  - Go: `-parallel` flag usage
- [ ] 2.2 Check for test timeouts:
  - Jest: `testTimeout` configuration
  - Pytest: `timeout` plugin or pytest.ini setting
- [ ] 2.3 Check for property-based testing:
  - JS: `fast-check` in deps
  - Python: `hypothesis` in deps
  - Go: `gopter` or `rapid` in deps
- [ ] 2.4 Check for coverage tooling (`nyc`, `c8`, `coverage.py`, etc.)
- [ ] 2.5 Check for E2E testing frameworks (playwright, cypress, selenium)
- [ ] 2.6 Check for snapshot testing setup

## 3. Security Pattern Detection
- [ ] 3.1 Scan for hardcoded secrets:
  - Pattern: `password\s*=\s*["'][^"']+["']`
  - Pattern: `api_key\s*=\s*["'][^"']+["']`
  - Pattern: `secret\s*=\s*["'][^"']+["']`
  - Exclude: `.env.example`, test files, config templates
- [ ] 3.2 Check for input validation libraries:
  - JS: `zod`, `joi`, `yup`, `class-validator`
  - Python: `pydantic`, `marshmallow`, `cerberus`
- [ ] 3.3 Detect SQL injection patterns:
  - String concatenation in SQL queries
  - Template literals with user input in queries
- [ ] 3.4 Check for rate limiting middleware
- [ ] 3.5 Detect unsafe eval/exec usage
- [ ] 3.6 Check for HTTP URLs in production config

## 4. Performance Anti-pattern Detection
- [ ] 4.1 Detect N+1 query patterns:
  - Loop with `.find()`, `.query()`, or DB call inside
  - Await inside forEach/map on array
- [ ] 4.2 Check for caching layer:
  - Redis, memcached dependencies
  - Cache configuration files
- [ ] 4.3 Detect synchronous blocking calls:
  - `readFileSync`, `writeFileSync` in async context
  - Blocking HTTP calls
- [ ] 4.4 Check for pagination patterns in API routes
- [ ] 4.5 Detect potential memory leaks:
  - Event listeners without cleanup
  - setInterval without clearInterval

## 5. Search Suggestion Generation
- [ ] 5.1 Create weakness-to-query mapping table
- [ ] 5.2 Implement query template system with stack placeholders
- [ ] 5.3 Add priority scoring for suggestions (Security > Testing > Performance)
- [ ] 5.4 Implement suggestion limit (top 5-7)
- [ ] 5.5 Format suggestions with weakness description and query

## 6. Report Integration
- [ ] 6.1 Add `SUGGESTED IMPROVEMENTS` section template to report
- [ ] 6.2 Integrate Phase 4 into audit flow (after synthesis, before final report)
- [ ] 6.3 Add category grouping (Testing, Security, Performance)
- [ ] 6.4 Add `--skip-suggestions` flag parsing
- [ ] 6.5 Add suggestions array to JSON output format
- [ ] 6.6 Handle "no weaknesses detected" case

## 7. Documentation
- [ ] 7.1 Update command description to mention architectural analysis
- [ ] 7.2 Document new `--skip-suggestions` flag
- [ ] 7.3 Add examples of suggestion output to help text
- [ ] 7.4 Document weakness detection heuristics for maintainability

## 8. Testing
- [ ] 8.1 Manual test: Detect missing test parallelization in JS project
- [ ] 8.2 Manual test: Detect hardcoded secrets pattern
- [ ] 8.3 Manual test: Verify stack detection works for JS/TS
- [ ] 8.4 Manual test: Verify stack detection works for Python
- [ ] 8.5 Manual test: Verify `--skip-suggestions` hides section
- [ ] 8.6 Manual test: Verify JSON output includes suggestions
- [ ] 8.7 Manual test: Verify suggestion limit works with many weaknesses

## Dependencies

- Tasks 1.x (Stack Detection) should complete before 5.x (Suggestion Generation)
- Tasks 2.x, 3.x, 4.x (Detection) can run in parallel
- Task 6.2 depends on all detection tasks completing
- This change can be implemented independently of `/goost-search`, but suggestions will be more useful once that command exists

## Notes

- Detection should be fast - use file existence checks and grep patterns, not AST parsing
- False positives are okay if labeled as "suggestions" - users will verify
- Stack detection should gracefully handle monorepos with multiple stacks
- Suggestions should be educational even if `/goost-search` isn't installed yet
