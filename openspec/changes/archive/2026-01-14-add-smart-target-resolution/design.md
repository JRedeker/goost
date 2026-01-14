## Context

OpenSpec commands operate on targets (changes or specs). Currently, target identification varies by command:
- Some require explicit arguments and error if missing
- Some have ad-hoc resolution logic
- None use the structured `mcp_question` tool for disambiguation

This design standardizes target resolution across all commands using a priority-based algorithm with user confirmation for ambiguous cases.

## Goals / Non-Goals

**Goals:**
- Standardize target resolution algorithm across all relevant commands
- Use `mcp_question` tool for structured disambiguation (aligns with existing `standardize-question-tool-usage` change)
- Preserve explicit target behavior - if user provides target, use it directly
- Never guess when uncertain - always confirm with user

**Non-Goals:**
- Changing how commands process targets once resolved
- Adding target resolution to commands that don't need it (proposal, status, roadmap)
- Complex heuristics or ML-based inference

## Research Validation

> Research conducted via `/openspec-research` on 2026-01-13

### Validated Decisions

| Decision | Status | Sources |
|----------|--------|---------|
| Priority-based resolution | Validated | npm, git, docker CLI patterns; clig.dev |
| `mcp_question` for selection | Validated | NN/g Recognition over Recall; Laws of UX |
| "Never guess" principle | Validated | clig.dev; NN/g Chatbot UX |

### Research-Driven Changes

Based on architectural research, the following simplifications are recommended:

1. **Remove conversation context inference** - Major AI tools (GitHub Copilot, Cursor) use explicit context mechanisms, not inference. The complexity and false-positive risk outweigh benefits.

2. **Differentiate confirmation by operation risk** - NN/g research warns against "confirmation fatigue" from excessive prompts. Read-only operations should skip confirmation when target is unambiguous.

3. **Reduce from 3 priorities to 2** - Simpler system matches proven CLI patterns.

## Decisions

### Decision: Two-Priority Resolution Algorithm (Simplified)

Target resolution SHALL follow this priority order:

1. **Explicit Argument** (highest priority)
   - If `$ARGUMENTS` is non-empty and non-whitespace, use it directly
   - Validate against available changes/specs
   - If invalid, error with suggestions (existing behavior)

2. **Structured Selection**
   - Run `openspec list` to get active changes
   - If exactly one active change exists AND operation is read-only: auto-proceed with notification
   - If exactly one active change exists AND operation modifies state: confirm via `mcp_question`
   - If multiple changes exist: present selection via `mcp_question`
   - If no changes exist: error with suggestion to create one

**Removed: Conversation Context Scanning**
- Originally Priority 2 in the design
- Research finding: GitHub Copilot and Cursor use explicit context (`#file`, `@workspace`), not inference
- Risk of false positives outweighs convenience benefit
- Simpler approach: let user select from list

**Rationale:**
- Matches proven CLI patterns (git, npm, docker)
- Deterministic and predictable behavior
- Reduces scenarios from 6 to 3

### Decision: Risk-Based Confirmation

Different operations warrant different confirmation levels:

| Operation Type | Single Candidate Behavior | Research Basis |
|---------------|---------------------------|----------------|
| Read-only (`review`) | Auto-proceed with notification | NN/g: Avoid confirmation fatigue |
| State-changing (`apply`, `archive`) | Require `mcp_question` confirmation | clig.dev: Confirm before dangerous |
| Analysis with fixes (`harden`) | Require confirmation (offers to modify) | Principle of least surprise |

**Notification format** (for auto-proceed cases):
```
Using '<change-id>' (only active change)
```

**Confirmation format** (for state-changing cases):
```
header: "Confirm"
question: "Proceed with '<change-id>'?"
options:
  - "Yes (Recommended)" - Proceed
  - "Cancel" - Abort
```

### Decision: Structured Selection via mcp_question

When multiple candidates exist, present selection:

```
header: "Select"
question: "Which change would you like to work with?"
options:
  - "<change-1>" - <task progress, e.g., "3/8 tasks">
  - "<change-2>" - <task progress>
  ...
```

**Rationale (research-backed):**
- NN/g: Recognition is easier than recall
- NN/g: Structured selection reduces cognitive load
- clig.dev: Prompt for user input when arguments missing
- Avoids parsing errors from free-form text

### Decision: Command-Specific Target Types

Different commands target different artifact types:

| Command | Primary Target | Fallback | Risk Level |
|---------|---------------|----------|------------|
| `/openspec-apply` | active change | - | State-changing |
| `/openspec-review` | active change | archived change | Read-only |
| `/openspec-harden` | active change | archived change | State-changing |
| `/openspec-archive` | active change | - | State-changing |
| `/openspec-research` | spec OR change | asks which | State-changing |

Resolution logic SHALL be aware of these distinctions and:
1. Filter candidates appropriately
2. Apply risk-based confirmation rules

## Risks / Trade-offs

**Risk:** Single-candidate auto-selection may surprise users
- **Mitigation:** Always display notification of which target was used
- **Research basis:** Principle of Least Surprise - users expect unambiguous commands to work

**Trade-off:** Confirmation for state-changing ops adds one interaction
- **Acceptance:** Research-backed; NN/g confirms value for destructive actions
- **Boundary:** Only for state-changing operations, not read-only

**Trade-off:** Removed conversation context inference reduces "magic"
- **Acceptance:** Reliability > convenience; major AI tools use explicit context
- **Escape hatch:** User can always provide explicit argument

## Migration Plan

1. Add shared "Target Resolution Protocol" section to each affected command's markdown
2. Update command instructions to invoke resolution before proceeding
3. Classify each command as read-only or state-changing for confirmation rules
4. No code changes to plugin - this is purely prompt engineering
5. Rollback: Revert markdown changes to restore explicit-only behavior

## Future Considerations

- Consider `--no-infer` flag for scripting (matches git's `--no-guess` pattern)
- Could add keyboard shortcuts (y/n/1/2/3) for power users
- If context inference is revisited, use explicit markers (`<!-- WORKING_ON: id -->`)

## Research Sources

- Nielsen Norman Group - "Confirmation Dialogs Can Prevent User Errors - If Not Overused" (2018)
- Nielsen Norman Group - "Memory Recognition and Recall in User Interfaces" (2024)
- Nielsen Norman Group - "The User Experience of Chatbots" (2018)
- Command Line Interface Guidelines (clig.dev)
- Laws of UX - Hick's Law
- Wikipedia - Principle of Least Astonishment
- GitHub Copilot Documentation - Chat context mechanisms
- Cursor Features Documentation
