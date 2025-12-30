---
name: openspec-harden
description: Post-implementation hardening analysis for OpenSpec changes - checks test coverage, code quality, documentation, cleanup, and spec alignment.
agent: general
---

# OpenSpec Hardening Analysis

You are performing a **post-implementation hardening analysis** on the OpenSpec change: `$ARGUMENTS`

This command analyzes a completed (or nearly completed) change to verify production-readiness before shipping.

## Pre-flight Checks

### Step 1: Validate Arguments

If `$ARGUMENTS` is empty or whitespace:
```
Usage: /openspec-harden <change-id>

Run `openspec list` to see available changes.
```
Then list active changes and stop.

### Step 2: Fetch Change Context

```bash
openspec show $ARGUMENTS --json
```

**If the command fails:**
- Check if OpenSpec CLI is available: `which openspec`
- If not available, display: "OpenSpec CLI required for hardening analysis. Install from: https://github.com/openspec-dev/openspec"
- Stop execution

**If change not found:**
- Display: "Change '$ARGUMENTS' not found"
- Run `openspec list` and show available changes
- Stop execution

**If change is archived:**
- Note: "This change has been archived. Performing post-archive verification."
- Continue with analysis

### Step 3: Extract Change Details

From the OpenSpec JSON output, extract:
- Change ID and title
- Affected files (from proposal.md "Affected code" section)
- Task list and completion status
- Spec deltas and scenarios

Read these files for context:
- `openspec/changes/$ARGUMENTS/proposal.md`
- `openspec/changes/$ARGUMENTS/tasks.md`
- `openspec/changes/$ARGUMENTS/specs/*/spec.md`

---

## Hardening Analysis

Track each analysis phase as a TODO. For each phase, collect issues into categories:
- **BLOCKER**: Must fix before shipping
- **WARNING**: Should fix, but not blocking
- **INFO**: Informational, optional improvement

### Phase 1: Test Coverage Analysis

**Goal**: Verify tests exist for new/modified code.

1. **Identify source files** from the change:
   - Parse "Affected code" from proposal.md
   - Search for files matching change keywords using `glob`/`grep`
   
2. **Check for corresponding test files** using common patterns:
   - TypeScript/JavaScript: `*.test.ts`, `*.spec.ts`, `*.test.js`, `*.spec.js`
   - Python: `test_*.py`, `*_test.py`
   - Go: `*_test.go`
   
3. **Calculate coverage**:
   - Count source files with corresponding test files
   - Report percentage: (files with tests / total source files)
   
4. **Run tests if possible**:
   - If `package.json` exists with test script: `npm test` or `npm run test`
   - If `pytest` available: `pytest --collect-only` to verify tests exist
   - Note if test execution was skipped

**Scoring**:
- PASS: >80% files have tests, tests pass
- WARN: 50-80% files have tests, or tests not run
- FAIL: <50% files have tests, or tests fail

### Phase 2: Implementation Quality Analysis

**Goal**: Detect code quality issues, hacky patterns, and AI slop.

Search affected files for:

#### 2.1 Incomplete Work Markers
```bash
rg -n "TODO|FIXME|HACK|XXX" <affected-files>
```
- Report each occurrence with file:line

#### 2.2 Debug Artifacts
```bash
rg -n "console\.log|console\.debug|console\.info|debugger" <affected-files> --type ts --type js
```
- Exclude files in `logger/`, `logging/`, or named `logger.ts`/`log.ts`
- Flag each for removal

#### 2.3 Commented-Out Code
Search for blocks of 3+ consecutive commented lines:
```bash
rg -n "^(\s*)//.*$" <affected-files> --type ts --type js
```
- Flag blocks that appear to be disabled code (not documentation)

#### 2.4 Hacky Code Patterns
Search for:
- `as any` or `as unknown` - type safety bypasses
- `@ts-ignore` or `@ts-expect-error` - TypeScript ignores
- `eslint-disable` without specific rule - blanket disables
- Magic numbers (numeric literals not 0, 1, -1 in non-obvious contexts)
- Functions >50 lines (use `wc -l` on function bodies)
- Nesting >3 levels deep

#### 2.5 AI Slop Patterns
Search for signs of low-quality AI-generated code:
- Comments that restate the obvious: `// increment i` before `i++`
- Placeholder implementations: `throw new Error("Not implemented")`, `pass`, `...`
- Overly verbose names: `thisIsTheVariableThatHoldsTheUserName` instead of `userName`
- Generic error messages: `"An error occurred"`, `"Something went wrong"`
- Unnecessary wrapper functions that just call another function
- Inconsistent naming: mixing camelCase and snake_case in same file
- Redundant null checks after already checking

#### 2.6 Error Handling
Search for:
- Empty catch blocks: `catch (e) { }` or `catch { }`
- Generic catch with no context: `catch (e) { throw e }`
- Swallowed errors: `catch (e) { console.log(e) }` without re-throw
- Missing `.catch()` on promise chains
- `async` functions without try/catch

**Scoring**:
- PASS: No TODOs/FIXMEs, no debug artifacts, no blockers
- WARN: <5 minor issues (TODOs, warnings)
- FAIL: Debug artifacts present, or >5 issues, or any blockers

### Phase 3: Documentation Analysis

**Goal**: Verify documentation is updated for the change.

#### 3.1 README Check
- If change adds commands/features, check if README.md mentions them
- Search README for change keywords
- Flag if new functionality appears undocumented

#### 3.2 Inline Documentation
For exported functions in affected files:
- TypeScript: Check for JSDoc `/** ... */` comments
- Python: Check for docstrings `""" ... """`
- Go: Check for doc comments `// FunctionName ...`
- Report undocumented exports

#### 3.3 CHANGELOG Check
- If `CHANGELOG.md` exists, check for entry related to this change
- Search for change ID or keywords in unreleased section
- Flag if missing

**Scoring**:
- PASS: README updated (or N/A), CHANGELOG entry exists (or N/A), >80% exports documented
- WARN: Some documentation gaps
- FAIL: Major documentation missing for user-facing changes

### Phase 4: Cleanup Analysis

**Goal**: Identify artifacts that should be removed.

#### 4.1 Obsolete Files
Search for backup/temp files:
```bash
find . -name "*.bak" -o -name "*.orig" -o -name "*.old" -o -name "*~" -o -name "*.swp"
```
- Flag each for removal

#### 4.2 Dead Imports
For TypeScript/JavaScript files:
- Run `npx tsc --noEmit` if available to detect unused imports
- Or search for import statements and check if imported names are used

#### 4.3 Orphaned Test Files
- If source files were removed, check if their test files still exist
- Flag orphaned tests for removal or update

#### 4.4 Development Artifacts
Search for:
- `poc/`, `scratch/`, `temp/`, `tmp/` directories
- Files named `test.ts`, `scratch.py`, `debug.*`
- Large binary files that should be gitignored

**Scoring**:
- PASS: No obsolete files, no orphaned tests
- WARN: <3 cleanup items
- FAIL: >3 cleanup items, or dev artifacts in committed code

### Phase 5: Spec Alignment Analysis

**Goal**: Verify implementation matches spec requirements.

#### 5.1 Task Verification
Read `openspec/changes/$ARGUMENTS/tasks.md`:
- For each task marked `[x]`, verify evidence exists:
  - Search codebase for related code
  - Check git diff for related changes
- Flag tasks marked complete without evidence

#### 5.2 Scenario Coverage
Read spec scenarios from `openspec/changes/$ARGUMENTS/specs/*/spec.md`:
- Extract each `#### Scenario:` block
- Check if corresponding test exists that covers the scenario
- Calculate scenario coverage percentage

#### 5.3 Scope Creep Detection
Compare actual changes to stated scope:
- Read "Affected code" from proposal.md
- Check git diff or modified files
- Flag files modified that aren't in stated scope

**Scoring**:
- PASS: All tasks verified, >80% scenarios covered, no scope creep
- WARN: Some unverified tasks, 50-80% scenario coverage
- FAIL: <50% verified, major scope creep

---

## Report Generation

After completing all phases, generate the hardening report.

### Determine Overall Status

- **READY**: All dimensions PASS, or only minor WARNs
- **NEEDS_WORK**: One or more dimensions have WARN with significant issues
- **BLOCKED**: Any dimension has FAIL status

### Generate Report

```
============================================================
              HARDENING REPORT: $ARGUMENTS
============================================================

OVERALL STATUS: [READY | NEEDS_WORK | BLOCKED]

TEST COVERAGE                                    [PASS|WARN|FAIL]
  Files with tests: X/Y (Z%)
  Tests run: [PASSED | FAILED | SKIPPED]
  - [list untested files if any]

IMPLEMENTATION QUALITY                           [PASS|WARN|FAIL]
  TODOs: N | Debug: N | Hacky: N | Slop: N
  Error handling: [OK | WARN | REVIEW]
  - [list issues with file:line if any]

DOCUMENTATION                                    [PASS|WARN|FAIL]
  README: [Updated | Needs Update | N/A]
  API docs: X% coverage
  CHANGELOG: [Entry exists | Missing | N/A]
  - [list undocumented items if any]

CLEANUP                                          [PASS|WARN|FAIL]
  Obsolete files: N | Dead imports: N | Orphaned tests: N
  - [list items requiring cleanup if any]

SPEC ALIGNMENT                                   [PASS|WARN|FAIL]
  Tasks verified: X/Y
  Scenarios covered: Z%
  Scope: [OK | WARN - files outside scope]
  - [list misalignments if any]

============================================================
NEXT STEPS:
[If READY:]
No issues found. Ready to ship!

[If NEEDS_WORK or BLOCKED, list top 5 actions by severity:]
1. [BLOCKER] Fix: <description> (<file:line>)
2. [WARNING] Address: <description>
...
============================================================
```

---

## Execution

Now execute the hardening analysis for change: `$ARGUMENTS`

Track each phase as a TODO and report findings as you go. Be thorough but concise - focus on actionable issues, not comprehensive listings of passing checks.
