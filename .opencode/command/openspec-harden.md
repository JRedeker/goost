---
name: openspec-harden
description: Post-implementation hardening analysis for OpenSpec changes - orchestrated multi-phase analysis with sub-agents for scanning, remediation, and cleanup.
agent: general
---

# OpenSpec Hardening Analysis

> **SUB-AGENT CONTEXT**: Return findings directly. Status markers and CONTRACT STATUS blocks are for main sessions only—omit them to maximize your output buffer.

You are orchestrating a **post-implementation hardening analysis** on the OpenSpec change: `$ARGUMENTS`

This is a **multi-phase orchestration** - you spawn sub-agents for analysis, synthesize findings, spawn targeted sub-agents for fixes, and execute cleanup.

## Supported Flags

Parse these flags from `$ARGUMENTS`:

| Flag | Purpose |
|------|---------|
| `--no-cleanup` | Skip cleanup phase entirely (audit-only mode) |
| `--execute` | Actually delete cleanup files (default is preview-only) |
| `--interactive` | Select individual files to delete |
| `--force` | No prompts, for scripting (requires --execute) |

Example: `/openspec-harden my-change --execute` or `/openspec-harden my-change --no-cleanup`

## Pre-flight Checks

### Target Resolution Protocol (State-Changing Operation)

Determine the target change ID:

1. **If $ARGUMENTS contains only flags (--no-cleanup, --execute, etc.) or is empty**:
   a. Run `openspec list` to get active changes
   b. If exactly one active change exists:
      - Use `mcp_question` to confirm:
        ```
        header: "Confirm"
        question: "Proceed with '<change-id>'?"
        options: "Yes (Recommended)", "Cancel"
        ```
      - Extract flags from original $ARGUMENTS
      - If user cancels, stop execution
   c. If multiple active changes exist:
      - Use `mcp_question` to present selection:
        ```
        header: "Select"
        question: "Which change would you like to harden?"
        options: list of changes with task progress (e.g., "feature-x (3/8 tasks)")
        ```
      - Proceed with user's selection and extract flags
   d. If no active changes exist:
      - Display: "No active changes found"
      - Suggest: "Run `/openspec-proposal` to create a new change"
      - Stop execution
2. **If $ARGUMENTS contains a change-id (with or without flags)**:
   - Extract change-id from $ARGUMENTS
   - Validate it exists (check archive if not in active)
   - Extract any flags (--no-cleanup, --execute, --interactive, --force)
   - Proceed with existing validation

### Step 2: Fetch Change Context

```bash
openspec show $ARGUMENTS --json
```

**If the command fails:**
- Check if OpenSpec CLI is available: `which openspec`
- If not available, display: "OpenSpec CLI required for hardening analysis. Install from: https://github.com/openspec-dev/openspec"
- Stop execution

**If change not found:**
- Display: "Change '$ARGUMENTS' not found in active changes"
- Check the archive: `openspec list --archived` or look in `openspec/changes/archive/`
- If found in archive: Inform user the change was already archived, then continue with analysis
- If not found anywhere: Run `openspec list` and show available changes, then stop execution

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
- [ ] AI-Slop Detection (Comprehensive)
- [ ] Documentation Analysis
- [ ] Cleanup Analysis
- [ ] Spec Alignment Analysis

### Spawn Analysis Sub-Agents

Spawn **5 parallel sub-agents** using the Task tool with `subagent_type: "explore"`:

#### Sub-Agent 1: Test Coverage & TDD Scanner

```
You are analyzing TEST COVERAGE and TDD ADHERENCE for OpenSpec change: <change-id>

CONTEXT:
- Change title: <title>
- Affected files: <list from proposal.md>
- Project type: <infer from package.json, pyproject.toml, go.mod, etc.>

TASK:
1. For each affected source file, check if a corresponding test file exists:
   - TypeScript/JavaScript: `*.test.ts`, `*.spec.ts`, `*.test.js`, `*.spec.js`, or files in `__tests__/`
   - Python: `test_*.py`, `*_test.py`, or files in `tests/`
   - Go: `*_test.go` in same package

2. TDD SEQUENCE AUDIT (RSTC Protocol):
   - Review session history (if available in context) for the Requirement-Spec-Test-Code sequence.
   - Verify that Red Phase Evidence (failing logs) was provided BEFORE implementation.
   - Verify that Green Phase Evidence (passing logs) was provided AFTER implementation.
   - Flag any criterion that skipped the Red phase.

3. Calculate coverage: (files with tests / total source files) * 100

4. Check if tests can be run:
   - Look for test scripts in package.json, Makefile, or similar
   - Report test runner availability only (skip actual test execution)

RETURN FORMAT:
```json
{
  "dimension": "test_coverage",
  "files_analyzed": ["<file1>", "<file2>"],
  "files_with_tests": ["<file1>"],
  "files_without_tests": ["<file2>"],
  "tdd_audit": {
    "protocol_followed": true,
    "missing_red_phases": ["<criterion_id>"],
    "missing_green_phases": []
  },
  "coverage_percent": 50,
  "test_runner_available": true,
  "test_command": "npm test",
  "issues": [
    {"severity": "WARNING", "file": "<file2>", "message": "No test file found"}
  ]
}
```
```

#### Sub-Agent 2: AI-Slop Detection Scanner (Comprehensive)

```
You are performing COMPREHENSIVE AI-SLOP DETECTION for OpenSpec change: <change-id>

This analysis is based on academic research (arXiv 2024-2025) showing LLM-generated code has 63% more code smells than human-written code, with implementation smells 73% higher.

CONTEXT:
- Affected files: <list from proposal.md>

TASK: Search affected files for AI-generated code patterns across 6 categories.

## CATEGORY 1: INCOMPLETE IMPLEMENTATIONS (HIGH PRIORITY)

Search for patterns indicating unfinished work:

1.1. PLACEHOLDER IMPLEMENTATIONS:
   - Python: `pass` in function/method bodies (excluding abstract methods, protocols, TYPE_CHECKING blocks)
   - `raise NotImplementedError` with generic messages
   - Return values like `return {}`, `return []`, `return None` with no logic before them
   - Hardcoded placeholder values: `= 12345`, `= "placeholder"`, `= 0  # placeholder`

1.2. INCOMPLETE REFACTORS:
   - Comments mentioning "WIP", "incomplete", "another agent", "not yet implemented"
   - Multi-line commented code blocks (>5 lines of commented-out code)
   - Functions that only call `super()` without adding value

1.3. TODO/FIXME COMMENTS:
   - `# TODO:` without owner or issue reference
   - `# FIXME:` comments
   - `# HACK:` or `# XXX:` comments

## CATEGORY 2: POOR EXCEPTION HANDLING (HIGH PRIORITY)

2.1. SILENT ERROR SWALLOWING:
   - `except Exception: pass` or `except: pass`
   - `except Exception as e: pass`
   - Empty except blocks
   - `except Exception:` without `# noqa: BLE001` justification

2.2. OVERLY BROAD EXCEPTION HANDLING:
   - `try/except Exception` around entire functions (>20 lines in try block)
   - Catching Exception when specific exceptions should be caught
   - Logging errors but not re-raising or handling properly

2.3. MISSING ERROR HANDLING:
   - Async functions without timeout on network calls
   - File operations without proper exception handling
   - Missing `.catch()` on JavaScript promise chains

## CATEGORY 3: LAZY TYPING AND GENERICS (MEDIUM PRIORITY)

3.1. EXCESSIVE `Any` USAGE (Python):
   - Function parameters typed as `Any` when specific types exist
   - `Any = Depends(...)` pattern in FastAPI
   - Return types of `Any` for functions with clear return types

3.2. UNDOCUMENTED KWARGS:
   - `**kwargs` without docstring explaining expected keys
   - `*args, **kwargs` passthrough without clear purpose
   - Generic `options: dict` parameters without TypedDict

3.3. TYPE SAFETY BYPASSES (TypeScript):
   - `as any`, `as unknown` casts
   - `@ts-ignore`, `@ts-expect-error` without explanation
   - `// @ts-nocheck` at file level

## CATEGORY 4: STRUCTURAL/DESIGN SMELLS (MEDIUM PRIORITY)

4.1. GOD CLASSES/FUNCTIONS:
   - Classes with >20 methods
   - Functions >100 lines
   - Files >1000 lines

4.2. DEEP NESTING:
   - >4 levels of indentation (excluding class/function definitions)
   - Nested callbacks >3 levels deep

4.3. MAGIC NUMBERS:
   - Numeric literals in conditionals without named constants
   - Hardcoded thresholds (e.g., `if score > 80:`, `if count > 100:`)
   - Hardcoded IDs or configuration values

4.4. DUPLICATE CODE:
   - Identical or near-identical code blocks in multiple files
   - Copy-pasted implementations that should be shared

## CATEGORY 5: DOCUMENTATION ISSUES (MEDIUM PRIORITY)

5.1. STALE/USELESS COMMENTS:
   - Comments that just repeat the code (`# increment counter` before `counter += 1`)
   - Docstrings that just repeat the function name
   - Outdated comments referencing old implementations

5.2. NOQA WITHOUT EXPLANATION:
   - `# noqa` or `# noqa: CODE` without justification comment
   - Duplicate noqa markers (`# noqa: S311  # noqa: S311`)
   - `# type: ignore` without explanation

5.3. DEAD DOCUMENTATION:
   - Docstrings describing parameters that don't exist
   - External URLs that may be stale
   - References to removed code or features

## CATEGORY 6: ASYNC/CONCURRENCY ISSUES (HIGH PRIORITY for async code)

6.1. BLOCKING IN ASYNC:
   - `time.sleep()` in async functions (should use `asyncio.sleep`)
   - `requests.get()` in async code (should use `httpx` or `aiohttp`)
   - Sync file I/O (`open()`) in async functions

6.2. THREAD SAFETY:
   - Singleton patterns without lock protection
   - Module-level mutable state accessed from multiple threads
   - Missing `asyncio.Lock` for shared async resources

6.3. MISSING AWAIT:
   - Coroutine called without `await`
   - `asyncio.run()` called inside async functions

SEVERITY LEVELS:
- BLOCKER: Code will fail or has security implications
- HIGH: Significant quality issue requiring fix before merge
- MEDIUM: Technical debt that should be addressed
- LOW: Minor style or preference issue

RETURN FORMAT:
```json
{
  "dimension": "ai_slop_detection",
  "summary": {
    "total_issues": 15,
    "blockers": 2,
    "high": 5,
    "medium": 6,
    "low": 2,
    "by_category": {
      "incomplete_implementations": 3,
      "exception_handling": 4,
      "lazy_typing": 2,
      "structural_smells": 3,
      "documentation_issues": 2,
      "async_issues": 1
    }
  },
  "issues": [
    {
      "severity": "BLOCKER|HIGH|MEDIUM|LOW",
      "category": "<category_name>",
      "subcategory": "<subcategory>",
      "file": "<file>",
      "line": <n>,
      "code_snippet": "<relevant code>",
      "message": "<description>",
      "fix_suggestion": "<how to fix>"
    }
  ],
  "patterns_detected": [
    "Silent exception swallowing (4 occurrences)",
    "Excessive Any types (2 occurrences)",
    "Magic numbers without constants (3 occurrences)"
  ]
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

1. EXTENSION-BASED TEMP FILES (SAFE - industry standard patterns):
   Search for files matching these extensions:
   - Backup files: *.bak, *.backup, *.orig, *.old
   - Editor artifacts: *~, *.swp, *.swo, #*#
   - Temp files: *.tmp, *.temp
   - OS artifacts: .DS_Store, Thumbs.db, .Trash-*
   - Patch artifacts: *.rej

2. EXPLICITLY MARKED ONE-TIME FILES:
   Search for files with explicit temporary markers:
   - Filename patterns: ONETIME-*.*, DELETE-AFTER-*.*
   - Header comments: Files containing "# ONETIME:" or "# DELETE AFTER:" in first 10 lines
   - Directory patterns: _onetime/, _cleanup/, _temp/, _artifacts/

3. DEVELOPMENT ARTIFACT DIRECTORIES:
   Check for presence of:
   - poc/, scratch/, temp/, tmp/ directories
   - Files named debug.*, scratch.*

4. DEAD IMPORTS (TypeScript/JavaScript only):
   - Check if any imports in affected files are unused
   - Use grep to search if imported names appear elsewhere in file

5. ORPHANED TESTS:
   - If source files were removed in this change, check if their test files still exist

6. DUPLICATE CODE:
   - Check for files with similar names in different directories that might be duplicates
   - Search for identical function signatures in multiple files

**Preserve these (HIGH FALSE POSITIVE RISK)**:
- fix-*.sh, migrate-*.py, patch-*.* (legitimate permanent tools use these names)
- Files in scripts/ or tools/ directories (usually permanent utilities)
- Database migration files (Alembic, Rails, Django patterns)

RETURN FORMAT:
```json
{
  "dimension": "cleanup",
  "extension_based_files": [
    {"file": "<path>", "pattern": "*.bak", "reason": "Backup file"}
  ],
  "explicitly_marked_files": [
    {"file": "<path>", "marker": "ONETIME-", "reason": "Explicitly marked for deletion"}
  ],
  "dev_artifact_dirs": ["poc/", "scratch/"],
  "dead_imports": [{"file": "<file>", "import": "<name>"}],
  "orphaned_tests": [],
  "duplicate_code": [{"files": ["<file1>", "<file2>"], "reason": "<description>"}],
  "total_cleanup_candidates": 5,
  "issues": [
    {"severity": "WARNING", "file": "<file>", "message": "Backup file should be removed", "pattern": "*.bak"}
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
- All issues by severity (BLOCKER > HIGH > MEDIUM > LOW > WARNING > INFO)
- Dimension scores (PASS/WARN/FAIL)
- Evidence and file references

---

## Phase 2: Synthesis (Root Cause Analysis)

**Goal**: YOU (the orchestrator) analyze the aggregated findings, cross-reference with documentation and specs, and identify root causes.

> **Anti-Loop Protocol**: After receiving sub-agent results, begin aggregation immediately. Proceed directly to Step 1—skip prose summaries of sub-agent findings.
>
> **Loop check**: If you're writing "Sub-agent 1 found..." or "The test coverage scanner reported...", you're in a planning loop. Proceed to aggregation immediately.

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
- .eslintrc, tsconfig.json, pyproject.toml - Are some patterns explicitly allowed?
- AGENTS.md - Are there project-specific rules about code style?

### Step 4: Root Cause Classification

For each issue or cluster of issues, determine:

| Root Cause | Indicators | Remediation Strategy |
|------------|------------|---------------------|
| Incomplete implementation | Tasks unverified, TODOs present, placeholder code | Complete the work |
| AI-generated slop | Silent exception handlers, placeholder values, lazy typing | Refactor to production quality |
| Testing gap | Low coverage, uncovered scenarios | Add targeted tests |
| Documentation debt | Missing docs, README not updated | Add documentation |
| Cleanup forgotten | Debug code, temp files, duplicate code | Remove artifacts, consolidate |
| Scope creep | Out-of-scope files modified | Review or revert |
| Quality shortcuts | Type bypasses, empty catches, magic numbers | Refactor for quality |
| Thread-safety issues | Missing locks, shared mutable state | Add proper synchronization |

### Step 5: Determine Overall Status

Based on aggregated findings:
- **READY**: No BLOCKERs, no HIGH severity issues, ≤3 MEDIUM issues
- **NEEDS_WORK**: No BLOCKERs, but HIGH severity issues or >3 MEDIUM issues
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

AI-SLOP DETECTION                                [PASS|WARN|FAIL]
  Issues: N total (X blockers, Y high, Z medium)
  Categories: incomplete=N, exception=N, typing=N, structural=N

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

TOP AI-SLOP PATTERNS DETECTED:
1. <pattern 1> - N occurrences
2. <pattern 2> - M occurrences
...

OVERALL STATUS: [READY|NEEDS_WORK|BLOCKED]
============================================================
```

---

## Pre-Remediation: Capture Git State for Session Tracking

**Goal**: Capture current untracked files so we can detect what remediation sub-agents create.

Before spawning any remediation sub-agents, run:

```bash
git ls-files --others --exclude-standard > /tmp/goost-pre-remediation-files.txt
```

Store this list - you'll compare it after remediation to identify session artifacts.

---

## Phase 3: Remediation (Targeted Fixes)

**Goal**: If issues exist, spawn targeted sub-agents to fix specific problems under contract tracking.

### Decision Point

**If READY**: Skip to Phase 4 (Cleanup). No fixes needed.

**If NEEDS_WORK or BLOCKED**: Prompt user before spawning fix sub-agents:

Display the issues found, then use `mcp_question` to prompt user:

```
Use mcp_question with:
  header: "Fix Issues"
  question: "Found <N> hardening issues. How would you like to proceed?"
  options:
    - label: "Fix all issues"
      description: "Spawn sub-agents to fix all issues automatically"
    - label: "Fix blockers and high only"
      description: "Spawn sub-agents for BLOCKER and HIGH issues only"
    - label: "Show report only"
      description: "Display detailed report for manual fixing"
    - label: "Accept current state"
      description: "Skip fixes and proceed"
```

### Establish Fix Contract

**If user selects "Fix all issues" or "Fix blockers and high only"**, establish a contract:

```
============================================================
                    CONTRACT ACTIVE
============================================================

OBJECTIVE: Fix hardening issues in <change-id>

SUCCESS CRITERIA:
- [ ] (H1) <issue 1 description> - <file:line>
- [ ] (H2) <issue 2 description> - <file:line>
- [ ] (HN) <issue N description> - <file:line>
- [ ] All fixes verified (build passes, issue resolved)

============================================================
```

Track each fix as a criterion. Mark complete only when verified.

### Spawn Fix Sub-Agents

Based on user choice, spawn targeted fix sub-agents with `subagent_type: "general"`:

#### Fix Sub-Agent Template

```
You are fixing specific issues for OpenSpec change: <change-id>

ISSUE TO FIX:
- Category: <category>
- Severity: <BLOCKER|HIGH|MEDIUM>
- File: <file>
- Line: <line> (if applicable)
- Description: <issue description>
- Fix suggestion: <suggested fix from analysis>

CONTEXT:
- Project specs: <relevant spec excerpts>
- Related documentation: <relevant doc excerpts>
- Project code style: <from AGENTS.md or CONTRIBUTING.md if available>

CONSTRAINTS:
- Make minimal, targeted changes
- Limit changes to the specific issue being fixed
- Follow existing code style
- Add tests if fixing implementation issues
- Update docs if fixing documentation issues
- Add `# noqa: CODE - reason` comments if suppressing lint rules intentionally

COMMON FIX PATTERNS:

For silent exception handlers:
  - Replace `except Exception: pass` with specific exception or add logging
  - Add `# noqa: BLE001 - <justification>` if suppression is intentional

For placeholder implementations:
  - Integrate with real services or raise NotImplementedError with clear message
  - Remove hardcoded values and use actual data sources

For lazy typing (Any):
  - Find the actual return type of dependencies and use proper types
  - Use Protocol or ABC for dependency injection

For magic numbers:
  - Define named constants at module level with descriptive names
  - Use UPPER_SNAKE_CASE for constant names

For thread-unsafe singletons:
  - Add threading.Lock with double-checked locking pattern
  - Follow existing patterns in codebase if available

TASK:
1. Analyze the issue in context
2. Implement the fix following the suggested pattern
3. Verify the fix addresses the issue
4. Run any available linters/formatters

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

## Phase 4: Cleanup Execution

**Goal**: Remove temporary artifacts identified during analysis AND created during remediation.

> **Skip this phase if `--no-cleanup` flag was provided.** Note in report: "Cleanup skipped (--no-cleanup flag)"

### Step 1: Detect Session Artifacts

Compare git state before and after remediation:

```bash
# Get current untracked files
git ls-files --others --exclude-standard > /tmp/goost-post-remediation-files.txt

# Files created during remediation = new untracked files
comm -13 /tmp/goost-pre-remediation-files.txt /tmp/goost-post-remediation-files.txt
```

Filter session artifacts through temp file patterns:
- `*.tmp`, `*.bak`, `debug.*`, `test_*.py` (if not in tests/ directory)
- Files in `tmp/`, `scratch/`, `_temp/` directories

### Step 2: Aggregate Cleanup Candidates

Combine all cleanup sources:
1. **From Cleanup Scanner (Phase 1)**: extension_based_files, explicitly_marked_files, dev_artifact_dirs
2. **From Session Tracking**: New untracked files matching temp patterns
3. **From Remediation**: Any temp files created by fix sub-agents

Build the final cleanup list with:
- File path
- Reason flagged (pattern matched, explicitly marked, session artifact)
- Size in bytes

### Step 3: Display Cleanup Preview

```
============================================================
              CLEANUP CANDIDATES: <change-id>
============================================================

Files identified for cleanup:

  EXTENSION-BASED (*.bak, *.tmp, etc.)
  1. path/to/file.bak              (1.2 KB) - Backup file
  2. path/to/temp.tmp              (0.5 KB) - Temporary file

  EXPLICITLY MARKED (ONETIME-, DELETE-AFTER-)
  3. scripts/ONETIME-fix-data.sh   (2.1 KB) - Marked for deletion

  SESSION ARTIFACTS (created during remediation)
  4. debug_output.log              (0.8 KB) - Created during this session

  DEVELOPMENT DIRECTORIES
  5. scratch/                      (dir)    - Development scratch directory

------------------------------------------------------------
Total: 5 files, 4.6 KB

Run with --execute to delete these files.
Run with --interactive to select individual files.
============================================================
```

### Step 4: Handle Cleanup Based on Flags

**If NO cleanup candidates found:**
```
No cleanup needed - workspace is clean.
```
Proceed to Final Report.

**If `--execute` flag NOT provided (default - preview only):**
Display the preview above and note:
```
Cleanup preview complete. No files deleted.
Run with --execute to delete, or --interactive to select individually.
```
Proceed to Final Report with cleanup_executed = false.

**If `--execute` flag provided:**

Delete all identified files:
```bash
rm -f "path/to/file.bak"
rm -f "path/to/temp.tmp"
# etc.
```

For directories, use:
```bash
rm -rf "scratch/"
```

Track results:
- files_deleted: list of successfully deleted files
- files_failed: list of files that couldn't be deleted (with reason)
- bytes_removed: total size removed

**If `--interactive` flag provided:**

Use `mcp_question` to prompt user:
```
Use mcp_question with:
  header: "Cleanup"
  question: "Select files to delete (found N cleanup candidates)"
  multiple: true
  options:
    - label: "path/to/file.bak (1.2 KB)"
      description: "Backup file - extension pattern *.bak"
    - label: "path/to/temp.tmp (0.5 KB)"
      description: "Temporary file - extension pattern *.tmp"
    - label: "scripts/ONETIME-fix-data.sh (2.1 KB)"
      description: "Explicitly marked for deletion"
    # ... one option per file
```

Delete only the selected files.

**If `--force` flag provided (with --execute):**

Skip all prompts, delete all identified files, report results.

### Step 5: Record Cleanup Results

Store cleanup results for the final report:
```json
{
  "cleanup_executed": true,
  "files_identified": 5,
  "files_deleted": ["file1.bak", "file2.tmp"],
  "files_skipped": ["file3.log"],
  "skip_reason": "user declined" | "preview mode" | "--no-cleanup flag",
  "bytes_removed": 4600,
  "errors": []
}
```

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

AI-SLOP DETECTION                                [PASS|WARN|FAIL]
  Summary: N issues found (X fixed, Y remaining)
  
  By Category:
  - Incomplete implementations: N (fixed: M)
  - Exception handling: N (fixed: M)
  - Lazy typing: N (fixed: M)
  - Structural smells: N (fixed: M)
  - Documentation issues: N (fixed: M)
  - Async/concurrency: N (fixed: M)
  
  [If issues remain, list top 5 with file:line]

DOCUMENTATION                                    [PASS|WARN|FAIL]
  README: [Updated | Needs Update | N/A]
  API docs: X% coverage
  CHANGELOG: [Entry exists | Missing | N/A]
  - [list undocumented items if any]

CLEANUP ANALYSIS                                 [PASS|WARN|FAIL]
  Extension-based files: N | Explicitly marked: N | Session artifacts: N
  - [list items identified if any]

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

------------------------------------------------------------
CLEANUP ACTIONS:

[If --no-cleanup flag was used:]
  Cleanup skipped (--no-cleanup flag)
  Identified but not deleted:
  - path/to/file.bak (*.bak pattern)
  - path/to/temp.tmp (*.tmp pattern)

[If preview mode (no --execute):]
  Cleanup preview only - no files deleted
  Would delete N files (X.X KB):
  - path/to/file.bak (*.bak pattern)
  - path/to/temp.tmp (*.tmp pattern)
  
  Run with --execute to delete these files.

[If --execute was used:]
  Files deleted:
  - [x] path/to/file.bak (1.2 KB)
  - [x] path/to/temp.tmp (0.5 KB)
  - [x] scripts/ONETIME-fix-data.sh (2.1 KB)
  
  Total removed: N files, X.X KB

[If --interactive was used:]
  Files deleted (user selected):
  - [x] path/to/file.bak (1.2 KB)
  
  Files skipped (user declined):
  - [ ] path/to/temp.tmp (0.5 KB)

[If no cleanup needed:]
  No cleanup needed - workspace is clean

------------------------------------------------------------
[If READY:]
NEXT STEPS:
Ready to ship! Consider running `/openspec-archive <change-id>`

[If NEEDS_WORK or BLOCKED:]
REMAINING ACTIONS:
1. [BLOCKER] Fix: <description> (<file:line>)
2. [HIGH] Fix: <description> (<file:line>)
3. [MEDIUM] Address: <description>
...
============================================================
```

### Contract Completion (If Fixes Applied)

After all fixes are verified, emit CONTRACT FULFILLED:

```
============================================================
                  CONTRACT FULFILLED
============================================================

OBJECTIVE: Fix hardening issues in <change-id>

ALL CRITERIA MET:
- [x] (H1) <issue 1> - VERIFIED
- [x] (H2) <issue 2> - VERIFIED
...

============================================================
```

### Completion Banner

After the final report (and CONTRACT FULFILLED if fixes were applied), emit:

```
============================================================
      /openspec-harden <change-id> COMPLETE
============================================================
Result: <READY | N issues fixed | Report only>
============================================================
```

**If contract was voided mid-remediation:**
```
============================================================
      /openspec-harden <change-id> COMPLETE
============================================================
Result: CONTRACT VOIDED - partial changes may be applied
============================================================
```

---

## Execution

Now execute the hardening analysis for change: `$ARGUMENTS`

**Phase Summary:**
1. Pre-flight checks (validate arguments, fetch change context)
2. Phase 1: Analysis (spawn 5 parallel sub-agents)
3. Phase 2: Synthesis (aggregate findings, identify root causes)
4. Pre-Remediation: Capture git state for session tracking
5. Phase 3: Remediation (fix issues based on user choice)
6. Phase 4: Cleanup Execution (remove temp artifacts based on flags)
7. Final Report (comprehensive status with cleanup actions)

Begin with pre-flight checks, then orchestrate each phase. Report progress as you go.

**Flag Handling Reminder:**
- `--no-cleanup`: Skip Phase 4 entirely
- `--execute`: Delete files in Phase 4 (default is preview)
- `--interactive`: Prompt for individual file selection
- `--force`: No prompts (requires --execute)
