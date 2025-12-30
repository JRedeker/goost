# Contract System - Sub-Agent Handling

## ADDED Requirements

### Requirement: Contract Context Enforcement

When a Goost contract is active and the agent spawns a sub-agent via the `task` tool, the sub-agent prompt MUST include a Contract Context Block containing the parent objective, assigned criterion, relevant constraints, and expected evidence.

#### Scenario: Sub-agent spawned with contract active
- **GIVEN** a Goost contract is active with objective "Implement user authentication"
- **WHEN** the agent spawns a sub-agent to search for existing auth patterns
- **THEN** the sub-agent prompt MUST include:
  - `PARENT CONTRACT OBJECTIVE: Implement user authentication`
  - `ASSIGNED CRITERION: <specific criterion>`
  - `CONSTRAINTS: <relevant constraints>`
  - `EVIDENCE NEEDED: <what to return>`

#### Scenario: Self-check before spawning
- **GIVEN** the agent is about to spawn a sub-agent
- **WHEN** a contract is active
- **THEN** the agent MUST answer three questions before spawning:
  1. Which specific criterion does this sub-agent address?
  2. What evidence will it return for criterion verification?
  3. Have constraints been included to prevent violations?

#### Scenario: Sub-agent spawned without contract context (error case)
- **GIVEN** a Goost contract is active
- **WHEN** the agent spawns a sub-agent WITHOUT the required Contract Context Block
- **THEN** the plugin SHOULD log a warning message indicating missing context
- **AND** the sub-agent results SHOULD still be processed but flagged as "unverified"
- **AND** the agent SHOULD include proper context in subsequent sub-agent prompts

### Requirement: Parallel Sub-Agent Orchestration

When spawning multiple sub-agents simultaneously, the agent MUST create a Sub-Agent Dispatch Plan documenting which criterion each sub-agent addresses, ensure non-overlapping scope, and systematically merge results.

#### Scenario: Parallel sub-agent dispatch
- **GIVEN** the agent needs to complete criteria 2, 3, and 4 in parallel
- **WHEN** spawning multiple sub-agents
- **THEN** the agent MUST create a dispatch plan table:
  | Sub-Agent | Type | Criterion | Expected Output |
- **AND** each sub-agent MUST address a different criterion or distinct part

#### Scenario: Sibling awareness in parallel dispatch
- **GIVEN** three sub-agents are being spawned in parallel
- **WHEN** constructing each sub-agent's prompt
- **THEN** the prompt MUST include awareness of sibling scope:
  - "YOUR SCOPE: <this agent's scope>"
  - "OTHER AGENTS HANDLING: <list of sibling scopes>"
  - "DO NOT: <work outside your scope>"

#### Scenario: Merging parallel results
- **GIVEN** multiple sub-agents return results
- **WHEN** processing the results
- **THEN** the agent MUST:
  1. Process each result independently
  2. Update corresponding criterion status
  3. Check for conflicts before proceeding
  4. Resolve any conflicts before marking criteria complete

#### Scenario: Partial parallel failure
- **GIVEN** three sub-agents are dispatched for criteria 2, 3, and 4
- **WHEN** sub-agents for criteria 2 and 4 succeed but sub-agent for criterion 3 fails
- **THEN** the agent MUST:
  1. Update criteria 2 and 4 as complete with evidence
  2. Track the failure for criterion 3 in the failure log
  3. NOT count this failure toward doom loop until retried for criterion 3 specifically
  4. Report partial success in the status block:
     - `[x] Criterion 2 (verified)`
     - `[ ] Criterion 3 (sub-agent failed - retry pending)`
     - `[x] Criterion 4 (verified)`

### Requirement: Sub-Agent Failure Escalation

When a sub-agent fails, the agent MUST track failures per criterion and escalate to doom loop state after 3 consecutive failures for the same criterion.

#### Scenario: First sub-agent failure
- **GIVEN** a sub-agent fails for criterion X
- **WHEN** it is the first failure for that criterion
- **THEN** the agent MUST:
  1. Log the failure reason
  2. Analyze the cause
  3. Retry with an adjusted prompt

#### Scenario: Second sub-agent failure
- **GIVEN** a sub-agent fails for criterion X
- **WHEN** it is the second failure for that criterion
- **THEN** the agent MUST:
  1. Try a different approach (change sub-agent type or scope)
  2. Include previous failure context in prompt:
    - `PREVIOUS ATTEMPT FAILED: <reason>`
    - `AVOID: <what caused failure>`

#### Scenario: Third sub-agent failure triggers doom loop
- **GIVEN** a sub-agent fails for criterion X
- **WHEN** it is the third failure for that criterion
- **THEN** the agent MUST:
  1. Emit `[GOOST:DOOM_LOOP]` marker
  2. Output "SUB-AGENT DOOM LOOP DETECTED"
  3. List the failure pattern
  4. Present options: more context, handle directly, mark blocked, or void contract
  5. Wait for user direction before proceeding

### Requirement: Sub-Agent Timeout Handling

The agent MUST be aware of sub-agent timeout thresholds and MUST provide recovery options when a sub-agent exceeds the defined thresholds.

**Timeout Thresholds:**
- `explore` sub-agents: 3 minutes (180 seconds)
- `general` sub-agents: 5 minutes (300 seconds)

#### Scenario: Sub-agent exceeds timeout threshold
- **GIVEN** a sub-agent of type `general` has been running for more than 5 minutes
- **WHEN** the elapsed time exceeds the 5-minute threshold
- **THEN** the agent MUST:
  1. Acknowledge the timeout condition
  2. Present recovery options to the user:
     - Continue waiting (task may be legitimately complex)
     - Attempt task directly without sub-agent
     - Break task into smaller sub-tasks
     - Mark criterion as blocked pending investigation

#### Scenario: Timeout recovery action taken
- **GIVEN** a sub-agent has timed out and the user selected "attempt task directly"
- **WHEN** the agent proceeds with the recovery action
- **THEN** the agent MUST:
  1. Log that sub-agent was bypassed due to timeout
  2. Attempt the task in the main agent context
  3. NOT count the timeout as a failure toward doom loop (different failure mode)
  4. Update criterion status based on direct attempt result

#### Scenario: Prevention through tight scoping
- **WHEN** spawning sub-agents
- **THEN** the agent MUST scope tasks tightly to prevent timeouts:
  - BAD: "Search the entire codebase for issues"
  - GOOD: "Search src/auth/ for deprecated API calls"
  - BAD: "Implement the complete feature"
  - GOOD: "Implement only the login endpoint"

### Requirement: Criteria Conflict Resolution

When sub-agents return conflicting results for the same criterion or overlapping work, the agent MUST flag the conflict and resolve it before marking any criterion complete.

#### Scenario: Evidence conflict detected
- **GIVEN** two sub-agents report different findings for criterion X
- **WHEN** Sub-agent A says "all tests pass" and Sub-agent B says "3 tests failing"
- **THEN** the agent MUST:
  1. Flag the conflict
  2. Verify independently (run the actual check)
  3. Update criterion based on verified truth

#### Scenario: Implementation conflict detected
- **GIVEN** two sub-agents modified overlapping code
- **WHEN** Sub-agent A modified lines 50-80 and Sub-agent B modified lines 60-90
- **THEN** the agent MUST:
  1. Read current file state
  2. Determine which changes to keep
  3. Manually merge if both needed
  4. Re-verify criterion after resolution

#### Scenario: Conflict status marker
- **GIVEN** a criterion has unresolved conflicts
- **WHEN** displaying the contract status block
- **THEN** the agent MUST use `[?]` marker instead of `[x]` or `[ ]`:
  - `[?] Criterion X (CONFLICT - needs resolution)`
- **AND** MUST NOT mark `[x]` until conflict is resolved
