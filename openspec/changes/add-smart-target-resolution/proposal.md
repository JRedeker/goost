# Change: Add Smart Target Resolution for OpenSpec Commands

## Why

Currently, most `/openspec-*` commands require an explicit target argument (e.g., `/openspec-apply feature-x`). When the user omits the target, commands either show a usage error or list available changes. This creates friction in workflows where the context already makes the target obvious - for example, when only one change exists.

Some commands like `/openspec-proposal` already work well without arguments because they create new artifacts. Others like `/openspec-archive` have partial target resolution logic. This proposal standardizes smart target resolution across all OpenSpec commands using a simplified two-priority algorithm and the `mcp_question` tool for disambiguation.

## Research Validation

> Architectural research conducted 2026-01-13

| Decision | Validation | Key Sources |
|----------|------------|-------------|
| Priority-based resolution | Validated | npm, git, docker CLI patterns |
| `mcp_question` for selection | Validated | NN/g Recognition over Recall |
| Skip confirmation for read-only ops | Validated | NN/g Confirmation Fatigue research |
| Remove context inference | **Changed** | GitHub Copilot/Cursor use explicit context |

**Key Simplification**: Original design had 3 priorities including "conversation context inference." Research showed major AI tools use explicit context mechanisms instead. Simplified to 2 priorities: explicit argument > structured selection.

## What Changes

- All `/openspec-*` commands that require a target SHALL attempt to resolve the target via:
  1. **Explicit argument** provided by user (highest priority)
  2. **Structured selection** via `mcp_question` when no argument provided
- When exactly one candidate exists:
  - **Read-only operations** (`review`): Auto-proceed with notification
  - **State-changing operations** (`apply`, `archive`, `harden`): Require confirmation
- When multiple candidates exist: Present selection via `mcp_question`
- Commands SHALL NOT guess - user always confirms or selects explicitly
- Existing explicit-target behavior preserved completely

**Affected Commands:**
- `/openspec-apply` - state-changing, requires confirmation
- `/openspec-review` - read-only, auto-proceeds with notification
- `/openspec-harden` - state-changing (offers fixes), requires confirmation
- `/openspec-archive` - state-changing, requires confirmation
- `/openspec-research` - state-changing (updates files), requires confirmation

**Commands NOT affected:**
- `/openspec-proposal` - creates new artifacts, doesn't need resolution
- `/openspec-status` - global status, no target needed
- `/openspec-roadmap` - global view, no target needed
- `/openspec-clarify` - works on conversation context, no file target
- `/openspec-coordinate` - coordinates multiple, no single target

## Impact

- Affected specs: slash-commands
- Affected code: `.opencode/command/openspec-apply.md`, `.opencode/command/openspec-review.md`, `.opencode/command/openspec-harden.md`, `.opencode/command/openspec-archive.md`, `.opencode/command/openspec-research.md`
- User experience: Smoother workflow with fewer unnecessary confirmations for read-only ops
- Risk: Low - existing explicit target behavior preserved, adds fallback logic only

## Research References

- Nielsen Norman Group - "Confirmation Dialogs Can Prevent User Errors - If Not Overused" (2018)
- Nielsen Norman Group - "Memory Recognition and Recall in User Interfaces" (2024)
- Command Line Interface Guidelines (clig.dev)
- GitHub Copilot Documentation - Chat context mechanisms
- Cursor Features Documentation
