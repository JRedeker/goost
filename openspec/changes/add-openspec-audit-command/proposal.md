# Change: Add OpenSpec Audit Command

## Why

As projects evolve over time, implementations can drift from their specifications. Code gets modified, quick fixes bypass formal processes, and specs become stale. Currently there's no systematic way to verify that the codebase still matches its specifications, leading to:

- **Drift**: Implementation behavior diverges from spec requirements
- **Gaps**: Functionality exists in code but isn't documented in specs
- **Conflicts**: Specs contradict each other or reference deprecated code
- **Staleness**: Specs reference code that no longer exists

The existing `/openspec-review` (pre-implementation) and `/openspec-harden` (post-implementation) commands focus on individual changes. A project-wide audit capability fills the gap for periodic verification.

## What Changes

- Add `/openspec-audit` slash command for project-wide spec/implementation alignment verification
- Multi-phase analysis: discovery, mapping, drift detection, orphan detection, conflict analysis
- Structured report with severity levels and remediation actions
- Optional scope filtering to audit specific capabilities
- Sub-agent orchestration pattern (consistent with `/openspec-harden`)

## Impact

- Affected specs: `slash-commands`
- Affected code:
  - `.opencode/command/openspec-audit.md` (new file)
  - `README.md` (update command table)
  - `goost_instructions.md` (update command table)
- Dependencies: Builds on existing sub-agent patterns from `/openspec-harden`
- Requires: OpenSpec CLI v0.3.0+
