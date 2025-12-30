---
name: openspec-harden
description: Post-implementation hardening analysis for OpenSpec changes - orchestrated multi-phase analysis with sub-agents for scanning and remediation.
---

# OpenSpec Hardening Analysis

You are orchestrating a **post-implementation hardening analysis** on the OpenSpec change: `$ARGUMENTS`

This is a **multi-phase orchestration** - you spawn sub-agents for analysis, synthesize findings, then spawn targeted sub-agents for fixes.

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

Store this context - you'll pass relevant portions to sub-agents.

---

## Phase 1: Analysis (Sub-Agent Scanning)

**Goal**: Spawn specialized sub-agents to scan each hardening dimension in parallel.

Create a TODO list tracking each analysis sub-agent:
- [ ] Test Coverage Analysis
- [ ] Implementation Quality Analysis
- [ ] Documentation Analysis
- [ ] Cleanup Analysis
- [ ] Spec Alignment Analysis

### Spawn Analysis Sub-Agents

Spawn **5 parallel sub-agents** using the Task tool with `subagent_type: "explore"`:

#### Sub-Agent 1: Test Coverage Scanner

```
You are analyzing TEST COVERAGE for OpenSpec change: <change-id>

CONTEXT:
- Change title: <title>
- Affected files: <list from proposal.md>
- Project type: <infer from package.json, pyproject.toml, go.mod, etc.>

TASK:
1. For each affected source file, check if a corresponding test file exists:
   - TypeScript/JavaScript: `*.test.ts`, `*.spec.ts`, `*.test.js`, `*.spec.js`, or files in `__tests__/`
   - Python: `test_*.py`, `*_test.py`, or files in `tests/`
   - Go: `*_test.go` in same package

2. Calculate coverage: (files with tests / total source files) * 100

3. Check if tests can be run:
   - Look for test scripts in package.json, Makefile, or similar
   - Do NOT run tests, just report if test runner is available

RETURN FORMAT:
```json
{
  "dimension": "test_coverage",
  "files_analyzed": ["<file1>", "<file2>"],
  "files_with_tests": ["<file1>"],
  "files_without_tests": ["<file2>"],
  "coverage_percent": 50,
  "test_runner_available": true,
  "test_command": "npm test",
  "issues": [
    {"severity": "WARNING", "file": "<file2>", "message": "No test file found"}
  ]
}
```
```

#### Sub-Agent 2: Implementation Quality Scanner

```
You are analyzing IMPLEMENTATION QUALITY for OpenSpec change: <change-id>

CONTEXT:
- Affected files: <list from proposal.md>

TASK: Search affected files for quality issues. For each issue, record file, line, and category.

1. INCOMPLETE WORK: Search for TODO, FIXME, HACK, XXX comments

2. DEBUG ARTIFACTS: Search for console.log, console.debug, debugger statements
   - EXCLUDE files in logger/, logging/, or named logger.ts/log.ts

3. TYPE SAFETY BYPASSES: Search for `as any`, `as unknown`, `@ts-ignore`, `@ts-expect-error`

4. ERROR HANDLING ISSUES:
   - Empty catch blocks
   - Swallowed errors (catch with only console.log, no rethrow)
   - Missing .catch() on promise chains

5. AI SLOP PATTERNS:
   - Placeholder implementations: `throw new Error("Not implemented")`, `pass`, `...`
   - Generic error messages: "An error occurred", "Something went wrong"
   - Obvious comments restating code

RETURN FORMAT:
```json
{
  "dimension": "implementation_quality",
  "issues": [
    {"severity": "BLOCKER|WARNING|INFO", "category": "<category>", "file": "<file>", "line": <n>, "message": "<description>"}
  ],
  "summary": {
    "todos": 2,
    "debug_artifacts": 0,
    "type_bypasses": 1,
    "error_handling": 0,
    "ai_slop": 0
  }
}
```
```

#### Sub-Agent 3: Documentation Scanner

```
You are analyzing DOCUMENTATION for OpenSpec change: <change-id>

CONTEXT:
- Change title: <title>
- Affected files: <list from proposal.md>
- User-facing changes: <yes/no based on proposal>

TASK:

1. README CHECK:
   - If change adds commands/features, search README.md for mentions
   - Flag if new functionality appears undocumented

2. INLINE DOCUMENTATION:
   - For exported functions in affected files, check for doc comments:
     - TypeScript/JS: JSDoc `/** ... */`
     - Python: docstrings `""" ... """`
     - Go: `// FunctionName ...`
   - Count documented vs undocumented exports

3. CHANGELOG CHECK:
   - If CHANGELOG.md exists, check for entry related to this change
   - Search for change ID or keywords in unreleased section

RETURN FORMAT:
```json
{
  "dimension": "documentation",
  "readme": {"updated": true, "needs_update": false, "missing_items": []},
  "inline_docs": {"documented": 8, "undocumented": 2, "coverage_percent": 80},
  "changelog": {"entry_exists": false, "applicable": true},
  "issues": [
    {"severity": "WARNING", "file": "README.md", "message": "New /harden command not documented"}
  ]
}
```
```

#### Sub-Agent 4: Cleanup Scanner

```
You are analyzing CLEANUP NEEDS for OpenSpec change: <change-id>

CONTEXT:
- Affected files: <list from proposal.md>
- Project root: <path>

TASK:

1. OBSOLETE FILES: Search for backup/temp files:
   - *.bak, *.orig, *.old, *~, *.swp, .DS_Store

2. DEAD IMPORTS (TypeScript/JavaScript only):
   - Check if any imports in affected files are unused
   - Use grep to search if imported names appear elsewhere in file

3. ORPHANED TESTS:
   - If source files were removed in this change, check if their test files still exist

4. DEVELOPMENT ARTIFACTS:
   - poc/, scratch/, temp/, tmp/ directories
   - Files named test.ts, scratch.py, debug.*

RETURN FORMAT:
```json
{
  "dimension": "cleanup",
  "obsolete_files": ["<file1>"],
  "dead_imports": [{"file": "<file>", "import": "<name>"}],
  "orphaned_tests": [],
  "dev_artifacts": [],
  "issues": [
    {"severity": "WARNING", "file": "<file>", "message": "Backup file should be removed"}
  ]
}
```
```

#### Sub-Agent 5: Spec Alignment Scanner

```
You are analyzing SPEC ALIGNMENT for OpenSpec change: <change-id>

CONTEXT:
- Tasks file: openspec/changes/<change-id>/tasks.md
- Spec files: openspec/changes/<change-id>/specs/*/spec.md
- Proposal scope: <affected code section from proposal.md>

TASK:

1. TASK VERIFICATION:
   - For each task marked `[x]` in tasks.md, search for evidence:
     - Related code exists
     - Related tests exist
   - Flag tasks marked complete without evidence

2. SCENARIO COVERAGE:
   - Extract each `#### Scenario:` block from spec files
   - Check if corresponding test exists that covers the scenario
   - Calculate scenario coverage percentage

3. SCOPE CREEP DETECTION:
   - Compare actual changes (git diff or modified files) to stated scope
   - Flag files modified that aren't in stated "Affected code" scope

RETURN FORMAT:
```json
{
  "dimension": "spec_alignment",
  "tasks": {"total": 5, "verified": 4, "unverified": ["<task description>"]},
  "scenarios": {"total": 3, "covered": 2, "uncovered": ["<scenario name>"]},
  "scope": {"clean": true, "out_of_scope_files": []},
  "issues": [
    {"severity": "WARNING", "message": "Task 'Add tests' marked complete but no new test files found"}
  ]
}
```
```

### Collect Sub-Agent Results

Wait for all 5 sub-agents to return. Parse their JSON outputs and aggregate:
- All issues by severity (BLOCKER > WARNING > INFO)
- Dimension scores (PASS/WARN/FAIL)
- Evidence and file references

---

## Phase 2: Synthesis (Root Cause Analysis)

**Goal**: YOU (the orchestrator) analyze the aggregated findings, cross-reference with documentation and specs, and identify root causes.

### Step 1: Aggregate Issues

Combine all issues from the 5 sub-agents into a unified list:
- Group by severity
- Group by affected file
- Identify patterns (e.g., same issue across multiple files)

### Step 2: Cross-Reference with Specs

Read the spec files again and check:
- Do unverified tasks have corresponding issues in other dimensions?
- Are documentation gaps related to incomplete implementation?
- Do cleanup items suggest abandoned approaches?

### Step 3: Cross-Reference with Project Documentation

Check project-level docs for context:
- README.md - Does it explain conventions that might excuse certain patterns?
- CONTRIBUTING.md - Are there documented exceptions?
- .eslintrc, tsconfig.json - Are some patterns explicitly allowed?

### Step 4: Root Cause Classification

For each issue or cluster of issues, determine:

| Root Cause | Indicators | Remediation Strategy |
|------------|------------|---------------------|
| Incomplete implementation | Tasks unverified, TODOs present | Complete the work |
| Testing gap | Low coverage, uncovered scenarios | Add targeted tests |
| Documentation debt | Missing docs, README not updated | Add documentation |
| Cleanup forgotten | Debug code, temp files | Remove artifacts |
| Scope creep | Out-of-scope files modified | Review or revert |
| Quality shortcuts | Type bypasses, empty catches | Refactor for quality |

### Step 5: Determine Overall Status

Based on aggregated findings:
- **READY**: No BLOCKERs, ≤3 WARNINGs, all dimensions PASS or WARN
- **NEEDS_WORK**: No BLOCKERs, but >3 WARNINGs or significant gaps
- **BLOCKED**: Any BLOCKER issues present

### Step 6: Generate Intermediate Report

Display the analysis summary:

```
============================================================
            HARDENING ANALYSIS: <change-id>
============================================================

PHASE 1 COMPLETE: Analysis gathered from 5 dimensions

TEST COVERAGE                                    [PASS|WARN|FAIL]
  Coverage: X% (N/M files have tests)

IMPLEMENTATION QUALITY                           [PASS|WARN|FAIL]
  Issues: N total (X blockers, Y warnings)

DOCUMENTATION                                    [PASS|WARN|FAIL]
  README: [OK|NEEDS UPDATE] | API Docs: X% | CHANGELOG: [OK|MISSING]

CLEANUP                                          [PASS|WARN|FAIL]
  Items: N requiring attention

SPEC ALIGNMENT                                   [PASS|WARN|FAIL]
  Tasks: X/Y verified | Scenarios: Z% covered

------------------------------------------------------------
ROOT CAUSES IDENTIFIED:
1. <root cause 1> - affects N issues
2. <root cause 2> - affects M issues
...

OVERALL STATUS: [READY|NEEDS_WORK|BLOCKED]
============================================================
```

---

## Phase 3: Remediation (Targeted Fixes)

**Goal**: If issues exist, spawn targeted sub-agents to fix specific problems.

### Decision Point

**If READY**: Skip to Final Report. No fixes needed.

**If NEEDS_WORK or BLOCKED**: Prompt user before spawning fix sub-agents:

```
Found <N> issues requiring attention.

Recommended fixes:
1. [BLOCKER] <description> - estimated: <simple|moderate|complex>
2. [WARNING] <description> - estimated: <simple|moderate|complex>
...

Options:
A) Spawn sub-agents to fix all issues automatically
B) Spawn sub-agents for BLOCKER issues only
C) Show detailed report and let me fix manually
D) Accept current state (skip fixes)

Which would you like?
```

### Spawn Fix Sub-Agents

Based on user choice, spawn targeted fix sub-agents with `subagent_type: "general"`:

#### Fix Sub-Agent Template

```
You are fixing specific issues for OpenSpec change: <change-id>

ISSUE TO FIX:
- Category: <category>
- Severity: <BLOCKER|WARNING>
- File: <file>
- Line: <line> (if applicable)
- Description: <issue description>

CONTEXT:
- Project specs: <relevant spec excerpts>
- Related documentation: <relevant doc excerpts>

CONSTRAINTS:
- Make minimal, targeted changes
- Do NOT change unrelated code
- Follow existing code style
- Add tests if fixing implementation issues
- Update docs if fixing documentation issues

TASK:
1. Analyze the issue in context
2. Implement the fix
3. Verify the fix addresses the issue

RETURN FORMAT:
```json
{
  "issue_id": "<category>:<file>:<line>",
  "status": "fixed|partial|unable",
  "changes_made": ["<description of change 1>", "<description of change 2>"],
  "files_modified": ["<file1>", "<file2>"],
  "verification": "<how you verified the fix>",
  "notes": "<any caveats or follow-up needed>"
}
```
```

### Collect Fix Results

After fix sub-agents complete:
1. Parse their results
2. Verify changes were made correctly
3. Run tests if available to confirm fixes don't break anything
4. Update issue status (resolved, partially resolved, unresolved)

---

## Final Report

Generate the final hardening report:

```
============================================================
               HARDENING REPORT: <change-id>
============================================================

OVERALL STATUS: [READY | NEEDS_WORK | BLOCKED]

TEST COVERAGE                                    [PASS|WARN|FAIL]
  Files with tests: X/Y (Z%)
  Tests run: [PASSED | FAILED | SKIPPED]
  - [list untested files if any]

IMPLEMENTATION QUALITY                           [PASS|WARN|FAIL]
  TODOs: N | Debug: N | Type bypasses: N | Error handling: N
  - [list remaining issues with file:line if any]

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

------------------------------------------------------------
[If fixes were applied:]
FIXES APPLIED:
- [x] <issue 1> - fixed in <file>
- [x] <issue 2> - fixed in <file>
- [ ] <issue 3> - unable to fix automatically: <reason>

[If READY:]
NEXT STEPS:
Ready to ship! Consider running `/openspec-archive <change-id>`

[If NEEDS_WORK or BLOCKED:]
REMAINING ACTIONS:
1. [BLOCKER] Fix: <description> (<file:line>)
2. [WARNING] Address: <description>
...
============================================================
```

---

## Execution

Now execute the hardening analysis for change: `$ARGUMENTS`

Begin with pre-flight checks, then orchestrate Phase 1 sub-agents. Report progress as you go.
