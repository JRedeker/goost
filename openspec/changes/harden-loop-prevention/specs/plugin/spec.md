# MODIFIED Requirements for plugin Capability

This delta adds loop prevention state management to the plugin capability.

## ADDED Requirements

### Requirement: Sub-Agent Work Tracking

The plugin SHALL track sub-agent work progress to enable deduplication and convergence detection across command phases.

#### Scenario: Record sub-agent work scope
- **GIVEN** a sub-agent is spawned for a specific criterion
- **WHEN** the sub-agent begins execution
- **THEN** the plugin SHALL record the assigned scope (files, requirements)
- **AND** store it in `state.subAgentWork` keyed by criterionId

#### Scenario: Update work on sub-agent completion
- **GIVEN** a sub-agent completes and returns findings
- **WHEN** processing the completion
- **THEN** the plugin SHALL update the work record with:
  - Processed file paths
  - Finding count
  - Completion status
- **AND** make this available for deduplication checks

#### Scenario: Retrieve work for deduplication
- **GIVEN** a command needs to check for duplicate work
- **WHEN** querying the plugin state
- **THEN** the plugin SHALL return the work record for a criterion
- **AND** indicate which files were already processed
- **AND** NOT expose raw findings (only that work was done)

#### Scenario: Clear work on criterion completion
- **GIVEN** a criterion is marked complete in the contract
- **WHEN** processing the completion
- **THEN** the plugin SHALL clear the work record for that criterion
- **AND** free the associated memory

#### Scenario: Work tracking persistence
- **GIVEN** the session is compacted
- **WHEN** restoring state
- **THEN** the plugin SHALL preserve `subAgentWork` state
- **AND** ensure work tracking survives context summarization

### Requirement: Failure Counter Reset on Success

The plugin SHALL clear failure counters when a criterion succeeds, preventing spurious doom loop warnings.

#### Scenario: Clear failures on criterion completion
- **GIVEN** a criterion has failure count > 0
- **WHEN** the criterion is marked complete (`[x]`) in the contract
- **THEN** the plugin SHALL reset the failure count to 0
- **AND** remove the criterion from the failure tracking map

#### Scenario: Clear failures on contract fulfillment
- **GIVEN** a contract is fulfilled
- **WHEN** processing the fulfillment
- **THEN** the plugin SHALL clear ALL failure counters
- **AND** reset the `subAgentFailures` map to empty

#### Scenario: Clear failures on contract void
- **GIVEN** a contract is voided by the user
- **WHEN** processing the void
- **THEN** the plugin SHALL clear ALL failure counters
- **AND** reset the `subAgentFailures` map to empty

#### Scenario: Failure count persists until completion
- **GIVEN** a criterion has failure count > 0
- **WHEN** the criterion is NOT complete
- **THEN** the failure count SHALL persist across responses
- **AND** be available for doom loop detection

### Requirement: Convergence State Management

The plugin SHALL maintain convergence state to track analysis phase progress and enforce checkpoint transitions.

#### Scenario: Initialize convergence state for contract
- **GIVEN** a contract is created with analysis phases
- **WHEN** the contract becomes active
- **THEN** the plugin SHALL initialize convergence state with:
  - Current phase: `DISCOVERY`
  - Phase progress: 0%
  - Checkpoints received: []

#### Scenario: Validate checkpoint for phase transition
- **GIVEN** a command emits a checkpoint marker
- **WHEN** the plugin receives the marker
- **THEN** the plugin SHALL validate:
  - Checkpoint format is correct
  - Checkpoint matches current phase
  - Findings count is reasonable (not zero when expected)
- **AND** update convergence state if valid

#### Scenario: Reject invalid checkpoint
- **GIVEN** a command emits a malformed checkpoint
- **WHEN** the plugin validates the checkpoint
- **THEN** the plugin SHALL reject the checkpoint
- **AND** log a warning: "Invalid checkpoint for phase <X>"
- **AND** NOT update convergence state

#### Scenario: Advance phase on valid checkpoint
- **GIVEN** a valid checkpoint is received for current phase
- **WHEN** validation succeeds
- **THEN** the plugin SHALL advance the phase:
  - DISCOVERY -> MAPPING
  - MAPPING -> SYNTHESIS
  - SYNTHESIS -> COMPLETE
- **AND** update convergence state with new phase
- **AND** record checkpoint timestamp

#### Scenario: Query current convergence state
- **GIVEN** the plugin has convergence state
- **WHEN** a command queries the state
- **THEN** the plugin SHALL return:
  - Current phase name
  - Progress percentage
  - Last checkpoint timestamp
  - Phase history

#### Scenario: Reset convergence state on new contract
- **GIVEN** convergence state exists for a previous contract
- **WHEN** a new contract becomes active
- **THEN** the plugin SHALL reset convergence state
- **AND** initialize for the new contract's phases

### Requirement: Doom Loop Threshold Configuration

The plugin SHALL allow configurable doom loop thresholds for different command types.

#### Scenario: Default doom loop threshold
- **GIVEN** no custom threshold is configured
- **WHEN** a sub-agent fails
- **THEN** the plugin SHALL use default threshold of 3 failures
- **AND** emit doom loop warning after 3rd failure

#### Scenario: Command-specific threshold
- **GIVEN** a command sets custom threshold in the contract
- **WHEN** tracking sub-agent failures
- **THEN** the plugin SHALL use the command-specific threshold
- **AND** emit doom loop warning after N failures (where N is custom)

#### Scenario: Threshold override via environment
- **GIVEN** environment variable `GOOST_DOOM_LOOP_THRESHOLD` is set
- **WHEN** initializing the plugin
- **THEN** the plugin SHALL use this as default threshold
- **AND** override the hardcoded default of 3

#### Scenario: Threshold for analysis commands
- **GIVEN** an analysis command (openspec-audit, openspec-review) is running
- **WHEN** sub-agents fail
- **THEN** the plugin SHALL use analysis threshold of 2 failures
- **AND** trigger fallback strategy earlier for analysis work

### Requirement: Loop Anomaly Detection

The plugin SHALL detect loop anomalies in agent responses and trigger user intervention.

#### Scenario: Detect repetitive content patterns
- **GIVEN** an agent response exceeds 20,000 characters
- **WHEN** analyzing the response for anomalies
- **THEN** the plugin SHALL check for repetitive substrings (80+ chars appearing 3+ times)
- **AND** emit anomaly detection result

#### Scenario: Abort on loop detection
- **GIVEN** loop anomaly is detected in agent response
- **WHEN** the detection threshold is reached
- **THEN** the plugin SHALL:
  - Emit terminal bell if enabled
  - Mark the response as anomalous
  - Suggest doom loop state to agent

#### Scenario: Configure anomaly detection sensitivity
- **GIVEN** environment variables control anomaly detection
- **WHEN** initializing the plugin
- **THEN** the plugin SHALL load:
  - `GOOST_ANOMALY_SIZE`: Response size threshold (default 20000)
  - `GOOST_ANOMALY_BELL`: Enable terminal bell (default true)

#### Scenario: Anomaly state reset on new response
- **GIVEN** anomaly state exists from previous response
- **WHEN** a new agent response begins
- **THEN** the plugin SHALL reset anomaly detection state
- **AND** prepare for fresh analysis
