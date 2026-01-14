# Change: Soften OpenSpec Apply Enforcement

## Why

The current `/openspec-apply` command has evolved into an extremely strict, contract-enforced workflow that prioritizes safety and TDD discipline. However, audit findings reveal four friction points that harm user experience and agent effectiveness:

1. **Implicit Approval Risk**: Users lose their last chance to verify generated Success Criteria before the contract becomes immutable, increasing the risk of incorrect criterion interpretation from the proposal.

2. **Robotic Transitions**: The Anti-Loop Protocol forbids any human-readable context between displaying the contract and starting implementation, making interactions feel mechanical.

3. **TDD Overhead for Trivial Changes**: Requiring Red/Green Phase Evidence for all changes (including version bumps, typo fixes, or documentation updates) triggers unnecessary work and potential doom loops.

4. **Clinical Language**: Repeated use of "MUST NOT", "Protocol", and "Do NOT" makes the command read like a system constraint file rather than collaborative guidance.

These issues contradict OpenCode's collaborative, user-first philosophy while providing diminishing returns on safety for non-critical tasks.

## What Changes

- **Restore confirmation step** after contract display (quick verification gate)
- **Allow intent statements** before tool calls (single-line context)
- **Add TDD escape hatch** for trivial changes (documentation, config, trivial UI)
- **Soften language** from commands to guidance where plugin enforcement already handles constraints
- Update `/openspec-apply` command markdown with refined instructions
- Update `slash-commands` spec to reflect new behavior

**Breaking**: None (behavior change is additive - adds confirmation back, relaxes restrictions)

## Impact

- **Affected specs**: `slash-commands`, `tdd-enforcement` (alignment note), `contract-system` (alignment note)
- **Affected code**:
  - `.opencode/command/openspec-apply.md` (primary - command implementation)
  - `goost_instructions.md` (contains RSTC/TDD protocol references that may need consistency updates)
- **User experience**: Improved - faster verification, clearer transitions, less friction on simple tasks
- **Safety**: Maintained - confirmation gate catches criterion errors, TDD still enforced for logic changes

## Spec Conflicts

This change introduces a Context-Aware TDD policy that relaxes strict RSTC enforcement for trivial changes. Two existing specs have related requirements:

## Research Validation

This change was validated through architectural research using OpenCode tools and authoritative sources:

**Validated Patterns:**
- `mcp_question` with text fallback is the documented best practice for OpenCode confirmation flows (OpenCode tools documentation)
- Context-Aware TDD aligns with industry "proportionate testing" patterns (CircleCI, Microsoft Engineering Playbook)
- Target resolution protocol with 5 scenarios is optimal for CLI UX

**Simplifications Applied:**
- Removed redundant Doom Loop Detection description (existing plugin behavior)
- Collapsed 3 TDD scenarios into 2 with streamlined borderline case guidance
- Eliminated scenario duplication

**Sources:**
- OpenCode tools documentation: https://opencode.ai/docs/tools/
- CircleCI Smoke Testing Guide: https://circleci.com/blog/smoke-tests-in-cicd-pipelines/
- Microsoft Engineering Playbook - Smoke Testing: https://microsoft.github.io/code-with-engineering-playbook/automated-testing/smoke-testing/
- Azure AI Agent Design Patterns: https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns

1. **`tdd-enforcement` spec**: Requires "Red Phase Evidence" and "Green Phase Evidence" for all criteria. This change adds an exception for trivial changes (docs, config, version bumps). The specs are compatible because:
   - `tdd-enforcement` is the base rule for logic-heavy work
   - This change adds a narrowly-scoped exception with explicit rationale requirements
   - Agents must still provide *some* verification evidence, just not formal Red/Green test cycles

2. **`contract-system` spec**: States contracts "SHALL NOT be created unless Red Phase and Green Phase evidence is provided for all criteria." This change clarifies that Context-Aware TDD applies to *what qualifies as sufficient evidence*, not bypassing the evidence requirement entirely. The alignment is:
   - Logic-heavy changes: Full Red/Green test evidence required (unchanged)
   - Trivial changes: Simplified verification (build passes, linter clean) qualifies as sufficient evidence
   - The contract-system requirement is satisfied because evidence is still provided, just in a form appropriate to the change type
