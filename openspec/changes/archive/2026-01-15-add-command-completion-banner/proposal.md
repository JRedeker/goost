# Change: Add Command Completion Banner and Standardize Contracts

## Why
When scrolling through a conversation with the AI agent, users cannot easily identify where specific commands completed. The `CONTRACT FULFILLED` message exists but:
1. Not all commands use contracts (e.g., `/openspec-status`, `/openspec-research`, `/openspec-review`)
2. Even when present, the objective doesn't indicate which command was executed
3. Users need a quick visual scan to find "where did `/openspec-harden` finish?"

Additionally, report-based commands like `/openspec-review`, `/openspec-harden`, `/openspec-research`, and `/openspec-audit` perform real work (fixing bugs, updating specs, applying hardening) but lack contract tracking for that implementation phase.

## What Changes
- Convert report-based commands to contract-based when they apply fixes
- Introduce a standardized `/<command-name> COMPLETE` banner format for all OpenSpec slash commands
- Banner includes the command name prominently in the header
- All commands that modify files show banner AFTER `CONTRACT FULFILLED`
- Read-only commands show banner at their natural completion point
- Banner format is visually distinct and grep-friendly

## Impact
- Affected specs: `slash-commands`
- Affected code: All `.opencode/command/openspec-*.md` files (18 files), `goost_instructions.md`
