---
name: contract
description: Establish a binding task contract with verifiable success criteria
---

# /contract - Establish a Binding Task Contract

You are establishing a **binding contract** with the user. This contract defines success criteria that only the user can change and MUST be satisfied before declaring task completion.

## Contract Creation Process

### Step 1: Analyze the Request

Parse the provided task description to extract:

1. **Objective**: The one-sentence definition of "done"
2. **Success Criteria**: 3-5 specific, verifiable conditions that must be true when complete. Link to Test Plan scenarios using IDs (e.g., C1, C2).
3. **Test Plan**: Specific test scenarios mapping to each criterion.
4. **Constraints**: Hard boundaries - things that MUST or MUST NOT happen
5. **Checkpoints**: Phase gates for multi-step work (if applicable)

If the request is ambiguous or missing critical information, ask clarifying questions before generating the contract. Otherwise, proceed directly to formatting.

### Step 2: Format the Contract

Once gathered, output the contract in this exact format:

```
============================================================
                    CONTRACT ACTIVE
============================================================

OBJECTIVE: <one sentence definition of done>

SUCCESS CRITERIA:
- [ ] (C1) <criterion 1 - must be verifiable>
- [ ] (C2) <criterion 2 - must be verifiable>
- [ ] (C3) <criterion 3 - must be verifiable>
[additional criteria as needed]

TEST PLAN:
- [ ] (C1) <test scenario 1 - file: path/to/test.ts>
- [ ] (C2) <test scenario 2 - file: path/to/test.ts>
- [ ] (C3) <test scenario 3 - file: path/to/test.ts>

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

Present the contract and use `mcp_question` to ask for confirmation:

```
Use mcp_question with:
  header: "Confirm"
  question: "Contract ready. Do you accept these terms?"
  options:
    - label: "Accept contract (Recommended)"
      description: "Lock the contract and begin work"
    - label: "Suggest changes"
      description: "Modify criteria before locking"
    - label: "Cancel"
      description: "Discard the contract"
```

Only proceed with work after "Accept contract" is selected. If "Suggest changes" is selected, apply modifications and re-present.

Once confirmed, the contract is **IMMUTABLE**. Neither you nor the user can modify success criteria without explicitly voiding the contract and creating a new one.

---

## Contract Enforcement Rules

### During Execution

1. **Every response** must end with a **Contract Status** block:
   ```
   ---
   CONTRACT STATUS:
   - [x] (C1) Criterion 1 (evidence: <link to logs or commit>)
   - [ ] (C2) Criterion 2 (status: pending|in progress|blocked | phase: red|green)
   - [ ] (C3) Criterion 3 (pending)
   Phase: 1 of 2 | Criteria: 1/3 complete
   ---
   ```

2. **TDD Protocol (RSTC)**: You MUST follow the Requirement-Spec-Test-Code sequence.
   - Provide **Red Phase Evidence** (failing logs) before implementation.
   - Provide **Green Phase Evidence** (passing logs) after implementation.
   - Mark a criterion `[x]` only after both Red and Green evidence are provided.

3. **Update checkboxes** only when you have concrete evidence the criterion is met (test passes, file exists, behavior verified).

4. **Always include the status block** - it's your accountability anchor.

### Completion Rules

**Declare the task complete when:**
- ALL success criteria checkboxes are marked `[x]`
- ALL checkpoint phases are marked complete
- All constraints have been honored

**If the user asks "are we done?" or tries to end early:**
1. Display current contract status
2. List any unmet criteria explicitly
3. Ask: "These criteria remain unmet. Should we continue, or do you want to void the contract and accept partial completion?"

**If you're genuinely blocked:**
1. Explain specifically what's blocking each unmet criterion
2. Propose solutions or ask for user input
3. Stay in "blocked" state until resolved or contract voided

### Doom Loop Detection

A **doom loop** is when you repeatedly attempt the same failing approach. Detect it when:
- Same fix attempted 3+ times without success
- Same error appearing after multiple attempts
- Single criterion stuck for 5+ responses
- Undoing and redoing the same changes

**When detected:**

1. Emit `[GOOST:DOOM_LOOP]` marker with description
2. Use `mcp_question` to present recovery options:
   ```
   Use mcp_question with:
     header: "Recovery"
     question: "I've attempted [approach] [N] times without success. Recurring issue: [error/problem]"
     options:
       - label: "Try alternative"
         description: "[different strategy]"
       - label: "Get more context"
         description: "[question for user]"
       - label: "Mark blocked"
         description: "[explain blocker]"
       - label: "Void contract"
         description: "Cancel and reassess scope"
   ```

**STOP and wait for user selection.** Do not retry the same approach.

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

### Completion Banner

After CONTRACT FULFILLED (or CONTRACT VOIDED), emit:

```
============================================================
      /contract COMPLETE
============================================================
Result: CONTRACT FULFILLED
============================================================
```

**If voided:**
```
============================================================
      /contract COMPLETE
============================================================
Result: CONTRACT VOIDED - X of Y criteria completed
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
- [ ] (C1) Toggle component renders on settings page
- [ ] (C2) Clicking toggle switches between light/dark themes
- [ ] (C3) Preference persists across page refreshes (localStorage)
- [ ] (C4) No TypeScript errors

TEST PLAN:
- [ ] (C1) Renders toggle: `npm test Toggle.test.ts`
- [ ] (C2) Switches theme: `npm test Theme.test.ts`
- [ ] (C3) Persists preference: `npm test Storage.test.ts`
- [ ] (C4) Type check: `npm run tsc`

CONSTRAINTS:
- MUST NOT: Break existing light theme styles
- MUST: Support system preference detection as default

CHECKPOINTS:
- [ ] Phase 1: Toggle component created and rendering
- [ ] Phase 2: Theme switching functional
- [ ] Phase 3: Persistence and system preference working

============================================================
```
