# Slash Commands Capability

## ADDED Requirements

### Requirement: OpenSpec Roadmap Command

The system SHALL provide a `/openspec-roadmap` slash command that displays a tiered progress dashboard for OpenSpec changes, with optional enhancement via `roadmap.yaml`.

#### Scenario: Display roadmap from OpenSpec only
- **GIVEN** the project has an `openspec/` directory with active changes
- **AND** no `roadmap.yaml` exists
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system displays active OpenSpec changes in a tiered dashboard
- **AND** each change shows its title, progress bar, and task completion count

#### Scenario: Display roadmap with roadmap.yaml
- **GIVEN** the project has both `openspec/` and `roadmap.yaml`
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system uses `roadmap.yaml` for item metadata and tiering
- **AND** enriches items with OpenSpec task progress when `change_spec` links exist

#### Scenario: Tiering based on status
- **GIVEN** items have status values
- **WHEN** the roadmap is rendered
- **THEN** items are tiered as follows:
  - NOW: `status: in_progress` OR `priority: critical`
  - NEXT: `status: proposed` OR `status: ready`
  - LATER: `status: deferred` OR `status: completed`

#### Scenario: OpenSpec-only tiering
- **GIVEN** no `roadmap.yaml` exists
- **WHEN** rendering OpenSpec changes directly
- **THEN** changes with >0% completion appear in NOW tier
- **AND** changes with 0% completion appear in NEXT tier

#### Scenario: No OpenSpec directory
- **GIVEN** the project does not have an `openspec/` directory
- **AND** no `roadmap.yaml` exists
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system displays a message: "No openspec/ directory found. Run `openspec init` to get started."

### Requirement: OpenSpec Integration

The system SHALL integrate with OpenSpec CLI to display task progress for changes.

#### Scenario: Item linked to OpenSpec change
- **GIVEN** a roadmap item has `change_spec: add-feature-x`
- **AND** OpenSpec has an active change named `add-feature-x` with 5/10 tasks complete
- **WHEN** the roadmap is rendered
- **THEN** the item shows "5/10 tasks" and 50% progress from OpenSpec

#### Scenario: OpenSpec change is archived
- **GIVEN** a roadmap item has `change_spec: completed-feature`
- **AND** that OpenSpec change has been archived
- **WHEN** the roadmap is rendered
- **THEN** the item shows as 100% complete

#### Scenario: OpenSpec CLI not available
- **GIVEN** the `openspec` CLI is not installed or not in PATH
- **AND** `roadmap.yaml` exists
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system displays the roadmap using only `roadmap.yaml` data
- **AND** shows a note that OpenSpec integration is unavailable

#### Scenario: Invalid change_spec reference
- **GIVEN** a roadmap item has `change_spec: non-existent-change`
- **WHEN** the roadmap is rendered
- **THEN** the item displays using its manual values
- **AND** shows a warning that the linked change was not found

### Requirement: Roadmap Progress Summary

The roadmap command SHALL include a summary showing aggregate progress.

#### Scenario: Summary content
- **GIVEN** there are N items with M total tasks and C completed tasks
- **WHEN** the roadmap is rendered
- **THEN** the header shows overall progress bar
- **AND** the footer shows "Total: N active | C/M tasks (X%)"

#### Scenario: Empty roadmap after filtering
- **GIVEN** `roadmap.yaml` exists with items
- **AND** all items have `status: archived` or are otherwise filtered out
- **WHEN** the roadmap is rendered
- **THEN** the system displays "No active roadmap items found"
- **AND** shows the count of filtered/archived items

#### Scenario: All items complete
- **GIVEN** all roadmap items have 100% task completion
- **WHEN** the roadmap is rendered
- **THEN** the header shows a full progress bar (100%)
- **AND** a congratulatory message: "All roadmap items complete!"
- **AND** items are still displayed in the LATER tier with DONE badges

### Requirement: Error Handling

The system SHALL handle error conditions gracefully with actionable messages.

#### Scenario: Malformed roadmap.yaml
- **GIVEN** `roadmap.yaml` contains invalid YAML syntax
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system displays a clear error message identifying the syntax issue

#### Scenario: Empty roadmap
- **GIVEN** `roadmap.yaml` exists but has no items defined
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system displays a message explaining no items are defined
- **AND** shows an example of how to add an item

#### Scenario: Malformed JSON from OpenSpec CLI
- **GIVEN** `openspec list --json` returns malformed or invalid JSON
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system displays an error: "OpenSpec CLI returned invalid data"
- **AND** falls back to `roadmap.yaml` if available
- **AND** suggests running `openspec list` manually to diagnose

#### Scenario: Empty openspec directory
- **GIVEN** the `openspec/` directory exists but contains no changes
- **AND** no `roadmap.yaml` exists
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system displays: "No OpenSpec changes found in openspec/"
- **AND** suggests running `openspec new <change-name>` to create one
