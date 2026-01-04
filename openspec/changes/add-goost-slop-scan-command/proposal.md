# Change: Add /goost-slop-scan command for AI code quality analysis

## Why

AI-generated code often contains subtle quality issues ("slop") that accumulate technical debt. The project already maintains a comprehensive catalog of these patterns in `slop-smells.yaml` (50+ documented smells across 10 categories), but there's no automated way to scan a codebase for these issues. Manual review is time-consuming and inconsistent.

## What Changes

- **NEW** `/goost-slop-scan` slash command that scans the codebase for slop patterns
- Two-phase detection strategy: automatable patterns first (regex/AST), then heuristic patterns
- Parallel sub-agent architecture for performance on large codebases
- Formatted report with severity grouping and fix suggestions
- Respects `.gitignore` for scan scope

## Impact

- Affected specs: `slash-commands`
- Affected code:
  - `.opencode/command/goost-slop-scan.md` (new file)
  - `goost_instructions.md` (update: add command to available commands table)
  - `README.md` (update: add command to documentation)
- Dependencies: `slop-smells.yaml` (read-only, provides pattern definitions)

## Design Decisions

### Two-Phase Scanning

1. **Phase 1 (Automatable)**: Fast regex/grep-based detection for patterns like:
   - `console.log`, `debugger` statements
   - Empty catch blocks, `// @ts-ignore`
   - TODO/FIXME/HACK markers
   - `as any`, `as unknown as`
   - Hardcoded localhost URLs, file paths
   
2. **Phase 2 (Heuristic)**: AI-assisted detection after Phase 1 fixes, covering:
   - Happy path only (missing error handling)
   - Confident incorrectness (plausible but wrong logic)
   - Context amnesia (ignoring codebase patterns)
   - Premature abstraction

This "scan-fix-scan" approach reduces noise in Phase 2 by eliminating obvious issues first.

### Sub-Agent Architecture

Spawn parallel sub-agents by smell category to maximize throughput:
- Hallucination Scanner (HALLU-*)
- Structure Scanner (STRUCT-*)
- Quality Scanner (QUAL-*)
- Documentation Scanner (DOC-*)
- Dependency Scanner (DEP-*)
- Maintainability Scanner (MAINT-*)
- AI-Specific Scanner (AI-*)
- Performance Scanner (PERF-*)
- Test Scanner (TEST-*)

Each sub-agent receives focused scope and returns structured findings.

### Gitignore Respect

Use `git ls-files` to enumerate scannable files, automatically respecting:
- `.gitignore` patterns
- `.git/` directory
- `node_modules/`, `vendor/`, etc.
