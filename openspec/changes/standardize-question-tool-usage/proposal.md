# Change: Standardize Question Tool Usage Across Goost

## Why

Currently, Goost commands ask users questions using inconsistent text-based prompts:
- Contract confirmation: "yes/no or suggest changes"
- Doom loop recovery: numbered options (1-4)
- Remediation choices: lettered options (A/B/C/D)
- Multiple match selection: text list with manual parsing

These inconsistent patterns create a fragmented UX and require users to type free-form responses. OpenCode provides a built-in `mcp_question` tool that presents structured multiple-choice UI with consistent interaction patterns.

## What Changes

- **Add new requirement**: Define structured question interaction pattern using `mcp_question` tool
- **Modify contract commands**: Use question tool for contract confirmation
- **Modify review/harden commands**: Use question tool for remediation option selection
- **Modify doom loop handling**: Use question tool for recovery option selection
- **Modify goost_instructions.md**: Update examples to show question tool usage
- **Update all affected slash commands**: Replace text-based prompts with question tool invocations

### Scope

Commands requiring structured questions:
1. `/contract` - Contract confirmation
2. `/contract-quick` - Contract confirmation
3. `/goost-search` - Multiple match selection (already spec'd but not consistent)
4. `/openspec-review` - Remediation option selection (A/B/C/D)
5. `/openspec-harden` - Remediation option selection (A/B/C/D)
6. `goost_instructions.md` - Doom loop recovery, user pressure resistance, post-compaction recovery

### Instruction Updates

The `goost_instructions.md` file must be updated to:
1. **Document the question tool requirement**: Add a section explaining when and how to use `mcp_question`
2. **Provide examples**: Show correct question tool invocation patterns
3. **Mandate usage**: Make it clear that all user-facing questions MUST use the question tool
4. **Update existing examples**: Replace text-based question examples with question tool examples

## Impact

- Affected specs: `slash-commands`
- Affected code:
  - `.opencode/command/contract.md`
  - `.opencode/command/contract-quick.md`
  - `.opencode/command/goost-search.md`
  - `.opencode/command/openspec-review.md`
  - `.opencode/command/openspec-harden.md`
  - `goost_instructions.md`
- No TypeScript plugin changes required (question tool is invoked via prompt instructions)
- No breaking changes (question tool allows "Other" for custom text input)

## Research Validation

Architectural research validated this change with the following findings:

### Validated ✅
- **2-5 options per question**: Aligned with Hick's Law for decision fatigue (source: IxDF, NN/g)
- **Recommended option first**: Follows "Power of Defaults" pattern (source: NN/g)
- **Structured prompts over text**: CLI best practices favor structured interaction (source: clig.dev, inquirer.js)

### Updated Based on Research
- **Header limit**: Relaxed from 12 to 25 characters (common headers like "Save changes?" exceed 12)
- **Fallback protocol**: Added explicit handling when `mcp_question` unavailable
- **Platform scope**: Documented that `mcp_question` is OpenCode-specific, not MCP-standard

### Research Sources
- CLI Guidelines: https://clig.dev/
- NN/g Power of Defaults: https://www.nngroup.com/articles/the-power-of-defaults/
- MCP Elicitation Spec: https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation
