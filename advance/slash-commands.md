# Advance (ADV) Slash Commands

This document maps current OpenSpec slash commands to their ADV equivalents, documenting what changes and what stays the same.

## Command Mapping

| Current (v1) | ADV Equivalent | Changes |
|--------------|----------------|---------|
| `/contract` | `/contract` | **Unchanged** — core contract mechanics stay the same |
| `/contract-quick` | `/contract-quick` | **Unchanged** |
| `/openspec-proposal` | `/adv-proposal` | Uses `adv_change_create` tool instead of `openspec` CLI |
| `/openspec-prep` | `/adv-prep` | JSON-aware analysis via `adv_change_show` + `adv_spec_search` |
| `/openspec-apply` | `/adv-apply` | Uses `adv_task_ready` and `adv_task_update` for task tracking |
| `/openspec-archive` | `/adv-archive` | Uses `adv_change_archive` tool, triggers doc generation |
| `/openspec-status` | `/adv-status` | Uses `adv_status` tool for fast SQLite-backed status |
| `/openspec-review` | `/adv-review` | Uses `adv_change_validate` against spec laws |
| `/openspec-research` | `/adv-research` | **Unchanged** — parallel research pattern stays the same |
| `/openspec-clarify` | `/adv-clarify` | Uses `adv_change_show` to target structured JSON |
| `/openspec-coordinate` | `/adv-coordinate` | Uses `adv_spec_search` for cross-spec dependencies |
| `/openspec-harden` | `/adv-harden` | **Unchanged** — prompt hardening pattern stays the same |
| `/openspec-audit` | `/adv-audit` | Uses `adv_status` for completeness metrics |
| `/openspec-roadmap` | `/adv-roadmap` | Uses `adv_spec_list` and `adv_change_list` |
| `/openspec-ralph` | `/adv-ralph` | **Unchanged** — exploratory review pattern stays the same |
| `/openspec-refactor` | `/adv-refactor` | Uses `adv_change_validate` with staleness detection |
| `/goost-search` | `/adv-search` | Uses `adv_spec_search` (FTS5) instead of ripgrep |
| `/goost-improve` | `/adv-improve` | Pattern stays the same |
| `/goost-slop-scan` | `/adv-slop-scan` | Pattern stays the same |

## New Commands

| Command | Purpose |
|---------|---------|
| `/adv-init` | Initialize project with `project.json` and `.advdb/` |
| `/adv-validate` | Validate change via `adv_change_validate` (specs as laws) |
| `/adv-docs` | Generate/preview documentation from specs |
| `/adv-migrate` | Migrate from OpenSpec v1 to ADV format |
| `/adv-refactor` | Refresh stale change proposals via Bidirectional Reconciliation |

## Detailed Command Specifications

### `/adv-proposal <description>`

**Purpose**: Create a new change proposal

**Workflow**:
1. Call `adv_change_create({ summary: "<description>" })` to scaffold files
2. Generate unique change ID (verb-led, e.g., `add-auth`, `fix-validation`)
3. Create:
   - `changes/{id}/proposal.md` — prose description
   - `changes/{id}/change.json` — structured metadata
4. Call `adv_change_validate({ changeId })` to check for conflicts
5. Present draft for user confirmation

**Tool Integration**:
```typescript
const { changeId, path } = await adv_change_create({ 
  summary: "Add user authentication" 
});
// Creates: changes/add-auth-abc123/
```

**Output**:
```
============================================================
      /adv-proposal <change-id> COMPLETE
============================================================
Result: Proposal created and validated
Files:
  - changes/add-auth-abc123/proposal.md
  - changes/add-auth-abc123/change.json
============================================================
```

---

### `/adv-apply [change-id]`

**Purpose**: Implement an approved change under contract enforcement

**Workflow**:
1. Resolve change ID (prompt if ambiguous)
2. Call `adv_change_show({ changeId })` for tasks and acceptance criteria
3. Generate contract from structured data
4. Call `adv_task_ready({ changeId })` to get unblocked tasks
5. Work through tasks, calling `adv_task_update` as tasks complete:
   ```typescript
   await adv_task_update({ 
     taskId: "tk-abc123", 
     status: "completed",
     notes: "Implemented with tests"
   });
   ```
6. Call `adv_change_validate({ changeId })` before completion
7. Mark change as `implemented` when all tasks done

---

### `/adv-archive [change-id]`

**Purpose**: Archive a completed change, promoting deltas to specs

**Workflow**:
1. Validate all tasks completed via `adv_task_list({ changeId })`
2. Call `adv_change_archive({ changeId })`
3. Deltas from `change.json` become requirements in `specs/{cap}/spec.json`
4. Change moves to `archive/{date}-{id}/`
5. Documentation generated: `docs/specs/{cap}.md`
6. SQLite cache updated

**Tool Integration**:
```typescript
const result = await adv_change_archive({ changeId: "add-auth-abc123" });
// → { success: true, specsUpdated: ["auth"], docsGenerated: ["docs/specs/auth.md"] }
```

---

### `/adv-status`

**Purpose**: Fast project status overview

**ADV Improvement**: Uses `adv_status` tool (SQLite-backed) instead of parsing files

**Workflow**:
```typescript
const status = await adv_status();
// Returns:
// - Active changes and progress
// - Spec counts
// - Dependency warnings
// - Recommendations
```

**Output Format**:
```
============================================================
                ADV STATUS
============================================================

ACTIVE CHANGES
------------------------------------------------------------
add-auth-abc123      [========> ] 8/10 tasks
fix-validation-xyz   [===>      ] 3/8 tasks

SPECS
------------------------------------------------------------
contract-system      12 requirements
slash-commands       8 requirements

DEPENDENCIES
------------------------------------------------------------
! add-auth-abc123 and fix-validation-xyz both modify: user-system

RECOMMENDATIONS
------------------------------------------------------------
> Ready to archive: `/adv-archive add-auth-abc123`
============================================================
```

---

### `/adv-validate [change-id]`

**Purpose**: Validate a change against existing specs (specs as laws)

**New in ADV**: This is the "specs as laws" enforcement point

**Checks**:
1. **Conflict detection**: New requirements don't contradict existing
2. **Dependency validation**: Referenced specs/requirements exist
3. **Schema validation**: JSON structure is valid
4. **Completeness**: All required fields present

**Tool Integration**:
```typescript
const result = await adv_change_validate({ 
  changeId: "add-auth-abc123",
  strict: true 
});
// → { passed: false, errors: [...], warnings: [...] }
```

**Output**:
```
============================================================
      /adv-validate add-auth-abc123
============================================================

VALIDATION RESULTS
------------------------------------------------------------
[PASS] Schema validation
[PASS] Dependency resolution
[WARN] Potential conflict with specs/user-system/spec.json
       - Existing: "rq-abc123: Users must authenticate via email"
       - New: "dl-xyz789: Allow OAuth-only authentication"
[FAIL] Missing acceptance scenario for dl-xyz789

RECOMMENDATIONS
------------------------------------------------------------
> Resolve conflict: clarify if OAuth replaces or supplements email auth
> Add scenario for dl-xyz789
============================================================
```

---

### `/adv-docs [--preview]`

**Purpose**: Generate or preview documentation from specs

**Workflow**:
```typescript
// Preview (don't write files)
const preview = await adv_docs_preview();

// Generate (during archive - handled by adv_change_archive)
```

**Output**: Markdown files in `docs/specs/`:
- `index.md` — table of contents
- `{capability}.md` — per-capability documentation

---

### `/adv-migrate`

**Purpose**: Migrate from OpenSpec v1 to ADV

**Workflow**:
1. Scan `openspec/` directory
2. Convert markdown specs to JSON format
3. Migrate changes to new structure
4. Initialize SQLite cache
5. Validate migration

**Tool Integration**:
```typescript
// Migration is a one-time operation, typically via plugin tool
const result = await adv_migrate({ source: "openspec" });
```

---

### `/adv-search <query>`

**Purpose**: Full-text search across specs and changes

**ADV Improvement**: Uses `adv_spec_search` (SQLite FTS5) instead of ripgrep

**Tool Integration**:
```typescript
const results = await adv_spec_search({ 
  query: "authentication",
  limit: 20 
});
```

**Output**:
```
============================================================
      SEARCH: "authentication"
============================================================

REQUIREMENTS (3 matches)
------------------------------------------------------------
rq-abc123  specs/user-system/spec.json:15
           "Users must authenticate before accessing..."
rq-def456  specs/api-gateway/spec.json:42
           "API endpoints require authentication token..."

CHANGES (1 match)
------------------------------------------------------------
add-auth-abc123  changes/add-auth-abc123/change.json
                 "Add OAuth authentication flow..."

============================================================
```

---

### `/adv-refactor [change-id]`

**Purpose**: Refresh stale change proposals via Bidirectional Reconciliation

**ADV Improvement**: Uses SQLite for fast staleness detection and cross-reference analysis

**Flags**:
- `--execute`: Apply changes (default is dry-run)
- `--interactive`: Approve each fix category
- `--force`: Skip recent-modification warnings

**Workflow**:
1. **Staleness Analysis**: Spawn parallel sub-agents for 5 detection dimensions:
   - Codebase Drift Scanner (file moves, renames)
   - Dependency Scanner (outdated libraries)
   - Conflict Scanner (overlaps with archived changes)
   - Task Validator (orphaned task references)
   - Obsolescence Detector (requirements already implemented)
2. **Synthesis**: Aggregate findings, classify by severity
3. **Intent Verification**: If code contradicts requirement, ask user to clarify
4. **Refactoring**: Update spec deltas, tasks, metadata (under contract)
5. **Validation**: Call `adv_change_validate({ changeId })` on updated proposal

**Tool Integration**:
```typescript
// Load change and validate
const change = await adv_change_show({ changeId: "add-auth-abc123" });
const validation = await adv_change_validate({ changeId: "add-auth-abc123" });

// Update tasks as needed
await adv_task_update({ taskId: "tk-old", status: "cancelled", notes: "Obsolete" });
await adv_task_add({ changeId, content: "New task based on current state" });
```

**Output**:
```
============================================================
          REFACTOR REPORT: add-auth-abc123
============================================================
STALENESS SUMMARY:
  - Age: 14 days since creation
  - Drift: 3 files moved/renamed
  - Obsolescence: 1 requirement implemented elsewhere

CHANGES:
✅ HIGH CONFIDENCE
  - Updated src/auth.ts reference (content hash match)
  - Corrected task 3.1 file path

⚠️ MANUAL REVIEW
  - Requirement rq-xyz789 may conflict with recent rq-abc123

ROLLBACK:
  git restore .

============================================================
      /adv-refactor add-auth-abc123 COMPLETE
============================================================
```

---

## Contract Integration

All `/adv-*` commands that modify state integrate with the contract system:

1. **Before work**: Generate contract from `change.json` (via `adv_change_show`)
2. **During work**: Update task status via `adv_task_update`
3. **After work**: Validate via `adv_change_validate`
4. **Completion**: Standard contract fulfillment protocol

The contract format remains unchanged from the original Goost:
```
============================================================
                    CONTRACT ACTIVE
============================================================

OBJECTIVE: <from change.json.summary>

SUCCESS CRITERIA:
- [ ] (C1) <from change.json.acceptance[0]>
...
============================================================
```

## Tool Integration Summary

| Slash Command | Plugin Tools |
|---------------|--------------|
| `/adv-proposal` | `adv_change_create`, `adv_change_validate` |
| `/adv-apply` | `adv_change_show`, `adv_task_ready`, `adv_task_update` |
| `/adv-archive` | `adv_task_list`, `adv_change_archive` |
| `/adv-status` | `adv_status` |
| `/adv-validate` | `adv_change_validate` |
| `/adv-docs` | `adv_docs_preview`, (or via `adv_change_archive`) |
| `/adv-migrate` | `adv_migrate` |
| `/adv-search` | `adv_spec_search` |
| `/adv-refactor` | `adv_change_show`, `adv_change_validate`, `adv_task_update`, `adv_task_add` |

## Migration Path

1. **Phase 1**: Implement plugin with core tools
2. **Phase 2**: Create new `/adv-*` slash commands that call plugin tools
3. **Phase 3**: Deprecate `/openspec-*` commands with warning
4. **Phase 4**: Remove deprecated commands after migration period

During migration, both command sets work:
- `/openspec-*` — reads/writes markdown (legacy)
- `/adv-*` — reads/writes JSON via plugin tools (ADV)

The `adv_migrate` tool handles the one-time conversion.
