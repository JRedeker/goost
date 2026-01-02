# Add OpenSpec Status Command

## Summary

Add a `/openspec-status` command that provides a quick, formatted overview of OpenSpec project state including active changes, specs, and potential dependencies between changes.

## Motivation

Users need a fast way to understand the current state of their OpenSpec project without running multiple CLI commands or performing heavy analysis. The command should:

1. Show active changes and their task progress at a glance
2. Show available specs with requirement counts
3. Identify potential dependencies between changes (e.g., changes affecting overlapping files/capabilities)
4. Provide actionable next-step recommendations
5. Be **fast** - no sub-agents, no deep analysis, just CLI output + formatting

## Affected Code

- `.opencode/command/openspec-status.md` (NEW) - slash command definition
- `goost_instructions.md` - command table update to add `/openspec-status`

## Design Decisions

### Speed Over Depth

This command prioritizes speed over comprehensive analysis:
- No sub-agent spawning
- No file content analysis
- Only CLI commands: `openspec list`, `openspec list --specs`, `openspec show <change> --json`
- Dependency detection via simple heuristics (overlapping capability names, shared spec directories)

### Dependency Detection Heuristics

Changes are flagged as potentially dependent if:
1. They modify the same capability spec (e.g., both add requirements to `slash-commands`)
2. Their proposal.md files reference overlapping files (requires reading proposals - optional enhancement)
3. One change's name is a prefix/suffix of another (suggests related work)

### Output Format

Concise, scannable output with:
- Status badges per change (task progress)
- Spec summary (capability + requirement count)
- Dependency warnings if detected
- Recommended next action based on state

## Out of Scope

- Deep conflict analysis (use `/openspec-audit` for that)
- Implementation drift detection
- Sub-agent orchestration
- JSON output format (keep it simple for v1)

## Related Changes

None - this is a standalone addition.
