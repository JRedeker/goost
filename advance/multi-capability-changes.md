# Multi-Capability Changes

## Overview

Some changes affect multiple specs (capabilities). Advance handles this through the `deltas` object in `change.json`, which is keyed by capability name.

## Structure

```
changes/add-auth-with-logging/
├── proposal.md              # Why (prose)
├── design.md                # Technical decisions (prose)
└── change.json              # Tasks + deltas for ALL affected specs
```

### change.json with Multiple Capabilities

```json
{
  "id": "add-auth-with-logging",
  "title": "Add Authentication with Audit Logging",
  "status": "active",
  "created_at": "2026-01-15T10:00:00Z",
  
  "tasks": [
    {
      "id": "tk-Hf7dK2mN",
      "title": "Implement auth token validation",
      "section": "Authentication",
      "status": "pending",
      "deps": []
    },
    {
      "id": "tk-Jm4nP8qR",
      "title": "Add login endpoint",
      "section": "Authentication",
      "status": "pending",
      "deps": [{"type": "blocked_by", "target": "tk-Hf7dK2mN"}]
    },
    {
      "id": "tk-Qp3xY9wL",
      "title": "Implement audit log writer",
      "section": "Logging",
      "status": "pending",
      "deps": []
    },
    {
      "id": "tk-Sw8tG1jE",
      "title": "Add auth event logging",
      "section": "Integration",
      "status": "pending",
      "deps": [
        {"type": "blocked_by", "target": "tk-Jm4nP8qR"},
        {"type": "blocked_by", "target": "tk-Qp3xY9wL"}
      ]
    }
  ],
  
  "deltas": {
    "auth": [
      {
        "id": "dl-Xt5zW3vB",
        "operation": "add",
        "requirement": {
          "id": "rq-Nm6kL4pC",
          "title": "Token Validation",
          "body": "The system SHALL validate JWT tokens on every authenticated request.",
          "priority": "must",
          "scenarios": [
            {
              "id": "rq-Nm6kL4pC.1",
              "title": "Valid token accepted",
              "given": ["request includes valid JWT", "token not expired"],
              "when": "request is processed",
              "then": ["request proceeds to handler"]
            }
          ]
        }
      },
      {
        "id": "dl-Ry7sF2hD",
        "operation": "add",
        "requirement": {
          "id": "rq-Pq8mN5rE",
          "title": "Login Endpoint",
          "body": "The system SHALL provide a POST /login endpoint for credential exchange.",
          "priority": "must",
          "scenarios": []
        }
      }
    ],
    "logging": [
      {
        "id": "dl-Uz9oP6sF",
        "operation": "add",
        "requirement": {
          "id": "rq-Ts0pQ7tG",
          "title": "Audit Log Format",
          "body": "Audit logs SHALL use structured JSON format with timestamp, actor, action, and resource fields.",
          "priority": "must",
          "scenarios": []
        }
      },
      {
        "id": "dl-Wa1qR8uH",
        "operation": "add",
        "requirement": {
          "id": "rq-Vb2rS9vI",
          "title": "Auth Event Logging",
          "body": "All authentication events (login, logout, token refresh, failures) SHALL be logged.",
          "priority": "must",
          "scenarios": []
        }
      }
    ]
  }
}
```

## Key Design Decisions

### 1. Deltas Grouped by Capability

The `deltas` object uses capability names as keys:

```json
{
  "deltas": {
    "auth": [...],      // Applied to specs/auth/spec.json
    "logging": [...]    // Applied to specs/logging/spec.json
  }
}
```

**Why this approach?**
- Clear mapping to target specs
- Easy to validate each capability separately
- Atomic archive: all deltas applied together or none

### 2. Tasks Can Span Capabilities

Tasks aren't tied to a specific capability. A single task can implement requirements across multiple specs:

```json
{
  "id": "tk-Sw8tG1jE",
  "title": "Add auth event logging",
  "section": "Integration",
  "deps": [...]
}
```

This task implements both:
- `rq-Vb2rS9vI` (Auth Event Logging) in `logging` spec
- Integration code that connects `auth` and `logging`

### 3. Cross-Capability Dependencies

Tasks can depend on tasks from different capability sections:

```json
{
  "id": "tk-Sw8tG1jE",
  "deps": [
    {"type": "blocked_by", "target": "tk-Jm4nP8qR"},  // Auth task
    {"type": "blocked_by", "target": "tk-Qp3xY9wL"}   // Logging task
  ]
}
```

## Archive Behavior

When archiving a multi-capability change:

1. **Validate all capabilities**: Each delta set is validated against its target spec
2. **Apply atomically**: All deltas applied in single transaction
3. **Generate docs for each**: `docs/specs/auth.md` AND `docs/specs/logging.md` regenerated
4. **Single commit**: All spec updates + all doc updates in one commit

```bash
$ change archive add-auth-with-logging

Validating deltas...
  ✓ auth: 2 requirements to add
  ✓ logging: 2 requirements to add

Applying deltas...
  ✓ specs/auth/spec.json updated (v1.0.0 → v1.1.0)
  ✓ specs/logging/spec.json updated (v1.2.0 → v1.3.0)

Generating documentation...
  ✓ docs/specs/auth.md regenerated
  ✓ docs/specs/logging.md regenerated
  ✓ docs/specs/index.md updated

Archiving change...
  ✓ Moved to archive/2026-01-15-add-auth-with-logging/

Committed: feat: Add Authentication with Audit Logging (add-auth-with-logging)
```

## Validation: Cross-Capability Conflicts

The `change validate` command checks for conflicts across all affected specs:

```bash
$ change validate add-auth-with-logging

Phase 1: Schema Validation
  ✓ change.json valid
  ✓ All target specs exist (auth, logging)

Phase 2: Per-Capability Validation
  ✓ auth: No conflicts with existing requirements
  ✓ logging: No conflicts with existing requirements

Phase 3: Cross-Capability Check
  ⚠ WARNING: Both specs define requirements mentioning "user session"
    - auth/rq-Nm6kL4pC: "validate JWT tokens"
    - logging/rq-Vb2rS9vI: "authentication events"
    Recommend: Ensure consistent terminology

Result: PASSED (0 errors, 1 warning)
```

## When to Use Multi-Capability Changes

### Good Use Cases

- **Feature integration**: Adding a feature that spans multiple domains
- **Cross-cutting concerns**: Security, logging, observability that touch multiple specs
- **Refactoring**: Moving requirements between specs
- **Consistency updates**: Ensuring uniform patterns across specs

### When to Split

Consider separate changes if:
- Deltas to different specs are **independently deployable**
- Changes have **different risk profiles** (one risky, one safe)
- Different **reviewers** are needed for each capability
- Changes can proceed on **different timelines**

## Example: Splitting a Large Change

Instead of one change with 15 tasks across 4 specs:

```
changes/
├── add-auth-core/           # Auth foundation (4 tasks, 1 spec)
├── add-audit-logging/       # Logging infrastructure (3 tasks, 1 spec)
├── add-auth-logging/        # Integration (2 tasks, 2 specs)
└── add-auth-api/            # API endpoints (6 tasks, 1 spec)
```

Use task dependencies to enforce ordering:

```json
// In add-auth-logging/change.json
{
  "tasks": [
    {
      "id": "tk-integration",
      "deps": [
        {"type": "blocked_by", "target": "add-auth-core"},      // Cross-change dep
        {"type": "blocked_by", "target": "add-audit-logging"}   // Cross-change dep
      ]
    }
  ]
}
```

**Note**: Cross-change dependencies reference change IDs, not task IDs. The entire change must be archived before dependent tasks can start.
