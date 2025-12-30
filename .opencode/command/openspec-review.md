---
name: openspec-review
description: Deep review of an OpenSpec change with research and validation
agent: general
---

# /openspec-review - OpenSpec Change Review

[GOOST:ROCKET]

You are performing a **deep review** of the OpenSpec change: `$ARGUMENTS`

## Pre-Review Check

1. Check if a Goost contract is currently active
   - If YES: Note which contract criteria relate to this review
   - If NO: Consider suggesting `/openspec-contract $ARGUMENTS` after review

2. Verify OpenSpec is available: `openspec list`
   - If command fails, inform user to install: `npm install -g @fission-ai/openspec`

## Review Framework

Track ALL review steps as TODOs. Be **methodical and thorough**.

### Phase 1: Spec Discovery & Context
1. **Locate the spec**: Read `openspec/changes/$ARGUMENTS/proposal.md`, `design.md`, `tasks.md`
2. **Read capability specs**: Check `openspec/changes/$ARGUMENTS/specs/*/spec.md`
3. **Review project context**: Read `openspec/project.md`
4. **Check current state**: Run `openspec show $ARGUMENTS --json`

### Phase 2: Documentation Research (Context7)
For EVERY library/framework/technology mentioned:
1. Use `resolve-library-id` to find Context7 library ID
2. Use `query-docs` to fetch current documentation
3. **Verify version compatibility** with project requirements
4. **Check for breaking changes** in recent versions
5. **Validate API patterns** match documented best practices

Document findings:
```
| Technology | Version | Context7 ID | Verified | Notes |
|------------|---------|-------------|----------|-------|
| [lib] | X.Y.Z | /org/lib | [yes/no] | [findings] |
```

### Phase 3: Acceptance Criteria Validation
For each requirement in the spec:
- [ ] Has clear, testable success criteria
- [ ] Has at least one `#### Scenario:` with Given/When/Then
- [ ] Scenarios cover happy path AND error cases
- [ ] Edge cases documented
- [ ] Performance requirements specified (if applicable)

### Phase 4: Core Rules Compliance
Validate against core rules (P01-P23) from `~/.config/opencode/rules.yaml`:

| Rule | Status | Evidence |
|------|--------|----------|
| **P01 Security** | | Least privilege enforced? |
| **P02 Collaboration** | | Plan before execution? |
| **P05 Ship-Complete** | | Tests, observability, feature flags? |
| **P07 Verify** | | Verification criteria for each task? |
| **P12 Dependencies** | | Versions verified? |
| **P19 Simplicity** | | Avoids over-engineering? |

**Full Rules Reference (P01-P23):**
- P01: Security - Least privilege, explicit confirmation for destructive actions
- P02: Collaboration - Plan and validate before execution
- P03: Timeouts - Commands expecting input must have timeouts
- P04: Locality - Behavior obvious from local unit
- P05: Ship-Complete - No partial/risky changes without tests/observability
- P06: Atomic-Commits - Logically grouped, never break build
- P07: Verify - Prove behavior with tests before trusting
- P08: Clarify - Ask questions if ambiguous
- P09: Rule-Resolution - Higher priority wins conflicts
- P10: Idempotence - Operations safely retriable
- P11: Lifecycle - Understand → Research → Plan → Implement → Verify
- P12: Dependencies - Verify versions, compatibility, security
- P13: Minimize-Debt - Favor deletion over abstraction
- P14: Observability - Structured logs, traces, errors
- P15: Fail-Fast - Surface failures early with clear messages
- P16: Docs-First - Consult existing docs before changes
- P17: Track-Progress - Maintain visible task list
- P18: User-First - Optimize for end-user experience
- P19: Simplicity - Simple > complex > complicated
- P20: Encapsulate - Hide implementation behind interfaces
- P21: Cleanup - Delete ephemeral artifacts
- P22: Modularity - Modular components, proven libraries
- P23: Campsite-Rule - Leave codebase better than found

### Phase 5: TDD Readiness
- [ ] Unit test targets identified
- [ ] Integration test boundaries defined
- [ ] Acceptance tests mapped to requirements
- [ ] Mock/stub strategy for dependencies
- [ ] Test paths follow conventions

### Phase 6: Final Assessment

```markdown
## OpenSpec Review: $ARGUMENTS

### Summary
- **Status**: [APPROVED | NEEDS_REVISION | BLOCKED]
- **Completeness**: X/10
- **TDD Readiness**: X/10
- **Rules Compliance**: X/23

### Critical Issues
1. [Issue + remediation]

### Recommendations
1. [Improvement]

### Contract Recommendation
[If complex]: This change would benefit from a Goost contract.
Run `/contract $ARGUMENTS` to establish binding criteria.
```

---
[Include standard Goost status block if contract active]
---
