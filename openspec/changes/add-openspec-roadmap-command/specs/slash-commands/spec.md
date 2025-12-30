# Slash Commands Capability

## ADDED Requirements

### Requirement: OpenSpec Roadmap Command

The system SHALL provide a `/openspec-roadmap` slash command that displays a tiered progress dashboard for all active OpenSpec changes.

#### Scenario: Display roadmap with active changes
- **GIVEN** the project has an `openspec/` directory with active changes
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system displays a dashboard with NOW/NEXT/LATER tiers
- **AND** each change shows its objective, progress bar, and task completion count

#### Scenario: Tiering based on progress
- **GIVEN** a change has > 50% tasks complete
- **WHEN** the roadmap is rendered
- **THEN** that change appears in the NOW tier (momentum principle)

#### Scenario: Tiering based on blocking status
- **GIVEN** a change is marked with `[BLOCKING]` or `[CRITICAL]` in its proposal
- **WHEN** the roadmap is rendered
- **THEN** that change appears in the NOW tier regardless of progress

#### Scenario: Dependency blocking
- **GIVEN** change A depends on change B (referenced in proposal)
- **AND** change B is not complete
- **WHEN** the roadmap is rendered
- **THEN** change A appears in NEXT or LATER tier with "Blocked by: B" indicator

#### Scenario: No OpenSpec directory
- **GIVEN** the project does not have an `openspec/` directory
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system displays an error message
- **AND** suggests running `openspec init` to initialize

#### Scenario: OpenSpec CLI not available
- **GIVEN** the `openspec` CLI is not installed or not in PATH
- **WHEN** user invokes `/openspec-roadmap`
- **THEN** the system displays an error explaining the dependency
- **AND** provides installation instructions

### Requirement: Roadmap Progress Summary

The roadmap command SHALL include a summary footer showing aggregate progress.

#### Scenario: Summary footer content
- **GIVEN** there are N active changes with M total tasks and C completed tasks
- **WHEN** the roadmap is rendered
- **THEN** the footer shows "Total: N active changes | C/M tasks complete (X%)"
