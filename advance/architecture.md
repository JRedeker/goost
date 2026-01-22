# Advance (ADV) Architecture

This document provides a high-level overview of the Advance system architecture.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ADVANCE (ADV)                                   │
│                    Spec-Driven Development System                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         USER INTERFACE                                │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │   │
│  │   │   AI Agent  │    │    User     │    │      CI/CD Pipeline     │  │   │
│  │   │  (OpenCode) │    │   (Human)   │    │       (Automation)      │  │   │
│  │   └──────┬──────┘    └──────┬──────┘    └────────────┬────────────┘  │   │
│  │          │                  │                        │               │   │
│  └──────────┼──────────────────┼────────────────────────┼───────────────┘   │
│             │                  │                        │                    │
│             ▼                  ▼                        ▼                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      INTERACTION LAYER                                │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │   ┌─────────────┐    ┌───────────────────────────────────────────┐   │   │
│  │   │   Slash     │    │         TypeScript Plugin (Primary)       │   │   │
│  │   │  Commands   │───▶│                                           │   │   │
│  │   │   (.md)     │    │  ┌─────────┐ ┌─────────┐ ┌─────────────┐  │   │   │
│  │   └─────────────┘    │  │AI Tools │ │ Storage │ │  Terminal   │  │   │   │
│  │                      │  │ tool()  │ │ SQLite  │ │  Tab/Title  │  │   │   │
│  │   ┌─────────────┐    │  └─────────┘ └─────────┘ └─────────────┘  │   │   │
│  │   │ CLI Wrapper │    │                                           │   │   │
│  │   │ (Optional)  │───▶│  Tools: adv_spec_*, adv_change_*,        │   │   │
│  │   │             │    │         adv_task_*, adv_status            │   │   │
│  │   └─────────────┘    └───────────────────────────────────────────┘   │   │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                       OUTPUT LAYER                                    │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │   │
│  │   │  Generated  │    │   Terminal  │    │      Git History        │  │   │
│  │   │    Docs     │    │  Tab/Title  │    │    (Audit Trail)        │  │   │
│  │   │ docs/specs/ │    │   Colors    │    │                         │  │   │
│  │   └─────────────┘    └─────────────┘    └─────────────────────────┘  │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Principles

### 1. Specs as Laws

Requirements in `specs/` are not just documentation — they're enforced:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Proposal   │     │   Change    │     │    Spec     │
│             │────▶│             │────▶│   (LAW)     │
│ proposal.md │     │ change.json │     │  spec.json  │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                   │
                    validate against ◀─────────┘
```

- New changes are validated against existing specs
- Conflicts and contradictions are detected before implementation
- Removal of requirements requires explicit justification

### 2. Hybrid Storage

| Content Type | Format | Rationale |
|--------------|--------|-----------|
| Structured data | JSON | Queryable, typed, no parsing fragility |
| Prose content | Markdown | Human-readable, rich formatting |
| Derived views | SQLite | Fast queries, FTS, cross-references |
| Documentation | Generated MD | Always in sync, human-browsable |

### 3. Single Source of Truth

```
JSON Files (Git-tracked)
        │
        │ authoritative
        ▼
   ┌─────────┐
   │ SQLite  │◀── derived, regeneratable
   └─────────┘
        │
        │ derived
        ▼
   ┌─────────┐
   │  Docs   │◀── generated on archive
   └─────────┘
```

## Data Flow

### Change Lifecycle

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         CHANGE LIFECYCLE                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. CREATE            2. DEVELOP           3. VALIDATE        4. ARCHIVE │
│  ┌─────────┐         ┌─────────┐          ┌─────────┐        ┌─────────┐ │
│  │ change  │         │  tasks  │          │  check  │        │  apply  │ │
│  │ create  │────────▶│  work   │─────────▶│  specs  │───────▶│ deltas  │ │
│  │         │         │         │          │         │        │         │ │
│  └─────────┘         └─────────┘          └─────────┘        └─────────┘ │
│       │                   │                    │                  │      │
│       ▼                   ▼                    ▼                  ▼      │
│  ┌─────────┐         ┌─────────┐          ┌─────────┐        ┌─────────┐ │
│  │proposal │         │ change  │          │conflicts│        │spec.json│ │
│  │.md      │         │ .json   │          │warnings │        │  +docs  │ │
│  │design.md│         │(updated)│          │         │        │+archive │ │
│  └─────────┘         └─────────┘          └─────────┘        └─────────┘ │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Query Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       QUERY FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   CLI Command                                                    │
│       │                                                          │
│       ▼                                                          │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              Freshness Check                             │   │
│   │   Is any JSON file newer than SQLite last_modified?      │   │
│   └────────────────────────┬────────────────────────────────┘   │
│                            │                                     │
│              ┌─────────────┴─────────────┐                      │
│              │                           │                      │
│              ▼                           ▼                      │
│         ┌────────┐                  ┌────────┐                  │
│         │  Yes   │                  │   No   │                  │
│         └───┬────┘                  └───┬────┘                  │
│             │                           │                       │
│             ▼                           │                       │
│   ┌─────────────────┐                   │                       │
│   │  Auto-Import    │                   │                       │
│   │  JSON → SQLite  │                   │                       │
│   │    (~10ms)      │                   │                       │
│   └────────┬────────┘                   │                       │
│            │                            │                       │
│            └──────────┬─────────────────┘                       │
│                       │                                          │
│                       ▼                                          │
│            ┌─────────────────┐                                   │
│            │  Execute Query  │                                   │
│            │    (SQLite)     │                                   │
│            └────────┬────────┘                                   │
│                     │                                            │
│                     ▼                                            │
│            ┌─────────────────┐                                   │
│            │  Return Result  │                                   │
│            └─────────────────┘                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### TypeScript Plugin (Primary)

```
┌─────────────────────────────────────────────────────────────────┐
│                    TYPESCRIPT PLUGIN                             │
│                    (Primary Interface)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   AI Tools (tool())                      │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │ adv_spec_list    → List capabilities with filtering     │   │
│   │ adv_spec_show    → Get spec details by ID               │   │
│   │ adv_spec_search  → Full-text search (FTS5)              │   │
│   │ adv_change_*     → Create, validate, archive changes    │   │
│   │ adv_task_*       → List, ready, update tasks            │   │
│   │ adv_status       → Project status overview              │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   Storage Layer                          │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │ JSON R/W        → Read/write spec.json, change.json     │   │
│   │ SQLite          → bun:sqlite for fast queries           │   │
│   │ Auto-sync       → JSON → SQLite on modification         │   │
│   │ FTS5            → Full-text search across specs         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   Validation Engine                      │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │ Schema validation  → Zod schemas for all JSON           │   │
│   │ Conflict detection → Contradicting requirements         │   │
│   │ Dependency cycles  → Task blocking validation           │   │
│   │ Completeness       → Missing scenarios, acceptance      │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   Event Handlers                         │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │ onMessage    → Detect status markers, update state       │   │
│   │ onResponse   → Track contract progress                   │   │
│   │ onToolResult → Monitor sub-agent completion              │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   Terminal Control                       │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │ Tab colors   → Green (complete), Yellow (active), etc.  │   │
│   │ Tab title    → Contract status indicator                │   │
│   │ OSC escapes  → Cross-terminal compatibility             │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### CLI Wrapper (Optional)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLI WRAPPER (Optional)                        │
│              For CI/CD and human debugging                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Built with: bun build --compile                                │
│   Uses: Same core library as plugin                              │
│                                                                  │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│   │   Commands  │  │   Output    │  │      Use Cases          │ │
│   ├─────────────┤  ├─────────────┤  ├─────────────────────────┤ │
│   │ adv status  │  │ --json      │  │ CI/CD pipelines         │ │
│   │ adv validate│  │ --table     │  │ Human debugging         │ │
│   │ adv export  │  │ --quiet     │  │ Scripting               │ │
│   └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## File System Layout

```
project/
├── AGENTS.md                      # Agent instructions (prose)
├── project.json                   # Project configuration
│
├── specs/                         # THE LAW — enforced requirements
│   ├── auth/
│   │   └── spec.json
│   └── contract-system/
│       └── spec.json
│
├── changes/                       # Active proposals
│   └── add-feature/
│       ├── proposal.md            # Why (prose)
│       ├── design.md              # How (prose, optional)
│       └── change.json            # Tasks + deltas (structured)
│
├── archive/                       # Completed changes (frozen)
│   └── 2026-01-15-add-feature/
│       ├── proposal.md
│       ├── design.md
│       └── change.json
│
├── docs/                          # Generated documentation
│   └── specs/
│       ├── index.md               # Table of contents
│       ├── auth.md                # Generated from spec.json
│       └── contract-system.md
│
└── .specdb/                       # Derived (not committed)
    └── spec.db                    # SQLite cache
```

## Integration Points

### Git Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                      GIT WORKFLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   main ──────────────────────────────────────────────────────▶  │
│         │                                         │              │
│         │ /spec-prep                              │ /spec-archive│
│         │ (creates branch)                        │ (squash)     │
│         ▼                                         │              │
│   spec/add-feature ──────────────────────────────▶┘              │
│         │                                                        │
│         │  • change.json updates                                 │
│         │  • Implementation work                                 │
│         │  • Task status changes                                 │
│                                                                  │
│   Archive commit includes:                                       │
│   • spec.json updates (deltas applied)                          │
│   • docs/specs/*.md regenerated                                  │
│   • change moved to archive/                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### OpenCode Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                   OPENCODE INTEGRATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User: /adv-apply add-feature                                   │
│         │                                                        │
│         ▼                                                        │
│   ┌─────────────────┐                                            │
│   │  Slash Command  │  Invokes plugin tools directly             │
│   │  (Markdown)     │  Displays contract                         │
│   └────────┬────────┘  Guides implementation                     │
│            │                                                     │
│            ▼                                                     │
│   ┌─────────────────┐                                            │
│   │   Plugin Tools  │  adv_change_show → load change             │
│   │   (In-process)  │  adv_task_ready → get unblocked tasks      │
│   │                 │  adv_task_update → mark complete           │
│   │                 │  adv_change_validate → check specs         │
│   └────────┬────────┘                                            │
│            │                                                     │
│            ▼                                                     │
│   ┌─────────────────┐                                            │
│   │  Event Handlers │  Detects [ADV:*] markers                   │
│   │  + Terminal UI  │  Updates tab color/title                   │
│   └─────────────────┘  Tracks contract progress                  │
│                                                                  │
│   Key advantage: No subprocess overhead, session context         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY MODEL                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Trust Boundaries:                                              │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  TRUSTED: Local File System                              │   │
│   │                                                          │   │
│   │  • specs/*.json      (laws, validated)                   │   │
│   │  • changes/*.json    (proposals, validated)              │   │
│   │  • .specdb/spec.db   (derived, regeneratable)            │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  VALIDATED: User Input                                   │   │
│   │                                                          │   │
│   │  • JSON schema validation on all writes                  │   │
│   │  • NanoID prevents predictable IDs                       │   │
│   │  • Spec validation prevents contradictions               │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  AUDIT: Git History                                      │   │
│   │                                                          │   │
│   │  • All changes tracked                                   │   │
│   │  • Timestamps on all entities                            │   │
│   │  • discovered_from provides provenance                   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Performance Characteristics

| Operation | Complexity | Typical Time |
|-----------|------------|--------------|
| Freshness check | O(1) | <1ms |
| Full re-import | O(n specs + m changes) | ~50ms for 100 specs |
| Ready tasks query | O(1) indexed | <1ms |
| FTS search | O(log n) | <5ms |
| Cross-spec validation | O(n) with index | <10ms |
| Archive operation | O(affected specs) | <100ms |

## Failure Modes & Recovery

| Failure | Detection | Recovery |
|---------|-----------|----------|
| SQLite corruption | Query error | `db rebuild` from JSON |
| JSON parse error | Schema validation | Manual fix, re-validate |
| Merge conflict | Git status | Resolve conflict, re-sync |
| Orphaned scenario | Validation | Add missing requirement |
| Circular dependency | Validation | Remove cycle |

## Related Documents

- [proposal.md](proposal.md) — Core concepts and design decisions
- [schemas.md](schemas.md) — JSON schema definitions
- [sqlite-cache.md](sqlite-cache.md) — Cache architecture and queries
- [cli-reference.md](cli-reference.md) — Command-line interface
- [tooling.md](tooling.md) — Component implementation details
- [entity-relationships.md](entity-relationships.md) — Data model
- [multi-capability-changes.md](multi-capability-changes.md) — Cross-spec changes
