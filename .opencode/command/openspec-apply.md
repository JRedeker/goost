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
**Step 1: Read the Change Proposal**

First, read the change proposal files:
1. `openspec/changes/<id>/proposal.md` - for objective and acceptance criteria
2. `openspec/changes/<id>/tasks.md` - for the task breakdown
3. `openspec/changes/<id>/design.md` (if present) - for implementation details

**Step 2: Display Contract (Informational)**

Generate a contract from the proposal for **visibility and tracking**. The user's invocation of `/openspec-apply` is implicit approval - do NOT wait for confirmation.

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

Then immediately proceed to implementation.

> **Anti-Loop Protocol**: After displaying the contract, your next output MUST be a tool call (Read/Edit) to begin implementation. Do NOT re-state the plan or explain what you're about to do.

**Step 3: Implement Under Contract (RSTC Protocol)**

You MUST follow the Requirement-Spec-Test-Code sequence for each criterion:
1. **Requirement (R)**: Review criterion and linked test scenario.
2. **Spec (S)**: Detail technical implementation and edge cases.
3. **Test (T)**: Write/update test and provide **Red Phase Evidence** (failing logs).
4. **Code (C)**: Implement solution and provide **Green Phase Evidence** (passing logs).

With the contract established:
- Work through tasks sequentially from `tasks.md`
- For EACH task: implement → verify → mark complete
- End every response with a CONTRACT STATUS block
- Do NOT declare completion until ALL criteria are `[x]`

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
