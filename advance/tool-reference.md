# Tool Reference

This document describes the Advance (ADV) plugin tools exposed to AI agents.

## Overview

The plugin exposes tools via OpenCode's `tool()` API. AI agents call these directly without shell overhead.

```typescript
// AI calls plugin tools natively
const specs = await adv_spec_list({ capability: "auth" });
const change = await adv_change_show({ changeId: "add-feature" });
```

## Tools

### Spec Tools

#### `adv_spec_list`

List all capabilities with optional filtering.

| Parameter | Type | Description |
|-----------|------|-------------|
| `capability` | string? | Filter by capability name |
| `tag` | string? | Filter by tag |

**Returns**: `{ specs: Spec[] }`

**Example**:
```typescript
adv_spec_list({ tag: "security" })
// → { specs: [{ id: "auth", name: "Authentication", ... }] }
```

---

#### `adv_spec_show`

Get spec details by ID.

| Parameter | Type | Description |
|-----------|------|-------------|
| `capability` | string | Capability ID |

**Returns**: `Spec` with full requirements and scenarios

---

#### `adv_spec_search`

Full-text search across specs (FTS5).

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search query |
| `limit` | number? | Max results (default: 20) |

**Returns**: `{ results: SearchResult[] }`

**Example**:
```typescript
adv_spec_search({ query: "authentication" })
// → { results: [{ spec: "auth", requirement: "rq-abc", match: "..." }] }
```

---

### Change Tools

#### `adv_change_list`

List active changes.

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string? | Filter: "draft", "pending", "implementing" |
| `includeArchived` | boolean? | Include archived changes |

**Returns**: `{ changes: ChangeSummary[] }`

---

#### `adv_change_show`

Get change details.

| Parameter | Type | Description |
|-----------|------|-------------|
| `changeId` | string | Change ID |

**Returns**: `Change` with tasks, deltas, metadata

---

#### `adv_change_create`

Create a new change proposal.

| Parameter | Type | Description |
|-----------|------|-------------|
| `summary` | string | Brief description |
| `capability` | string? | Primary capability affected |

**Returns**: `{ changeId: string, path: string }`

**Example**:
```typescript
adv_change_create({ summary: "Add OAuth support" })
// → { changeId: "add-oauth-xyz", path: "changes/add-oauth-xyz/" }
```

---

#### `adv_change_validate`

Validate change against existing specs (laws).

| Parameter | Type | Description |
|-----------|------|-------------|
| `changeId` | string | Change ID |
| `strict` | boolean? | Treat warnings as errors |

**Returns**: `ValidationResult`

```typescript
{
  passed: boolean,
  errors: ValidationError[],
  warnings: ValidationWarning[]
}
```

**Example**:
```typescript
adv_change_validate({ changeId: "add-feature" })
// → { passed: true, errors: [], warnings: [{ message: "..." }] }
```

---

#### `adv_change_archive`

Archive a completed change (applies deltas to specs).

| Parameter | Type | Description |
|-----------|------|-------------|
| `changeId` | string | Change ID |

**Returns**: `ArchiveResult`

```typescript
{
  success: boolean,
  specsUpdated: string[],
  docsGenerated: string[],
  archivePath: string
}
```

---

### Task Tools

#### `adv_task_list`

List tasks for a change.

| Parameter | Type | Description |
|-----------|------|-------------|
| `changeId` | string | Change ID |
| `status` | string? | Filter: "pending", "in_progress", "completed" |

**Returns**: `{ tasks: Task[] }`

---

#### `adv_task_ready`

Get unblocked pending tasks.

| Parameter | Type | Description |
|-----------|------|-------------|
| `changeId` | string | Change ID |

**Returns**: `{ ready: Task[], blocked: BlockedTask[] }`

**Example**:
```typescript
adv_task_ready({ changeId: "add-feature" })
// → { ready: [{ id: "tk-abc", content: "..." }], blocked: [...] }
```

---

#### `adv_task_update`

Update task status.

| Parameter | Type | Description |
|-----------|------|-------------|
| `taskId` | string | Task ID |
| `status` | string | "pending", "in_progress", "completed", "cancelled" |
| `notes` | string? | Completion notes or reason |

**Returns**: `{ success: boolean, task: Task }`

---

#### `adv_task_add`

Add a task to a change.

| Parameter | Type | Description |
|-----------|------|-------------|
| `changeId` | string | Change ID |
| `content` | string | Task description |
| `blockedBy` | string[]? | Task IDs that block this one |
| `section` | string? | Section header (e.g., "Testing") |

**Returns**: `{ taskId: string, task: Task }`

---

### Status Tool

#### `adv_status`

Get project status overview.

| Parameter | Type | Description |
|-----------|------|-------------|
| (none) | - | - |

**Returns**: `ProjectStatus`

```typescript
{
  specs: { count: number, capabilities: string[] },
  changes: { active: number, byStatus: Record<string, number> },
  recommendations: string[]
}
```

---

## Integration with Slash Commands

Slash commands invoke plugin tools directly:

```markdown
<!-- .opencode/command/adv-apply.md -->
---
name: adv-apply
description: Implement an approved spec change under contract enforcement
---

1. Call `adv_change_show` to load change details
2. Call `adv_task_ready` to get unblocked tasks
3. Display contract from change metadata
4. Implement tasks using TDD protocol
5. Call `adv_task_update` as tasks complete
6. Call `adv_change_archive` when all tasks done
```

This provides:
- Zero subprocess overhead
- Session-aware context
- Native structured I/O
- Automatic tool discovery

## CLI Wrapper (Optional)

For CI/CD and human debugging, a CLI wrapper exposes the same functionality:

```bash
adv status                    # Calls adv_status
adv validate add-feature      # Calls adv_change_validate
adv export --format=json      # Exports for external tools
```

Built with `bun build --compile`, sharing the same core library as the plugin.
