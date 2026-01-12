---
name: openspec-prep
description: Pre-implementation preparation - analyze spec gaps and add missing acceptance criteria, scenarios, and tasks under contract enforcement.
agent: general
---

# OpenSpec Pre-Implementation Preparation

> **SUB-AGENT CONTEXT**: You are running as a sub-agent. Do NOT emit `[GOOST:*]` status markers or CONTRACT STATUS blocks - these only work in the main session and waste your output buffer. Focus on returning useful results directly.

You are performing **pre-implementation preparation** on the OpenSpec change: `$ARGUMENTS`

This command **analyzes AND improves** the spec by adding missing acceptance criteria, scenarios, and tasks. Changes to spec files are made under contract enforcement.

> **Note**: This command was formerly `/openspec-review`. Use `/openspec-review` after implementation for code review.

## Pre-flight Checks

### Step 1: Validate Arguments

If `$ARGUMENTS` is empty or whitespace:
```
Usage: /openspec-prep <change-id>

Run `openspec list` to see available changes.
```
Then list active changes and stop.

### Step 2: Fetch Change Context

```bash
openspec show $ARGUMENTS --json
```

**If change not found:**
- Display: "Change '$ARGUMENTS' not found"
- Run `openspec list` and show available changes
- Stop execution

### Step 3: Read Spec Files

Read these files to understand current state:
- `openspec/changes/$ARGUMENTS/proposal.md`
- `openspec/changes/$ARGUMENTS/tasks.md`
- `openspec/changes/$ARGUMENTS/design.md` (if exists)
- `openspec/changes/$ARGUMENTS/specs/*/spec.md`
- `openspec/project.md`

---

## Phase 1: Analysis (Build the Gap List)

Analyze the spec across these dimensions, building a list of gaps to fix:

### 1.1 Acceptance Criteria Completeness

For each requirement in `specs/*/spec.md`:
- [ ] Has clear, testable success criteria
- [ ] Has at least one `#### Scenario:` with Given/When/Then
- [ ] Scenarios cover happy path AND error cases
- [ ] Edge cases are documented

**Flag gaps**: Requirements missing scenarios, vague criteria, missing error cases.

### 1.2 Task Completeness

Review `tasks.md`:
- [ ] Tasks are atomic and verifiable
- [ ] Each task has clear completion criteria
- [ ] Tasks cover all requirements in spec
- [ ] Tasks include verification steps (tests, validation)

**Flag gaps**: Missing tasks, vague tasks, tasks without verification.

### 1.3 Cross-Cutting Concerns

Check if spec addresses:

| Concern | Check For |
|---------|-----------|
| Error Handling | Failure scenarios, API errors, network failures |
| Logging/Observability | Structured logs, metrics, traces |
| Security | Auth, input validation, secrets handling |
| Configuration | New config options, env vars, feature flags |
| Performance | Latency requirements, rate limits |

**Flag gaps**: Concerns not addressed in requirements or scenarios.

### 1.4 Codebase Impact

1. Extract key terms from the spec
2. Search codebase for files matching those terms
3. Compare with "Affected code" in proposal.md

**Flag gaps**: Files that should be in scope but aren't listed.

### 1.5 Documentation Research (Context7)

For libraries/frameworks mentioned in the spec:
1. Use `resolve-library-id` to find Context7 ID
2. Use `query-docs` to verify API patterns
3. Check version compatibility

**Flag gaps**: Outdated patterns, version mismatches, missing error handling.

---

## Phase 2: Contract Establishment

Based on the analysis, generate a contract for the spec improvements:

```
============================================================
                    CONTRACT ACTIVE
============================================================

OBJECTIVE: Prepare spec for implementation by filling all gaps

SUCCESS CRITERIA:
- [ ] All requirements have at least one scenario
- [ ] All scenarios have Given/When/Then format
- [ ] Error cases documented for each requirement
- [ ] Tasks cover all requirements with verification steps
- [ ] Cross-cutting concerns addressed (or marked N/A with reason)
- [ ] Affected code section complete
- [ ] openspec validate passes with --strict

GAPS TO FIX:
- [ ] <gap 1 from analysis>
- [ ] <gap 2 from analysis>
- [ ] <gap N from analysis>

============================================================
```

**Display the contract and immediately proceed** - user invocation of `/openspec-prep` is implicit approval.

---

## Phase 3: Fix Gaps (Under Contract)

Work through each gap, making actual edits to the spec files:

### For Missing Scenarios

Add scenarios to `openspec/changes/$ARGUMENTS/specs/<capability>/spec.md`:

```markdown
#### Scenario: <descriptive name>
- **GIVEN** <precondition>
- **WHEN** <action>
- **THEN** <expected result>
```

### For Missing Error Cases

Add error scenarios after happy path scenarios:

```markdown
#### Scenario: <operation> fails when <condition>
- **GIVEN** <error precondition>
- **WHEN** <action that should fail>
- **THEN** <error handling behavior>
```

### For Missing Tasks

Add tasks to `openspec/changes/$ARGUMENTS/tasks.md`:

```markdown
- [ ] <task description>
  - Verify: <how to verify completion>
```

### For Cross-Cutting Concerns

Add requirements or scenarios addressing the concern, OR add explicit N/A note:

```markdown
> **Note**: <concern> is N/A for this change because <reason>.
```

### For Affected Code Gaps

Update `proposal.md` "Affected code" section with discovered files.

---

## Phase 4: Validation

After making all changes:

1. Run `openspec validate $ARGUMENTS --strict`
2. Fix any validation errors
3. Re-run until validation passes

---

## Phase 5: Final Report

Generate the completion report:

```
============================================================
                  CONTRACT FULFILLED
============================================================

OBJECTIVE: Prepare spec for implementation by filling all gaps

ALL CRITERIA MET:
- [x] All requirements have at least one scenario
- [x] All scenarios have Given/When/Then format
- [x] Error cases documented for each requirement
- [x] Tasks cover all requirements with verification steps
- [x] Cross-cutting concerns addressed
- [x] Affected code section complete
- [x] openspec validate passes with --strict

CHANGES MADE:
- Added N scenarios to specs/<capability>/spec.md
- Added M tasks to tasks.md
- Updated affected code in proposal.md
- Added cross-cutting concern notes

VALIDATION: openspec validate $ARGUMENTS --strict - PASSED

============================================================
NEXT STEPS:
Ready for implementation! Run `/openspec-apply $ARGUMENTS`
============================================================
```

---

## Contract Enforcement

Throughout Phase 3, end every response with a CONTRACT STATUS block:

```
---
CONTRACT STATUS:
- [x] Gap 1 (evidence: added scenario at line X)
- [ ] Gap 2 (status: in progress)
- [ ] Gap 3 (status: pending)
Phase: 3 of 5 | Gaps: N/M fixed
---
```

Do NOT output CONTRACT FULFILLED until:
- ALL gaps are fixed
- `openspec validate --strict` passes
- All success criteria are `[x]`

---

## Reference Commands

- `openspec show $ARGUMENTS --json --deltas-only` - Full spec context
- `openspec validate $ARGUMENTS --strict` - Validate changes
- `rg -n "Requirement:|Scenario:" openspec/changes/$ARGUMENTS/` - Find requirements
