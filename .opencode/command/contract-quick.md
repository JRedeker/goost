---
description: Quickly create a contract by inferring criteria from your request
agent: general
---

# /contract-quick - Rapid Contract Creation

For when you don't want the interactive flow. Parse the user's request and immediately propose a contract.

## Behavior

When invoked with a task description, **skip the questions** and directly propose a contract based on analysis of the request.

### Process

1. **Parse the user's input** for:
   - Implicit objective (what they want done)
   - Implicit success criteria (what "done" means)
   - Implicit constraints (things they care about preserving)

2. **Generate a contract** with reasonable defaults

3. **Present for confirmation** (still required - emit `[GOOST:MIC]` to signal approval needed)

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
- [ ] Login endpoint accepts credentials and returns JWT
- [ ] Protected routes reject requests without valid JWT
- [ ] Protected routes accept requests with valid JWT
- [ ] JWT includes user ID and expiration
- [ ] Existing unprotected routes continue to function

CONSTRAINTS:
- MUST NOT: Break existing route functionality
- MUST: Use industry-standard JWT practices (proper signing, expiration)

CHECKPOINTS:
- [ ] Phase 1: JWT generation and validation utilities
- [ ] Phase 2: Auth middleware implemented
- [ ] Phase 3: Login endpoint working
- [ ] Phase 4: Existing routes verified

============================================================

[GOOST:MIC]

Does this capture your requirements? Say "confirm" to lock, or suggest changes.
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
