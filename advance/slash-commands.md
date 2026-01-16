# Advance (ADV) Slash Commands

This document maps current OpenSpec slash commands to their ADV equivalents, documenting what changes and what stays the same.

## Command Mapping

| Current (v1) | ADV Equivalent | Changes |
|--------------|----------------|---------|
| `/contract` | `/contract` | **Unchanged** — core contract mechanics stay the same |
| `/contract-quick` | `/contract-quick` | **Unchanged** |
| `/openspec-proposal` | `/adv-proposal` | Uses `adv change new` instead of `openspec` CLI |
| `/openspec-prep` | `/adv-prep` | JSON-aware analysis, validates against `spec.json` |
| `/openspec-apply` | `/adv-apply` | Reads `change.json` for tasks, updates task status in JSON |
| `/openspec-archive` | `/adv-archive` | Uses `adv change archive`, triggers doc generation |
| `/openspec-status` | `/adv-status` | Queries SQLite for fast status, no file parsing |
| `/openspec-review` | `/adv-review` | Validates implementation against `spec.json` laws |
| `/openspec-research` | `/adv-research` | **Unchanged** — parallel research pattern stays the same |
| `/openspec-clarify` | `/adv-clarify` | Targets `change.json` instead of markdown specs |
| `/openspec-coordinate` | `/adv-coordinate` | Queries SQLite for cross-spec dependencies |
| `/openspec-harden` | `/adv-harden` | **Unchanged** — prompt hardening pattern stays the same |
| `/openspec-audit` | `/adv-audit` | Queries `adv.db` for completeness metrics |
| `/openspec-roadmap` | `/adv-roadmap` | Uses `adv roadmap` CLI command |
| `/openspec-ralph` | `/adv-ralph` | **Unchanged** — exploratory review pattern stays the same |
| `/goost-search` | `/adv-search` | Queries SQLite FTS5 instead of ripgrep |
| `/goost-improve` | `/adv-improve` | Pattern stays the same |
| `/goost-slop-scan` | `/adv-slop-scan` | Pattern stays the same |

## New Commands

| Command | Purpose |
|---------|---------|
| `/adv-init` | Initialize project with `project.json` and `.advdb/` |
| `/adv-validate` | Validate change against existing specs (specs as laws) |
| `/adv-docs` | Generate/preview documentation from specs |
| `/adv-migrate` | Migrate from OpenSpec v1 to ADV format |

## Detailed Command Specifications

### `/adv-proposal <description>`

**Purpose**: Create a new change proposal

**Workflow**:
1. Run `adv change new "<description>"` to scaffold files
2. Generate unique change ID (verb-led, e.g., `add-auth`, `fix-validation`)
3. Create:
   - `changes/{id}/proposal.md` — prose description
   - `changes/{id}/change.json` — structured metadata
4. Validate against existing specs (check for conflicts)
5. Present draft for user confirmation

**CLI Integration**:
```bash
adv change new "Add user authentication"
# Creates: changes/add-auth-abc123/
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
2. Read `change.json` for tasks and acceptance criteria
3. Generate contract from structured data
4. Work through tasks, updating `change.json` status:
   ```json
   "tasks": [
     {"id": "tk-abc123", "content": "...", "status": "completed"}
   ]
   ```
5. Run `adv change validate <id>` before completion
6. Mark change as `implemented` when all tasks done

**Task Status Updates**:
```bash
adv task update tk-abc123 --status=completed
```

---

### `/adv-archive [change-id]`

**Purpose**: Archive a completed change, promoting deltas to specs

**Workflow**:
1. Validate all tasks completed
2. Run `adv change archive <id>`
3. Deltas from `change.json` become requirements in `specs/{cap}/spec.json`
4. Change moves to `archive/{date}-{id}/`
5. Generate documentation: `docs/specs/{cap}.md`
6. Update SQLite cache

**Triggers**:
- Spec promotion (deltas → requirements)
- Documentation generation
- Cache sync

---

### `/adv-status`

**Purpose**: Fast project status overview

**ADV Improvement**: Queries SQLite instead of parsing files

**Workflow**:
```bash
adv status
# Returns JSON with:
# - Active changes and progress
# - Spec counts
# - Dependency warnings
# - Recommendations
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

**Workflow**:
```bash
adv change validate add-auth-abc123
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
```bash
# Preview (don't commit)
adv docs preview

# Generate (during archive)
adv docs generate
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

**CLI**:
```bash
adv migrate from-openspec
```

---

### `/adv-search <query>`

**Purpose**: Full-text search across specs and changes

**ADV Improvement**: Uses SQLite FTS5 instead of ripgrep

**Workflow**:
```bash
adv search "authentication"
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

## Contract Integration

All `/adv-*` commands that modify state integrate with the contract system:

1. **Before work**: Generate contract from `change.json`
2. **During work**: Update task status in `change.json`
3. **After work**: Validate via `adv change validate`
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

## CLI Integration Summary

| Slash Command | CLI Command |
|---------------|-------------|
| `/adv-proposal` | `adv change new` |
| `/adv-apply` | `adv task update` |
| `/adv-archive` | `adv change archive` |
| `/adv-status` | `adv status` |
| `/adv-validate` | `adv change validate` |
| `/adv-docs` | `adv docs preview/generate` |
| `/adv-migrate` | `adv migrate from-openspec` |
| `/adv-search` | `adv search` |

## Migration Path

1. **Phase 1**: Implement Go CLI with core commands
2. **Phase 2**: Create new `/adv-*` slash commands that call CLI
3. **Phase 3**: Deprecate `/openspec-*` commands with warning
4. **Phase 4**: Remove deprecated commands after migration period

During migration, both command sets work:
- `/openspec-*` — reads/writes markdown (legacy)
- `/adv-*` — reads/writes JSON (ADV)

The `adv migrate from-openspec` command handles the one-time conversion.
