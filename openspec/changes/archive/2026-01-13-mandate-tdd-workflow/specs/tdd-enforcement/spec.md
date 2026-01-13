# TDD Enforcement Specification

## Purpose
Defines the requirements for mandatory Test-Driven Development (TDD) within the Goost protocol.

## ADDED Requirements

### Requirement: Mandatory Test Plan
Every Goost contract SHALL include a `TEST PLAN` section containing verifiable test scenarios.

#### Scenario: Contract created without test plan
- **GIVEN** an agent attempts to establish a contract
- **AND** the contract block lacks a `TEST PLAN` section
- **THEN** the protocol SHALL consider the contract invalid
- **AND** the agent SHOULD prompt the user to add a test plan

#### Scenario: Contract created with test plan
- **GIVEN** an agent establishes a contract
- **AND** the contract block includes a `TEST PLAN` section
- **THEN** the contract SHALL be considered valid

### Requirement: TDD Protocol Enforcement (RSTC)
The agent SHALL follow the Requirement-Spec-Test-Code sequence, providing raw log provenance for each phase.

#### Scenario: Red/Green Phase sequence
- **GIVEN** a contract is active
- **WHEN** the agent works on criterion C1
- **THEN** the agent MUST provide **Red Phase Evidence** (failing test logs)
- **AND** the agent MUST then provide **Green Phase Evidence** (passing test logs)
- **AND** the criterion SHALL NOT be marked `[x]` until both are provided.

#### Scenario: TDD sequence violation (Green before Red)
- **GIVEN** a contract is active
- **WHEN** the agent provides Green Phase evidence for C1 without prior Red Phase evidence
- **THEN** the protocol SHALL flag a TDD violation
- **AND** the criterion SHALL remain `[ ]`
- **AND** the agent SHALL be prompted to justify the skip or provide Red evidence.

### Requirement: Evidence Provenance
Test evidence MUST include the raw command string and unedited stdout/stderr output.

#### Scenario: Summarized evidence (Anecdotal)
- **GIVEN** an agent provides evidence: "Tests pass locally"
- **WHEN** reviewing the contract status
- **THEN** the evidence SHALL be considered INVALID
- **AND** the agent SHALL be required to provide raw logs.

#### Scenario: Raw Provenance
- **GIVEN** an agent provides evidence: `npm test tests/auth.ts -> exit 0 | logs: [raw output]`
- **THEN** the evidence SHALL be considered VALID.

### Requirement: TDD Status Indicators
The Goost plugin SHALL provide visual indicators of TDD compliance in the terminal tab.

#### Scenario: TDD Violation Indicator
- **GIVEN** a TDD violation is detected
- **WHEN** updating the terminal state
- **THEN** the tab title SHALL include `⚠️🧪 TDD VIOLATION`
- **AND** the tab color SHALL change to Orange/Yellow

#### Scenario: TDD OK Indicator
- **GIVEN** TDD compliance is verified
- **WHEN** updating the terminal state
- **THEN** the tab title SHALL include `🧪 TDD OK` (optional)
- **AND** the tab color SHALL remain or return to its standard active state (Red/Work)
