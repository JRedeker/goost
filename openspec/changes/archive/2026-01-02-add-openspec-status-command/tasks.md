# Tasks

## Implementation

- [x] Create `.opencode/command/openspec-status.md` slash command
  - Verify: File exists and contains valid frontmatter with name/description

- [x] Implement CLI data gathering section
  - Run `openspec list` for active changes
  - Run `openspec list --specs` for spec overview
  - Run `openspec show <change> --json` for each active change (task progress)
  - Verify: Command instructions include all three CLI invocations

- [x] Implement dependency detection logic
  - Parse change data for overlapping capabilities
  - Flag changes modifying same spec directories
  - Verify: Instructions describe heuristic for dependency flagging

- [x] Implement formatted output section
  - Status header with project name
  - Active changes table with progress bars
  - Specs summary table
  - Dependency warnings section (if any)
  - Recommendations section
  - Verify: Output format matches spec example

- [x] Implement error handling for CLI failures
  - Handle malformed JSON from `openspec list --json`
  - Handle partial failures from `openspec show` per-change
  - Graceful degradation when some data unavailable
  - Verify: Error messages match spec scenarios

## Validation

- [x] Run `openspec validate add-openspec-status-command --strict`
  - Verify: Validation passes with no errors

## Testing

- [x] Manual verification of `/openspec-status` command
  - Test with active changes present (current project)
  - Test output format matches spec
  - Verify progress bars render correctly
  - Verify recommendations section appears
  - Verify: Command completes within 2-3 seconds as specified

## Documentation

- [x] Update `goost_instructions.md` command table
  - Verify: `/openspec-status` listed with description

- [x] Sync to global OpenCode config
  - Copy to `~/.config/opencode/command/`
  - Verify: File exists in global config
