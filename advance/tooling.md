# Tooling Architecture

This document describes how Advance (ADV) components are implemented and distributed.

## Overview

Advance uses a **plugin-first** architecture, purpose-built for OpenCode:

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADVANCE (ADV) TOOLKIT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              TypeScript Plugin (Primary)                   │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │  │
│  │  │  AI Tools    │  │   Storage    │  │  Terminal UI   │   │  │
│  │  │  tool()      │  │   SQLite     │  │  Tab colors    │   │  │
│  │  └──────────────┘  └──────────────┘  └────────────────┘   │  │
│  │                                                            │  │
│  │  Tools: adv_spec_*, adv_change_*, adv_task_*, adv_status  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────┐  ┌───────────────────────────┐ │
│  │  Slash Commands (.md)       │  │  CLI Wrapper (optional)   │ │
│  │  User workflows invoking    │  │  For CI/CD and debugging  │ │
│  │  plugin tools               │  │  Built with bun build     │ │
│  └─────────────────────────────┘  └───────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Markdown Instructions                           ││
│  │              Agent behavior, TDD protocol, contracts         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

| Component | Implementation | Responsibility |
|-----------|----------------|----------------|
| **Plugin** | TypeScript | All spec/change/task operations, SQLite, validation, UI |
| **CLI Wrapper** | TypeScript (Bun) | CI validation, human debugging (optional) |
| **Instructions** | Markdown | TDD protocol, contract enforcement, agent guidance |
| **Slash Commands** | Markdown | User workflows invoking plugin tools |

## Why Plugin-First?

| Concern | CLI-First | Plugin-First |
|---------|-----------|--------------|
| Latency | ~100-200ms (spawn) | <5ms (in-process) |
| Token cost | ~1-2k/call | ~1k/call |
| Session context | None | Full access |
| Contract integration | Manual | Native |
| Tool discovery | Manual | Automatic |
| Language | Go + TypeScript | TypeScript only |

## TypeScript Plugin (Primary)

The plugin is the primary interface, handling all ADV operations.

**Why TypeScript?**
- OpenCode Plugin SDK is TypeScript
- Bun provides native SQLite (`bun:sqlite`)
- Single language for entire codebase
- Already proven in current Goost plugin
- Can be compiled to standalone CLI with `bun build`

**Responsibilities**:
- AI tools exposed via `tool()` API
- SQLite storage layer with auto-sync
- "Specs as Laws" validation engine
- JSON schema validation (Zod)
- Terminal tab colors and titles
- Status marker detection
- Contract state tracking

**Structure**:
```
plugin/
├── src/
│   ├── index.ts         # Plugin entry, tool registration
│   ├── tools/           # AI tool implementations
│   │   ├── spec.ts      # adv_spec_* tools
│   │   ├── change.ts    # adv_change_* tools
│   │   └── task.ts      # adv_task_* tools
│   ├── storage/         # Data layer
│   │   ├── sqlite.ts    # SQLite operations
│   │   ├── json.ts      # JSON file I/O
│   │   └── sync.ts      # Auto-sync logic
│   ├── validator/       # Specs as laws
│   │   ├── conflicts.ts
│   │   └── completeness.ts
│   └── events/          # Event handlers
│       ├── terminal.ts
│       └── contract.ts
├── package.json
└── tsconfig.json
```

## Markdown Instructions

Instructions are prompt engineering for AI agent behavior.

**Why Markdown?**
- Natural language for AI consumption
- Easy to iterate and test
- No compilation needed
- Human-readable documentation

**Key Files**:
- `adv_instructions.md` — Main agent instructions
- Contract enforcement protocol
- TDD workflow (RSTC)
- Status block requirements
- Completion criteria

## Slash Commands

Slash commands are user-invokable workflows that invoke plugin tools.

**Why Markdown?**
- OpenCode's command format
- Invoke plugin tools directly
- Easy to customize per project
- Self-documenting

**Example** (`/adv-apply`):
```markdown
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

**Commands to Port**:
| Current | ADV Equivalent |
|---------|----------------|
| `/contract` | `/contract` |
| `/openspec-apply` | `/adv-apply` |
| `/openspec-prep` | `/adv-prep` |
| `/openspec-review` | `/adv-review` |
| `/openspec-archive` | `/adv-archive` |

## CLI Wrapper (Optional)

For CI/CD and human debugging, a CLI wrapper can be built from the same codebase.

**Why Optional?**
- Most use cases are within OpenCode sessions
- Plugin tools handle the 90% case
- CLI only needed for CI pipelines and external scripting

**Implementation**:
```typescript
// cli/index.ts
const store = await createStore(process.cwd());

switch (command) {
  case "status":
    const result = await adv_status.execute({}, { store });
    console.log(formatOutput(result));
    break;
}
```

**Build**:
```bash
bun build cli/index.ts --compile --outfile=adv
```

**Commands**:
```bash
adv status                    # Project overview
adv validate add-feature      # Validate a change
adv export --format=json      # Export for external tools
```

## Installation

One command installs the plugin:

```bash
# Add to OpenCode plugins
cp -r advance-plugin/ ~/.opencode/plugins/advance/

# Copy instructions
cp adv_instructions.md ~/.opencode/

# Copy slash commands
cp .opencode/command/adv-*.md ~/.opencode/command/
```

**Project Initialization**:
```bash
# In a new project, the plugin auto-creates on first tool call:
# - specs/           (empty, for capabilities)
# - changes/         (empty, for proposals)
# - archive/         (empty, for completed changes)
# - .advdb/          (SQLite cache)
# - project.json     (project configuration)
```

## Development Workflow

```bash
# Install dependencies
cd plugin
bun install

# Run tests
bun test

# Type check
bun run check

# Build CLI wrapper (optional)
bun build cli/index.ts --compile --outfile=adv

# Local development
bun run dev
```

## Version Compatibility

| Component | Versioning | Compatibility |
|-----------|------------|---------------|
| Plugin | Semantic versioning | JSON schema version in `$schema` |
| CLI Wrapper | Matches plugin version | Same codebase |
| Instructions | Unversioned | Updated with plugin |
| Slash Commands | Unversioned | Project-specific |

## Related Documents

- [proposal.md](proposal.md) — Core concepts and design decisions
- [plugin-implementation.md](plugin-implementation.md) — Implementation plan
- [tool-reference.md](tool-reference.md) — Tool documentation
- [architecture.md](architecture.md) — System diagrams
