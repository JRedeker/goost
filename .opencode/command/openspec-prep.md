---
name: openspec-prep
description: Pre-implementation preparation and validation of a spec with research, acceptance criteria, TDD verification, and gap analysis.
agent: general
---

# OpenSpec Pre-Implementation Preparation

You are performing **pre-implementation preparation** on the OpenSpec change: `$ARGUMENTS`

> **Note**: This command was formerly `/openspec-review`. Use `/openspec-review` after implementation for code review.

## Preparation Framework

Follow this comprehensive preparation process, tracking all items as TODOs:

### Phase 1: Spec Discovery & Context
1. **Locate the spec**: Find and read `openspec/changes/$ARGUMENTS/proposal.md`, `design.md`, and `tasks.md`
2. **Read related specs**: Check `openspec/changes/$ARGUMENTS/specs/*/spec.md` for all capability deltas
3. **Review project context**: Read `openspec/project.md` for project-level requirements
4. **Check existing implementation**: Run `openspec show $ARGUMENTS --json` for full context

### Phase 2: Documentation Research (Use Context7)
For EVERY library, framework, or technology mentioned in the spec:
1. Use `resolve-library-id` to find the Context7 library ID
2. Use `query-docs` to fetch current documentation
3. **Verify version compatibility** with project requirements from `openspec/project.md`
4. **Check for breaking changes** in recent versions
5. **Validate API patterns** match documented best practices
6. Document any discrepancies between spec and current library docs

### Phase 3: Acceptance Criteria Validation
Verify the spec has **complete acceptance criteria**:

1. **Requirements Check** (for each requirement):
   - [ ] Has clear, testable success criteria
   - [ ] Has at least one `#### Scenario:` with Given/When/Then
   - [ ] Scenarios cover happy path AND error cases
   - [ ] Edge cases are documented
   - [ ] Performance requirements specified (if applicable)

2. **Missing Scenarios** - Identify and draft scenarios for:
   - Error handling paths
   - Boundary conditions
   - Concurrent access scenarios
   - Degradation/fallback behavior
   - Security considerations

### Phase 4: Core Rules Compliance
Validate against `~/.config/opencode/rules.yaml`:

| Rule | Status | Evidence |
|------|--------|----------|
| **P01 Security** | | Least privilege enforced? |
| **P02 Collaboration** | | Plan proposed before execution? |
| **P05 Ship-Complete** | | Tests, observability, feature flags specified? |
| **P06 Atomic-Commits** | | Tasks are atomic and verifiable? |
| **P07 Verify** | | Each task has verification criteria? |
| **P08 Clarify** | | Ambiguities identified and resolved? |
| **P11 Lifecycle** | | Follows Understand -> Research -> Plan -> Implement -> Verify? |
| **P12 Dependencies** | | Versions, compatibility, security verified? |
| **P13 Minimize-Debt** | | Simplest solution proposed? |
| **P14 Observability** | | Logging, metrics, tracing specified? |
| **P16 Docs-First** | | Documentation plan included? |
| **P19 Simplicity** | | Avoids over-engineering? |

### Phase 5: TDD Readiness
Verify the spec supports Test-Driven Development:

1. **Test Strategy**:
   - [ ] Unit test targets identified for each component
   - [ ] Integration test boundaries defined
   - [ ] Acceptance test scenarios mapped to requirements
   - [ ] Mock/stub strategy for external dependencies

2. **Test File Locations**:
   - [ ] Test paths follow project conventions (check `openspec/project.md` for project-specific paths)
   - [ ] Test markers/tags specified per project's test framework

3. **Testability**:
   - [ ] Dependencies are injectable
   - [ ] Side effects are isolated
   - [ ] Async code is properly testable

### Phase 6: Research Gaps
Identify what additional research is needed:

1. **External API Research**:
   - Are all external APIs documented?
   - Are rate limits known?
   - Is error handling specified?

2. **Performance Research**:
   - Are baseline performance requirements established?
   - Is there load testing criteria?

3. **Security Research**:
   - Are authentication/authorization requirements clear?
   - Are sensitive data handling requirements specified?

### Phase 7: Gap Analysis

Analyze what the spec might be **missing** or **forgetting**:

#### 7.1 Codebase Impact Discovery
1. **Extract key terms**: Identify technologies, features, and domain terms from the spec
2. **Search codebase**: Use `grep`/`glob` to find files matching those terms
3. **Compare with spec**: Check found files against the "Affected code" section in proposal.md
4. **Flag gaps**: List potentially impacted files not mentioned in the spec

**Error handling**:
- If no "Affected code" section exists, note it and treat all found files as potentially impacted
- If no files match, report "No additional impacted files found"
- If >50 files match, truncate to top 50 and note that results were truncated

#### 7.2 Cross-Cutting Concerns Check
Review the spec for coverage of each concern:

| Concern | What to Check |
|---------|---------------|
| **Error Handling** | Are failure scenarios documented? API errors? Network failures? |
| **Logging/Observability** | Are structured logs, metrics, or traces specified? |
| **Security** | Auth, input validation, secrets handling, least privilege? |
| **Configuration** | New config options documented? Env vars? Feature flags? |
| **Performance** | Latency requirements? Rate limits? Resource constraints? |

Mark each as: ✓ Covered | ⚠️ Partial | ✗ Missing

#### 7.3 Related Changes Detection
1. **List active changes**: Run `openspec list` to get other in-progress changes
2. **Check for overlaps**: Compare capabilities and affected files
3. **Flag conflicts**: Note any changes that touch the same areas

**Error handling**:
- If `openspec` CLI is unavailable, skip this check and note in the report

#### 7.4 Commonly Forgotten Items
Present this checklist and mark items based on spec content:

- [ ] **Database migrations** - Does the change modify data models?
- [ ] **API versioning** - Are endpoints changing in breaking ways?
- [ ] **Feature flags** - Should this be gradually rolled out?
- [ ] **Rollback plan** - How to revert if issues occur?
- [ ] **Documentation updates** - README, API docs, user guides?
- [ ] **Dependency updates** - New deps need version pinning, security review?

Mark as: ✓ Addressed | ⚠️ Needs attention | N/A Not applicable

### Phase 8: Final Assessment

Generate a **PREPARATION REPORT** with:

```markdown
## OpenSpec Prep: $ARGUMENTS

### Summary
- **Overall Status**: [READY | NEEDS_REVISION | BLOCKED]
- **Completeness**: X/10
- **TDD Readiness**: X/10
- **Rules Compliance**: X/23

### Critical Issues
1. [Issue description and remediation]

### Recommendations
1. [Improvement suggestion]

### Missing Items
- [ ] [Item to add]

### Documentation Verified
- [Library]: Version X.Y.Z compatible, [notes]

### Gap Analysis

#### Potentially Impacted Files (Not in Spec)
- `path/to/file.ts` - Contains "[term]" but not listed in affected code
- _(or "No additional impacted files found")_

#### Cross-Cutting Concerns
| Concern | Status | Notes |
|---------|--------|-------|
| Error Handling | ✓/⚠️/✗ | [specific notes] |
| Logging/Observability | ✓/⚠️/✗ | [specific notes] |
| Security | ✓/⚠️/✗ | [specific notes] |
| Configuration | ✓/⚠️/✗ | [specific notes] |
| Performance | ✓/⚠️/✗ | [specific notes] |

#### Related Changes
- `change-id` - May conflict: [reason]
- _(or "No conflicts detected" or "OpenSpec CLI unavailable - conflict check skipped")_

#### Commonly Forgotten Items
- [ ] Database migrations (if schema changes)
- [ ] API versioning (if endpoints change)
- [ ] Feature flags (for gradual rollout)
- [ ] Rollback plan
- [ ] Documentation updates
- [ ] Dependency updates

### Next Steps
1. [Action item]
```

## Output Requirements

1. **Use TODOs**: Track all review steps as todos
2. **Be thorough**: Check Context7 for EVERY technology mentioned
3. **Be specific**: Quote exact locations of issues (file:line)
4. **Be actionable**: Every issue must have a remediation path
5. **Update the spec**: If issues are found, propose specific edits to fix them

## Reference Commands
- `openspec show $ARGUMENTS --json --deltas-only` - Get full spec context
- `openspec validate $ARGUMENTS --strict` - Run validation
- `rg -n "Requirement:|Scenario:" openspec/changes/$ARGUMENTS/` - Find all requirements
