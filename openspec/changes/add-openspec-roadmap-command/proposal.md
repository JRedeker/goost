# Change: Add OpenSpec Roadmap Command to Goost

## Why

The global `/roadmap` command at `~/.config/opencode/command/roadmap.md` is tightly coupled to a specific project's Python script (`scripts/roadmap_status.py`). This makes it:
1. **Non-portable**: Only works in projects with that specific script
2. **Fragile**: Breaks silently when the script doesn't exist
3. **Disconnected**: Doesn't integrate with OpenSpec's change management system

Goost already provides contract-based task tracking, but lacks visibility into OpenSpec change progress across projects. A `/openspec-roadmap` command would provide a universal roadmap view based on OpenSpec's structured data.

## What Changes

### New Capability: `/openspec-roadmap` Command

- **Add** a new slash command `openspec-roadmap.md` to `.opencode/command/` within Goost
- **Integrate** with OpenSpec CLI (`openspec list`, `openspec show`) for data retrieval
- **Render** a tiered roadmap dashboard (NOW/NEXT/LATER) based on:
  - OpenSpec change status (active changes from `openspec list`)
  - Task completion progress from `tasks.md` files
  - Priority/blocking indicators from proposal metadata
- **Support** both project-local and global views

### Deprecation: Global `/roadmap`

- The global `/roadmap` command should be moved to project-specific configs where that Python script exists
- Users of Goost gain the new `/openspec-roadmap` as a replacement

## Impact

- **Affected specs**: New `slash-commands` capability (or add to existing)
- **Affected code**: 
  - `.opencode/command/openspec-roadmap.md` (new file)
  - Potentially `goost_instructions.md` (add reference to new command)
- **Dependencies**: OpenSpec CLI must be installed (`openspec list` must work)
- **Breaking**: None - this is additive; global `/roadmap` remains for backward compatibility

## Design Considerations

### Tiering Logic

The NOW/NEXT/LATER tiers should be derived from:

| Tier | Criteria |
|------|----------|
| **NOW** | Changes with `[BLOCKING]` tag, OR > 50% tasks complete (momentum), OR explicitly marked critical |
| **NEXT** | Changes with incomplete dependencies resolved, ready to start |
| **LATER** | All other changes, including blocked or low-priority items |

### Output Format

```
============================================================
                    OPENSPEC ROADMAP
============================================================

NOW (Active/Critical)
---------------------
  [####------] add-oauth-support (4/10 tasks)
    Objective: Add OAuth2 authentication flow
    Blocked by: None
    
  [########--] fix-session-timeout (8/10 tasks)
    Objective: Resolve session timeout issues
    Blocked by: None

NEXT (Ready to Start)
---------------------
  [----------] add-rate-limiting (0/5 tasks)
    Objective: Implement API rate limiting
    Blocked by: add-oauth-support

LATER (Backlog)
---------------
  [----------] refactor-db-layer (0/12 tasks)
    Objective: Modernize database abstraction
    Blocked by: Multiple dependencies

============================================================
Total: 3 active changes | 12/37 tasks complete (32%)
============================================================
```

### Fallback Behavior

If `openspec` CLI is not available or no `openspec/` directory exists:
- Show clear error message
- Suggest installing OpenSpec or initializing with `openspec init`

## Alternatives Considered

1. **Keep global `/roadmap` as-is**: Rejected - too project-specific
2. **Make `/roadmap` configurable**: Adds complexity without solving the core issue
3. **Integrate into plugin's terminal output**: Plugin is for visual status, not command output
