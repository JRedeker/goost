## Context
Users scroll through long AI conversations to find where specific commands completed. Currently there's no standardized visual marker that says "this command finished here." The `CONTRACT FULFILLED` banner exists but doesn't name the command.

Additionally, commands like `/openspec-review`, `/openspec-harden`, `/openspec-research`, and `/openspec-audit` perform analysis AND offer to apply fixes, but the fix phase lacks contract tracking. When a user says "yes, fix the issues", that kicks off real implementation work that should be tracked to completion.

## Goals
- Provide a visually distinct, scannable completion marker for every OpenSpec command
- Make the command name prominent in the banner
- Standardize contract usage: all commands that modify files use contracts
- Maintain consistency with existing Goost visual patterns (the `===` delimiter style)
- Be grep-friendly for programmatic extraction

## Non-Goals
- Changing the `CONTRACT FULFILLED` format (it serves a different purpose)
- Adding plugin detection for completion banners (manual visual only for now)

## Decisions

### 1. Banner Format

Standardized completion banner:

```
============================================================
      /openspec-apply add-feature-x COMPLETE
============================================================
Duration: ~3 minutes
Result: CONTRACT FULFILLED

Next: /openspec-archive add-feature-x
============================================================
```

Key elements:
- **Header**: Command name + target + `COMPLETE` suffix (e.g., `/openspec-apply add-feature-x COMPLETE`)
- **Duration**: Approximate execution time (optional, omit if < 30 seconds)
- **Result**: Outcome summary (e.g., "CONTRACT FULFILLED", "APPROVED", "3 issues found")
- **Next**: Suggested follow-up action (contextual)

### 2. Command Categories

Commands fall into two categories for completion handling:

| Category | Commands | Completion Trigger |
|----------|----------|-------------------|
| **Contract-based** | `/openspec-apply`, `/openspec-ralph`, `/openspec-prep`, `/openspec-review`, `/openspec-harden`, `/openspec-audit`, `/openspec-research`, `/openspec-proposal`, `/openspec-archive`, `/contract`, `/goost-search` | After CONTRACT FULFILLED |
| **Read-only** | `/openspec-status`, `/openspec-roadmap` | After output displayed |

### 3. Contract Flow for Analysis Commands

Commands like `/openspec-review` and `/openspec-harden` have a two-phase flow:

```
Phase 1: Analysis (no contract yet)
├── Spawn sub-agents for scanning
├── Synthesize findings into report
└── Display report with verdict

Phase 2: Remediation (contract-based)
├── User confirms "Fix issues" via mcp_question
├── CONTRACT ACTIVE established with fix criteria
├── Apply fixes with tracking
├── CONTRACT FULFILLED when all fixes verified
└── /<command> COMPLETE banner
```

If the user declines fixes or the report shows no issues:
- Skip contract phase
- Emit completion banner directly after report

### 4. Placement Rules

- **Contract-based commands**: Banner appears AFTER the `CONTRACT FULFILLED` block
- **Read-only commands**: Banner appears at the end of output (may be optional for very short commands)

### 5. Minimal vs Full Banner

For read-only/short commands, use a minimal banner:
```
============================================================
           /openspec-status COMPLETE
============================================================
```

For contract-based commands, use full banner with context.

## Alternatives Considered

**A. Modify CONTRACT FULFILLED to include command name**
- Rejected: CONTRACT FULFILLED is about the contract, not the command
- A command might have multiple contract phases

**B. Use a different delimiter style**
- Rejected: Consistency with existing Goost patterns is valuable
- The `===` style is already recognized by users

**C. Add to plugin detection**
- Deferred: Visual-only is sufficient for MVP
- Can add plugin detection later if needed for automation

## Risks / Trade-offs
- **Verbosity**: Adds ~5 lines to every command completion
- **Mitigation**: Minimal banner option for read-only commands
- **Maintenance**: 18 command files to update
- **Mitigation**: Clear pattern makes bulk updates straightforward
- **Complexity for analysis commands**: Two-phase flow adds logic
- **Mitigation**: Clear phase separation; contract only when fixes confirmed
- **User friction**: Extra confirmation step before fixes
- **Mitigation**: Already exists in most commands (mcp_question); just adding contract tracking after

## Research Validation

### ✅ Validated: Banner Format
- The delimiter pattern aligns with Cisco IOS banner conventions (proven pattern)
- Consistent with existing Goost conventions (100+ occurrences of `============...`)
- Centered `/<command-name> COMPLETE` is grep-friendly and scannable
- Sources: Cisco banner docs, Goost codebase analysis, Tim Pope conventions

### ✅ Validated: Two-Phase Flow
- Mirrors Terraform plan/apply workflow (industry standard)
- ESLint dry-run pattern proves value of preview-then-apply
- CI/CD approval gates use same pattern
- Sources: ESLint CLI, Terraform workflow, GitHub Actions approval

### ✅ Validated: Contract-Based Fix Tracking
- Contract pattern provides explicit criteria for each fix (current gaps)
- Checklists improve remediation completion rates
- Matches CONTRACT STATUS visibility pattern
- Sources: openspec-review.md, contract.md patterns, code review best practices

### ✅ Validated: Visual Distinctiveness
- F-pattern scanning favors top/block-boundary markers
- Color + borders + unique text = robust distinctiveness
- Green checkmarks universally signal completion
- Sources: Nielsen Norman Group, Interaction Design Foundation, CLI UX guidelines

## Recommendations from Research

1. Keep centered `/<command-name> COMPLETE` header with `============...` delimiters
2. Use two-phase flow for analysis commands (matches Terraform/ESLint patterns)
3. Add contract tracking for remediation phase (addresses current visibility gap)
4. Consider adding visual enhancement: green checkmark prefix for additional distinctiveness
