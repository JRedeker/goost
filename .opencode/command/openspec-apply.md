---
name: openspec-apply
description: Implement an approved OpenSpec change under contract enforcement.
agent: build
---
The user has requested to implement the following change proposal. Find the change proposal and follow the instructions below. If you're not sure or if ambiguous, ask for clarification from the user.
<UserRequest>
  $ARGUMENTS
</UserRequest>

<!-- OPENSPEC:START -->

**Target Resolution Protocol (State-Changing Operation)**

Before proceeding, determine the target change ID:

1. **If $ARGUMENTS is provided and non-empty**: Use it directly as the target (existing behavior)
2. **If $ARGUMENTS is empty or no target found**:
   a. Run `openspec list` to get active changes
   b. If exactly one active change exists:
      - Use `mcp_question` to confirm:
        ```
        header: "Confirm"
        question: "Proceed with '<change-id>'?"
        options: "Yes (Recommended)", "Cancel"
        ```
      - If user cancels, stop execution
   c. If multiple active changes exist:
      - Use `mcp_question` to present selection:
        ```
        header: "Select"
        question: "Which change would you like to work with?"
        options: list of changes with task progress (e.g., "feature-x (3/8 tasks)")
        ```
      - Proceed with user's selection
   d. If no active changes exist:
      - Display: "No active changes found"
      - Suggest: "Run `/openspec-proposal` to create a new change"
      - Stop execution
3. **If target provided but invalid**:
   - Display: "Change '<target>' not found"
   - Suggest: "Run `openspec list` to see available changes"
   - Stop execution

**Step 1: Read the Change Proposal**

First, read the change proposal files:
1. `openspec/changes/<id>/proposal.md` - for objective and acceptance criteria
2. `openspec/changes/<id>/tasks.md` - for the task breakdown
3. `openspec/changes/<id>/design.md` (if present) - for implementation details

**Step 2: Display Contract (Informational)**

Generate a contract from the proposal for **visibility and tracking**. Then proceed to Step 2.5 for user confirmation before implementation.

Derive the contract:
1. **OBJECTIVE**: From the proposal's title/summary
2. **SUCCESS CRITERIA**: Convert acceptance criteria from `proposal.md` into verifiable checkboxes. Link to Test Plan (C1, C2).
3. **TEST PLAN**: Derived from `tasks.md` and spec scenarios.
4. **CONSTRAINTS**: Extract any MUST/MUST NOT requirements
5. **CHECKPOINTS**: Group tasks from `tasks.md` into logical phases

Display the contract:
```
============================================================
                    CONTRACT ACTIVE
============================================================

OBJECTIVE: <derived from proposal summary>

SUCCESS CRITERIA:
- [ ] (C1) <acceptance criterion 1 from proposal>
- [ ] (C2) <acceptance criterion 2 from proposal>
- [ ] (C3) All tasks in tasks.md completed
- [ ] (C4) No TypeScript/build errors introduced

TEST PLAN:
- [ ] (C1) <test scenario for C1>
- [ ] (C2) <test scenario for C2>
- [ ] (C3) <verification task from tasks.md>
- [ ] (C4) `npm run build` or equivalent

CONSTRAINTS:
- MUST NOT: <from proposal constraints>
- MUST: <from proposal requirements>

CHECKPOINTS:
- [ ] Phase 1: <grouped tasks>
- [ ] Phase 2: <grouped tasks>

============================================================
```

Then immediately proceed to confirmation and implementation.

**Step 2.5: Confirmation**

After displaying the contract, use `mcp_question` to request user confirmation:
```
Use mcp_question with:
  header: "Confirm"
  question: "Does this contract accurately capture the proposal requirements?"
  options:
    - label: "Begin work (Recommended)"
      description: "Start implementation under this contract"
    - label: "Modify criteria"
      description: "Suggest changes to the contract before proceeding"
    - label: "Cancel"
      description: "Discard the contract and stop"
```

Proceed with implementation only if user selects "Begin work". If user cancels, output "Contract cancelled. No changes made." and stop. If user requests modification, discuss changes before regenerating the contract.

> **Intent Statement Protocol**: After confirmation, you MAY emit a single-line intent statement followed immediately by a tool call (Read/Edit). Example: "Starting implementation" + [Read tool]. Avoid multi-paragraph explanations without tool calls.

**Step 3: Implement Under Contract (RSTC Protocol)**

Follow the Requirement-Spec-Test-Code sequence for logic-heavy work. For trivial changes (docs, config, UI copy), use simplified verification.

**Logic-Heavy Changes** (new APIs, business logic, state management):
1. **Requirement (R)**: Review criterion and linked test scenario.
2. **Spec (S)**: Detail technical implementation and edge cases.
3. **Test (T)**: Write/update test and provide **Red Phase Evidence** (failing logs).
4. **Code (C)**: Implement solution and provide **Green Phase Evidence** (passing logs).

**Trivial Changes** (documentation, configuration, trivial UI):
- Skip formal test writing - use simplified verification:
  - Build passes, linter clean, manual inspection
- Include rationale in CONTRACT STATUS:
  - Example: `- [x] (C3) Update README (trivial: documentation change, verified by manual review)`

**Borderline cases**: Default to full RSTC protocol if uncertain.

With the contract established:
- Work through tasks sequentially from `tasks.md`
- For EACH task: implement → verify → mark complete
- End every response with a CONTRACT STATUS block
- Avoid declaring completion until ALL criteria are `[x]`

**Guardrails**
- Favor straightforward, minimal implementations first
- Keep changes tightly scoped to the proposal
- Refer to `openspec/AGENTS.md` for OpenSpec conventions if needed

**Contract Completion**

Before declaring CONTRACT FULFILLED:
- [ ] Every task in `tasks.md` is marked `- [x]`
- [ ] Every acceptance criterion from `proposal.md` is verified
- [ ] No TODOs or FIXMEs left in code
- [ ] Build/tests pass

Follow the standard contract completion protocol (commit, changelog update).

**Reference**
- Use `openspec show <id> --json --deltas-only` for additional proposal context
<!-- OPENSPEC:END -->
