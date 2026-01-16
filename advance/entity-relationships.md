# Entity Relationships

## Overview

This document describes the data model and relationships between entities in Advance (ADV).

## Entity Hierarchy

```
                        ┌─────────────────┐
                        │     Project     │
                        │  project.json   │
                        │   AGENTS.md     │
                        └────────┬────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
           ▼                     ▼                     ▼
    ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
    │    Spec     │       │    Spec     │       │   Change    │
    │  spec.json  │       │  spec.json  │       │   (dir)     │
    │   (LAW)     │       │   (LAW)     │       │  (proposal) │
    └──────┬──────┘       └─────────────┘       └──────┬──────┘
           │                                           │
     ┌─────┴─────┐              ┌──────────────────────┼──────────────────────┐
     │           │              │                      │                      │
     ▼           ▼              ▼                      ▼                      ▼
┌─────────┐ ┌─────────┐  ┌────────────┐         ┌───────────┐         ┌───────────┐
│   Req   │ │   Req   │  │   Tasks    │         │  Deltas   │         │   Prose   │
│rq-xxxxx │ │rq-xxxxx │  │ (in change │         │(in change │         │proposal.md│
│         │ │         │  │   .json)   │         │  .json)   │         │design.md  │
└────┬────┘ └─────────┘  └─────┬──────┘         └───────────┘         └───────────┘
     │                         │
┌────┴────┐              ┌─────┴─────┐
│         │              │           │
▼         ▼              ▼           ▼
┌──────┐ ┌──────┐   ┌────────┐ ┌────────┐
│ Scn  │ │ Scn  │   │  Task  │ │  Task  │
│.1    │ │.2    │   │tk-xxxx │ │tk-xxxx │
└──────┘ └──────┘   │blocked │ │blocked │
                    │   by   │ │   by   │
                    └────────┘ └────────┘
```

## Entity Definitions

### Project

The root container. Defines conventions and agent instructions.

| File | Purpose |
|------|---------|
| `project.json` | Project configuration, conventions |
| `AGENTS.md` | Instructions for AI agents (prose) |

### Spec (Law)

A capability specification containing enforced requirements. Lives in `specs/{capability}/spec.json`.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Capability identifier (e.g., `contract-system`) |
| `title` | string | Human-readable name |
| `purpose` | string | Description of capability |
| `version` | string | Semantic version |
| `updated_at` | ISO8601 | Last modification timestamp |
| `requirements` | array | List of requirements |

**Lifecycle**: Created when a change is archived. Immutable until modified by a new change.

### Requirement

A single behavioral requirement within a spec.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | NanoID (e.g., `rq-V1StGXR8`) |
| `title` | string | Requirement name |
| `body` | string | Full description (markdown allowed) |
| `priority` | enum | `must` / `should` / `may` (RFC 2119) |
| `tags` | array | Cross-cutting categories |
| `scenarios` | array | Given/When/Then test cases |

### Scenario

A testable case within a requirement. ID is hierarchical: `{parent-req-id}.{n}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Hierarchical (e.g., `rq-V1StGXR8.1`) |
| `title` | string | Scenario name |
| `given` | array | Preconditions |
| `when` | string | Trigger action |
| `then` | array | Expected outcomes |

### Change

A proposed modification to one or more specs. Lives in `changes/{change-id}/`.

| File | Purpose |
|------|---------|
| `proposal.md` | Why this change exists (prose) |
| `design.md` | Technical decisions (prose, optional) |
| `change.json` | Tasks + deltas (structured) |

**Lifecycle**: Active → Archived (when complete) → Deltas applied to specs

### Task

A unit of work within a change. Stored in `change.json`.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | NanoID (e.g., `tk-Hf7dK2mN`) |
| `title` | string | Task description |
| `section` | string | Grouping label (optional) |
| `status` | enum | `pending` / `in_progress` / `done` / `cancelled` |
| `priority` | int | Lower = higher priority |
| `deps` | array | Typed dependencies |
| `created_at` | ISO8601 | Creation timestamp |
| `started_at` | ISO8601 | When work began (nullable) |
| `completed_at` | ISO8601 | When finished (nullable) |
| `completed_by` | string | Agent/user identifier (nullable) |

### Delta

A mutation to be applied to a spec at archive time. Stored in `change.json`.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | NanoID (e.g., `dl-Xt5zW3vB`) |
| `operation` | enum | `add` / `modify` / `remove` |
| `requirement` | object | Full requirement (for `add`) |
| `target_id` | string | Requirement ID (for `modify`/`remove`) |
| `changes` | object | Fields to update (for `modify`) |
| `reason` | string | Justification (for `remove`) |

## Relationship Types

### Task Dependencies

Tasks form a DAG (Directed Acyclic Graph) via typed dependencies:

| Type | Meaning | Effect |
|------|---------|--------|
| `blocked_by` | Cannot start until target completes | Blocks `task ready` |
| `related` | Informational link | No blocking |
| `discovered_from` | Found while working on target | Provenance tracking |
| `parent` | Hierarchical containment | Rollup queries |

### Spec ↔ Change Relationship

```
┌─────────────────────────────────────────────────────────────────┐
│                     CHANGE LIFECYCLE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   changes/{id}/              archive/{date}-{id}/    specs/     │
│   ┌─────────────┐           ┌─────────────┐       ┌──────────┐  │
│   │ change.json │  archive  │ change.json │ apply │ spec.json│  │
│   │  (deltas)   │ ────────▶ │  (frozen)   │ ────▶ │  (LAW)   │  │
│   └─────────────┘           └─────────────┘       └──────────┘  │
│         │                                              │         │
│         │                                              │         │
│         └──────────── validate against ────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

- **Active change**: Deltas are proposals, can be modified
- **Archived change**: Frozen snapshot, deltas applied to specs
- **Spec (law)**: Enforced requirements, validated against new changes

## Cross-Entity Queries

### Ready Tasks Query

Find tasks that can be started (no pending blockers):

```sql
SELECT t.* FROM tasks t
WHERE t.status = 'pending'
  AND t.change_id = ?
  AND NOT EXISTS (
    SELECT 1 FROM deps d
    JOIN tasks blocker ON d.target_id = blocker.id
    WHERE d.source_id = t.id
      AND d.dep_type = 'blocked_by'
      AND blocker.status NOT IN ('done', 'cancelled')
  )
ORDER BY t.priority, t.created_at;
```

### Impact Analysis Query

Find requirements affected by modifying a given requirement:

```sql
-- Find scenarios that reference this requirement
SELECT s.* FROM scenarios s
WHERE s.requirement_id = ?;

-- Find other requirements in same spec
SELECT r.* FROM requirements r
WHERE r.spec_id = (SELECT spec_id FROM requirements WHERE id = ?);

-- Find pending deltas targeting this requirement
SELECT d.* FROM deltas d
WHERE d.target_id = ?
  AND d.change_id IN (SELECT id FROM changes WHERE status = 'active');
```

### Cross-Spec Search

Full-text search across all requirements:

```sql
SELECT r.id, r.title, r.spec_id, snippet(requirements_fts, 2, '<b>', '</b>', '...', 32) as match
FROM requirements_fts
WHERE requirements_fts MATCH ?
ORDER BY rank;
```
