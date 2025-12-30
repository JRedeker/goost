# Slash Commands Capability

## MODIFIED Requirements

### Requirement: OpenSpec Review Command

The `/openspec-review` command SHALL perform a comprehensive review of an OpenSpec change including validation, research, and gap analysis to identify potentially missing or forgotten impacts.

#### Scenario: Gap analysis before final assessment
- **GIVEN** the review has completed phases 1-6 (Discovery, Research, Criteria, Rules, TDD, Research Gaps)
- **WHEN** Phase 7: Gap Analysis executes
- **THEN** the command SHALL analyze the spec for missing or forgotten impacts
- **AND** feed findings into Phase 8: Final Assessment

#### Scenario: Codebase impact discovery
- **GIVEN** the spec mentions specific technologies, features, or domain terms
- **WHEN** performing gap analysis
- **THEN** the command SHALL search the codebase for files containing those terms
- **AND** compare found files against the spec's "Affected code" section
- **AND** flag files that are potentially impacted but not mentioned

#### Scenario: Cross-cutting concerns check
- **GIVEN** the spec describes new functionality
- **WHEN** performing gap analysis
- **THEN** the command SHALL check for coverage of:
  - Error handling scenarios
  - Logging and observability
  - Security considerations (auth, validation, secrets)
  - Configuration requirements
- **AND** flag any concerns not addressed in the spec

#### Scenario: Related changes detection
- **GIVEN** other OpenSpec changes exist in `openspec/changes/`
- **WHEN** performing gap analysis
- **THEN** the command SHALL check for potential conflicts or dependencies
- **AND** flag changes that affect overlapping capabilities or files

#### Scenario: Commonly forgotten items checklist
- **GIVEN** the spec describes a change
- **WHEN** performing gap analysis
- **THEN** the command SHALL present a checklist of commonly forgotten items:
  - Database migrations (if data model changes)
  - API versioning (if endpoints change)
  - Feature flags (for gradual rollout)
  - Rollback plan
  - Documentation updates
  - Dependency updates
- **AND** mark items as applicable or not applicable based on spec content

#### Scenario: Gap analysis in final assessment report
- **GIVEN** Phase 7: Gap Analysis has completed
- **WHEN** Phase 8: Final Assessment generates the review report
- **THEN** the report SHALL include a "Gap Analysis" section with:
  - Potentially impacted files not in spec
  - Cross-cutting concerns status table
  - Related changes that may conflict
  - Commonly forgotten items checklist

#### Scenario: OpenSpec CLI unavailable during gap analysis
- **GIVEN** the `openspec` CLI is not installed or fails
- **WHEN** performing related changes detection
- **THEN** the command SHALL skip the related changes check
- **AND** note in the report that conflict detection is unavailable

#### Scenario: No matching files found in codebase
- **GIVEN** key terms are extracted from the spec
- **WHEN** searching codebase with grep/glob
- **AND** no files match the extracted terms
- **THEN** the command SHALL report "No additional impacted files found"

#### Scenario: Spec missing affected code section
- **GIVEN** the proposal.md lacks an "Affected code" section
- **WHEN** performing codebase impact discovery
- **THEN** the command SHALL note that affected code is not specified
- **AND** treat all found files as potentially impacted

#### Scenario: Large result set from codebase search
- **GIVEN** key term search returns more than 50 files
- **WHEN** performing codebase impact discovery
- **THEN** the command SHALL truncate results to top 50
- **AND** note that results were truncated
- **AND** suggest refining search terms or spec scope
