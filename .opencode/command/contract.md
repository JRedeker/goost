---
name: contract
description: Establish a binding task contract with verifiable success criteria
---

# /contract - Establish a Binding Task Contract

You are establishing a **binding contract** with the user. This contract defines success criteria that CANNOT be unilaterally changed and MUST be satisfied before declaring task completion.

## Contract Creation Process

### Step 1: Analyze the Request

Parse the provided task description to extract:

1. **Objective**: The one-sentence definition of "done"
2. **Success Criteria**: 3-5 specific, verifiable conditions that must be true when complete
3. **Constraints**: Hard boundaries - things that MUST or MUST NOT happen
4. **Checkpoints**: Phase gates for multi-step work (if applicable)

If the request is ambiguous or missing critical information, ask clarifying questions before generating the contract. Otherwise, proceed directly to formatting.

### Step 2: Format the Contract

Once gathered, output the contract in this exact format:

```
============================================================
                    CONTRACT ACTIVE
============================================================

OBJECTIVE: <one sentence definition of done>

SUCCESS CRITERIA:
- [ ] <criterion 1 - must be verifiable>
- [ ] <criterion 2 - must be verifiable>
- [ ] <criterion 3 - must be verifiable>
[additional criteria as needed]

CONSTRAINTS:
- MUST NOT: <hard boundary>
- MUST: <non-negotiable requirement>
[or "None specified" if not provided]

CHECKPOINTS:
- [ ] Phase 1: <milestone description>
- [ ] Phase 2: <milestone description>
[or "Single-phase task" if not applicable]

============================================================
```

### Step 3: Confirm and Lock

Present the contract and ask for confirmation:

```
Contract ready. Do you accept these terms? (yes/no or suggest changes)
```

Only proceed with work after explicit confirmation (yes, confirmed, let's go, accept, etc.).

Once confirmed, the contract is **IMMUTABLE**. Neither you nor the user can modify success criteria without explicitly voiding the contract and creating a new one.

---

## Contract Enforcement Rules

### During Execution

1. **Every response** must end with a **Contract Status** block:
   ```
   ---
   CONTRACT STATUS:
   - [x] Criterion 1 (completed: <brief evidence>)
   - [ ] Criterion 2 (in progress / blocked / pending)
   - [ ] Criterion 3 (pending)
   Phase: 1 of 2 | Criteria: 1/3 complete
   ---
   ```

2. **Update checkboxes** only when you have concrete evidence the criterion is met (test passes, file exists, behavior verified).

3. **Never skip the status block** - it's your accountability anchor.

### Completion Rules

**You CANNOT declare the task complete until:**
- ALL success criteria checkboxes are marked `[x]`
- ALL checkpoint phases are marked complete
- NO constraints have been violated

**If the user asks "are we done?" or tries to end early:**
1. Display current contract status
2. List any unmet criteria explicitly
3. Ask: "These criteria remain unmet. Should we continue, or do you want to void the contract and accept partial completion?"

**If you're genuinely blocked:**
1. Explain specifically what's blocking each unmet criterion
2. Propose solutions or ask for user input
3. Do NOT declare done - stay in "blocked" state until resolved or contract voided

### Doom Loop Detection

A **doom loop** is when you repeatedly attempt the same failing approach. Detect it when:
- Same fix attempted 3+ times without success
- Same error appearing after multiple attempts
- Single criterion stuck for 5+ responses
- Undoing and redoing the same changes

**When detected:**
```
[GOOST:DOOM_LOOP]

⚠️ DOOM LOOP DETECTED

I've attempted [approach] [N] times without success.
Recurring issue: [error/problem]

Options:
1. Try alternative: [different strategy]
2. Need context: [question for user]
3. Mark blocked: [explain blocker]
4. Void contract
```

**STOP and wait for user direction.** Do not retry the same approach.

### Contract Voiding

The user (not you) can void a contract by explicitly saying:
- "Void the contract"
- "Cancel the contract"
- "I accept partial completion"

When voided, output:
```
============================================================
                  CONTRACT VOIDED
============================================================
Completed: X of Y criteria
Unmet criteria:
- <criterion A>
- <criterion B>
============================================================
```

---

## Quality Guidelines for Criteria

Good criteria are **verifiable**:
- "All tests pass" (run tests, see green)
- "Function handles edge case X" (write test, prove it)
- "No TypeScript errors" (run tsc, check output)
- "API endpoint returns expected response" (curl it, verify)

Bad criteria are **subjective**:
- "Code is clean" (according to whom?)
- "Performance is good" (how good? measured how?)
- "Works correctly" (define "correctly")

If user provides vague criteria, help them sharpen it:
> "You said 'works correctly' - can we make that more specific? Like 'user can complete checkout flow without errors' or 'all unit tests pass'?"

---

## Example Contract

```
============================================================
                    CONTRACT ACTIVE
============================================================

OBJECTIVE: Add dark mode toggle to the settings page that persists user preference.

SUCCESS CRITERIA:
- [ ] Toggle component renders on settings page
- [ ] Clicking toggle switches between light/dark themes
- [ ] Preference persists across page refreshes (localStorage)
- [ ] All existing tests pass
- [ ] No TypeScript errors

CONSTRAINTS:
- MUST NOT: Break existing light theme styles
- MUST: Support system preference detection as default

CHECKPOINTS:
- [ ] Phase 1: Toggle component created and rendering
- [ ] Phase 2: Theme switching functional
- [ ] Phase 3: Persistence and system preference working

============================================================
```
