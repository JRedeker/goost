# Change: Add Gap Analysis Phase to /openspec-review

## Why

The current `/openspec-review` command performs thorough validation of a spec's internal quality (acceptance criteria, TDD readiness, rules compliance) but does not analyze what the change might be **missing** or **forgetting**. This leads to:

1. Changes that pass review but miss impacted areas of the codebase
2. Specs that don't consider downstream effects on other capabilities
3. Missing integration points or cross-cutting concerns
4. Forgotten edge cases that only surface during implementation

A comprehensive gap analysis after the review phases would catch these issues before implementation begins.

## What Changes

### Command Enhancement

The `/openspec-review` command is defined globally at `~/.config/opencode/command/openspec-review.md`. This change modifies that file.

- **ADDED**: Phase 7 - Gap Analysis before the Final Assessment
- **MODIFIED**: Phase 8 - Final Assessment (renumbered, now includes gap analysis findings)

### Gap Analysis Scope

The new phase will analyze:

1. **Codebase Impact**: Files/modules that will be affected but aren't mentioned in the spec
2. **Capability Dependencies**: Other OpenSpec capabilities that might need updates
3. **Cross-Cutting Concerns**: Logging, error handling, security, observability gaps
4. **Integration Points**: APIs, events, or interfaces that need consideration
5. **Forgotten Scenarios**: Common patterns that specs typically miss

## Impact

- **Affected specs**: `slash-commands` capability
- **Affected code**: 
  - `~/.config/opencode/command/openspec-review.md` (global command, modified)
- **Dependencies**: None - uses existing MCP tools (grep, read, glob) and OpenSpec CLI
- **Breaking**: None - additive phase

## Design Considerations

### Gap Analysis Approach

The analysis should be **automated discovery** followed by **manual verification**:

1. Use `grep`/`glob` to find files matching keywords from the spec
2. Compare found files against spec's "Affected code" section
3. Check for common patterns (error handlers, middleware, config) not mentioned
4. Cross-reference with other active OpenSpec changes for conflicts

### Output Format

```markdown
## Gap Analysis

### Potentially Impacted Files (Not in Spec)
- `src/utils/logger.ts` - Mentions "authentication" but not in affected code
- `src/middleware/auth.ts` - Related to auth capability

### Cross-Cutting Concerns Check
| Concern | Status | Notes |
|---------|--------|-------|
| Error Handling | ⚠️ | No error scenarios for API failures |
| Logging | ✓ | Covered in observability section |
| Security | ⚠️ | No mention of input validation |

### Related Changes
- `enhance-subagent-contract-propagation` - May conflict with sub-agent handling

### Commonly Forgotten Items
- [ ] Database migrations (if schema changes)
- [ ] API versioning (if endpoints change)
- [ ] Feature flags (for gradual rollout)
- [ ] Rollback plan
```

## Out of Scope

- Automatic spec modification (analysis only, user decides action)
- Deep static analysis of code (uses text search, not AST)
- Performance impact analysis (separate concern)
