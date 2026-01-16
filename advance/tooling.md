# Tooling Architecture

This document describes how Advance (ADV) components are implemented and distributed.

## Overview

Advance ships as a complete toolkit, purpose-built for OpenCode:

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADVANCE (ADV) TOOLKIT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Go CLI    │  │  TS Plugin  │  │  Markdown Instructions  │  │
│  │    `adv`    │  │  (OpenCode) │  │   + Slash Commands      │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                     │                 │
│         │                │                     │                 │
│  ┌──────┴──────┐  ┌──────┴──────┐  ┌──────────┴──────────┐      │
│  │ SQLite      │  │ Terminal    │  │ Agent Behavior      │      │
│  │ Validation  │  │ Integration │  │ TDD Protocol        │      │
│  │ Queries     │  │ Tab Colors  │  │ Contract Enforcement│      │
│  └─────────────┘  └─────────────┘  └─────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

| Component | Implementation | Responsibility |
|-----------|----------------|----------------|
| **CLI** | Go binary | Spec/change/task management, SQLite, validation |
| **Plugin** | TypeScript | Terminal integration, status detection, contract state |
| **Instructions** | Markdown | TDD protocol, contract enforcement, agent guidance |
| **Slash Commands** | Markdown | User-invokable workflows (call CLI internally) |
| **MCP Server** | Optional (future) | Expose spec queries to external tools |

## Why This Split?

| Concern | Best Tool | Rationale |
|---------|-----------|-----------|
| Fast queries | Go CLI + SQLite | Performance, cross-platform binary |
| Terminal colors | TypeScript plugin | OpenCode SDK, event hooks |
| Agent behavior | Markdown instructions | Prompt engineering, easy iteration |
| User workflows | Slash commands | Composable, call CLI underneath |
| External tools | MCP server | Standard protocol, optional |

## Go CLI (`adv`)

The CLI is a single binary that handles all structured data operations.

**Why Go?**
- Single binary distribution (no runtime dependencies)
- Cross-platform (Linux, macOS, Windows)
- Excellent SQLite libraries (go-sqlite3, modernc.org/sqlite)
- Fast startup time
- Proven for CLI tools (gh, docker, kubectl)

**Responsibilities**:
- Parse and validate JSON schemas
- Manage SQLite cache (sync, queries, rebuild)
- Execute spec/change/task commands
- Validate changes against specs (laws)
- Apply deltas during archive
- Generate documentation

**Distribution**:
```bash
# Direct download
curl -fsSL https://advance.dev/install.sh | bash

# Or via package managers (future)
brew install adv
```

## TypeScript Plugin

The plugin integrates with OpenCode's terminal and event system.

**Why TypeScript?**
- OpenCode Plugin SDK is TypeScript
- Event hooks for message lifecycle
- Access to terminal escape sequences
- Already proven in current Goost plugin

**Responsibilities**:
- Terminal tab colors based on contract state
- Status marker detection (`[ADV:ROCKET]`, etc.)
- Contract state tracking (active, fulfilled, voided)
- Sub-agent tracking
- Doom loop detection

**Structure** (based on current Goost plugin):
```
plugin/
├── index.ts       # Entry point, event dispatch
├── types.ts       # Types, constants, Zod schemas
├── terminal.ts    # OSC sequences, tab colors
└── contract.ts    # Contract parsing, state management
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

Slash commands are user-invokable workflows that orchestrate the CLI.

**Why Markdown?**
- OpenCode's command format
- Composable with CLI calls
- Easy to customize per project
- Self-documenting

**Example** (`/adv-apply`):
```markdown
---
name: adv-apply
description: Implement an approved spec change under contract enforcement
---

1. Run `adv change show $ARGUMENTS` to load change details
2. Run `adv task ready $ARGUMENTS` to get unblocked tasks
3. Display contract from change metadata
4. Implement tasks using TDD protocol
5. Run `adv task done <id>` as tasks complete
6. Run `adv change archive $ARGUMENTS` when all tasks done
```

**Commands to Port**:
| Current | ADV Equivalent |
|---------|----------------|
| `/contract` | `/contract` |
| `/openspec-apply` | `/adv-apply` |
| `/openspec-prep` | `/adv-prep` |
| `/openspec-review` | `/adv-review` |
| `/openspec-archive` | `/adv-archive` |

## Installation

One command installs everything:

```bash
curl -fsSL https://advance.dev/install.sh | bash
```

**What it does**:
1. Detects OS/architecture
2. Downloads `adv` CLI binary to `~/.local/bin/`
3. Installs OpenCode plugin to `~/.opencode/plugins/advance/`
4. Copies instructions to `~/.opencode/adv_instructions.md`
5. Copies slash commands to `.opencode/command/`
6. Adds shell configuration (optional)
7. Initializes `.advdb/` in current project

**Project Initialization**:
```bash
# In a new project
adv init

# This creates:
# - specs/           (empty, for capabilities)
# - changes/         (empty, for proposals)
# - archive/         (empty, for completed changes)
# - .advdb/          (SQLite cache)
# - project.json     (project configuration)
```

## CLI ↔ Plugin Communication

The CLI and plugin are independent but complementary:

```
┌─────────────────────────────────────────────────────────────────┐
│                     RUNTIME FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User: /adv-apply add-feature                                    │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────┐                                             │
│  │ Slash Command   │  (reads change.json via CLI)                │
│  │ /adv-apply      │                                             │
│  └────────┬────────┘                                             │
│           │                                                      │
│           │  adv change show add-feature                         │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │    Go CLI       │  (queries SQLite, returns JSON)             │
│  │     `adv`       │                                             │
│  └────────┬────────┘                                             │
│           │                                                      │
│           │  Contract displayed, work begins                     │
│           ▼                                                      │
│  ┌─────────────────┐                                             │
│  │   TS Plugin     │  (detects status markers, updates tab)      │
│  │   (OpenCode)    │                                             │
│  └─────────────────┘                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**No direct communication needed** — the CLI writes to JSON/SQLite, the plugin reads agent output for status markers.

## Future: MCP Server

An optional MCP server could expose spec queries to external tools:

**Potential Endpoints**:
- `spec/list` — List all capabilities
- `spec/search` — Full-text search
- `task/ready` — Get ready tasks for a change
- `change/validate` — Validate a change

**Use Cases**:
- IDE extensions
- Dashboard integrations
- CI/CD pipelines
- External AI agents

**Status**: Deferred to ADV 1.2+. CLI is sufficient for MVP.

## Development Workflow

```bash
# Build CLI
cd cli
go build -o adv

# Run tests
go test ./...

# Build plugin
cd plugin
npm install
npm run build

# Test locally
npm run dev
```

## Version Compatibility

| Component | Versioning | Compatibility |
|-----------|------------|---------------|
| CLI | Semantic versioning | JSON schema version in `$schema` |
| Plugin | Matches CLI major version | OpenCode SDK version |
| Instructions | Unversioned | Updated with CLI |
| Slash Commands | Unversioned | Project-specific |

**Upgrade Path**:
```bash
# Update CLI
adv self-update

# Or reinstall
curl -fsSL https://advance.dev/install.sh | bash
```
