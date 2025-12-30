# Goost - Project Instructions

This is the **Goost** plugin for OpenCode - a contract-based persistence mechanism for long-running AI tasks.

## Project Structure

```
goost/
├── README.md                           # User documentation
├── CLAUDE.md                           # This file (agent instructions)
└── .opencode/
    ├── command/
    │   ├── contract.md                 # Main /contract slash command
    │   └── contract-quick.md           # Quick /contract-quick variant
    └── rules/
        └── contract-enforcer.md        # Enforcement rule (auto-injected)
```

## Core Concept

Goost solves LLM task persistence by replacing mutable todo lists with **immutable contracts**:

1. User defines success criteria upfront
2. Contract is locked after confirmation
3. Agent cannot declare completion until all criteria are verified
4. Scope changes require explicit contract voiding

## For Agents Working Here

### If modifying slash commands:
- Maintain the contract format exactly (the `====` borders matter for detection)
- Keep criteria verifiable (yes/no checkable)
- Preserve the confirmation step before locking

### If modifying the enforcer rule:
- The rule must be self-activating (detect CONTRACT ACTIVE in history)
- Status blocks are mandatory on every response
- Never allow completion without all `[x]` marks

### Design Principles:
- **Simplicity**: Pure markdown, no runtime dependencies
- **Portability**: Works with any OpenCode-compatible agent
- **User authority**: Only users can void contracts
- **Visibility**: Progress shown in every response

## Testing Changes

To test locally:
1. Copy `.opencode/` to a test project
2. Start a session and run `/contract`
3. Verify the full flow: create → confirm → work → status → complete/void

## No Build Step

This is a pure-prompt plugin. No compilation, no installation beyond copying files.
