# MODIFIED Requirements for slash-commands Capability

This delta adds loop prevention requirements to the slash-commands capability.

## ADDED Requirements

### Requirement: Termination Criteria Validation

Commands that perform analysis SHALL define explicit termination criteria before each phase transition, preventing infinite loops from ambiguous objectives.

#### Scenario: Phase transition requires completion evidence
- **GIVEN** a command with defined phases (e.g., DISCOVERY, MAPPING, SYNTHESIS)
- **WHEN** transitioning from one phase to the next
- **THEN** the command SHALL emit a checkpoint marker: `[GOOST:CHECKPOINT:PHASE_COMPLETE phase=<phase> findings=<count>]`
- **AND** the checkpoint SHALL include evidence that the phase is actually complete (e.g., "All 15 requirements extracted")

#### Scenario: Validation failure prevents phase transition
- **GIVEN** a command has termination criteria for a phase
- **WHEN** the criteria are NOT met (e.g., expected 15 requirements but found only 5)
- **THEN** the command SHALL output "INCOMPLETE - missing X"
- **AND** continue working to complete the criteria
- **AND** NOT proceed to the next phase

#### Scenario: No termination criteria defined
- **GIVEN** a command is invoked
- **WHEN** the command prompt does not define termination criteria
- **THEN** the command SHALL assume default criteria: "Work until user interrupts or all sub-agents respond"
- **AND** note in output: "No explicit termination criteria - using defaults"

#### Scenario: Termination criteria are measurable
- **GIVEN** a command defines termination criteria
- **WHEN** the criteria are evaluated
- **THEN** each criterion SHALL be objectively measurable (count, boolean, comparison)
- **AND** criteria SHALL NOT be subjective (e.g., "done" vs "N items processed")

### Requirement: Sub-Agent Work Deduplication

Commands that spawn parallel sub-agents SHALL track which files each sub-agent processes to prevent redundant analysis.

#### Scenario: Parallel sub-agents process different files
- **GIVEN** a command spawns multiple sub-agents for parallel analysis
- **WHEN** assigning scope to each sub-agent
- **THEN** the command SHALL ensure file scopes do not overlap
- **AND** track assigned files to detect potential conflicts

#### Scenario: Duplicate file assignment detected
- **GIVEN** the command is about to assign a file to a sub-agent
- **WHEN** that file was already assigned to another sub-agent
- **THEN** the command SHALL skip assigning the duplicate
- **AND** note in output: "Skipping duplicate file assignment: <path>"

#### Scenario: Track processed files per sub-agent
- **GIVEN** a sub-agent completes its analysis
- **WHEN** processing results
- **THEN** the command SHALL record which files were processed
- **AND** use this information to prevent redundant analysis in future phases

#### Scenario: Deduplication across parallel scanners
- **GIVEN** multiple scanners (e.g., Quality Scanner, Security Scanner) are running in parallel
- **WHEN** a scanner returns findings
- **THEN** the command SHALL check each finding against findings already returned by other scanners
- **AND** skip duplicate findings (same file:line:severity combination)
- **AND** note count of duplicates skipped in report

### Requirement: Convergence Checkpoints

Commands with multi-phase analysis SHALL emit explicit convergence checkpoints that signal the transition between analysis states.

#### Scenario: Discovery phase completion
- **GIVEN** a command is in DISCOVERY phase (e.g., parsing specs, extracting requirements)
- **WHEN** all required data has been collected
- **THEN** the command SHALL emit: `[GOOST:CHECKPOINT:DISCOVERY_COMPLETE requirements=<count> scenarios=<count>]`
- **AND** only then proceed to the next phase

#### Scenario: Synthesis phase completion
- **GIVEN** a command is in SYNTHESIS phase (e.g., aggregating findings, cross-referencing)
- **WHEN** all findings have been aggregated and deduplicated
- **THEN** the command SHALL emit: `[GOOST:CHECKPOINT:SYNTHESIS_COMPLETE findings=<count> duplicates=<count>]`
- **AND** only then proceed to report generation

#### Scenario: Missing checkpoint blocks progress
- **GIVEN** a command is waiting for a checkpoint
- **WHEN** the expected checkpoint is not received
- **THEN** the command SHALL continue waiting or timeout
- **AND** NOT proceed to the next phase without the checkpoint or timeout
- **AND** note the missing checkpoint in output

#### Scenario: Timeout fallback for missing checkpoint
- **GIVEN** a command is waiting for a phase completion checkpoint
- **WHEN** the timeout threshold is reached (default: 5 minutes) without checkpoint
- **THEN** the command SHALL emit warning: "Phase <X> timed out, proceeding with available findings"
- **AND** advance to the next phase with whatever findings are available
- **AND** note the timeout in the report

#### Scenario: Checkpoint validation
- **GIVEN** a checkpoint marker is received
- **WHEN** validating the checkpoint
- **THEN** the command SHALL verify the checkpoint contains required fields
- **AND** reject malformed checkpoints with a warning
- **AND** continue waiting for valid checkpoint

### Requirement: Fallback Strategy on Sub-Agent Failure

Commands that spawn sub-agents SHALL define fallback strategies for when sub-agents fail, preventing indefinite retry loops.

#### Scenario: First sub-agent failure
- **GIVEN** a sub-agent fails (timeout, error, invalid response)
- **WHEN** it is the first failure for that analysis dimension
- **THEN** the command SHALL retry with an adjusted prompt
- **AND** note the retry in output: "Retrying <dimension> analysis (attempt 1/2)"

#### Scenario: Second sub-agent failure triggers fallback
- **GIVEN** a sub-agent fails for the second time
- **WHEN** the retry also fails
- **THEN** the command SHALL activate fallback strategy:
  - Simplify the task (e.g., reduce scope)
  - Use direct file reading instead of sub-agent
  - Skip the dimension and note as INCOMPLETE
- **AND** output: "Fallback activated for <dimension>: <strategy>"

#### Scenario: All retries exhausted with no fallback
- **GIVEN** all retries have failed for a sub-agent
- **AND** no viable fallback strategy exists
- **WHEN** the command must proceed
- **THEN** the command SHALL mark that dimension as FAILED
- **AND** continue with other dimensions
- **AND** note in report: "<dimension> analysis FAILED - manual review required"

#### Scenario: Sub-agent failure count tracking
- **GIVEN** a sub-agent fails for a specific analysis dimension
- **WHEN** counting failures
- **THEN** the command SHALL track failures per dimension
- **AND** trigger fallback after 2 consecutive failures (not 3 - commands need faster fallback)
- **AND** reset failure count when a sub-agent succeeds

### Requirement: Novelty Detection for Parallel Analysis

Commands with parallel sub-agents SHALL detect and skip redundant analysis to prevent token waste.

#### Scenario: Skip already-covered requirements
- **GIVEN** a second sub-agent is being tasked with analyzing requirements
- **WHEN** those requirements were already analyzed by the first sub-agent
- **THEN** the command SHALL skip assigning those requirements
- **AND** note in output: "Skipping <N> requirements already analyzed"

#### Scenario: Track unique findings
- **GIVEN** multiple sub-agents return findings
- **WHEN** aggregating findings
- **THEN** the command SHALL track unique findings by file:line:severity
- **AND** skip findings that match already-reported ones
- **AND** report duplicate count in summary

#### Scenario: Novelty penalty for repeated analysis
- **GIVEN** a sub-agent attempts to analyze files that were already analyzed
- **WHEN** detecting redundant work
- **THEN** the command SHALL warn: "Skipping redundant analysis of <file>"
- **AND** NOT charge tokens for the redundant analysis (by not assigning it)

#### Scenario: Novelty scoring for findings
- **GIVEN** findings are being prioritized for the report
- **WHEN** sorting findings
- **THEN** the command SHALL prefer unique findings over duplicates
- **AND** de-prioritize findings that match patterns already reported
