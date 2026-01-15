---
name: contract-quick
description: Quickly create a contract by inferring criteria from your request
agent: general
---

# /contract-quick - Rapid Contract Creation

> **SUB-AGENT CONTEXT**: Return findings directly. Status markers and CONTRACT STATUS blocks are for main sessions only—omit them to maximize your output buffer.

For when you don't want the interactive flow. Parse the user's request and immediately propose a contract.

## Pre-flight Check

If `$ARGUMENTS` is empty or whitespace:
```
Usage: /contract-quick <task description>

Example: /contract-quick Add JWT auth without breaking existing routes

For an interactive contract flow, use /contract instead.
```
Then stop execution.

## Behavior

When invoked with a task description, **skip the questions** and directly propose a contract based on analysis of the request.

### Process

1. **Parse the user's input** for:
   - Implicit objective (what they want done)
   - Implicit success criteria (what "done" means). Link to Test Plan (C1, C2).
   - Implicit test plan (how to verify each criterion)
   - Implicit constraints (things they care about preserving)

2. **Generate a contract** with reasonable defaults

3. **Present for confirmation** - emit `[GOOST:MIC]` and WAIT for user approval before starting work

**Note:** Unlike `/openspec-apply` where the spec provides implicit approval, `/contract-quick` requires explicit confirmation because the AI is inferring criteria that the user must validate.

### Example

**User input:**
```
/contract-quick Add user authentication with JWT, make sure existing routes still work
```

**Your response:**
```
Based on your request, here's a proposed contract:

============================================================
                    CONTRACT ACTIVE
============================================================

OBJECTIVE: Add JWT-based user authentication to the application.

SUCCESS CRITERIA:
- [ ] (C1) Login endpoint accepts credentials and returns JWT
- [ ] (C2) Protected routes reject requests without valid JWT
- [ ] (C3) Protected routes accept requests with valid JWT
- [ ] (C4) Existing unprotected routes continue to function

TEST PLAN:
- [ ] (C1) `npm test auth.login.test.ts`
- [ ] (C2) `npm test auth.middleware.test.ts`
- [ ] (C3) `npm test auth.middleware.test.ts`
- [ ] (C4) `npm test routes.test.ts`

CONSTRAINTS:
- MUST NOT: Break existing route functionality
- MUST: Use industry-standard JWT practices (proper signing, expiration)

CHECKPOINTS:
- [ ] Phase 1: JWT generation and validation utilities
- [ ] Phase 2: Auth middleware implemented
- [ ] Phase 3: Login endpoint working
- [ ] Phase 4: Existing routes verified

============================================================
```

Then emit `[GOOST:MIC]` and use `mcp_question` for confirmation:

```
Use mcp_question with:
  header: "Confirm"
  question: "Does this capture your requirements?"
  options:
    - label: "Accept contract (Recommended)"
      description: "Lock the contract and begin work"
    - label: "Suggest changes"
      description: "Modify criteria before locking"
    - label: "Cancel"
      description: "Discard and optionally use full /contract flow"
```

### Inference Guidelines

**For feature requests**, assume criteria like:
- Feature works as described
- Existing functionality preserved
- Tests included (if project has tests)
- No type errors (if TypeScript)

**For bug fixes**, assume criteria like:
- Bug no longer reproduces
- Root cause identified and fixed (not just symptoms)
- Regression test added
- No new bugs introduced

**For refactoring**, assume criteria like:
- All existing tests pass
- Behavior unchanged
- Code meets stated improvement goal
- No new warnings/errors

### When to Fall Back to Full Flow

If the request is:
- Ambiguous (could mean multiple things)
- Very complex (needs >8 criteria)
- Missing key context

Say: "This request needs more detail. Let me walk through the full contract flow..."

Then invoke the standard `/contract` behavior.

---

## Completion Banner

After CONTRACT FULFILLED (or CONTRACT VOIDED), emit:

```
============================================================
      /contract-quick COMPLETE
============================================================
Result: CONTRACT FULFILLED
============================================================
```

**If voided:**
```
============================================================
      /contract-quick COMPLETE
============================================================
Result: CONTRACT VOIDED - X of Y criteria completed
============================================================
```
