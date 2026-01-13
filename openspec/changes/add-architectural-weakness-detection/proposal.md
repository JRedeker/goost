# Change: Add Architectural Weakness Detection to OpenSpec Audit

## Why

The current `/openspec-audit` command focuses on spec/implementation drift but misses broader architectural weaknesses that affect project health. When the audit detects weak testing infrastructure, missing security patterns, or performance anti-patterns, it should proactively suggest `/goost-search` queries to help users find solutions from curated prompt libraries.

This creates a powerful feedback loop: audit identifies problems → suggests search queries → user discovers expert prompts → applies solutions.

## What Changes

- Add **Phase 4: Architectural Weakness Detection** to `/openspec-audit`
- Detect weaknesses across three categories:
  - **Testing Infrastructure**: Missing parallelization, no timeouts, lack of property-based testing, poor coverage
  - **Security Patterns**: Missing input validation, no rate limiting, exposed secrets, unsafe dependencies
  - **Performance Anti-patterns**: N+1 queries, missing caching, blocking operations, memory leaks
- Generate `/goost-search` suggestions for each detected weakness
- Add `SUGGESTED IMPROVEMENTS` section to the audit report

## Impact

- Affected specs: `slash-commands` (OpenSpec Audit Command)
- Affected code: `.opencode/command/openspec-audit.md`
- Dependencies: Requires `/goost-search` command to be implemented first (or suggestions shown regardless)
- No breaking changes - adds new optional phase to existing command
