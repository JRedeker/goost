# Change: Add /openspec-roadmap Command

## Why

The global `/roadmap` command at `~/.config/opencode/command/roadmap.md` is tightly coupled to a specific project's Python script. This makes it:
1. **Non-portable**: Only works in projects with that specific script
2. **Fragile**: Breaks silently when the script doesn't exist
3. **Disconnected**: Doesn't integrate with OpenSpec's change management system

Goost already provides contract-based task tracking, but lacks visibility into OpenSpec change progress across projects. A `/openspec-roadmap` command would provide a universal roadmap view based on OpenSpec's structured data.

## What Changes

### New Capability: `/openspec-roadmap` Command

- **Add** a new slash command `openspec-roadmap.md` to `.opencode/command/` within Goost
- **Integrate** with OpenSpec CLI (`openspec list`) for change progress data
- **Render** a tiered roadmap dashboard (NOW/NEXT/LATER) based on:
  - OpenSpec change status and task completion
  - Optional `roadmap.yaml` for additional metadata
- **Support** OpenSpec-only mode (no roadmap.yaml required)

### Deprecation: Global `/roadmap`

- The global `/roadmap` command should be moved to project-specific configs where the Python script exists
- Users of Goost gain the new `/openspec-roadmap` as a replacement

## Impact

- **Affected specs**: New `slash-commands` capability
- **Affected code**: 
  - `.opencode/command/openspec-roadmap.md` (new file)
  - Potentially `goost_instructions.md` (add reference to new command)
- **Dependencies**: OpenSpec CLI recommended but not required
- **Breaking**: None - this is additive

## Design Considerations

### Tiering Logic (Simple)

| Tier | Criteria |
|------|----------|
| **NOW** | `status: in_progress` OR `priority: critical` |
| **NEXT** | `status: proposed` OR `status: ready` |
| **LATER** | `status: deferred` OR `status: completed` |

For OpenSpec-only mode (no roadmap.yaml):
- Changes with >0% completion → NOW
- Changes with 0% completion → NEXT

### Output Format

```
============================================================
                    PROJECT ROADMAP
============================================================

NOW (In Progress)
-----------------
  [████████░░] add-oauth-support (8/10 tasks)
    OAuth2 authentication flow
    
  [██████████] fix-session-timeout (10/10 tasks)  DONE

NEXT (Ready)
------------
  [░░░░░░░░░░] add-rate-limiting (0/5 tasks)
    API rate limiting

LATER (Backlog)
---------------
  [░░░░░░░░░░] refactor-db-layer (0/12 tasks)
    Database abstraction

============================================================
Total: 4 changes | 18/27 tasks (67%)
============================================================
```

### Fallback Behavior

1. **No openspec/ directory**: Show message suggesting `openspec init`
2. **No OpenSpec CLI**: Work with roadmap.yaml alone (if exists)
3. **No openspec/ AND no roadmap.yaml**: Show setup instructions

## Alternatives Considered

1. **Keep global `/roadmap` as-is**: Rejected - too project-specific
2. **Require roadmap.yaml**: Rejected - should work with just OpenSpec changes
3. **Auto-scaffold roadmap.yaml**: Rejected - adds complexity, prefer OpenSpec-only mode

## Implementation Notes

### YAML Parsing (js-yaml v4)

When parsing `roadmap.yaml`, use the js-yaml v4 API:

```typescript
import yaml from 'js-yaml';

try {
  const config = yaml.load(fileContent, { json: true });
  // json: true enables duplicate key handling
} catch (e) {
  if (e instanceof yaml.YAMLException) {
    // Handle syntax error with line/column info
    console.error(`YAML error at line ${e.mark?.line}: ${e.message}`);
  }
  throw e;
}
```

**Important:** js-yaml v4 renamed `safeLoad()` → `load()`. Do NOT use the deprecated `safeLoad` function.

### Schema Validation

A `roadmap.schema.yaml` is provided for optional validation. Implementers may use:
- `ajv` for JSON Schema validation
- Manual validation for simpler deployments

## Out of Scope

- Auto-scaffolding of roadmap.yaml (users create manually if needed)
- Circular dependency detection (edge case, adds complexity)
- Debug logging requirements (implementation detail)
- Momentum-based tiering (>50% = NOW) - too clever, prefer explicit status
