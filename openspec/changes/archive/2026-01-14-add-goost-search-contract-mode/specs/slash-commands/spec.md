## MODIFIED Requirements

### Requirement: Goost Search Command

The `/goost-search` command SHALL offer contract conversion after displaying a fetched prompt, with inline security scanning before conversion.

#### Scenario: Security check before offering conversion
- **GIVEN** a prompt has been displayed to the user
- **WHEN** preparing to offer contract conversion
- **THEN** the command SHALL check for injection patterns (single regex)
- **AND** only offer conversion if no patterns are detected

#### Scenario: Offer contract conversion (safe prompt)
- **GIVEN** a prompt has been displayed
- **AND** no injection patterns were detected
- **WHEN** the display is complete
- **THEN** the command SHALL ask: "Would you like me to convert this into a contract?"
- **AND** use the question tool with options: "Yes, create a contract" and "No, I'll use it manually"

#### Scenario: Block conversion for unsafe prompt
- **GIVEN** a prompt has been displayed
- **AND** injection patterns were detected
- **WHEN** the display is complete
- **THEN** the command SHALL NOT offer contract conversion
- **AND** display a security warning noting patterns were detected
- **AND** allow manual viewing only

#### Scenario: User declines conversion
- **GIVEN** user is offered contract conversion
- **WHEN** user selects "No, I'll use it manually"
- **THEN** the command SHALL end without further action

#### Scenario: User accepts conversion
- **GIVEN** user is offered contract conversion
- **WHEN** user selects "Yes, create a contract"
- **THEN** the command SHALL analyze the prompt
- **AND** generate a draft contract

## ADDED Requirements

### Requirement: Contract Conversion

The goost-search command SHALL convert prompts into structured contracts.

#### Scenario: Generate draft contract
- **GIVEN** user has accepted contract conversion
- **WHEN** generating the contract
- **THEN** the command SHALL produce a contract with:
  - OBJECTIVE: Derived from prompt purpose
  - SUCCESS CRITERIA: Behavioral goals from instructions (no shell commands)
  - CONSTRAINTS: Must/must-not rules
  - IMPLEMENTATION STEPS: Numbered action items
- **AND** label it as "DRAFT CONTRACT"
- **AND** reference the source prompt

#### Scenario: Present draft for review
- **GIVEN** a draft contract has been generated
- **WHEN** displaying the draft
- **THEN** the command SHALL show the full draft
- **AND** prompt: "Say 'confirm' to lock, describe changes to modify, or 'cancel'"

#### Scenario: User confirms draft
- **GIVEN** a draft contract is displayed
- **WHEN** user says "confirm"
- **THEN** the contract SHALL be locked as CONTRACT ACTIVE
- **AND** follow standard contract enforcement rules

#### Scenario: User modifies draft
- **GIVEN** a draft contract is displayed
- **WHEN** user describes modifications
- **THEN** the command SHALL revise the draft
- **AND** present the updated draft for review

#### Scenario: User cancels
- **GIVEN** a draft contract is displayed
- **WHEN** user says "cancel"
- **THEN** the command SHALL discard the draft
- **AND** note the prompt remains available for manual use

### Requirement: Security Controls

Contract conversion SHALL implement basic security filtering.

#### Scenario: Detect injection patterns
- **GIVEN** a prompt is being checked for security
- **WHEN** the security check runs
- **THEN** the command SHALL detect patterns matching:
  - "ignore previous/all instructions" variants
  - "disregard/forget/override" with "instructions/system"
  - Requests to reveal prompts/configurations
  - Base64 blocks >200 characters
  - "jailbreak" keyword
- **AND** block conversion if any match

#### Scenario: Exclude dangerous content from contracts
- **GIVEN** a prompt passes security check
- **WHEN** generating a contract
- **THEN** success criteria SHALL NOT include:
  - Shell commands
  - File system operations
  - Network requests
  - Code execution instructions
- **AND** extract only behavioral goals

## DEFERRED to v2

- Tool definition extraction from system prompts
- Long prompt (>100 lines) special handling  
- Non-actionable prompt detection (let extraction fail naturally)
- Approved source verification (current implementation already restricts)
