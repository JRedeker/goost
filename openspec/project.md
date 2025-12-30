# Project Context

## Purpose
Goost is a contract-based task persistence protocol for OpenCode that prevents AI agents from prematurely declaring task completion. It establishes immutable contracts with verifiable success criteria, tracks progress through status blocks, and provides visual feedback via terminal tab colors and titles.

## Tech Stack
- TypeScript (plugin implementation)
- OpenCode Plugin SDK (`@opencode-ai/plugin`)
- Markdown (slash commands, instructions, rules)
- OSC escape sequences (terminal tab color/title control)
- tmux passthrough support

## Project Conventions

### Code Style
- TypeScript with strict typing
- Functional patterns where appropriate
- Clear interface definitions for state objects
- Regex patterns for content detection
- Defensive error handling with try/catch in all hooks

### Architecture Patterns
- **Plugin Architecture**: Single entry point (`plugin/index.ts`) with hook-based event handling
- **Prompt Engineering**: Instructions in markdown files guide AI behavior
- **State Management**: In-memory state for contract and sub-agent tracking
- **Slash Commands**: Markdown files in `.opencode/command/` define user-invokable commands

### Testing Strategy
- Manual testing via OpenCode sessions
- Debug mode via `GOOST_DEBUG=1` environment variable
- Log output to stderr for debugging

### Git Workflow
- Main branch: `trunk`
- Commit style: Conventional commits (feat:, fix:, docs:, etc.)
- Atomic commits with clear descriptions

## Domain Context

### Contract System
- Contracts are immutable once confirmed
- Success criteria must be verifiable with evidence
- Status blocks track progress and must appear in every response
- Only users can void contracts

### Status Indicators
| Marker | Icon | Meaning |
|--------|------|---------|
| `[GOOST:ROCKET]` | 🚀 | Active work / spawning agents |
| `[GOOST:MOON]` | 🌕 | Waiting for sub-agent results |
| `[GOOST:EARTH]` | 🌍 | Complete / awaiting user input |
| `[GOOST:DOOM_LOOP]` | 🔄 | Stuck in retry cycle |
| `[GOOST:MIC]` | 🎤 | Needs user approval |

### Sub-Agent Integration
- Sub-agents spawned via OpenCode `task` tool
- Sub-agents have full MCP tool access by default (Context7, Firecrawl, etc.)
- Parent agent must propagate contract context in sub-agent prompts
- For implementation tasks, sub-agents should verify patterns via documentation tools
- Plugin tracks active sub-agent count

## Important Constraints
- Must work in non-interactive shell environments
- Must support tmux passthrough for escape sequences
- Cannot modify contracts without user explicit action
- Must preserve contract state across context compaction

## External Dependencies
- OpenCode CLI and Plugin SDK
- OpenSpec CLI (optional, for `/openspec-*` commands)
- Context7 MCP (optional, for research commands)
- Windows Terminal or compatible terminal for tab colors
