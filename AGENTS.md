<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Goost - Project Instructions

This is the **Goost** plugin for OpenCode - a contract-based persistence mechanism for long-running AI tasks.

## Project Structure

```
goost/
├── README.md                           # User documentation
├── AGENTS.md                           # This file (agent instructions)
├── CHANGELOG.md                        # Version history
├── INSTALL.md                          # Installation guide for AI agents
├── goost_instructions.md               # Main instructions (injected into sessions)
├── install.sh                          # Automated install script
├── rules.yaml                          # Global agent rules
├── plugin/                             # TypeScript plugin
│   ├── index.ts                        # Entry point, event dispatch, hooks
│   ├── types.ts                        # Types, constants, Zod schemas
│   ├── terminal.ts                     # OSC sequences, tab color/title
│   ├── contract.ts                     # Contract parsing, state management
│   ├── package.json                    # Dependencies (@opencode-ai/plugin, zod)
│   ├── tsconfig.json                   # TypeScript config
│   └── eslint.config.js                # ESLint configuration
├── .opencode/
│   ├── command/
│   │   ├── contract.md                 # Main /contract slash command
│   │   ├── contract-quick.md           # Quick /contract-quick variant
│   │   └── openspec-*.md               # OpenSpec integration commands
│   └── rules/
│       └── status-indicator.md         # Status indicator rule
├── .github/
│   └── workflows/
│       └── ci.yml                      # GitHub Actions CI
├── assets/
│   └── goost-logo.svg                  # Project logo
└── openspec/                           # OpenSpec change management
    ├── AGENTS.md                       # OpenSpec agent instructions
    ├── project.md                      # Project context
    ├── specs/                          # Capability specifications
    └── changes/                        # Change proposals
```

## Core Concept

Goost solves LLM task persistence by replacing mutable todo lists with **immutable contracts**:

1. User defines success criteria upfront
2. Contract is locked after confirmation
3. Agent cannot declare completion until all criteria are verified
4. Scope changes require explicit contract voiding

## Plugin Architecture

The plugin follows a modular architecture:

| Module | Responsibility |
|--------|----------------|
| `types.ts` | Type definitions, constants (STATUS_EMOJIS, TAB_COLORS, EVENT_TYPES), Zod schemas for runtime validation |
| `terminal.ts` | OSC escape sequence handling, tmux passthrough, tab color/title updates |
| `contract.ts` | Contract parsing, state factory functions, status detection, sub-agent failure tracking |
| `index.ts` | Plugin initialization, event handler dispatch map, hook implementations |

### Key Patterns

- **Runtime Validation**: Zod schemas validate SDK event properties before type assertions
- **Event Dispatch Map**: Clean `eventHandlers[event.type](...)` routing
- **Immutable State**: Factory functions return new state objects
- **Centralized State**: Single `PluginState` object tracks all state

## For Agents Working Here

### If modifying slash commands:
- Maintain the contract format exactly (the `====` borders matter for detection)
- Keep criteria verifiable (yes/no checkable)
- Preserve the confirmation step before locking

### If modifying the plugin:
- Add types to `types.ts`, keep Zod schemas in sync
- Terminal functions go in `terminal.ts` with `@sideeffect` JSDoc
- Contract logic goes in `contract.ts` with pure functions where possible
- Event handlers use the dispatch map pattern in `index.ts`
- Run `npm run check` before committing (typecheck + lint + format)

### Design Principles:
- **Type Safety**: Runtime validation of external data (SDK events)
- **Separation of Concerns**: Each module has a clear responsibility
- **Testability**: Pure functions in contract.ts, side effects isolated in terminal.ts
- **User Authority**: Only users can void contracts
- **Visibility**: Progress shown in every response

## Development

```bash
cd plugin
npm install
npm run check      # typecheck + lint + format:check
npm run lint:fix   # auto-fix lint issues
npm run format     # apply prettier formatting
```

## Testing Changes

Enable debug logging:
```bash
GOOST_DEBUG=1 opencode
```

Manual test flow:
1. Start a session and run `/contract`
2. Verify the full flow: create → confirm → work → status → complete/void
3. Check tab colors change appropriately
4. Test sub-agent spawning (moon state)
5. Test permission prompts (mic state)
