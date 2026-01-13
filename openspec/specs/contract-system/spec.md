# contract-system Specification

## Purpose

The contract-system capability defines the behavior of Goost's immutable contract enforcement mechanism. This includes automatic commit creation on contract fulfillment, conventional commit message derivation from objectives, changelog entry generation, sub-agent contract context propagation, and failure escalation protocols.
## Requirements
### Requirement: Contract Completion Commit
When a contract is fulfilled (all criteria verified with evidence), the agent SHALL automatically create an atomic git commit containing all contract-related changes.

The commit MUST:
- Include all staged and unstaged changes related to the contract work
- Use a conventional commit message derived from the contract objective
- Be skipped if there are no changes to commit (clean working tree)
- Exclude CHANGELOG.md (updated separately after commit to include correct hash)
- **PROHIBITED**: SHALL NOT be created unless **Red Phase (failure)** and **Green Phase (success)** raw provenance is provided for all criteria.

#### Scenario: Contract completion with valid TDD evidence
- **GIVEN** all criteria are marked `[x]`
- **AND** valid Red Phase and Green Phase evidence is provided for each criterion
- **WHEN** the agent declares CONTRACT FULFILLED
- **THEN** the agent SHALL automatically create an atomic git commit
- **AND** the commit message SHALL follow conventional commit standards
- 
#### Scenario: Contract completion without test evidence
- **GIVEN** all criteria are marked `[x]`
- **AND** no evidence of test execution is provided in the session
- **WHEN** the agent attempts to declare CONTRACT FULFILLED
- **THEN** the protocol SHALL block the fulfillment
- **AND** the agent SHOULD prompt the user to run tests and provide evidence

### Requirement: Conventional Commit Derivation

The agent SHALL derive the conventional commit type from the contract objective using these rules:

| Objective Pattern | Commit Type |
|-------------------|-------------|
| "Add", "Implement", "Create", "Introduce" | `feat:` |
| "Fix", "Resolve", "Repair", "Correct", "Patch" | `fix:` |
| "Refactor", "Restructure", "Reorganize", "Clean up", "Simplify" | `refactor:` |
| "Optimize", "Improve performance", "Speed up" | `perf:` |
| "Update", "Modify", "Change", "Adjust" + bug/error/issue context | `fix:` |
| "Update", "Modify", "Change", "Adjust" + feature/enhancement context | `feat:` |
| "Update", "Modify", "Change", "Adjust" (ambiguous) | `chore:` |
| "Remove", "Delete", "Deprecate" | `refactor:` |
| "Document", "Add docs", "Update README", "Write docs" | `docs:` |
| "Test", "Add tests", "Improve coverage", "Write tests" | `test:` |
| "Configure", "Setup", "Initialize", "Bootstrap" | `chore:` |
| "Build", "Bundle", "Compile", "Package" | `build:` |
| "CI", "Pipeline", "Workflow", "Deploy config" | `ci:` |
| "Format", "Lint", "Style", "Prettify" | `style:` |
| Default (no clear match) | `chore:` |

**Context Detection for Update/Modify:**
- **Bug context keywords**: "bug", "error", "issue", "broken", "failing", "crash", "wrong", "incorrect"
- **Feature context keywords**: "feature", "enhancement", "new", "capability", "support", "enable"
- If neither context is detected, default to `chore:` (safe, non-semantic default)

The commit message body MAY include:
- List of completed criteria
- Contract ID or reference (if applicable)

#### Scenario: Feature objective derivation

- **GIVEN** contract objective "Implement dark mode toggle"
- **WHEN** deriving commit message
- **THEN** commit type is `feat:`
- **AND** message is `feat: implement dark mode toggle`

#### Scenario: Bug fix objective derivation

- **GIVEN** contract objective "Fix authentication timeout issue"
- **WHEN** deriving commit message
- **THEN** commit type is `fix:`
- **AND** message is `fix: authentication timeout issue`

#### Scenario: Documentation objective derivation

- **GIVEN** contract objective "Document API endpoints"
- **WHEN** deriving commit message
- **THEN** commit type is `docs:`
- **AND** message is `docs: document API endpoints`

#### Scenario: Performance objective derivation

- **GIVEN** contract objective "Optimize database query performance"
- **WHEN** deriving commit message
- **THEN** commit type is `perf:`
- **AND** message is `perf: optimize database query performance`

#### Scenario: Build system objective derivation

- **GIVEN** contract objective "Configure webpack for production builds"
- **WHEN** deriving commit message
- **THEN** commit type is `build:`
- **AND** message is `build: configure webpack for production builds`

#### Scenario: CI/CD objective derivation

- **GIVEN** contract objective "Add GitHub Actions workflow for testing"
- **WHEN** deriving commit message
- **THEN** commit type is `ci:`
- **AND** message is `ci: add GitHub Actions workflow for testing`

#### Scenario: Style/formatting objective derivation

- **GIVEN** contract objective "Apply prettier formatting to codebase"
- **WHEN** deriving commit message
- **THEN** commit type is `style:`
- **AND** message is `style: apply prettier formatting to codebase`

#### Scenario: Ambiguous update objective - bug context

- **GIVEN** contract objective "Update error handling for login failures"
- **WHEN** deriving commit message
- **AND** objective contains bug context keyword "error"
- **THEN** commit type is `fix:`
- **AND** message is `fix: update error handling for login failures`

#### Scenario: Ambiguous update objective - feature context

- **GIVEN** contract objective "Update API to support pagination"
- **WHEN** deriving commit message
- **AND** objective contains feature context keyword "support"
- **THEN** commit type is `feat:`
- **AND** message is `feat: update API to support pagination`

#### Scenario: Ambiguous update objective - no context

- **GIVEN** contract objective "Update configuration values"
- **WHEN** deriving commit message
- **AND** no bug or feature context keywords are present
- **THEN** commit type is `chore:`
- **AND** message is `chore: update configuration values`

---

### Requirement: Changelog Entry

When a contract is fulfilled, the agent SHALL append an entry to the project root `CHANGELOG.md` file following the [Keep a Changelog](https://keepachangelog.com/) format.

The entry MUST:
- Be added under the `## [Unreleased]` section (create if missing)
- Use the appropriate category: Added, Changed, Fixed, Deprecated, Removed, Security
- Include a concise description derived from the contract objective
- Reference the commit hash (short form)

The entry MUST NOT:
- Duplicate existing entries for the same work
- Be added for voided contracts

**Commit Type to Changelog Category Mapping:**

| Commit Type | Changelog Category |
|-------------|-------------------|
| `feat:` | Added |
| `fix:` | Fixed |
| `refactor:` | Changed |
| `perf:` | Changed |
| `docs:` | Changed |
| `build:` | Changed |
| `ci:` | Changed |
| `style:` | Changed |
| `chore:` | Changed |
| `test:` | Changed |
| Deprecation-related | Deprecated |
| Removal-related | Removed |
| Security-related | Security |

#### Scenario: New feature changelog entry

- **GIVEN** contract objective "Implement user authentication"
- **AND** commit hash `a1b2c3d`
- **WHEN** the agent updates CHANGELOG.md
- **THEN** entry is added under `### Added`
- **AND** entry text is `- Implement user authentication (a1b2c3d)`

#### Scenario: Bug fix changelog entry

- **GIVEN** contract objective "Fix login redirect loop"
- **AND** commit hash `e4f5g6h`
- **WHEN** the agent updates CHANGELOG.md
- **THEN** entry is added under `### Fixed`
- **AND** entry text is `- Fix login redirect loop (e4f5g6h)`

#### Scenario: CHANGELOG.md does not exist

- **GIVEN** no CHANGELOG.md file exists in project root
- **WHEN** the agent completes a contract
- **THEN** the agent creates CHANGELOG.md with standard Keep a Changelog header
- **AND** adds the `## [Unreleased]` section
- **AND** adds the entry under the appropriate category

#### Scenario: Unreleased section missing

- **GIVEN** CHANGELOG.md exists but has no `## [Unreleased]` section
- **WHEN** the agent completes a contract
- **THEN** the agent adds `## [Unreleased]` section at the top (below header)
- **AND** adds the entry under the appropriate category

#### Scenario: Duplicate entry prevention

- **GIVEN** contract objective "Implement user authentication"
- **AND** commit hash `a1b2c3d`
- **AND** CHANGELOG.md already contains entry "- Implement user authentication (a1b2c3d)"
- **WHEN** the agent attempts to update CHANGELOG.md
- **THEN** no duplicate entry is added
- **AND** the agent notes "Changelog entry already exists"

### Requirement: Contract Context Propagation

When a Goost contract is active and the agent spawns a sub-agent via the `task` tool, the agent SHALL consider including contract context to ensure aligned work. This is advisory guidance - the sub-agent will function without context, but context improves alignment.

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

### Requirement: OpenSpec Tab Title Tracking

When a user invokes an `/openspec-*` slash command with a change ID argument, the plugin SHALL detect the change name and display it in the terminal tab title for session identification.

The tab title format SHALL be: `projectName | statusEmoji statusText [progress] | changeName`

Detection SHALL support these patterns (in priority order):
1. Expanded template: `<UserRequest>change-id</UserRequest>` (primary - how OpenCode expands slash commands)
2. Direct command: `/openspec-xxx change-id` (fallback - if command not expanded)
3. Path reference: `openspec/changes/<change-id>/` (tertiary - from assistant messages)

The change name SHALL:
- Persist in the tab title until the contract is fulfilled or voided
- Be cleared when the contract ends (via `processContractEnd`)
- Support kebab-case identifiers (e.g., `add-feature-x`, `fix-auth-bug`)

#### Scenario: User invokes openspec-apply command
- **GIVEN** user invokes `/openspec-apply my-feature`
- **AND** the slash command template expands to include `<UserRequest>my-feature</UserRequest>`
- **WHEN** the plugin processes the user message
- **THEN** the plugin extracts `my-feature` as the OpenSpec change name
- **AND** the tab title updates to include `| my-feature`

#### Scenario: Tab title format with change name
- **GIVEN** project name is `goost`
- **AND** status is `work` with emoji rocket
- **AND** contract progress is `2/5`
- **AND** OpenSpec change is `add-auth`
- **WHEN** the tab title is updated
- **THEN** the title is `goost | rocket Working [2/5] | add-auth`

#### Scenario: Tab title format without change name
- **GIVEN** project name is `goost`
- **AND** status is `idle`
- **AND** no OpenSpec change is active
- **WHEN** the tab title is updated
- **THEN** the title is `goost | earth` (no change name appended)

#### Scenario: Change name cleared on contract end
- **GIVEN** an OpenSpec change `feature-x` is active in the tab title
- **WHEN** the contract is fulfilled or voided
- **THEN** the `openSpecChange` state is cleared
- **AND** the tab title no longer includes the change name

#### Scenario: Direct command detection (fallback)
- **GIVEN** user types `/openspec-prep fix-login-bug` directly
- **AND** the message is NOT expanded into `<UserRequest>` format
- **WHEN** the plugin processes the user message
- **THEN** the plugin extracts `fix-login-bug` using the command pattern fallback

#### Scenario: Path reference detection (tertiary)
- **GIVEN** an assistant message contains `openspec/changes/add-feature/proposal.md`
- **AND** no other detection patterns matched
- **WHEN** the plugin processes the assistant message
- **THEN** the plugin extracts `add-feature` from the path

#### Scenario: No OpenSpec pattern matches (error case)
- **GIVEN** a user message does not contain any OpenSpec command pattern
- **AND** the message does not contain `<UserRequest>` tags
- **AND** the message does not contain `openspec/changes/` paths
- **WHEN** the plugin processes the user message
- **THEN** the plugin returns `null` for the change name
- **AND** any existing `openSpecChange` state is preserved (not cleared)

#### Scenario: OpenSpec change already set (persistence)
- **GIVEN** `openSpecChange` state is already set to `existing-feature`
- **AND** a new message does not contain any OpenSpec patterns
- **WHEN** the plugin processes the message
- **THEN** the `openSpecChange` remains `existing-feature`
- **AND** the tab title continues to display `| existing-feature`

> **Note**: Error handling is minimal by design. Regex pattern failures are handled gracefully by returning `null`, which preserves existing state. No exceptions are thrown for malformed input.

