# Change: Add Contract Conversion Mode to /goost-search

## Why

The `/goost-search` command currently displays prompts with instructions to "copy the relevant portions manually." This requires users to:
1. Read through the entire prompt
2. Mentally extract actionable steps
3. Manually create their own contract or task list
4. Hope they didn't miss anything important

This friction reduces the utility of discovered prompts. Users want a seamless flow from "find a good prompt" to "start implementing with clear success criteria."

## What Changes

After `/goost-search` displays a fetched prompt, offer the user an option to convert it into actionable steps and a draft `/contract`. This bridges the gap between prompt discovery and structured implementation.

**New Flow:**
1. `/goost-search <query>` → finds and displays prompt (existing behavior)
2. After display, ask: "Would you like me to convert this into a contract?"
3. If user accepts:
   - Analyze the prompt content
   - Extract key instructions and requirements
   - Convert to numbered implementation steps
   - Generate a draft contract with success criteria
   - Present for user review before locking

**Key Behaviors:**
- **Opt-in**: User must explicitly request conversion (not automatic)
- **All prompt types**: Works with any fetched prompt (general-purpose or system prompts)
- **Draft contract**: Contract is proposed, not locked until user confirms
- **Intelligent extraction**: Use AI to identify actionable items, not just line-by-line copying

## Security Model

Contract conversion bypasses the manual copy/paste friction that was the primary defense against prompt injection. This requires additional safeguards:

**Source Restriction:**
- Only prompts from the 2 hardcoded approved repositories can be converted
- No user-supplied URLs or arbitrary sources

**Pre-Conversion Security Scan:**
Before converting ANY prompt to a contract, scan for injection patterns:
- "ignore previous instructions" and variants
- "disregard", "forget", "override" + "instructions/system"
- Requests to reveal system prompts or configurations
- Encoded payloads (base64 blocks, hex sequences)
- Suspicious tool/function definitions requesting dangerous capabilities

**Block vs Allow:**
- If injection patterns detected → **BLOCK conversion entirely**
- Display: "This prompt contains patterns that could be used for injection attacks. Contract conversion is not available."
- User can still view the raw prompt but cannot convert to contract

**Contract Constraints:**
- Generated contracts SHALL NOT include shell commands from the prompt
- Generated contracts SHALL NOT include code execution from the prompt
- Success criteria must be behavioral, not command-based

## Acceptance Criteria

- [ ] After displaying a prompt, command offers contract conversion option
- [ ] User can accept or decline the conversion offer
- [ ] **Security scan runs BEFORE conversion is offered**
- [ ] **Prompts with injection patterns are BLOCKED from conversion**
- [ ] Conversion extracts meaningful steps from prompt content
- [ ] Generated contract follows standard `/contract` format
- [ ] **Generated contracts exclude shell commands and code execution**
- [ ] Contract is presented as draft for user review
- [ ] User must explicitly confirm to lock the contract
- [ ] Declining conversion returns to normal prompt display state

## Impact

- Affected specs: `slash-commands`
- Affected code: `.opencode/command/goost-search.md`
- Dependencies: Relies on existing `/contract` format and Goost contract system
- No breaking changes to existing `/goost-search` behavior
