---
name: openspec-prep
description: Pre-implementation preparation - analyze spec gaps and add missing acceptance criteria, scenarios, and tasks under contract enforcement.
agent: general
---

# OpenSpec Pre-Implementation Preparation

> **SUB-AGENT CONTEXT**: Return findings directly. Status markers and CONTRACT STATUS blocks are for main sessions only—omit them to maximize your output buffer.

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

Analyze the spec across these dimensions, building a list of gaps to fix.

**TERMINATION CRITERIA (Gap Analysis):**
- Gap analysis is considered complete ONLY after:
  1. All requirements in the spec have been checked for scenarios.
  2. The codebase has been searched for at least 3 key terms from the spec (Phase 1.4).
  3. At least 2 relevant libraries have been researched via Context7 (if applicable).
  4. All deployed specs have been scanned for conflicts (Phase 1.6).
- Record the count of gaps identified.

> **Research Coordination Note**: If using sub-agents for parallel research (1.4-1.6), synthesize results into a **simple numbered list** of gaps. Extract only the actionable gaps—keep research details in sub-agent outputs, not working memory.

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

### 1.6 Cross-Spec Consistency

Check for conflicts between this change and existing deployed specs:

1. **Scan existing specs**:
   ```bash
   ls openspec/specs/
   ```
   Read `openspec/specs/*/spec.md` for all deployed capabilities.

2. **Extract requirements from the change**:
   - Parse `openspec/changes/$ARGUMENTS/specs/*/spec.md` for requirements
   - Note any identifiers, behaviors, or state transitions defined

3. **Conflict detection** - Compare against deployed specs for:

   | Conflict Type | Example |
   |---------------|---------|
   | **Direct conflicts** | Two specs define contradicting behavior for same action |
   | **Behavioral conflicts** | Same API endpoint with different response contracts |
   | **State conflicts** | Incompatible state transitions (e.g., session timeout: 1hr vs 24hr) |
   | **Scope overlaps** | Multiple specs claiming responsibility for same feature |
   | **Terminology inconsistencies** | Same concept with different names across specs |

4. **Cross-reference check**:
   ```bash
   # Find requirements in deployed specs that mention same identifiers
   rg -n "Requirement:" openspec/specs/ | grep -i "<key-terms-from-change>"
   ```

**Flag gaps**: Conflicting requirements, inconsistent terminology, scope overlaps.

**Resolution options** (add to gaps list):
- Update the change's spec to align with existing specs
- Note that existing spec needs a separate change proposal to resolve conflict
- Add explicit supersedes/overrides note if intentional

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
- [ ] No unresolved cross-spec conflicts
- [ ] openspec validate passes with --strict

GAPS TO FIX:
- [ ] <gap 1 from analysis>
- [ ] <gap 2 from analysis>
- [ ] <gap N from analysis>

============================================================
```

**Display the contract and immediately proceed** - user invocation of `/openspec-prep` is implicit approval.

---

## Phase Transition: Synthesis → Execution

> **CRITICAL: Anti-Loop Protocol**
>
> After displaying the contract above, you MUST:
> 1. Output exactly: `>>> SYNTHESIS COMPLETE - EXECUTING GAP FIXES <<<`
> 2. **Immediately** emit your first tool call (Read or Edit) in the same response
> 3. Proceed directly to action—skip additional planning or "I will now..." statements
>
> **Loop check**: If you're writing "Actually, I'll...", "Let me now...", or re-stating the plan, you're in a planning loop. Emit a tool call immediately.

---

## Phase 3: Fix Gaps (Under Contract)

Work through gaps **ONE AT A TIME**, making actual edits to the spec files.

> **Sequential Processing Rule**: 
> - Pick the FIRST unfixed gap
> - Make the edit (one tool call)
> - Mark it complete in your tracking
> - Move to the next gap
> - Process gaps one at a time—act immediately on each before considering the next

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

### For Cross-Spec Conflicts

When conflicts with deployed specs are found, resolve by one of:

1. **Align with existing spec** - Update this change's requirements to match:
   ```markdown
   > **Aligned with [spec-name]**: Using <value> to match existing behavior.
   ```

2. **Document intentional override** - If this change intentionally supersedes:
   ```markdown
   > **Supersedes [spec-name]**: This change updates <behavior> from <old> to <new>.
   > A follow-up change proposal will update the affected spec.
   ```

3. **Flag for separate resolution** - If conflict requires broader discussion:
   - Add to `proposal.md` under a new "## Spec Conflicts" section
   - List the conflicting specs and requirements
   - Note that resolution is out of scope for this change

---

## Phase 4: Validation

After making all changes:

1. Run `openspec validate $ARGUMENTS --strict`
2. Fix any validation errors
3. Re-run until validation passes

---

## Phase 5: Final Report

**>>> FINAL ASSESSMENT CHECKPOINT <<<**
Before fulfilling the contract, verify:
- `openspec validate --strict` has passed in the previous turn.
- All GAPS TO FIX from Phase 2 are marked `[x]`.
- No new gaps were introduced during implementation.

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
- [x] No unresolved cross-spec conflicts
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

> **Anti-Loop Check**: If your response exceeds 500 words without a tool call, STOP and emit a tool call immediately. Planning loops manifest as verbose re-stating of intent without action.

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

Output CONTRACT FULFILLED only when:
- ALL gaps are fixed
- `openspec validate --strict` passes
- All success criteria are `[x]`

---

## Reference Commands

- `openspec show $ARGUMENTS --json --deltas-only` - Full spec context
- `openspec validate $ARGUMENTS --strict` - Validate changes
- `rg -n "Requirement:|Scenario:" openspec/changes/$ARGUMENTS/` - Find requirements
