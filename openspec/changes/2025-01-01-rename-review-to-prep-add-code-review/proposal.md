# Change: Rename /openspec-review to /openspec-prep and Add New Code Review Command

## Why

The current `/openspec-review` command focuses on **pre-implementation** validation: spec quality, acceptance criteria, TDD readiness, documentation research, and gap analysis. However, its name suggests it reviews code, which causes confusion about when to use it in the workflow.

Additionally, there's a gap in the OpenSpec workflow between implementation (`/openspec-apply`) and hardening (`/openspec-harden`):

- `/openspec-apply` - Implements the spec
- **[GAP]** - No code review step to verify correctness
- `/openspec-harden` - Focuses on production readiness (tests, docs, cleanup, slop detection)

The harden command catches technical debt and polish issues, but doesn't deeply review whether the implementation is **correct** - does it actually satisfy the spec requirements? Are there logic bugs? Architectural violations?

This change:
1. **Renames** `/openspec-review` to `/openspec-prep` to clarify it's pre-implementation preparation
2. **Creates** a new `/openspec-review` command for post-implementation code review

## What Changes

### Command Rename

- **RENAMED**: `/openspec-review` → `/openspec-prep`
- File: `.opencode/command/openspec-review.md` → `.opencode/command/openspec-prep.md`
- No functional changes to the command itself

### New Command

- **ADDED**: `/openspec-review` - Implementation code review command
- File: `.opencode/command/openspec-review.md` (new content)
- Sub-agent orchestration pattern for scalable analysis
- Focus on correctness, logic, architecture, security

### Workflow Update

New recommended workflow:
```
/openspec-prep → /openspec-apply → /openspec-review → /openspec-harden → /openspec-archive
         ↑                              ↑                    ↑
    Pre-impl prep              Code correctness      Production readiness
```

## Impact

- **Affected specs**: `slash-commands` capability
- **Affected code**:
  - `.opencode/command/openspec-review.md` (renamed to openspec-prep.md)
  - `.opencode/command/openspec-review.md` (new file with code review logic)
  - `goost_instructions.md` (update command table)
  - `README.md` (update command documentation)
- **Dependencies**: Builds on existing sub-agent patterns from `/openspec-harden`
- **Breaking**: Users expecting old `/openspec-review` will need to use `/openspec-prep`

## Design Considerations

### Differentiation from /openspec-harden

| Aspect | `/openspec-review` (NEW) | `/openspec-harden` |
|--------|--------------------------|-------------------|
| **Question** | "Is it correct?" | "Is it shippable?" |
| **Focus** | Correctness & Architecture | Production Readiness |
| **Catches** | Bugs, missed requirements, wrong behavior | TODOs, slop, missing tests/docs |
| **Timing** | After apply, before harden | After review, before archive |
| **Output** | Structured review findings | Hardening report with auto-fixes |
| **Remediation** | Identifies issues for manual fix | Offers to spawn fix sub-agents |

### Sub-Agent Architecture

The new `/openspec-review` uses orchestrated sub-agents for scalable analysis:

**Phase 1: Discovery (Parallel Sub-Agents)**
- Requirement Traceability Scanner
- Logic & Edge Case Scanner  
- Security Review Scanner
- Architecture Conformance Scanner

**Phase 2: Synthesis (Main Agent)**
- Cross-reference findings
- Identify root causes
- Prioritize issues

**Phase 3: Remediation (Targeted Sub-Agents)**
- Spawn fix sub-agents for critical issues
- User chooses fix scope (all/critical/manual)

This pattern manages context tokens by:
- Each scanner sub-agent has focused scope
- Main agent synthesizes without full codebase in context
- Fix sub-agents are spawned only as needed

### Output Format

Structured, actionable review format:

```
============================================================
              CODE REVIEW: <change-id>
============================================================

OVERALL VERDICT: [APPROVED | CHANGES_REQUESTED | BLOCKED]

REQUIREMENT COVERAGE                               [PASS|WARN|FAIL]
  Scenarios traced: X/Y (Z%)
  - [list untraced scenarios]

LOGIC REVIEW                                       [PASS|WARN|FAIL]
  Issues found: N (X critical, Y major, Z minor)
  - [issue list with file:line references]

SECURITY REVIEW                                    [PASS|WARN|FAIL]
  Concerns: N
  - [security issue list]

ARCHITECTURE CONFORMANCE                           [PASS|WARN|FAIL]
  Pattern violations: N
  - [violation list]

------------------------------------------------------------
REVIEW COMMENTS:
1. [CRITICAL] <file:line> - <finding>
   Suggestion: <how to fix>

2. [MAJOR] <file:line> - <finding>
   Suggestion: <how to fix>
...
============================================================
```

## Out of Scope

- Changing `/openspec-harden` behavior (complementary, not overlapping)
- Automatic code fixes without user approval (review identifies, user decides)
- Performance benchmarking (separate concern, may add later)
- Formal verification or proof systems (too heavyweight)
