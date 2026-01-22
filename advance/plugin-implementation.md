# Plugin Implementation Plan

This document outlines the implementation plan for the Advance (ADV) TypeScript plugin.

## Overview

The plugin is the primary interface for ADV, handling all spec/change/task operations with:
- AI tools exposed via `tool()` API
- SQLite storage via `bun:sqlite`
- JSON file management
- Validation engine ("specs as laws")
- Terminal UI (tab colors, titles)

## Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Runtime | Bun | Fast, native SQLite, TypeScript support |
| Plugin SDK | @opencode-ai/plugin | OpenCode's official plugin API |
| SQLite | bun:sqlite | Native, fast, no dependencies |
| Validation | Zod | Runtime type validation, TypeScript integration |
| ID Generation | nanoid | Lightweight, collision-resistant |
| Testing | bun:test | Built-in, fast |

## Project Structure

```
plugin/
├── src/
│   ├── index.ts              # Plugin entry, tool registration
│   ├── tools/                # AI tool implementations
│   │   ├── spec.ts           # adv_spec_* tools
│   │   ├── change.ts         # adv_change_* tools
│   │   ├── task.ts           # adv_task_* tools
│   │   └── status.ts         # adv_status tool
│   ├── storage/              # Data layer
│   │   ├── store.ts          # Store interface
│   │   ├── json.ts           # JSON file operations
│   │   ├── sqlite.ts         # SQLite operations
│   │   └── sync.ts           # JSON → SQLite sync
│   ├── validator/            # "Specs as Laws" validation
│   │   ├── validator.ts      # Validation interface
│   │   ├── conflicts.ts      # Conflict detection
│   │   └── completeness.ts   # Completeness checks
│   ├── schemas/              # Zod schemas
│   │   ├── spec.ts           # Spec schema
│   │   ├── change.ts         # Change schema
│   │   └── project.ts        # Project config schema
│   ├── events/               # Event handlers
│   │   ├── message.ts        # Status marker detection
│   │   ├── contract.ts       # Contract state tracking
│   │   └── terminal.ts       # Tab color/title updates
│   └── types.ts              # Shared types
├── migrations/               # SQLite schema migrations
│   └── 001_init.sql
├── package.json
├── tsconfig.json
└── bunfig.toml
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Plugin skeleton with spec tools

```typescript
// src/index.ts
import { type Plugin, tool } from "@opencode-ai/plugin";
import { z } from "zod";
import { createStore } from "./storage/store";

export const AdvPlugin: Plugin = async ({ directory }) => {
  const store = await createStore(directory);
  
  return {
    tool: {
      adv_spec_list: tool({
        description: "List all specifications",
        args: { capability: z.string().optional() },
        async execute({ capability }) {
          const specs = await store.specs.list(capability);
          return JSON.stringify(specs);
        }
      }),
      
      adv_spec_show: tool({
        description: "Get spec details by ID",
        args: { capability: z.string() },
        async execute({ capability }) {
          const spec = await store.specs.get(capability);
          return JSON.stringify(spec);
        }
      }),
    }
  };
};
```

**Tasks**:
- [ ] Plugin scaffold with tool registration
- [ ] JSON file reader for specs
- [ ] `adv_spec_list` tool
- [ ] `adv_spec_show` tool
- [ ] Zod schemas for spec.json

**Deliverable**: Can list and show specs from JSON files.

### Phase 2: SQLite Storage (Week 3-4)

**Goal**: SQLite cache with auto-sync

```typescript
// src/storage/sqlite.ts
import { Database } from "bun:sqlite";

export function createSQLiteStore(dbPath: string) {
  const db = new Database(dbPath);
  
  // Run migrations
  db.run(MIGRATIONS['001_init']);
  
  return {
    requirements: {
      all: () => db.query("SELECT * FROM requirements").all(),
      search: (query: string) => 
        db.query("SELECT * FROM requirements_fts WHERE body MATCH ?").all(query),
    },
    sync: (specs: Spec[]) => { /* ... */ },
    needsSync: () => { /* check mtimes */ },
  };
}
```

**Tasks**:
- [ ] SQLite schema (requirements, scenarios, changes, tasks)
- [ ] JSON → SQLite sync logic
- [ ] `adv_spec_search` tool (FTS5)
- [ ] Auto-sync on tool invocation

**Deliverable**: Specs queryable via SQLite, auto-synced from JSON.

### Phase 3: Change Management (Week 5-6)

**Goal**: Full change CRUD

```typescript
// src/tools/change.ts
adv_change_create: tool({
  description: "Create a new change proposal",
  args: { 
    summary: z.string(),
    capability: z.string().optional(),
  },
  async execute({ summary, capability }) {
    const changeId = generateChangeId(summary);
    const path = `changes/${changeId}`;
    
    await store.changes.create({
      id: changeId,
      summary,
      status: "draft",
      tasks: [],
      deltas: [],
    });
    
    return JSON.stringify({ changeId, path });
  }
}),
```

**Tasks**:
- [ ] `adv_change_list` tool
- [ ] `adv_change_show` tool
- [ ] `adv_change_create` tool
- [ ] NanoID generation with prefix
- [ ] proposal.md scaffolding

**Deliverable**: Can create and manage changes.

### Phase 4: Task Management (Week 7-8)

**Goal**: Task CRUD with dependency resolution

```typescript
// src/storage/sqlite.ts
readyTasks(changeId: string) {
  return db.query(`
    SELECT t.* FROM tasks t
    WHERE t.change_id = ?
      AND t.status = 'pending'
      AND NOT EXISTS (
        SELECT 1 FROM dependencies d
        JOIN tasks bt ON d.target_id = bt.id
        WHERE d.source_id = t.id
          AND d.type = 'blocked_by'
          AND bt.status != 'completed'
      )
  `).all(changeId);
}
```

**Tasks**:
- [ ] `adv_task_list` tool
- [ ] `adv_task_ready` tool
- [ ] `adv_task_update` tool
- [ ] `adv_task_add` tool
- [ ] Dependency resolution algorithm

**Deliverable**: Full task management with blocking queries.

### Phase 5: Validation (Week 9-10)

**Goal**: "Specs as Laws" enforcement

```typescript
// src/validator/validator.ts
export async function validateChange(
  change: Change, 
  store: Store
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  for (const delta of change.deltas) {
    // Check for conflicts with existing requirements
    const conflicts = await detectConflicts(delta, store);
    errors.push(...conflicts.filter(c => c.severity === 'error'));
    warnings.push(...conflicts.filter(c => c.severity === 'warning'));
    
    // Check for completeness
    const completeness = await checkCompleteness(delta);
    errors.push(...completeness.missing);
  }
  
  return { 
    passed: errors.length === 0, 
    errors, 
    warnings 
  };
}
```

**Tasks**:
- [ ] `adv_change_validate` tool
- [ ] Conflict detection (contradicting requirements)
- [ ] Completeness checks (scenarios, acceptance)
- [ ] Warning vs error classification

**Deliverable**: Changes validated against existing specs.

### Phase 6: Archive & Docs (Week 11-12)

**Goal**: Archive workflow with doc generation

```typescript
// src/tools/change.ts
adv_change_archive: tool({
  description: "Archive completed change, apply deltas to specs",
  args: { changeId: z.string() },
  async execute({ changeId }) {
    // 1. Validate all tasks complete
    const change = await store.changes.get(changeId);
    if (change.tasks.some(t => t.status !== 'completed')) {
      throw new Error("Not all tasks completed");
    }
    
    // 2. Validate against specs
    const validation = await validateChange(change, store);
    if (!validation.passed) {
      throw new Error("Validation failed");
    }
    
    // 3. Apply deltas to specs
    for (const delta of change.deltas) {
      await applyDelta(delta, store);
    }
    
    // 4. Generate docs
    const docs = await generateDocs(change.affectedSpecs);
    
    // 5. Move to archive
    const archivePath = await archiveChange(change);
    
    return JSON.stringify({
      success: true,
      specsUpdated: change.affectedSpecs,
      docsGenerated: docs,
      archivePath,
    });
  }
}),
```

**Tasks**:
- [ ] `adv_change_archive` tool
- [ ] Delta → requirement promotion
- [ ] Markdown doc generation
- [ ] Archive directory management

**Deliverable**: Complete archive workflow.

### Phase 7: Events & UI (Week 13-14)

**Goal**: Event handlers, terminal UI, polish

```typescript
// src/events/message.ts
export function detectStatusMarker(content: string): StatusMarker | null {
  const match = content.match(/\[ADV:(\w+)\]/);
  if (!match) return null;
  return match[1] as StatusMarker;
}

// src/events/terminal.ts
export function updateTabColor(status: StatusMarker) {
  const colors = {
    ROCKET: '#FF6B6B',
    TDD_RED: '#FF8C42',
    TDD_GREEN: '#4ECDC4',
    MOON: '#6B7FD7',
    EARTH: '#95E1A3',
  };
  setTabColor(colors[status]);
}
```

**Tasks**:
- [ ] Status marker detection
- [ ] Tab color updates
- [ ] Contract state tracking
- [ ] `adv_status` tool
- [ ] Migration from OpenSpec
- [ ] Performance optimization
- [ ] Error handling polish

**Deliverable**: Production-ready plugin.

## Key Algorithms

### Dependency Resolution (Kahn's Algorithm)

```typescript
function topologicalSort(tasks: Task[], deps: Dependency[]): Task[] {
  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();
  
  for (const t of tasks) {
    inDegree.set(t.id, 0);
    graph.set(t.id, []);
  }
  
  for (const d of deps) {
    if (d.type === 'blocked_by') {
      graph.get(d.targetId)?.push(d.sourceId);
      inDegree.set(d.sourceId, (inDegree.get(d.sourceId) || 0) + 1);
    }
  }
  
  const queue = [...inDegree.entries()]
    .filter(([, deg]) => deg === 0)
    .map(([id]) => id);
  
  const sorted: Task[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    sorted.push(tasks.find(t => t.id === id)!);
    
    for (const next of graph.get(id) || []) {
      inDegree.set(next, inDegree.get(next)! - 1);
      if (inDegree.get(next) === 0) {
        queue.push(next);
      }
    }
  }
  
  return sorted;
}
```

### Auto-Sync Logic

```typescript
async function needsSync(store: Store): Promise<boolean> {
  const lastSync = store.getLastSyncTime();
  
  for await (const file of glob("**/*.json", { cwd: store.projectPath })) {
    const stat = await Bun.file(file).stat();
    if (stat.mtime > lastSync) {
      return true;
    }
  }
  
  return false;
}
```

## Testing Strategy

### Unit Tests

```typescript
// src/tools/spec.test.ts
import { describe, test, expect } from "bun:test";
import { createMockStore } from "../test/mocks";

describe("adv_spec_list", () => {
  test("returns all specs when no filter", async () => {
    const store = createMockStore({
      specs: [
        { id: "auth", name: "Authentication" },
        { id: "api", name: "API Gateway" },
      ],
    });
    
    const result = await adv_spec_list.execute({}, { store });
    expect(JSON.parse(result).specs).toHaveLength(2);
  });
  
  test("filters by capability", async () => {
    const store = createMockStore({ /* ... */ });
    const result = await adv_spec_list.execute(
      { capability: "auth" }, 
      { store }
    );
    expect(JSON.parse(result).specs).toHaveLength(1);
  });
});
```

### Integration Tests

```typescript
// src/integration.test.ts
import { describe, test, expect, beforeEach, afterEach } from "bun:test";

describe("change lifecycle", () => {
  let testDir: string;
  
  beforeEach(async () => {
    testDir = await createTempProject();
  });
  
  afterEach(async () => {
    await rm(testDir, { recursive: true });
  });
  
  test("create → validate → archive", async () => {
    const plugin = await AdvPlugin({ directory: testDir });
    
    // Create
    const createResult = await plugin.tool.adv_change_create.execute({
      summary: "Test feature",
    });
    const { changeId } = JSON.parse(createResult);
    
    // Add task and complete it
    await plugin.tool.adv_task_add.execute({
      changeId,
      content: "Implement feature",
    });
    // ... complete task
    
    // Validate
    const validateResult = await plugin.tool.adv_change_validate.execute({
      changeId,
    });
    expect(JSON.parse(validateResult).passed).toBe(true);
    
    // Archive
    const archiveResult = await plugin.tool.adv_change_archive.execute({
      changeId,
    });
    expect(JSON.parse(archiveResult).success).toBe(true);
  });
});
```

## CLI Wrapper (Optional)

For CI/CD integration, a CLI wrapper can be built:

```typescript
// cli/index.ts
import { parseArgs } from "util";
import { createStore } from "../src/storage/store";
import * as tools from "../src/tools";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    json: { type: "boolean" },
    help: { type: "boolean" },
  },
  allowPositionals: true,
});

const [command, ...args] = positionals;

const store = await createStore(process.cwd());

switch (command) {
  case "status":
    const result = await tools.adv_status.execute({}, { store });
    console.log(values.json ? result : formatStatus(JSON.parse(result)));
    break;
  // ... other commands
}
```

Build as standalone binary:

```bash
bun build cli/index.ts --compile --outfile=adv
```

## Timeline Summary

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| 1. Foundation | 2 weeks | Spec list/show tools |
| 2. SQLite | 2 weeks | Auto-sync + search |
| 3. Change Mgmt | 2 weeks | Change CRUD |
| 4. Task Mgmt | 2 weeks | Task CRUD + deps |
| 5. Validation | 2 weeks | Specs as laws |
| 6. Archive | 2 weeks | Full workflow |
| 7. Events & UI | 2 weeks | Terminal integration |

**Total**: ~14 weeks to production-ready plugin

## Advantages Over CLI-First

| Aspect | CLI-First | Plugin-First |
|--------|-----------|--------------|
| Latency | ~100-200ms/call | <5ms/call |
| Token cost | ~1-2k/call | ~1k/call |
| Session context | None | Full access |
| Contract integration | Manual | Native |
| Tool discovery | Manual | Automatic |
| Development | Go + TypeScript | TypeScript only |
