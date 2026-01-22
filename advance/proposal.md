# Proposal: Advance (ADV) — Specs as Laws

## Summary

An optimized spec-driven development system using **hybrid storage** where:
- **JSON** stores all structured data (specs, tasks, deltas) with SQLite caching for fast queries
- **Markdown** stores prose content (proposals, designs) for human readability
- **Specs become laws** — requirements are enforced during change validation, not just documented

This builds on the original hybrid storage proposal with key optimizations informed by Beads' production-tested patterns.

## Motivation

### Why Upgrade from the Original Proposal?

The original proposal established the JSON/Markdown split. This v2 proposal adds:

1. **Specs as Laws**: Requirements aren't just documentation — they're enforced during change validation
2. **Typed Dependencies**: Four dependency types (blocked_by, related, discovered_from, parent) enable richer queries
3. **SQLite Cache**: Fast queries without parsing JSON files on every operation
4. **Hierarchical Scenario IDs**: Scenarios nested under requirements (rq-a1b2.1, rq-a1b2.2)
5. **Audit Trail**: Timestamps and actor tracking for all state changes
6. **Unified change.json**: Tasks and deltas in one file per change (simpler than separate files)

### The "Specs as Laws" Concept

```
┌─────────────────────────────────────────────────────────────────┐
│                        LIFECYCLE                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   PROPOSAL          CHANGE              SPEC (LAW)               │
│   ┌─────────┐      ┌─────────┐         ┌─────────┐              │
│   │proposal │ ──▶  │change   │  ──▶    │spec     │              │
│   │.md      │      │.json    │ archive │.json    │              │
│   └─────────┘      └─────────┘         └─────────┘              │
│                         │                    │                   │
│                         │                    │                   │
│                    ┌────┴────┐          ┌────┴────┐             │
│                    │ tasks   │          │ enforce │             │
│                    │ deltas  │          │ validate│             │
│                    └─────────┘          └─────────┘             │
│                                              ▲                   │
│                                              │                   │
│                    NEW PROPOSAL ─────────────┘                   │
│                    (checked against laws)                        │
└─────────────────────────────────────────────────────────────────┘
```

When creating a new change, the system validates deltas against existing specs:
- Detect conflicts with existing requirements
- Warn when modifying or removing established behavior
- Ensure new requirements don't contradict existing laws

## Design

### Directory Structure

```
project/
├── AGENTS.md                           # Instructions (prose)
├── project.json                        # Project config + conventions
├── specs/
│   └── {capability}/
│       └── spec.json                   # THE LAW — enforced requirements
├── changes/
│   └── {change-id}/
│       ├── proposal.md                 # Why (prose)
│       ├── design.md                   # How (prose, optional)
│       └── change.json                 # Tasks + deltas + metadata
├── archive/
│   └── {date}-{change-id}/
│       └── ... (frozen snapshot)
├── docs/
│   └── specs/
│       ├── index.md                    # Generated table of contents
│       └── {capability}.md             # Generated markdown (human-readable)
└── .specdb/
    └── spec.db                         # SQLite cache (derived, not committed)
```

### Generated Documentation

When requirements become law (via archive), the system auto-generates human-readable markdown documentation:

```
docs/specs/
├── index.md                # Auto-generated table of contents
├── contract-system.md      # Generated from specs/contract-system/spec.json
└── slash-commands.md       # Generated from specs/slash-commands/spec.json
```

**Benefits**:
- Documentation always in sync with specs (generated, not manually maintained)
- GitHub/GitLab renders `docs/` beautifully for browsing
- Source of truth remains JSON (structured, queryable)
- PR reviews can reference generated docs for human context

**Generation Workflow: Archive + Preview**

| Command | When | Commits? | Use Case |
|---------|------|----------|----------|
| `spec docs preview <change>` | During development | No | See what docs will look like |
| `spec docs preview --diff` | During development | No | See changes from current docs |
| `change archive <id>` | At archive time | Yes | Commits docs with spec changes |

```bash
# During development (preview only, outputs to stdout or temp):
spec docs preview add-feature      # Render proposed docs
spec docs preview --diff           # Show diff from current docs

# At archive time (committed atomically with spec changes):
change archive add-feature
# → Applies deltas to spec.json
# → Regenerates docs/specs/{affected}.md
# → Updates docs/specs/index.md
# → Single commit with all changes
```

**Why Preview + Archive (not continuous generation)**:
- Docs in `docs/specs/` always match archived (law) state
- No stale docs from abandoned changes
- Preview enables review without polluting git history
- CI can generate preview for PR review comments

**Generated Doc Format**:

```markdown
# Contract System

> Defines the immutable contract enforcement mechanism for AI agent task completion.

**Version**: 1.2.0 | **Updated**: 2026-01-15

## Requirements

### Contract Completion Commit (rq-V1StGXR8)

When a contract is fulfilled (all criteria verified), the agent SHALL create...

**Priority**: MUST

#### Scenarios

1. **With valid TDD evidence** (rq-V1StGXR8.1)
   - **Given**: all criteria are marked [x], valid Red Phase evidence provided...
   - **When**: agent declares CONTRACT FULFILLED
   - **Then**: agent creates atomic git commit...

2. **Without test evidence** (rq-V1StGXR8.2)
   ...
```

### Key Changes from v1

| Aspect | v1 Proposal | v2 Proposal |
|--------|-------------|-------------|
| Task storage | `tasks.json` separate | Unified in `change.json` |
| Delta storage | `deltas/{cap}.json` | Unified in `change.json` |
| Dependencies | `blocked_by` array | Typed deps with 4 types |
| Scenario IDs | `sc-xxxx` flat | Hierarchical `rq-xxxx.1` |
| Query performance | Parse JSON | SQLite cache |
| Spec enforcement | None | Validation on change creation |
| Timestamps | None | Full audit trail |

## Schema Definitions

See **[schemas.md](schemas.md)** for complete JSON schema definitions.

**Key files**:
- `specs/{capability}/spec.json` — Living requirements (laws)
- `changes/{id}/change.json` — Tasks + deltas (proposals)

**ID Format**: `{prefix}-{nanoid(8)}` (e.g., `rq-V1StGXR8`, `tk-Hf7dK2mN`)

**Dependency Types**:
| Type | Meaning |
|------|---------|
| `blocked_by` | Cannot start until target completes |
| `related` | Informational link, no blocking |
| `discovered_from` | Found while working on target |
| `parent` | Hierarchical containment |

## SQLite Cache Architecture

See **[sqlite-cache.md](sqlite-cache.md)** for complete cache documentation.

**Key points**:
- SQLite is **essential** for "specs as laws" validation (cross-spec queries)
- **On-demand sync** — no daemon; sync on every CLI command if JSON is newer
- JSON files are source of truth; SQLite is derived and regeneratable
- FTS5 enables full-text search across requirements

## CLI Commands

See **[cli-reference.md](cli-reference.md)** for complete CLI documentation.

**Core commands**:
```bash
spec list                 # List capabilities
spec search "auth"        # Full-text search
change validate <id>      # Validate against specs (laws)
task ready <change>       # Get unblocked tasks
change archive <id>       # Apply deltas, generate docs
```

## Git Branch Workflow

All spec changes require a dedicated git branch, created at prep time and merged at archive time.

### Why Branches?

1. **Cleaner diffs**: Incremental JSON edits happen on feature branch; main sees a single squashed commit
2. **Multi-agent safety**: Each agent works on own branch, no concurrent edit conflicts
3. **PR review**: Complete change visible in one PR, not scattered commits
4. **Rollback**: Easy to abandon a change by deleting the branch

### Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     BRANCH LIFECYCLE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   main ─────────────────────────────────────────────────────▶   │
│         │                                           │            │
│         │ /spec-prep                                │ /spec-archive
│         │ creates branch                            │ merges back │
│         ▼                                           │            │
│   spec/add-feature ──────────────────────────────▶──┘            │
│         │                                                        │
│         │ work happens here                                      │
│         │ (tasks, implementation, review)                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Branch Naming

```
spec/{change-id}          # e.g., spec/add-parallel-coordination
```

### Commands

```bash
# At end of /spec-prep (after validation passes):
git checkout -b spec/{change-id}
git push -u origin spec/{change-id}

# During work:
# All commits happen on spec/{change-id} branch

# At archive time:
git checkout main
git merge --squash spec/{change-id}
git commit -m "feat: {change title} (archived {change-id})"
git branch -d spec/{change-id}
git push origin --delete spec/{change-id}
```

### Multi-Agent Coordination

When multiple agents work on different changes:
- Each agent has own branch (`spec/feature-a`, `spec/feature-b`)
- No conflicts during development
- Conflicts only possible at merge time (rare with hash IDs)
- `change validate` checks for conflicts before archive

## Validation: Specs as Laws

### Conflict Detection

When validating a change, the system checks:

1. **Modification conflicts**: Does the delta modify a requirement that other requirements depend on?
2. **Removal conflicts**: Does the delta remove a requirement referenced by scenarios?
3. **Contradiction detection**: Does a new requirement contradict an existing one?
4. **Coverage gaps**: Does removing a requirement leave scenarios without coverage?

### Validation Rules

```yaml
rules:
  - name: no_orphaned_scenarios
    description: Every scenario must belong to an existing requirement
    severity: error
    
  - name: no_contradicting_requirements
    description: New requirements must not contradict existing MUST requirements
    severity: error
    
  - name: modification_impact_warning
    description: Warn when modifying requirements with downstream dependencies
    severity: warning
    
  - name: removal_requires_reason
    description: Removing a requirement requires a reason field
    severity: error
```

### Example Validation Flow

```
$ change validate add-breaking-change

Phase 1: Schema Validation
  ✓ change.json valid against schema
  ✓ All referenced specs exist

Phase 2: Dependency Analysis
  ✓ No circular dependencies in tasks
  ✓ All blocked_by targets exist

Phase 3: Spec Law Enforcement
  ⚠ WARNING: Delta modifies rq-commit-001
    - 5 scenarios reference this requirement
    - 2 other requirements depend on this behavior
    - Recommend: Review downstream impact
    
  ✗ ERROR: Delta removes rq-tdd-001 without migration
    - This is a MUST requirement (law)
    - 3 scenarios will become orphaned
    - Required: Add migration plan or keep requirement

Phase 4: Contradiction Check
  ✓ No contradictions with existing requirements

Result: FAILED (1 error, 1 warning)
```

## Archive Operation

When archiving a completed change:

1. **Pre-flight checks**:
   - All tasks in `change.json` have `status: done` or `cancelled`
   - `change validate <id>` passes
   
2. **Apply deltas**:
   - For each delta in `change.json`:
     - `add` → Insert requirement into `specs/{capability}/spec.json`
     - `modify` → Update requirement fields
     - `remove` → Remove requirement (with audit note)
   - Increment spec `version`
   - Update spec `updated_at`

3. **Generate documentation**:
   - Regenerate `docs/specs/{capability}.md` for each affected capability
   - Update `docs/specs/index.md` table of contents
   - Documentation stays in sync automatically

4. **Archive change**:
   - Move `changes/{id}/` → `archive/{YYYY-MM-DD}-{id}/`
   - Update SQLite cache

5. **Verify**:
   - Run `spec validate` on affected specs
   - Ensure no broken references

6. **Commit atomically**:
   - Single commit includes: spec.json updates + generated docs + archived change

## Migration from OpenSpec

For projects using the current OpenSpec markdown format:

```bash
# One-time migration
spec migrate from-openspec ./openspec/

# This will:
# 1. Parse specs/*.md files
# 2. Extract requirements and scenarios
# 3. Generate spec.json files
# 4. Parse changes/*/*.md files
# 5. Generate change.json files
# 6. Validate the migration
# 7. Optionally remove old .md files
```

The migration preserves:
- All requirement text (in `body` field)
- All scenarios (converted to structured format)
- Task lists (with dependencies inferred from ordering)
- Proposal and design files (kept as markdown)

## Benefits Summary

### For AI Agents

| Problem | Solution |
|---------|----------|
| Parsing task status | Read `status` field directly |
| Finding ready tasks | `task ready` query (SQLite indexed) |
| Task dependencies | Explicit typed `deps` array |
| Concurrent edits | Hash IDs prevent collisions |
| Requirement structure | Structured JSON, no regex |
| Scenario extraction | Array fields, no parsing |
| Cross-spec queries | SQLite joins |
| Impact analysis | Dependency graph queries |

### For Governance

| Problem | Solution |
|---------|----------|
| Requirements drift | Specs are validated laws |
| Breaking changes | Validation catches conflicts |
| Audit trail | Timestamps on all changes |
| Traceability | `discovered_from` deps |

### For Performance

| Operation | Before (JSON parse) | After (SQLite) |
|-----------|---------------------|----------------|
| Ready tasks | O(n) scan | O(1) indexed |
| Cross-spec search | O(n*m) | O(log n) |
| Dependency check | O(n) | O(1) |

## AI-Agent Workflow Model

### Prose in JSON is Not a Problem

Requirement bodies contain markdown, but this is **not painful** in an AI-first workflow:

1. **Users don't edit JSON directly** — they work with AI agents via natural language
2. **AI agents read/write JSON natively** — no parsing friction
3. **AI reformats on the fly** — displays bodies as formatted markdown, accepts prose input
4. **Generated docs provide human view** — `docs/specs/*.md` for reading

### Flexibility via Change Lifecycle

Nothing is permanent until archived:

| Stage | Flexibility | What Can Change |
|-------|-------------|-----------------|
| Proposal | High | Everything — brainstorming phase |
| Change (active) | Medium | Tasks, deltas, design — refine as you learn |
| Archive | Low | Only via new change proposal |
| Spec (law) | Enforced | Must propose change to modify |

**Escape hatch**: Void the change before archive if requirements need rethinking.

### When Requirements Become Law

Requirements are created **only at archive time**:
1. Deltas in `change.json` are proposals (mutable)
2. `change archive` applies deltas → requirements in `spec.json`
3. Requirements are now laws (validated against future changes)

This mirrors current OpenSpec: specs in `changes/` are proposals, specs in `specs/` are truth.

## Tooling Architecture

See **[tooling.md](tooling.md)** for complete tooling documentation.

**Components**:
| Component | Implementation | Responsibility |
|-----------|----------------|----------------|
| **CLI** | Go binary | Spec/change/task management, SQLite, validation |
| **Plugin** | TypeScript | Terminal integration, status detection |
| **Instructions** | Markdown | TDD protocol, contract enforcement |
| **Slash Commands** | Markdown | User-invokable workflows |

**Installation**:
```bash
curl -fsSL https://advance.dev/install.sh | bash
```

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| SQLite corruption | Regenerate from JSON (source of truth) |
| JSON merge conflicts | Hash IDs + branch workflow eliminate conflicts |
| Migration complexity | Automated migration tool; incremental adoption possible |
| Learning curve | CLI provides human-friendly interface; AI handles JSON |
| Markdown in body field | AI reformats; generated docs for humans |
| GitHub rendering | Generated `docs/specs/*.md` for browsing |
| Git diff noise | Branch workflow: squash merge shows clean diff |

## Open Questions

### Resolved

1. ~~**Human editability**~~: Resolved — AI agents handle JSON; generated docs for humans
2. ~~**GitHub rendering**~~: Resolved — `docs/specs/*.md` generated on archive
3. ~~**Git diff noise**~~: Resolved — branch workflow with squash merge
4. ~~**Prose in JSON**~~: Resolved — AI reformats; not user-facing
5. ~~**Tooling independence**~~: Resolved — bundled installer, purpose-built for OpenCode
6. ~~**Hash ID collision risk**~~: Resolved — Use NanoID(8) instead of 4-char truncated hash
7. ~~**Schema versioning**~~: Resolved — Backwards-compatible additions only; `additionalProperties: true` in schemas; `$schema` URI bump for breaking changes
8. ~~**Daemon architecture**~~: Resolved — No daemon; on-demand sync on every command (Beads-proven pattern)
9. ~~**SQLite essential vs optional**~~: Resolved — Essential for "specs as laws" cross-spec validation; include from day 1
10. ~~**Generated docs timing**~~: Resolved — Archive + preview workflow; docs committed only when requirements become law

### Open

1. **Compaction**: Should old archived changes be compacted/summarized?
   - Beads does "memory decay" for old issues
   - May not be needed if archive is sufficient
   
2. **MCP server scope**: What should be exposed via MCP?
   - Spec queries for external tools?
   - Task status for dashboards?
   - Or keep it CLI-only initially?

3. **Contradiction detection**: How sophisticated should the "specs as laws" validation be?
   - Simple: Check for removed requirements with references
   - Medium: Semantic overlap detection
   - Advanced: LLM-assisted contradiction checking

## Research Validation (January 2026)

Architecture validated via `/openspec-research` with 8 sub-agents:

| Decision | Result | Notes |
|----------|--------|-------|
| SQLite as cache | ✅ Validated | Beads-proven; WAL mode correct; **defer to v2.1** |
| JSON source of truth | ✅ Validated | Industry standard |
| 4 dependency types | ✅ Validated | Beads uses identical types |
| Per-project daemon | ✅ Validated | LSP architecture; **defer daemon, use on-demand sync** |
| Git branch workflow | ✅ Validated | GitHub Flow aligns; optional best practice |
| FTS5 for search | ✅ Validated | Appropriate for spec corpus |
| Hash-based IDs | ❌ **Changed** | 4-char was broken; now using NanoID(8) |
| Schema versioning | ✅ Validated | Additive-only is sufficient |

### MVP Scope (v2.0)

Based on research and refinement:

**Include in MVP**:
- ✅ **JSON specs + changes** — Core value proposition
- ✅ **SQLite cache** — Essential for "specs as laws" validation (cross-spec queries)
- ✅ **On-demand sync** — No daemon; sync on command invocation
- ✅ **Go CLI** — `spec`, `change`, `task`, `db` commands
- ✅ **8-char NanoID** — Collision-resistant IDs
- ✅ **4 dependency types** — All solve real problems
- ✅ **Generated docs** — Archive + preview workflow
- ✅ **TypeScript plugin** — Terminal integration (exists)
- ✅ **Slash commands** — User workflows (adapted from current)
- ✅ **Refactor command** — `/adv-refactor` for stale proposal reconciliation
- ✅ **Condensed instructions** — Terse format (tables, bullets, inline code)

**Defer to v2.1+**:
- ⏸️ **Daemon** — On-demand sync is sufficient initially
- ⏸️ **MCP server** — External tool integration
- ⏸️ **Branch workflow enforcement** — Document as best practice
- ⏸️ **Advanced contradiction detection** — LLM-assisted validation

## Goost v1 Learnings (January 2026)

Additional patterns validated during Goost development:

| Learning | Implication |
|----------|-------------|
| Instructions can be condensed 72% | Use terse format: tables, bullet points, inline code |
| Refactor command needed | Add `/adv-refactor` for Bidirectional Reconciliation of stale proposals |
| P25 related-scan rule | When fixing bugs, scan for sibling patterns |
| Question tool auto-detection | Plugin should detect MCP question calls for MIC state |
| Permission hooks needed | Track approval states via `permission.ask` hook |

## References

- [Beads: A memory upgrade for your coding agent](https://github.com/steveyegge/beads) — State-file pattern, hash-based IDs, SQLite cache, typed dependencies
- [OpenSpec](https://github.com/openspec-dev/openspec) — Spec-driven development workflow, delta operations
- [Original Hybrid Storage Proposal](./jsonl-storage-proposal.md) — Foundation for this design
- [JSON Schema](https://json-schema.org/) — For spec.json validation
- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) — MUST/SHOULD/MAY requirement levels
