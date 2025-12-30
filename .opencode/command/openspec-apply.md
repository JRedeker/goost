---
agent: build
description: Implement an approved OpenSpec change under contract enforcement.
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

**Step 2: Establish a Contract**

You MUST establish a Goost contract before implementing. Generate the contract by:

1. **OBJECTIVE**: Derive from the proposal's title/summary
2. **SUCCESS CRITERIA**: Convert each acceptance criterion from `proposal.md` into a verifiable checkbox
3. **CONSTRAINTS**: Extract any MUST/MUST NOT requirements from the proposal
4. **CHECKPOINTS**: Group tasks from `tasks.md` into logical phases

Format the contract:
```
============================================================
                    CONTRACT ACTIVE
============================================================

OBJECTIVE: <derived from proposal summary>

SUCCESS CRITERIA:
- [ ] <acceptance criterion 1 from proposal>
- [ ] <acceptance criterion 2 from proposal>
- [ ] All tasks in tasks.md completed
- [ ] No TypeScript/build errors introduced

CONSTRAINTS:
- MUST NOT: <from proposal constraints>
- MUST: <from proposal requirements>

CHECKPOINTS:
- [ ] Phase 1: <grouped tasks>
- [ ] Phase 2: <grouped tasks>

============================================================
```

Present the contract and emit `[GOOST:MIC]` to request confirmation before proceeding.

**Step 3: Implement Under Contract**

Once the contract is confirmed:
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
