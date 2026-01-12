---
name: openspec-review
description: Post-implementation code review of an OpenSpec change - orchestrated sub-agents for correctness, logic, security, and architecture analysis.
agent: general
---

# OpenSpec Code Review

> **SUB-AGENT CONTEXT**: You are running as a sub-agent. Do NOT emit `[GOOST:*]` status markers or CONTRACT STATUS blocks - these only work in the main session and waste your output buffer. Focus on returning useful results directly.

You are orchestrating a **post-implementation code review** on the OpenSpec change: `$ARGUMENTS`

This is a **multi-phase orchestration** - you spawn sub-agents for analysis, synthesize findings, then optionally spawn targeted sub-agents for fixes.

## Pre-flight Checks

### Step 1: Validate Arguments

If `$ARGUMENTS` is empty or whitespace:
```
Usage: /openspec-review <change-id>

Run `openspec list` to see available changes.
```
Then list active changes and stop.

### Step 2: Fetch Change Context

```bash
openspec show $ARGUMENTS --json
```

**If the command fails:**
- Check if OpenSpec CLI is available: `which openspec`
- If not available, display: "OpenSpec CLI required for code review. Install from: https://github.com/openspec-dev/openspec"
- Stop execution

**If change not found:**
- Display: "Change '$ARGUMENTS' not found in active changes"
- Check the archive: `openspec list --archived` or look in `openspec/changes/archive/`
- If found in archive: Inform user the change was already archived, then continue with analysis
- If not found anywhere: Run `openspec list` and show available changes, then stop execution

**If change is archived:**
- Note: "This change has been archived. Performing post-archive review."
- Continue with analysis

### Step 3: Check for Implementation

Verify implementation exists by checking:
1. Read `openspec/changes/$ARGUMENTS/tasks.md` - check if tasks are marked complete
2. Search for affected files from `openspec/changes/$ARGUMENTS/proposal.md`

**If no implementation found:**
- Display: "No implementation found for this change"
- Suggest: "Run `/openspec-apply $ARGUMENTS` first to implement the change"
- Stop execution

### Step 4: Extract Change Details

From the OpenSpec JSON output and proposal, extract:
- Change ID and title
- Affected files (from proposal.md "Affected code" section)
- Spec scenarios (from specs/*/spec.md files)
- Task list and completion status

Read these files for context:
- `openspec/changes/$ARGUMENTS/proposal.md`
- `openspec/changes/$ARGUMENTS/tasks.md`
- `openspec/changes/$ARGUMENTS/specs/*/spec.md`

Store this context - you'll pass relevant portions to sub-agents.

---

## Phase 1: Discovery (Sub-Agent Scanning)

**Goal**: Spawn specialized sub-agents to scan each review dimension in parallel.

Create a TODO list tracking each analysis sub-agent:
- [ ] Requirement Traceability Analysis
- [ ] Logic & Edge Case Analysis
- [ ] Security Review Analysis
- [ ] Architecture Conformance Analysis

### Spawn Analysis Sub-Agents

Spawn **4 parallel sub-agents** using the Task tool with `subagent_type: "explore"`:

#### Sub-Agent 1: Requirement Traceability Scanner

```
You are analyzing REQUIREMENT TRACEABILITY for OpenSpec change: <change-id>

CONTEXT:
- Change title: <title>
- Affected files: <list from proposal.md>
- Spec scenarios: <list of scenario titles from specs/*/spec.md>

TASK:
1. For each scenario in the spec, search affected files for implementation evidence:
   - Look for function names, comments, or logic that implements the scenario
   - Note file:line where implementation is found

2. Calculate coverage: (scenarios with traced implementation / total scenarios) * 100

3. For untraced scenarios:
   - Note the scenario title
   - Explain what implementation evidence would look like
   - Flag as UNTRACED

RETURN FORMAT:
```json
{
  "dimension": "requirement_traceability",
  "total_scenarios": 10,
  "traced_scenarios": 8,
  "coverage_percent": 80,
  "traces": [
    {
      "scenario": "User login with valid credentials",
      "status": "TRACED",
      "file": "src/auth/login.ts",
      "line": 45,
      "evidence": "function handleLogin(credentials) { ... }"
    }
  ],
  "untraced": [
    {
      "scenario": "User login with expired token",
      "status": "UNTRACED",
      "reason": "No token expiration check found in login flow"
    }
  ],
  "issues": []
}
```
```

#### Sub-Agent 2: Logic & Edge Case Scanner

```
You are analyzing LOGIC AND EDGE CASES for OpenSpec change: <change-id>

CONTEXT:
- Affected files: <list from proposal.md>
- Project type: <infer from package.json, pyproject.toml, go.mod, etc.>

TASK:
1. Read each affected file and analyze for logic issues:

   **Off-by-one errors:**
   - Array indexing: `arr[i]` where i could equal arr.length
   - Loop bounds: `for (i = 0; i <= length)` instead of `< length`
   - String slicing edge cases

   **Boolean logic errors:**
   - Incorrect AND/OR combinations
   - De Morgan's law violations
   - Double negatives that confuse intent

   **Null/undefined handling:**
   - Property access without null checks: `obj.prop.value` without `obj?.prop`
   - Array methods on potentially undefined arrays
   - Missing default values for optional parameters

   **Comparison issues:**
   - == vs === in JavaScript/TypeScript
   - < vs <= boundary conditions
   - String vs number comparisons

   **Unreachable code:**
   - Returns before code that should execute
   - Conditions that are always true/false
   - Dead branches after early exits

2. Check edge case handling:
   - Empty arrays/strings/objects
   - Null/undefined inputs
   - Zero, negative numbers, MAX_INT
   - Concurrent access patterns

3. Check error handling:
   - Are errors caught at right boundaries?
   - Is error info preserved (not swallowed)?
   - Are user-facing messages appropriate?

SEVERITY LEVELS:
- CRITICAL: Will cause runtime errors or data corruption
- MAJOR: Significant logic flaw affecting correctness
- MINOR: Edge case not handled but low impact
- INFO: Potential improvement

RETURN FORMAT:
```json
{
  "dimension": "logic_review",
  "files_analyzed": ["file1.ts", "file2.ts"],
  "issues": [
    {
      "severity": "MAJOR",
      "category": "null_handling",
      "file": "src/api/handler.ts",
      "line": 23,
      "code_snippet": "const value = response.data.items[0].name",
      "finding": "No null check before accessing nested properties",
      "suggestion": "Use optional chaining: response?.data?.items?.[0]?.name"
    }
  ],
  "edge_cases_checked": {
    "empty_inputs": "COVERED",
    "null_handling": "PARTIAL",
    "boundary_values": "MISSING",
    "concurrent_access": "N/A"
  },
  "error_handling_assessment": "ADEQUATE"
}
```
```

#### Sub-Agent 3: Security Review Scanner

```
You are analyzing SECURITY for OpenSpec change: <change-id>

CONTEXT:
- Affected files: <list from proposal.md>
- Project type: <infer from package.json, pyproject.toml, go.mod, etc.>

TASK:
1. **Authentication & Authorization:**
   - Is auth checked before accessing protected resources?
   - Are authorization checks using least privilege?
   - Is session/token validation present and correct?
   - Are credentials handled securely (not logged, hashed properly)?

2. **Input Validation:**
   - Is user input validated before use?
   - Are there SQL injection vectors (raw string concatenation in queries)?
   - Are there XSS vectors (unescaped user content in HTML)?
   - Are there command injection vectors (user input in shell commands)?
   - Are file paths sanitized (no path traversal)?

3. **Secrets Handling:**
   - Are secrets hardcoded? Search for: API keys, passwords, tokens, connection strings
   - Are secrets loaded from environment or secure storage?
   - Are secrets logged or exposed in error messages?
   - Check .env files are in .gitignore

4. **Data Exposure:**
   - Are sensitive fields inadvertently exposed in responses?
   - Is response filtering applied where needed?
   - Is debug information leaked in production?
   - Are internal IDs or implementation details exposed?

SEVERITY LEVELS:
- CRITICAL: Exploitable vulnerability (injection, auth bypass, secrets exposure)
- MAJOR: Security weakness that should be fixed
- MINOR: Defense-in-depth improvement
- INFO: Best practice suggestion

RETURN FORMAT:
```json
{
  "dimension": "security_review",
  "files_analyzed": ["file1.ts", "file2.ts"],
  "issues": [
    {
      "severity": "CRITICAL",
      "category": "input_validation",
      "file": "src/api/query.ts",
      "line": 15,
      "code_snippet": "db.query(`SELECT * FROM users WHERE id = ${userId}`)",
      "finding": "SQL injection vulnerability - user input directly interpolated",
      "suggestion": "Use parameterized queries: db.query('SELECT * FROM users WHERE id = ?', [userId])"
    }
  ],
  "auth_assessment": {
    "authentication": "PRESENT",
    "authorization": "MISSING",
    "session_handling": "ADEQUATE"
  },
  "secrets_scan": {
    "hardcoded_secrets": 0,
    "env_usage": true,
    "logging_safe": true
  }
}
```
```

#### Sub-Agent 4: Architecture Conformance Scanner

```
You are analyzing ARCHITECTURE CONFORMANCE for OpenSpec change: <change-id>

CONTEXT:
- Affected files: <list from proposal.md>
- Project root: <path>

TASK:
1. **Pattern Conformance:**
   - Read AGENTS.md, CONTRIBUTING.md, or architecture docs if they exist
   - Check if implementation follows documented patterns
   - Note any deviations from established patterns

2. **Module Boundaries:**
   - Check if imports respect module boundaries
   - Look for circular dependencies
   - Verify public/private interfaces are respected
   - Check for inappropriate cross-module dependencies

3. **Naming Conventions:**
   - File names follow project conventions
   - Function/class names follow conventions (camelCase, PascalCase, snake_case)
   - Variable names are descriptive and consistent
   - Constants use appropriate casing (UPPER_SNAKE_CASE)

4. **Code Organization:**
   - New files placed in appropriate directories
   - Related code grouped together
   - No god files (>500 lines) or god functions (>100 lines)
   - Separation of concerns maintained

5. **Consistency Check:**
   - Does new code match existing codebase style?
   - Are similar operations handled consistently?
   - Is error handling style consistent?

SEVERITY LEVELS:
- CRITICAL: Breaks fundamental architecture (rare)
- MAJOR: Significant pattern violation
- MINOR: Inconsistency or minor convention violation
- INFO: Style suggestion

RETURN FORMAT:
```json
{
  "dimension": "architecture_conformance",
  "files_analyzed": ["file1.ts", "file2.ts"],
  "patterns_documented": true,
  "issues": [
    {
      "severity": "MAJOR",
      "category": "module_boundary",
      "file": "src/api/handler.ts",
      "line": 5,
      "code_snippet": "import { dbConnection } from '../database/internal'",
      "finding": "Importing internal module from database layer",
      "suggestion": "Use the public database API: import { query } from '../database'"
    }
  ],
  "naming_violations": [],
  "organization_issues": [],
  "god_files": [],
  "god_functions": []
}
```
```

### Collect Sub-Agent Results

Wait for all 4 sub-agents to return. Parse their JSON outputs.

**Error Handling:**

For each sub-agent response:
1. **If timeout**: Mark dimension as `TIMEOUT`, continue with other results
2. **If parse error**: Mark dimension as `PARSE_ERROR`, log the raw response, continue
3. **If empty response**: Mark dimension as `EMPTY`, continue

Track failures:
```
failed_scanners = []
successful_results = []
```

**If ALL sub-agents fail:**
```
============================================================
         CODE REVIEW FAILED - ALL SCANNERS ERROR
============================================================

Scanner failures:
1. Requirement Traceability: <reason>
2. Logic Review: <reason>
3. Security Review: <reason>
4. Architecture Review: <reason>

Possible causes:
- Sub-agent timeouts (try again with simpler scope)
- Invalid change context (verify openspec show works)
- System resource issues

Suggestions:
- Retry the review: /openspec-review $ARGUMENTS
- Check system status
- Try reviewing a smaller scope
============================================================
```
Stop execution.

---

## Phase 2: Synthesis (Root Cause Analysis)

**Goal**: YOU (the orchestrator) analyze the aggregated findings, cross-reference, and identify root causes.

### Step 1: Aggregate Issues

Combine all issues from successful sub-agents:
- Group by severity: CRITICAL → MAJOR → MINOR → INFO
- Group by file (issues in same file may be related)
- Identify patterns (same issue type across multiple files)

### Step 2: Deduplicate Findings

Check for overlapping findings:
- Same file:line flagged by multiple scanners
- Keep the most severe classification
- Note which scanners agreed

### Step 3: Cross-Reference with Spec

For each issue, check:
- Does it relate to an untraced scenario?
- Does it violate a spec requirement?
- Is it in scope or scope creep?

### Step 4: Determine Overall Verdict

Based on aggregated findings:
- **BLOCKED**: Any CRITICAL issues present
- **CHANGES_REQUESTED**: No CRITICAL but any MAJOR issues present
- **APPROVED**: Only MINOR or INFO issues (or no issues)

### Step 5: Generate Intermediate Report

Display the analysis summary:

```
============================================================
              CODE REVIEW: <change-id>
============================================================

PHASE 1 COMPLETE: Analysis gathered from N/4 dimensions

REQUIREMENT TRACEABILITY                           [PASS|WARN|FAIL|INCOMPLETE]
  Coverage: X% (N/M scenarios traced)
  Untraced: <count>

LOGIC REVIEW                                       [PASS|WARN|FAIL|INCOMPLETE]
  Issues: N total (X critical, Y major, Z minor)

SECURITY REVIEW                                    [PASS|WARN|FAIL|INCOMPLETE]
  Concerns: N (X critical, Y major)

ARCHITECTURE CONFORMANCE                           [PASS|WARN|FAIL|INCOMPLETE]
  Violations: N

------------------------------------------------------------
SEVERITY BREAKDOWN:
  CRITICAL: X issues (blocks approval)
  MAJOR: Y issues (requires changes)
  MINOR: Z issues (recommended fixes)
  INFO: W issues (suggestions)

OVERALL VERDICT: [APPROVED | CHANGES_REQUESTED | BLOCKED]
============================================================
```

---

## Phase 3: Remediation (Targeted Fixes)

**Goal**: If issues exist, optionally spawn targeted sub-agents to fix specific problems.

### Decision Point

**If APPROVED**: Skip to Final Report. No fixes needed.

**If CHANGES_REQUESTED or BLOCKED**: Prompt user:

```
Found <N> issues requiring attention.

Options:
A) Spawn sub-agents to fix CRITICAL issues only (<count>)
B) Spawn sub-agents to fix CRITICAL and MAJOR issues (<count>)
C) Show detailed report only (fix manually)
D) Accept current state (skip fixes)

Which would you like? [A/B/C/D]
```

Wait for user selection before proceeding.

### Spawn Fix Sub-Agents

Based on user choice, spawn targeted fix sub-agents with `subagent_type: "general"`:

#### Fix Sub-Agent Template

```
You are fixing a specific issue for OpenSpec change: <change-id>

ISSUE TO FIX:
- Severity: <CRITICAL|MAJOR>
- Category: <category>
- File: <file>
- Line: <line>
- Finding: <issue description>
- Suggestion: <suggested fix from analysis>

CONTEXT:
- Full file content: <read the file>
- Project patterns: <from AGENTS.md or conventions>

CONSTRAINTS:
- Make minimal, targeted changes
- Do NOT change unrelated code
- Follow existing code style
- Preserve all existing functionality

TASK:
1. Read the file and understand the context
2. Implement the fix following the suggestion
3. Verify the fix addresses the issue
4. Ensure no new issues are introduced

RETURN FORMAT:
```json
{
  "issue_id": "<category>:<file>:<line>",
  "status": "FIXED|PARTIAL|UNABLE",
  "changes_made": ["<description of change>"],
  "files_modified": ["<file>"],
  "verification": "<how you verified the fix>",
  "notes": "<any caveats or follow-up needed>"
}
```
```

### Validate Fixes

After each fix sub-agent completes:

1. **Check the fix exists**: Read the file to verify changes were made
2. **Check for syntax errors**: If TypeScript, run `tsc --noEmit` on the file
3. **Check original issue is resolved**: The pattern from the finding should no longer exist at that location
4. **Check for new issues**: No obvious new problems introduced

Mark each fix as:
- **VERIFIED**: Fix applied correctly, issue resolved
- **UNVERIFIED**: Fix applied but couldn't confirm resolution
- **PROBLEMATIC**: Fix introduced new issues

### Rollback Guidance

After remediation, output:
```
ROLLBACK GUIDANCE:
Files modified by remediation:
- <file1>
- <file2>

To revert individual files:
  git checkout -- <file>

To revert all remediation changes:
  git checkout -- .

Note: Changes are unstaged. Review before committing.
```

---

## Final Report

Generate the final code review report:

```
============================================================
              CODE REVIEW: <change-id>
============================================================

OVERALL VERDICT: [APPROVED | CHANGES_REQUESTED | BLOCKED]

REQUIREMENT TRACEABILITY                           [PASS|WARN|FAIL]
  Scenarios traced: X/Y (Z%)
  - [list untraced scenarios if any]

LOGIC REVIEW                                       [PASS|WARN|FAIL]
  Issues found: N (X critical, Y major, Z minor)
  Edge cases: [COVERED|PARTIAL|MISSING]
  Error handling: [ADEQUATE|NEEDS_WORK]
  - [top issues if any]

SECURITY REVIEW                                    [PASS|WARN|FAIL]
  Concerns: N
  Auth: [PRESENT|MISSING] | Input validation: [PRESENT|MISSING]
  - [critical/major issues if any]

ARCHITECTURE CONFORMANCE                           [PASS|WARN|FAIL]
  Pattern violations: N
  - [issues if any]

------------------------------------------------------------
REVIEW COMMENTS:

1. [CRITICAL] <file:line> - <finding>
   Suggestion: <how to fix>

2. [MAJOR] <file:line> - <finding>
   Suggestion: <how to fix>

3. [MINOR] <file:line> - <finding>
   Suggestion: <how to fix>
...

------------------------------------------------------------
[If fixes were applied:]
FIXES APPLIED:
- [x] <issue 1> - VERIFIED in <file>
- [x] <issue 2> - VERIFIED in <file>
- [ ] <issue 3> - UNABLE: <reason>

ROLLBACK:
  git checkout -- <file1> <file2> ...

------------------------------------------------------------
[If APPROVED:]
NEXT STEPS:
Ready for hardening! Run `/openspec-harden $ARGUMENTS`

[If CHANGES_REQUESTED or BLOCKED:]
REMAINING ACTIONS:
1. Fix: <description> (<file:line>)
2. Fix: <description> (<file:line>)
...

After fixes, re-run: /openspec-review $ARGUMENTS
============================================================
```

---

## Execution

Now execute the code review for change: `$ARGUMENTS`

Begin with pre-flight checks, then orchestrate Phase 1 sub-agents. Report progress as you go.
