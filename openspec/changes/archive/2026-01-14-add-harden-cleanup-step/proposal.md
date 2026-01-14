# Change: Add Cleanup Step to /openspec-harden Command

## Why

The `/openspec-harden` command currently detects artifacts that should be cleaned up but doesn't enforce that cleanup actually happens. During implementation and hardening, agents often create one-time use scripts, scratch files, debugging notes, and temporary artifacts. These get detected but may be left behind if the agent doesn't explicitly clean them up before completing the hardening process.

This creates accumulated cruft in repositories over time, especially when AI agents are involved in implementation work.

## What Changes

- Add a **mandatory cleanup phase** to `/openspec-harden` that executes after remediation
- The cleanup phase SHALL:
  1. Delete files identified as one-time use artifacts (with user confirmation)
  2. Remove scratch/temp files created during the session
  3. Verify no new artifacts were introduced by remediation sub-agents
- Update the hardening report to include a "Cleanup Actions" section showing what was removed
- Add a `--no-cleanup` flag to skip automatic cleanup (for audit-only runs)

## Impact

- Affected specs: `slash-commands` (OpenSpec Harden Command, Cleanup Analysis)
- Affected code:
  - `.opencode/command/openspec-harden.md`

## Research Validation

This proposal was validated against industry best practices (2026-01-13).

### Validated Decisions ✅

| Decision | Validation |
|----------|------------|
| `--no-cleanup` flag naming | Follows GNU convention (`--no-X` for negation), consistent with git, npm, docker |
| Phase ordering (cleanup last) | Matches Jenkins `cleanup` post-condition and Maven `post-integration-test` pattern |
| Git-based session tracking | Using `git status` before/after remediation is simpler than custom manifest tracking |

### Concerns Addressed ⚠️

| Original Concern | Research Finding | Resolution |
|------------------|------------------|------------|
| Y/N/S confirmation pattern | Not best practice; dry-run-first recommended | Changed to `--execute` flag pattern with preview default |
| `fix-*.sh`, `migrate-*.py` patterns | HIGH false positive risk (legitimate permanent tools match) | Removed; use extension-based patterns instead |
| Session artifact tracking | Custom tracking adds complexity | Use git status diffing instead |

### Key Changes from Research

1. **Confirmation flow restructured**: Default is preview-only (safe); use `--execute` to delete
2. **Pattern detection revised**: Removed risky prefix patterns; use extensions (`*.tmp`, `*.bak`) and explicit markers
3. **Hybrid git approach**: Use `git ls-files --others` as foundation, add thin pattern overlay

### Research Sources

- GNU Coding Standards (CLI flag conventions)
- clig.dev Command Line Interface Guidelines
- Jenkins Pipeline `cleanup` post-condition design
- Maven Build Lifecycle (post-integration-test pattern)
- GitHub gitignore templates (temp file patterns)
- git-clean documentation
