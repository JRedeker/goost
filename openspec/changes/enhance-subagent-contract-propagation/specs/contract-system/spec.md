# Contract System - Sub-Agent Handling

## Implementation Boundary

This spec defines **agent behavior** (LLM guidance via instructions), not plugin automation. The plugin provides:
- Sub-agent count tracking (visual status)
- Basic failure logging (debug only)
- Contract preservation during compaction

The plugin does NOT:
- Enforce failure counts or doom loop triggers
- Validate sub-agent prompts for contract context
- Detect conflicts automatically

All enforcement is via instruction-based guidance that the LLM follows.

## ADDED Requirements

### Requirement: Contract Context Propagation

When a Goost contract is active and the agent spawns a sub-agent via the `task` tool, the sub-agent prompt SHOULD include contract context to ensure aligned work. This is advisory guidance, not a hard requirement.

#### Security Note

When propagating contract context to sub-agents, the agent SHALL NOT include raw credentials, API keys, or secrets. Reference sensitive values by name only (e.g., "uses the API key from .env") rather than including actual values.

#### Scenario: Sub-agent spawned with contract active
- **GIVEN** a Goost contract is active with objective "Implement user authentication"
- **WHEN** the agent spawns a sub-agent to search for existing auth patterns
- **THEN** the sub-agent prompt SHOULD include:
  - The parent contract objective
  - The specific criterion being addressed
  - Relevant constraints
  - What evidence to return

#### Scenario: Sub-agent spawned without contract context
- **GIVEN** a Goost contract is active
- **WHEN** the agent spawns a sub-agent WITHOUT contract context
- **THEN** sub-agent results SHALL still be processed
- **AND** the agent SHOULD include proper context in subsequent sub-agent prompts

### Requirement: Parallel Sub-Agent Coordination

When spawning multiple sub-agents simultaneously, the agent SHALL ensure each addresses a distinct scope to avoid conflicts.

#### Scenario: Parallel sub-agent dispatch
- **GIVEN** the agent needs to complete multiple criteria in parallel
- **WHEN** spawning multiple sub-agents
- **THEN** each sub-agent prompt MUST specify its scope clearly
- **AND** scopes SHOULD NOT overlap

#### Scenario: Merging parallel results
- **GIVEN** multiple sub-agents return results
- **WHEN** processing the results
- **THEN** the agent SHALL update each criterion independently
- **AND** check for conflicts before marking criteria complete

#### Scenario: Partial parallel failure
- **GIVEN** three sub-agents are dispatched for criteria 2, 3, and 4
- **WHEN** sub-agents for criteria 2 and 4 succeed but sub-agent for criterion 3 fails
- **THEN** the agent SHALL:
  1. Update criteria 2 and 4 as complete with evidence
  2. Track the failure for criterion 3
  3. Report partial success in the status block

### Requirement: Sub-Agent Failure Escalation

When a sub-agent fails, the agent SHALL track failures per criterion and escalate to doom loop state after 3 consecutive failures for the same criterion.

#### Failure Detection Guidance

The agent (not the plugin) interprets sub-agent results. A sub-agent result SHOULD be considered a **failure** if ANY of the following are true:
- Output is empty or does not address the assigned criterion
- Sub-agent explicitly reports a blocker (e.g., "Cannot proceed", "Unable to complete")
- Sub-agent returns a clear error without useful partial results

A sub-agent result is **NOT a failure** if:
- Output discusses errors in the codebase being analyzed (e.g., "found 3 error handling issues")
- Output provides useful partial results even with some errors
- Sub-agent completed the task but noted limitations

Note: The plugin performs basic failure logging but does NOT enforce failure counts. The 3-strike escalation is agent behavior guided by instructions.

#### Scenario: First sub-agent failure
- **GIVEN** a sub-agent fails for criterion X
- **WHEN** it is the first failure for that criterion
- **THEN** the agent SHALL:
  1. Log the failure reason
  2. Analyze the cause
  3. Retry with an adjusted prompt

#### Scenario: Second sub-agent failure
- **GIVEN** a sub-agent fails for criterion X
- **WHEN** it is the second failure for that criterion
- **THEN** the agent SHALL:
  1. Try a different approach (change sub-agent type or scope)
  2. Include previous failure context in prompt

#### Scenario: Third sub-agent failure triggers doom loop
- **GIVEN** a sub-agent fails for criterion X
- **WHEN** it is the third failure for that criterion
- **THEN** the agent SHALL:
  1. Emit `[GOOST:DOOM_LOOP]` marker
  2. Output "SUB-AGENT DOOM LOOP DETECTED"
  3. Present options to user
  4. Wait for user direction before proceeding

### Requirement: Tight Task Scoping

The agent SHALL scope sub-agent tasks tightly to ensure focused, efficient execution.

#### Scenario: Scoping guidance
- **WHEN** spawning sub-agents
- **THEN** the agent SHALL prefer narrow, focused tasks:
  - BAD: "Search the entire codebase for issues"
  - GOOD: "Search src/auth/ for deprecated API calls"
  - BAD: "Implement the complete feature"
  - GOOD: "Implement only the login endpoint"

### Requirement: Conflict Resolution

When sub-agents return conflicting results, the agent SHALL resolve conflicts before marking criteria complete.

#### Scenario: Conflict detected
- **GIVEN** sub-agents return contradictory evidence or overlapping changes
- **WHEN** processing results
- **THEN** the agent SHALL:
  1. Flag the conflict with `[?]` marker in status block
  2. Verify independently or reconcile the difference
  3. Only mark `[x]` after resolution

#### Scenario: Multiple conflicts from parallel sub-agents
- **GIVEN** 3+ sub-agents return with overlapping or contradictory results
- **WHEN** processing results
- **THEN** the agent SHALL:
  1. Flag ALL conflicting criteria with `[?]` marker
  2. List conflicts explicitly in status block
  3. Resolve conflicts one at a time, starting with highest priority criterion

#### Scenario: Late conflict detection
- **GIVEN** a criterion was marked `[x]` complete
- **WHEN** a later sub-agent returns evidence contradicting that criterion
- **THEN** the agent SHALL:
  1. Revert the criterion to `[?]` status
  2. Note the contradiction in the status block
  3. Re-verify before marking complete again

### Requirement: Documentation Verification for Implementation Sub-Agents

When spawning sub-agents for implementation work involving external libraries or frameworks, the agent SHALL prompt sub-agents to verify patterns against live documentation when documentation tools are available.

#### Scenario: Implementation sub-agent with library dependencies
- **GIVEN** a sub-agent is spawned to implement code using external libraries
- **WHEN** the sub-agent has access to documentation tools (Context7, Firecrawl, etc.)
- **THEN** the sub-agent prompt SHOULD include a reminder to verify patterns against current docs

#### Scenario: Lightweight prompt addition
- **GIVEN** the agent is spawning an implementation sub-agent
- **WHEN** constructing the prompt
- **THEN** the agent MAY add a simple reminder:
  ```
  NOTE: You have access to Context7 and other documentation tools.
  For external libraries, verify patterns against current docs before implementing.
  ```

#### Scenario: Contract evidence notation
- **GIVEN** a sub-agent returns implementation
- **WHEN** patterns were not verified against documentation
- **THEN** the agent SHOULD note this in criterion evidence:
  - `[x] Criterion X (implemented - recommend manual pattern review)`
- **AND** this is advisory, not blocking
