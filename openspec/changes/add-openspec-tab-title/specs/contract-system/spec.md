## ADDED Requirements

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
