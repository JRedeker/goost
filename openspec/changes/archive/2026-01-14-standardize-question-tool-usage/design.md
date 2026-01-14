# Design: Standardize Question Tool Usage

## Context

Goost is a contract-based persistence protocol implemented as an OpenCode plugin. It uses markdown-based slash commands and instruction files to guide AI agent behavior. Currently, when agents need user input, they use various text-based prompting patterns that are inconsistent and require free-form text parsing.

OpenCode provides a built-in `mcp_question` tool that creates structured multiple-choice interactions with:
- Defined options with labels and descriptions
- Optional multi-select capability
- Automatic "Other" option for custom text input
- Consistent UI presentation

## Goals

1. **Consistent UX**: All user questions use the same interaction pattern
2. **Reduced parsing errors**: Structured responses eliminate ambiguous text interpretation
3. **Clear options**: Users see all available choices with descriptions
4. **Instruction clarity**: Agent instructions clearly mandate question tool usage

## Non-Goals

1. Plugin-level question handling (the question tool is an OpenCode built-in, not a Goost feature)
2. Custom question UI components
3. Changing the semantics of existing questions (only the presentation)

## Decisions

### Decision 1: Question Tool Parameters

> **Note**: `mcp_question` is an OpenCode-specific built-in tool. It provides similar functionality to MCP's Elicitation feature but is implemented as a tool rather than using the MCP client elicitation protocol. This is a pragmatic choice for CLI environments.

The `mcp_question` tool accepts:
```typescript
{
  questions: [{
    question: string,      // The full question text
    header: string,        // Short label (max 25 chars, prefer 2-4 words)
    options: [{
      label: string,       // Display text (1-5 words)
      description: string  // Explanation of choice
    }],
    multiple?: boolean     // Allow multi-select (default false)
  }]
}
```

**Approach**: Each question scenario will be mapped to this structure with:
- Clear, action-oriented labels
- Helpful descriptions explaining the consequence of each choice
- Recommended option listed first with "(Recommended)" suffix where applicable
- 2-5 options per question (aligned with Hick's Law for decision fatigue)

### Decision 2: Question Categories

| Question Type | Header | Example Options |
|---------------|--------|-----------------|
| Contract confirmation | "Confirm" | "Accept contract", "Suggest changes", "Cancel" |
| Remediation choice | "Fix Issues" | "Fix critical only", "Fix all issues", "Manual fix", "Skip" |
| Doom loop recovery | "Recovery" | "Try alternative", "Ask question", "Mark blocked", "Void contract" |
| Multiple match selection | "Select" | Dynamic list of matches |
| User pressure resistance | "Continue?" | "Continue work", "Void and accept partial" |

### Decision 3: Instruction File Updates

The `goost_instructions.md` file will be updated to:

1. **Add a new section**: "User Interaction Protocol" documenting question tool usage
2. **Include template examples**: Show how to construct question tool calls for common scenarios
3. **Mandate usage**: State that ALL user-facing questions MUST use `mcp_question`
4. **Update existing examples**: Replace text-based examples with question tool invocations

### Decision 4: Backward Compatibility

The question tool's "Other" option allows users to type custom responses, maintaining compatibility with users who prefer free-form input. No behavioral changes are required.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Question tool unavailable in some OpenCode versions | Explicit fallback protocol (see Decision 5) |
| Users prefer text-based interaction | "Other" option always available for custom input |
| Verbose instruction changes | Keep examples concise; use consistent patterns |

### Decision 5: Fallback Protocol

When `mcp_question` is unavailable (error `-32601` method not found, timeout, or version incompatibility):

1. **Detect failure**: Catch error from tool invocation
2. **Fall back to numbered list**: Present options as:
   ```
   Select an option (type number or describe your choice):
   1. [Option A] - Description
   2. [Option B] - Description
   3. [Other] - Type custom response
   ```
3. **Accept flexible input**: Parse number, option label, or free text
4. **Log warning**: Note that structured question tool was unavailable

This ensures graceful degradation while maintaining consistent interaction patterns.

## Migration Plan

1. Update `goost_instructions.md` with question tool requirement and examples
2. Update each slash command file to use question tool format
3. Update spec requirements to mandate question tool usage
4. Test each command flow manually

## Research Validation

This design was validated through architectural research (see `/openspec-research`):

### Validated ✅
- **2-5 options constraint**: Aligned with Hick's Law and UX research on decision fatigue
- **1-5 word option labels**: Matches CLI UX best practices (inquirer.js, clig.dev)
- **Recommended option first + suffix**: Follows transparent nudge pattern (NN/g Power of Defaults)
- **Question tool vs text prompts**: Validated by CLI guidelines and MCP elicitation spec

### Updated Based on Research
- **Header limit relaxed**: Changed from 12 chars to 25 chars based on UX research showing common headers exceed 12 chars
- **Fallback protocol added**: Decision 5 added based on graceful degradation best practices
- **OpenCode-specific noted**: Documented that `mcp_question` is platform-specific, not MCP-standard

### Sources
- CLI Guidelines (clig.dev) - https://clig.dev/
- NN/g "Power of Defaults" - https://www.nngroup.com/articles/the-power-of-defaults/
- IxDF Hick's Law - https://www.interaction-design.org/literature/article/hick-s-law-making-the-choice-easier-for-users
- MCP Elicitation Spec - https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation
- OpenCode Tools Docs - https://opencode.ai/docs/tools/

## Open Questions

None - research validated the core approach.
