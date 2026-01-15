# Change: Add /openspec-ralph command with Ralph Wiggum Loop

## Why
Standard implementation commands like `/openspec-apply` often stop and ask for help when a test or build fails, requiring human "babysitting." A "Ralph Wiggum Loop" allows the agent to autonomously iterate on failures, significantly increasing the "walk-away" time for complex changes and improving overall throughput by handling trivial errors without human intervention.

## What Changes
- New slash command `/openspec-ralph` added to `.opencode/command/`.
- `/openspec-ralph` implements a persistent autonomous iteration loop for implementation tasks.
- Adds an "Autonomous Fix Cycle" where the agent ingests error logs and retries up to 3 times before asking for help.
- Mandatory "Global Verification" phase that must pass before the contract is marked fulfilled.

## Impact
- Affected specs: `slash-commands`
- Affected code: `.opencode/command/openspec-ralph.md` (new file), `openspec/AGENTS.md` (reference update), `goost_instructions.md` (DOOM_LOOP indicator already documented)
