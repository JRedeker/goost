# Slash Commands Spec Delta

## ADDED Requirements

### Requirement: Positive Instruction Framing

Slash command instructions SHALL prefer positive framing over negative framing to improve LLM instruction-following reliability.

**Positive framing** tells the agent what to do. **Negative framing** tells the agent what not to do.

| Negative (avoid) | Positive (prefer) |
|------------------|-------------------|
| "Do NOT emit status markers" | "Return findings directly" |
| "Never skip the status block" | "Always include a status block" |
| "Avoid multi-paragraph explanations" | "Pair intent with immediate tool call" |
| "CANNOT declare complete until X" | "Declare complete when X" |

**Exceptions** (keep as negative):
- Safety-critical constraints in contract CONSTRAINTS sections (e.g., "MUST NOT: Break existing functionality")
- User authority statements may use negative framing for emphasis

#### Scenario: Sub-agent context block uses positive framing
- **GIVEN** a slash command that spawns sub-agents
- **WHEN** the command includes a sub-agent context block
- **THEN** the block SHALL use positive framing (e.g., "Return findings directly" instead of "Do NOT emit markers")

#### Scenario: Anti-loop protocol uses positive framing
- **GIVEN** a slash command with an anti-loop protocol
- **WHEN** the protocol instructs the agent on post-synthesis behavior
- **THEN** the instruction SHALL use positive framing (e.g., "Proceed directly to aggregation" instead of "Do NOT re-explain findings")

#### Scenario: Completion criteria use positive framing
- **GIVEN** a slash command with completion criteria
- **WHEN** the criteria define when completion is allowed
- **THEN** the criteria SHALL use positive framing (e.g., "Declare complete when all criteria are [x]" instead of "CANNOT declare complete until...")

#### Scenario: Safety constraints preserved as negative
- **GIVEN** a contract CONSTRAINTS section
- **WHEN** the constraint defines a safety-critical boundary
- **THEN** the constraint MAY use negative framing (e.g., "MUST NOT: Delete production data")

#### Scenario: Semantic equivalence maintained after conversion
- **GIVEN** a negative instruction "Do NOT skip verification steps"
- **WHEN** converted to positive framing "Complete all verification steps"
- **THEN** the converted instruction SHALL preserve the original behavioral intent
- **AND** no edge cases of the original instruction SHALL be lost in conversion

#### Scenario: Mixed content with unconvertible negatives
- **GIVEN** a slash command contains both convertible negatives (procedural) and safety negatives
- **WHEN** the command is reviewed for positive framing
- **THEN** procedural negatives SHALL be converted to positive equivalents
- **AND** safety negatives SHALL be preserved with explanatory comment if not in CONSTRAINTS section
