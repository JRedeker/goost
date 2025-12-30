---
agent: build
description: Implement an approved OpenSpec change and keep tasks in sync.
---
The user has requested to implement the following change proposal. Find the change proposal and follow the instructions below. If you're not sure or if ambiguous, ask for clarification from the user.
<UserRequest>
  $ARGUMENTS
</UserRequest>
<!-- OPENSPEC:START -->
**CRITICAL: Complete ALL Tasks**
You MUST complete 100% of the tasks in `tasks.md`. Do NOT:
- Skip tasks because they seem minor or optional
- Defer tasks to "later" or "future work"
- Declare completion with any task still unchecked
- Rush through tasks without verification
- Leave partial implementations

Track your progress visibly using the TodoWrite tool. Mark each task in_progress when you start and completed only after verification.

**Guardrails**
- Favor straightforward, minimal implementations first and add complexity only when it is requested or clearly required.
- Keep changes tightly scoped to the requested outcome.
- Refer to `openspec/AGENTS.md` (located inside the `openspec/` directory—run `ls openspec` or `openspec update` if you don't see it) if you need additional OpenSpec conventions or clarifications.

**Steps**
Track these steps as TODOs and complete them one by one.
1. Read `changes/<id>/proposal.md`, `design.md` (if present), and `tasks.md` to confirm scope and acceptance criteria.
2. Create a TODO list with EVERY task from `tasks.md` - do not omit any.
3. Work through tasks sequentially, keeping edits minimal and focused on the requested change.
4. For EACH task: implement → verify it works → mark complete → then move to next.
5. After ALL tasks are done, do a final review to confirm nothing was missed.
6. Update the checklist so each task is marked `- [x]` and reflects reality.
7. Reference `openspec list` or `openspec show <item>` when additional context is required.

**Completion Criteria**
Before declaring this change complete, verify:
- [ ] Every task in `tasks.md` is marked `- [x]`
- [ ] Every implementation has been tested/verified
- [ ] No TODOs or FIXMEs were left in the code
- [ ] The change matches the proposal's acceptance criteria

**Reference**
- Use `openspec show <id> --json --deltas-only` if you need additional context from the proposal while implementing.
<!-- OPENSPEC:END -->
