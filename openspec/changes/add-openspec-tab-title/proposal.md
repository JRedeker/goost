# Change: Add OpenSpec Change Name to Terminal Tab Title

## Why

When a user runs `/openspec-apply my-feature` or other `/openspec-*` commands with a change ID argument, there is no visual indicator of which spec is being worked on. This makes it difficult to identify sessions at a glance when working with multiple terminal tabs.

## What Changes

- Listen for `session.updated` events to detect OpenSpec change names from the session title
- OpenCode already maintains session titles like "Preparing OpenSpec add-feature" in the sidebar
- Extract the change name using regex pattern matching on the session title
- Display the change name in the terminal tab title alongside the existing project name and status emoji
- Update title format to: `projectName | emoji changeName [progress]`

## Implementation Approach

**Evolution of approach:**
1. Initial: `command.executed` event - fires AFTER work completes (too late)
2. Second: `message.updated` user messages - `info.parts` was always empty
3. Third: `message.part.updated` event - detected template placeholder instead of actual value
4. **Final: `session.updated` event** - session title already contains the change name

**Key insight:** OpenCode maintains a sidebar session title that gets set early in the flow. We tap into this via the `session.updated` event.

## Impact

- Affected specs: `contract-system` (new requirement for OpenSpec tab title tracking)
- Affected code:
  - `plugin/types.ts` - New `SESSION_UPDATED` event type and schema
  - `plugin/index.ts` - New `handleSessionUpdated` handler
  - `plugin/terminal.ts` - Updated `updateTitle()` format
  - `plugin/contract.ts` - Updated `extractOpenSpecChange()` with additional patterns (fallback)
