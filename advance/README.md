# Advance (ADV) — Spec-Driven Development

> **Specs as Laws**: Requirements aren't just documentation — they're enforced during change validation.

## Overview

Advance is a complete redesign of the spec-driven development system using:
- **JSON** for structured data (specs, tasks, deltas) with SQLite caching
- **Markdown** for prose content (proposals, designs)
- **Enforcement** — changes validated against existing specs

## Documents

| Document | Purpose |
|----------|---------|
| [proposal.md](proposal.md) | Core concepts, motivation, workflow, key decisions |
| [architecture.md](architecture.md) | System diagrams, component overview |
| [schemas.md](schemas.md) | JSON schema definitions (spec.json, change.json) |
| [sqlite-cache.md](sqlite-cache.md) | Cache architecture, tables, queries, sync rules |
| [cli-reference.md](cli-reference.md) | CLI command reference (`adv` binary) |
| [tooling.md](tooling.md) | Component breakdown (CLI, plugin, commands) |
| [entity-relationships.md](entity-relationships.md) | Data model diagrams and relationships |
| [multi-capability-changes.md](multi-capability-changes.md) | Handling changes affecting multiple specs |
| [token-analysis.md](token-analysis.md) | Token cost comparison (20-30% reduction) |
| [agent-instructions.md](agent-instructions.md) | Agent behavioral rules, contract protocol |
| [rules.yaml](rules.yaml) | Core rules in YAML format |
| [slash-commands.md](slash-commands.md) | Slash command mapping (v1 → ADV) |
| [cli-implementation.md](cli-implementation.md) | Go CLI implementation plan |

## Quick Start (Planned)

```bash
# Initialize a project
adv init

# Create a new change
adv change new "Add user authentication"

# List pending changes
adv change list --status=pending

# Validate a change against specs
adv change validate auth-abc123

# Archive a completed change (becomes law)
adv change archive auth-abc123

# Search across specs
adv search "authentication"
```

## Key Concepts

### Lifecycle

```
PROPOSAL        CHANGE              SPEC (LAW)
┌─────────┐    ┌─────────┐         ┌─────────┐
│proposal │ ──▶│change   │  ──▶    │spec     │
│.md      │    │.json    │ archive │.json    │
└─────────┘    └─────────┘         └─────────┘
                    │                    │
               ┌────┴────┐          ┌────┴────┐
               │ tasks   │          │ enforce │
               │ deltas  │          │ validate│
               └─────────┘          └─────────┘
                                         ▲
                                         │
               NEW PROPOSAL ─────────────┘
               (checked against laws)
```

### Directory Structure

```
project/
├── AGENTS.md                    # Instructions (prose)
├── project.json                 # Project config
├── specs/
│   └── {capability}/
│       └── spec.json            # THE LAW
├── changes/
│   └── {change-id}/
│       ├── proposal.md          # Why (prose)
│       ├── design.md            # How (prose, optional)
│       └── change.json          # Tasks + deltas
├── archive/
│   └── {date}-{change-id}/      # Frozen snapshots
├── docs/
│   └── specs/
│       └── {capability}.md      # Generated docs
└── .advdb/
    └── adv.db                   # SQLite cache (not committed)
```

### ID Format

| Type | Format | Example |
|------|--------|---------|
| Requirement | `rq-{nanoid8}` | `rq-a1b2c3d4` |
| Scenario | `rq-{nanoid8}.{n}` | `rq-a1b2c3d4.1` |
| Task | `tk-{nanoid8}` | `tk-e5f6g7h8` |
| Delta | `dl-{nanoid8}` | `dl-i9j0k1l2` |

NanoID(8) gives 50% collision probability at ~51 million IDs.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ID scheme | NanoID(8) | 4-char truncation has collision at 256 IDs (birthday problem) |
| Cache | SQLite from day 1 | Required for cross-spec validation ("specs as laws") |
| Daemon | None (on-demand sync) | Simpler, Beads-proven pattern |
| Docs | Generated on archive | Keep source of truth in JSON, render for humans |
| Dependencies | 4 types | blocked_by, related, discovered_from, parent |

## Implementation Status

- [ ] Go CLI skeleton (`adv` binary)
- [ ] JSON schemas (Zod validation)
- [ ] SQLite schema implementation
- [ ] Migration tool (`adv migrate from-openspec`)
- [ ] Slash command updates (`/adv-*`)
- [ ] TypeScript plugin integration

## Learnings from Goost v1 (January 2026)

Recent Goost development yielded important patterns to incorporate:

| Learning | Implication for ADV |
|----------|---------------------|
| Instructions condensed 72% (886→244 lines) | ADV instructions should be terse; use tables, bullet points, inline code |
| `/openspec-refactor` command added | Add `/adv-refactor` for stale proposal reconciliation |
| P25 related-scan rule | Bug fixes trigger sibling-pattern scanning |
| Auto-detect question tools (MIC state) | Plugin should detect question-like MCP calls automatically |
| Permission.ask hook | Track approval states via plugin hooks |

## Open Questions

1. **Compaction**: Should archived changes be compacted/summarized?
2. **MCP server scope**: What to expose via MCP for external tools?
3. **Contradiction detection**: How sophisticated should validation be?

## Related

- [Beads](https://github.com/steveyegge/beads) — Git-backed graph issue tracker (inspiration)
- [OpenSpec](../openspec/) — Current spec system being replaced
- [Goost v1](../README.md) — Current contract-based persistence system (Advance builds on Goost)
