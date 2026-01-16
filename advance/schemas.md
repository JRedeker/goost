# JSON Schema Definitions

This document defines the JSON schemas for Advance (ADV) structured data files.

## Overview

| File | Schema | Purpose |
|------|--------|---------|
| `specs/{capability}/spec.json` | `spec.v1.json` | Living requirements (laws) |
| `changes/{id}/change.json` | `change.v1.json` | Tasks + deltas (proposals) |

## specs/{capability}/spec.json

The spec file contains enforced requirements for a capability.

```json
{
  "$schema": "https://advance.dev/schemas/spec.v1.json",
  "name": "contract-system",
  "title": "Contract System",
  "purpose": "Defines the immutable contract enforcement mechanism for AI agent task completion.",
  "version": "1.2.0",
  "updated_at": "2026-01-15T10:00:00Z",
  
  "requirements": [
    {
      "id": "rq-V1StGXR8",
      "title": "Contract Completion Commit",
      "body": "When a contract is fulfilled (all criteria verified), the agent SHALL create an atomic git commit.\n\nThe commit MUST:\n- Include all staged changes\n- Use conventional commit message\n- **PROHIBITED**: No commit without Red/Green evidence.",
      "priority": "must",
      "tags": ["commit", "tdd"],
      
      "scenarios": [
        {
          "id": "rq-V1StGXR8.1",
          "title": "With valid TDD evidence",
          "given": [
            "all criteria are marked [x]",
            "valid Red Phase evidence provided",
            "valid Green Phase evidence provided"
          ],
          "when": "agent declares CONTRACT FULFILLED",
          "then": [
            "agent creates atomic git commit",
            "commit message follows conventional standards"
          ]
        },
        {
          "id": "rq-V1StGXR8.2",
          "title": "Without test evidence",
          "given": [
            "all criteria are marked [x]",
            "no test execution evidence in session"
          ],
          "when": "agent attempts CONTRACT FULFILLED",
          "then": [
            "fulfillment is blocked",
            "agent prompts user to run tests"
          ]
        }
      ]
    }
  ]
}
```

### Spec Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `$schema` | string | Yes | Schema URI for validation |
| `name` | string | Yes | Capability identifier (kebab-case) |
| `title` | string | Yes | Human-readable name |
| `purpose` | string | Yes | Description of capability |
| `version` | string | Yes | Semantic version (incremented on changes) |
| `updated_at` | ISO8601 | Yes | Last modification timestamp |
| `requirements` | array | Yes | List of requirements |

### Requirement Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | NanoID (e.g., `rq-V1StGXR8`) |
| `title` | string | Yes | Requirement name |
| `body` | string | Yes | Full description (markdown allowed) |
| `priority` | enum | Yes | `must` / `should` / `may` (RFC 2119) |
| `tags` | array | No | Cross-cutting categories |
| `scenarios` | array | No | Given/When/Then test cases |

### Scenario Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Hierarchical ID (e.g., `rq-V1StGXR8.1`) |
| `title` | string | Yes | Scenario name |
| `given` | array | Yes | Preconditions (strings) |
| `when` | string | Yes | Trigger action |
| `then` | array | Yes | Expected outcomes (strings) |

### Design Decisions

- **`body` contains markdown**: Lists, tables, code blocks are allowed. This is the one place markdown lives in JSON.
- **`scenarios` use arrays**: `given` and `then` are arrays to enable iteration without parsing.
- **Hierarchical scenario IDs**: `rq-V1StGXR8.1` shows parent relationship without separate lookup.
- **RFC 2119 priority**: `must`/`should`/`may` aligns with industry standards.
- **Tags enable cross-cutting queries**: Find all security-related requirements across specs.

---

## changes/{change-id}/change.json

The change file contains tasks and deltas for a proposed modification.

```json
{
  "$schema": "https://advance.dev/schemas/change.v1.json",
  "id": "add-parallel-coordination",
  "title": "Add Parallel Sub-Agent Coordination",
  "status": "active",
  "created_at": "2026-01-15T10:00:00Z",
  "created_by": "user",
  
  "tasks": [
    {
      "id": "tk-Hf7dK2mN",
      "title": "Implement coordination protocol",
      "section": "Core Implementation",
      "status": "pending",
      "priority": 0,
      "deps": [
        {"type": "blocked_by", "target": "tk-Qp3xY9wL"},
        {"type": "related", "target": "rq-V1StGXR8"}
      ],
      "created_at": "2026-01-15T10:00:00Z",
      "started_at": null,
      "completed_at": null,
      "completed_by": null
    },
    {
      "id": "tk-Jm4nP8qR",
      "title": "Add tests for parallel dispatch",
      "section": "Testing",
      "status": "pending",
      "priority": 1,
      "deps": [
        {"type": "blocked_by", "target": "tk-Hf7dK2mN"},
        {"type": "discovered_from", "target": "tk-Hf7dK2mN"}
      ],
      "created_at": "2026-01-15T10:05:00Z",
      "started_at": null,
      "completed_at": null,
      "completed_by": null
    }
  ],
  
  "deltas": {
    "contract-system": [
      {
        "id": "dl-Xt5zW3vB",
        "operation": "add",
        "requirement": {
          "id": "rq-Nm6kL4pC",
          "title": "Parallel Sub-Agent Coordination",
          "body": "When spawning multiple sub-agents simultaneously, the agent SHALL ensure each addresses a distinct scope to avoid conflicts.",
          "priority": "must",
          "scenarios": [
            {
              "id": "rq-Nm6kL4pC.1",
              "title": "Parallel dispatch with distinct scopes",
              "given": ["agent needs to complete multiple criteria in parallel"],
              "when": "spawning multiple sub-agents",
              "then": [
                "each sub-agent prompt specifies distinct scope",
                "scopes do not overlap"
              ]
            }
          ]
        }
      },
      {
        "id": "dl-Ry7sF2hD",
        "operation": "modify",
        "target_id": "rq-V1StGXR8",
        "changes": {
          "body": "Updated body with new parallel coordination constraint..."
        }
      },
      {
        "id": "dl-Sw8tG1jE",
        "operation": "remove",
        "target_id": "rq-OldReq01",
        "reason": "Superseded by rq-Nm6kL4pC"
      }
    ]
  },
  
  "validation": {
    "checked_against_specs": ["contract-system", "slash-commands"],
    "conflicts": [],
    "warnings": [
      "Modifying rq-V1StGXR8 may affect 3 downstream requirements"
    ],
    "validated_at": "2026-01-15T10:10:00Z"
  }
}
```

### Change Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `$schema` | string | Yes | Schema URI for validation |
| `id` | string | Yes | Change identifier (kebab-case) |
| `title` | string | Yes | Human-readable name |
| `status` | enum | Yes | `active` / `archived` |
| `created_at` | ISO8601 | Yes | Creation timestamp |
| `created_by` | string | No | Creator identifier |
| `tasks` | array | Yes | Task list |
| `deltas` | object | Yes | Deltas keyed by capability |
| `validation` | object | No | Last validation result |

### Task Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | NanoID (e.g., `tk-Hf7dK2mN`) |
| `title` | string | Yes | Task description |
| `section` | string | No | Grouping label for display |
| `status` | enum | Yes | `pending` / `in_progress` / `done` / `cancelled` |
| `priority` | int | No | Lower = higher priority (default: 0) |
| `deps` | array | No | Typed dependencies |
| `created_at` | ISO8601 | Yes | Creation timestamp |
| `started_at` | ISO8601 | No | When work began |
| `completed_at` | ISO8601 | No | When finished |
| `completed_by` | string | No | Agent/user identifier |

### Dependency Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | enum | Yes | `blocked_by` / `related` / `discovered_from` / `parent` |
| `target` | string | Yes | Target entity ID |

### Dependency Types

| Type | Meaning | Effect |
|------|---------|--------|
| `blocked_by` | Cannot start until target completes | Blocks `task ready` |
| `related` | Informational link | No blocking |
| `discovered_from` | Found while working on target | Provenance tracking |
| `parent` | Hierarchical containment | Rollup queries |

### Delta Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | NanoID (e.g., `dl-Xt5zW3vB`) |
| `operation` | enum | Yes | `add` / `modify` / `remove` |
| `requirement` | object | For `add` | Full requirement to add |
| `target_id` | string | For `modify`/`remove` | Requirement ID to change |
| `changes` | object | For `modify` | Fields to update |
| `reason` | string | For `remove` | Justification |

---

## ID Generation

**Format**: `{prefix}-{nanoid}`

| Entity | Prefix | Example |
|--------|--------|---------|
| Requirement | `rq-` | `rq-V1StGXR8` |
| Scenario | `rq-{parent}.` | `rq-V1StGXR8.1` |
| Task | `tk-` | `tk-Hf7dK2mN` |
| Delta | `dl-` | `dl-Qp3xY9wL` |

**Algorithm**:
```
id = prefix + nanoid(8)  // 8 characters from NanoID alphabet
```

**Why NanoID(8)?**

Research revealed 4-char hashes have critical collision problems:

| IDs Generated | Collision Probability (4-char) |
|---------------|-------------------------------|
| 36 | ~1% |
| 100 | ~7% |
| 256 | **~50%** |
| 500 | **~98%** |

NanoID(8) provides:
- 50% collision probability at ~51 million IDs
- URL-safe alphabet (A-Za-z0-9_-)
- No progressive scaling needed

---

## Schema Versioning

**Strategy**: Backwards-compatible additions only.

- Add new optional fields freely
- Never remove or rename required fields
- Use `additionalProperties: true` in JSON Schema
- Bump `$schema` URI version for breaking changes (rare)

Example version bump:
```
https://advance.dev/schemas/spec.v1.json  →  v2 only if breaking
```
