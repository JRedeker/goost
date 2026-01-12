# plugin Specification

## Purpose
TBD - created by archiving change add-loop-anomaly-detection. Update Purpose after archive.
## Requirements
### Requirement: Loop Anomaly Detection

The plugin SHALL detect anomalous loop patterns in AI agent responses and terminate runaway generation.

Detection triggers when BOTH conditions are met:
1. Response size exceeds threshold (default: 20,000 characters)
2. Response contains repetitive content (any 80+ character substring appearing 3+ times)

When an anomaly is detected:
- The plugin SHALL call `client.session.abort()` to terminate the response
- The plugin SHALL update status to `doom_loop` (reusing existing status)
- The plugin SHALL optionally emit a terminal bell (if GOOST_ANOMALY_BELL=1)
- Debug logs SHALL include anomaly details when GOOST_DEBUG=1

<!-- Source: Research validated SDK abort API per https://opencode.ai/docs/sdk/ -->

#### Scenario: Text repetition detected and aborted

- **GIVEN** an AI response is streaming
- **WHEN** the response exceeds 20,000 characters
- **AND** any 80+ character substring appears 3 or more times
- **THEN** the plugin SHALL call `client.session.abort()` to terminate the response
- **AND** the plugin SHALL check the return value to confirm abort succeeded
- **AND** the plugin SHALL set status to `doom_loop`
- **AND** debug logs SHALL record the repeated substring (truncated)

#### Scenario: SDK abort fails

- **GIVEN** an anomaly is detected
- **WHEN** `client.session.abort()` returns false or throws
- **THEN** the plugin SHALL log a warning "Abort may have failed"
- **AND** the plugin SHALL still set status to `doom_loop`
- **AND** the plugin SHALL NOT retry the abort automatically

#### Scenario: Large response without repetition

- **GIVEN** an AI response is streaming
- **WHEN** the response exceeds 20,000 characters
- **AND** no 80+ character substring appears 3 or more times
- **THEN** the plugin SHALL NOT abort the response
- **AND** the response SHALL continue streaming normally

#### Scenario: Small response with repetition

- **GIVEN** an AI response is streaming
- **WHEN** the response is under 20,000 characters
- **THEN** the plugin SHALL NOT perform repetition analysis
- **AND** the response SHALL continue streaming normally

#### Scenario: Response with special regex characters

- **GIVEN** an AI response contains special regex characters (e.g., `.*+?^${}()|[]\\`)
- **WHEN** checking for substring repetition
- **THEN** the plugin SHALL escape special characters before matching
- **AND** detection SHALL work correctly without regex errors

#### Scenario: Abort during tool execution prevented

- **GIVEN** a tool is currently executing
- **WHEN** an anomaly is detected
- **THEN** the plugin SHALL NOT abort until tool execution completes
- **AND** the abort SHALL be queued and executed after tool completion

#### Scenario: Tool execution timeout with queued abort

- **GIVEN** a tool is executing and an anomaly was detected
- **AND** the abort was queued pending tool completion
- **WHEN** the tool execution times out or fails
- **THEN** the queued abort SHALL be discarded
- **AND** debug logs SHALL record "Queued abort discarded due to tool failure"
- **AND** the plugin SHALL NOT attempt abort after tool failure

### Requirement: Abort Throttling

The plugin SHALL prevent rapid repeated abort calls using state-based throttling.

Throttle behavior:
- After an abort, subsequent anomaly detections within the same streaming response SHALL NOT trigger additional abort calls
- Throttle state SHALL reset when session status changes (response completes or user resumes)

<!-- Source: Research recommended state-based throttle over time-based debounce -->

#### Scenario: Abort throttled within same response

- **GIVEN** an abort was triggered for the current response
- **WHEN** another anomaly is detected in the same response
- **THEN** no additional abort call SHALL be made
- **AND** debug logs SHALL indicate "Abort already triggered for this response"

#### Scenario: Throttle reset on new response

- **GIVEN** an abort was triggered for a previous response
- **WHEN** a new response begins streaming
- **THEN** the throttle state SHALL reset
- **AND** anomaly detection SHALL function normally

### Requirement: Optional Terminal Bell

The plugin SHALL optionally emit an audible terminal bell when anomalies are detected.

Bell behavior:
- Controlled by GOOST_ANOMALY_BELL environment variable (default: "1" = enabled)
- Uses ASCII BEL character (0x07) written to stdout
- Maximum one bell per anomaly detection (rate limited)

<!-- Source: Research found terminal bell support varies; kept as optional -->

#### Scenario: Bell emitted when enabled

- **GIVEN** GOOST_ANOMALY_BELL is "1" or unset
- **WHEN** an anomaly is detected
- **THEN** the plugin SHALL write BEL character to stdout

#### Scenario: Bell disabled

- **GIVEN** GOOST_ANOMALY_BELL is "0"
- **WHEN** an anomaly is detected
- **THEN** no BEL character SHALL be emitted

### Requirement: Environment Variable Configuration

The plugin SHALL support threshold configuration via environment variables.

Environment variables:
- `GOOST_ANOMALY_SIZE`: Size threshold in characters (default: "20000")
- `GOOST_ANOMALY_BELL`: Enable terminal bell, "1" or "0" (default: "1")

<!-- Source: Research recommended env vars over config file for v1 simplicity -->

#### Scenario: Custom size threshold

- **GIVEN** GOOST_ANOMALY_SIZE is set to "30000"
- **WHEN** a response reaches 25,000 characters with repetitive content
- **THEN** the plugin SHALL NOT trigger anomaly detection
- **AND** detection SHALL only occur if response exceeds 30,000 characters

#### Scenario: Default thresholds used

- **GIVEN** no GOOST_ANOMALY_* environment variables are set
- **WHEN** the plugin initializes
- **THEN** default values SHALL be used (size: 20000, bell: enabled)

#### Scenario: Invalid size threshold value

- **GIVEN** GOOST_ANOMALY_SIZE is set to a non-numeric value (e.g., "invalid")
- **WHEN** the plugin initializes
- **THEN** the plugin SHALL fall back to the default value (20000)
- **AND** debug logs SHALL warn about the invalid configuration

