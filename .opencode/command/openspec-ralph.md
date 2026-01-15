---
name: openspec-ralph
description: Implement an approved OpenSpec change with autonomous retry on failures.
agent: build
---

<!--
SYNC WARNING: This command extends /openspec-apply with autonomous retry behavior.
Core protocols (Target Resolution, RSTC, Contract Display) are inherited from openspec-apply.
When updating /openspec-apply, review this file for necessary synchronization.
Last synced with openspec-apply: 2026-01-15
-->

The user has requested to implement the following change proposal with **autonomous retry enabled**. Find the change proposal and follow the instructions below. If you're not sure or if ambiguous, ask for clarification from the user.
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
6. **AUTONOMOUS RETRY**: Include the retry protocol section (see below)

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
- [ ] (C5) Global Final Loop verification passed

TEST PLAN:
- [ ] (C1) <test scenario for C1>
- [ ] (C2) <test scenario for C2>
- [ ] (C3) <verification task from tasks.md>
- [ ] (C4) `npm run check` or equivalent
- [ ] (C5) Full build + all tests pass

CONSTRAINTS:
- MUST NOT: <from proposal constraints>
- MUST: <from proposal requirements>

CHECKPOINTS:
- [ ] Phase 1: <grouped tasks>
- [ ] Phase 2: <grouped tasks>

AUTONOMOUS RETRY ENABLED:
- SEMANTIC errors (type/logic/test failures): 3 retries with diagnosis
- TRANSIENT errors (network/flaky): 1 retry with 5s delay
- ENVIRONMENTAL errors (missing deps/config): immediate escalation
- Global Final Loop required before CONTRACT FULFILLED

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
    - label: "Begin Autonomous Implementation (Recommended)"
      description: "Start implementation with autonomous retry on failures"
    - label: "Modify criteria"
      description: "Suggest changes to the contract before proceeding"
    - label: "Cancel"
      description: "Discard the contract and stop"
```

Proceed with implementation only if user selects "Begin Autonomous Implementation". If user cancels, output "Contract cancelled. No changes made." and stop. If user selects "Modify criteria", ask the user what specific criteria need adjustment, then regenerate the contract with the requested changes, and re-present the updated contract for confirmation.

> **Intent Statement Protocol**: After confirmation, emit a single-line intent statement describing the next action, followed immediately by a tool call (Read, Edit, Write, Bash, etc.). Example: "Starting implementation" + [Read tool]. Pair each intent with an immediate tool call.

---

## Autonomous Retry Protocol

This protocol defines how verification failures are handled autonomously. It applies to ALL verification steps: incremental task verification, RSTC test phases, and Global Final Loop.

### Error Classification

When a verification command (test, build, lint) fails, classify the error BEFORE deciding on action:

| Error Type | Examples | Action |
|------------|----------|--------|
| **SEMANTIC** | Type errors, test assertion failures, logic bugs, compilation errors | Diagnose → Fix → Retry (up to 3 times) |
| **TRANSIENT** | Network timeout, rate limit, flaky test (passed before, fails now) | Wait 5s → Retry once; if retry fails, reclassify as SEMANTIC |
| **ENVIRONMENTAL** | Missing dependency, config file not found, permission denied, missing env var | Escalate immediately to user |

### Diagnosis Requirement (Reflexion)

Before applying ANY fix for a SEMANTIC error, you MUST verbalize your diagnosis:

```
[GOOST:DOOM_LOOP] RETRY 1/3

DIAGNOSIS: The test fails because `calculateTotal()` returns undefined when 
the cart is empty. The function lacks a guard clause for the empty array case.

FIX: Add early return of 0 when items.length === 0.

Applying fix...
```

This diagnosis MUST appear in your response before the fix is applied. It ensures:
1. You understand the root cause before attempting a fix
2. The user can see your reasoning in logs
3. You don't repeatedly apply the same ineffective fix

> **Terminal Integration**: The `[GOOST:DOOM_LOOP]` marker is detected by the Goost plugin, which automatically updates the terminal tab title to show retry state (e.g., "RETRYING (2/3)") via OSC escape sequences. No manual title setting is required.

> **Observability**: When `GOOST_DEBUG=1` is set, retry diagnostics are logged to stderr including attempt number, error classification, and diagnosis. This aids debugging of complex failure chains.

### Retry Budget Tracking

Track retry attempts per verification failure. The retry budget **resets for each new task** - if Task 1 uses 2 retries, Task 2 starts fresh with 3 available retries.

> **Numbering**: `RETRY 1/3` means "retry attempt 1 of 3 allowed retries" (the initial verification attempt is not counted as a retry).

```
[GOOST:DOOM_LOOP] RETRY <N>/3 - <error-type>
```

Example retry progression:
```
[GOOST:DOOM_LOOP] RETRY 1/3 - SEMANTIC
DIAGNOSIS: ...
FIX: ...
<run verification>

[GOOST:DOOM_LOOP] RETRY 2/3 - SEMANTIC
DIAGNOSIS: Previous fix addressed symptom but not root cause...
FIX: ...
<run verification>

[GOOST:DOOM_LOOP] RETRY 3/3 - SEMANTIC
DIAGNOSIS: ...
FIX: ...
<run verification>
```

### Budget Exhaustion

If all 3 SEMANTIC retry attempts fail (initial verification + 3 retries = 4 total attempts), STOP and report:

```
============================================================
        AUTONOMOUS RETRY BUDGET EXHAUSTED
============================================================

ATTEMPTS MADE:
1. [description of first fix attempt]
2. [description of second fix attempt]  
3. [description of third fix attempt]

PERSISTENT ERROR:
<error message that keeps occurring>

MY ANALYSIS:
<why you think you're stuck>

REQUESTING HUMAN GUIDANCE:
Please advise on how to proceed. Options:
- Provide a hint for the fix
- Take over this specific task manually
- Void the contract to reassess scope

============================================================
```

Then use `mcp_question` to get user direction:
```
header: "Stuck"
question: "Retry budget exhausted. How would you like to proceed?"
options:
  - label: "Provide guidance"
    description: "I'll give you a hint to try"
  - label: "Skip this task"
    description: "Mark as blocked and continue with other tasks"
  - label: "Void contract"
    description: "Stop implementation and reassess"
```

---

**Step 3: Implement Under Contract (RSTC Protocol with Autonomous Retry)**

Follow the Requirement-Spec-Test-Code sequence for logic-heavy work. For trivial changes (docs, config, UI copy), use simplified verification.

**Logic-Heavy Changes** (new APIs, business logic, state management):
1. **Requirement (R)**: Review criterion and linked test scenario.
2. **Spec (S)**: Detail technical implementation and edge cases.
3. **Test (T)**: Write/update test and provide **Red Phase Evidence** (failing logs).
4. **Code (C)**: Implement solution and provide **Green Phase Evidence** (passing logs).

> **Autonomous Retry applies to steps T and C**: If verification fails, apply the Autonomous Retry Protocol before moving to the next step.

**Trivial Changes** (documentation, configuration, trivial UI):
- Skip formal test writing - use simplified verification:
  - Build passes, linter clean, manual inspection
- Include rationale in CONTRACT STATUS:
  - Example: `- [x] (C3) Update README (trivial: documentation change, verified by manual review)`

**Borderline cases**: Default to full RSTC protocol if uncertain.

### Incremental Task Verification

After completing EACH task (before marking it complete in tasks.md):

1. Run relevant verification for that task:
   - TypeScript: `npm run check` (typecheck + lint)
   - Tests: Run unit tests for affected modules
   - Build: Verify no compilation errors

2. If verification fails, apply Autonomous Retry Protocol

3. Only mark task complete after verification passes

This provides early feedback and catches issues before they compound.

### Working Through Tasks

With the contract established:
- Work through tasks sequentially from `tasks.md`
- For EACH task: implement → verify (with retry) → mark complete
- End every response with a CONTRACT STATUS block
- Declare completion only when ALL criteria are `[x]` AND Global Final Loop passes

**Guardrails**
- Favor straightforward, minimal implementations first
- Keep changes tightly scoped to the proposal
- Refer to `openspec/AGENTS.md` for OpenSpec conventions if needed

---

**Step 4: Global Final Loop**

Before declaring CONTRACT FULFILLED, run the Global Final Loop:

```
============================================================
              GLOBAL FINAL LOOP VERIFICATION
============================================================

Running full verification suite...
- [ ] Full build: npm run check
- [ ] All tests: npm test (or equivalent)
- [ ] No lint errors
- [ ] No TypeScript errors

============================================================
```

Execute ALL project verification commands. If any fail:
1. Apply Autonomous Retry Protocol (classify error, diagnose, fix, retry)
2. Continue until all pass OR retry budget exhausted

Only after Global Final Loop passes can you declare CONTRACT FULFILLED.

---

**Contract Completion**

Before declaring CONTRACT FULFILLED:
- [ ] Every task in `tasks.md` is marked `- [x]`
- [ ] Every acceptance criterion from `proposal.md` is verified
- [ ] No TODOs or FIXMEs left in code
- [ ] Global Final Loop verification passed
- [ ] Build/tests pass

Follow the standard contract completion protocol (commit, changelog update).

### Completion Banner

After CONTRACT FULFILLED, emit:

```
============================================================
      /openspec-ralph <change-id> COMPLETE
============================================================
Result: CONTRACT FULFILLED (autonomous retry enabled)
============================================================
```

**If retry budget was exhausted and user intervened:**
```
============================================================
      /openspec-ralph <change-id> COMPLETE
============================================================
Result: CONTRACT FULFILLED (with human guidance on N issues)
============================================================
```

**Reference**
- Use `openspec show <id> --json --deltas-only` for additional proposal context

<!-- OPENSPEC:END -->
