---
name: openspec-audit
description: Project-wide audit to detect spec/implementation drift, identify unspecified code, and find conflicting requirements.
agent: general
---

# OpenSpec Project Audit

> **SUB-AGENT CONTEXT**: Return findings directly. Status markers and CONTRACT STATUS blocks are for main sessions only—omit them to maximize your output buffer.

You are orchestrating a **project-wide spec/implementation audit** for: `$ARGUMENTS`

This is a **multi-phase orchestration** - you spawn sub-agents to analyze different dimensions, then synthesize findings into a comprehensive report.

## Pre-flight Checks

### Step 1: Validate Specs Directory

Check if `openspec/specs/` exists:

```bash
ls -la openspec/specs/ 2>/dev/null || echo "NO_SPECS_DIR"
```

**If directory doesn't exist:**
```
No specs found in openspec/specs/. Run `openspec init` to get started.
```
Stop execution.

**If directory is empty (no subdirectories):**
```
No capability specs found in openspec/specs/

To create specs:
- Run `/openspec-proposal` to create a new change with specs
- Or manually create `openspec/specs/<capability>/spec.md`
```
Stop execution.

### Step 2: Check OpenSpec CLI Availability

```bash
which openspec && openspec --version 2>/dev/null || echo "CLI_UNAVAILABLE"
```

**If CLI unavailable:**
- Note: "OpenSpec CLI not available. Using direct file reading."
- Continue with file-based discovery (fallback mode)

**If CLI available:**
- Fetch spec inventory for structured parsing:
```bash
openspec list --specs --json 2>/dev/null || echo "CLI_JSON_UNAVAILABLE"
```
- If JSON output unavailable, fall back to directory scanning
- Check for active changes that may affect audit accuracy:
```bash
openspec list 2>/dev/null
```
- If active changes exist, warn: "Note: Active changes may affect audit accuracy. Consider archiving completed changes."

### Step 3: Determine Audit Scope and Output Format

**Parse arguments from `$ARGUMENTS`:**
- If contains `--json`: Set `OUTPUT_FORMAT = "json"`, remove `--json` from arguments
- Otherwise: Set `OUTPUT_FORMAT = "text"` (default)

**Determine scope from remaining arguments:**

**If arguments empty after parsing flags:**
- Audit ALL capability specs under `openspec/specs/`
- Set `SCOPE = "all"`

**If arguments provided (e.g., "auth"):**
- Verify `openspec/specs/<argument>/` exists
- If not found, display error and list available capabilities
- Set `SCOPE = "<argument>"`

### Step 4: Build Spec Inventory

List all capability directories to audit:

```bash
find openspec/specs -mindepth 1 -maxdepth 1 -type d -exec basename {} \; 2>/dev/null
```

**TERMINATION CRITERIA (Discovery):**
- If no capability directories are found, STOP and inform the user: "No capabilities found for audit in openspec/specs/."
- Record the count of capabilities to be audited.

Store the list - you'll pass it to sub-agents.

---

## Phase 1: Analysis (Sub-Agent Scanning)

**Goal**: Spawn specialized sub-agents to analyze different dimensions.

**Execution Order**: Due to data dependencies, sub-agents run in stages:
1. **Stage 1**: Spec Parser (runs first, no dependencies)
   - **TERMINATION CRITERIA**: If Spec Parser returns 0 requirements, STOP and inform user: "Audit aborted: No requirements found in the selected specs. Please ensure specs contain `### Requirement:` blocks."
2. **Stage 2**: Code Mapper + Conflict Detector (run in parallel after Spec Parser completes)
3. **Stage 3**: Drift Scanner (runs after Code Mapper completes)

Create a TODO list tracking each analysis sub-agent:
- [ ] Spec Parser (inventory requirements and scenarios)
- [ ] Code Mapper (map specs to implementation files)
- [ ] Drift Scanner (check requirements against code)
- [ ] Conflict Detector (cross-reference specs for contradictions)

### Sub-Agent Common Template

All sub-agents follow this structure for consistency:

```
You are a [ROLE] for a project-wide OpenSpec audit.

SCOPE: <scope value - "all" or specific capability>
[INPUTS: list any data passed from previous sub-agents]

TASK:
[numbered steps specific to the sub-agent role]

RETURN FORMAT:
{
  "dimension": "<dimension_name>",
  "summary": { ... aggregate counts ... },
  [role-specific fields]
}
```

**Guidelines for all sub-agents:**
- Return valid JSON only (no markdown wrapping)
- Include a `summary` object with aggregate counts for quick parsing
- Use consistent severity levels: HIGH, MEDIUM, LOW, REVIEW
- Reference file locations as `path:line` format

### Data Flow Between Sub-Agents

Sub-agents have dependencies - use this execution order and data passing logic:

| Stage | Sub-Agent | Depends On | Data Passing Rule |
|-------|-----------|------------|-------------------|
| 1 | Spec Parser | None | Runs first; count requirements in output |
| 2 | Code Mapper | Spec Parser | If <50 requirements: pass inline. If ≥50: use fallback instructions below |
| 2 | Conflict Detector | Spec Parser | Pass requirements inline (runs parallel with Code Mapper) |
| 3 | Drift Scanner | Code Mapper | Always pass mappings inline (typically <100 entries) |

**Fallback for ≥50 requirements** (Code Mapper only):
Instead of passing all requirements inline, add this instruction to the Code Mapper prompt:
```
REQUIREMENTS SOURCE: Too many requirements to pass inline (N total).
Read requirements directly from spec files:
1. For each capability in scope, read `openspec/specs/<capability>/spec.md`
2. Extract `### Requirement:` blocks and their file references
3. Use the requirement title as the key for your mapping output
```

**Rationale**: Inline data reduces sub-agent file I/O but bloats prompts. The 50-requirement threshold balances context efficiency (~2KB per 50 requirements) against sub-agent autonomy.

### Spawn Analysis Sub-Agents

**Stage 1**: Spawn Spec Parser first using the Task tool with `subagent_type: "explore"`:

#### Sub-Agent 1: Spec Parser

```
You are a SPECIFICATION PARSER for a project-wide OpenSpec audit.

SCOPE: <SCOPE value - "all" or specific capability>
SPECS DIRECTORY: openspec/specs/

TASK:
1. For each capability directory in scope, read `spec.md`
2. Extract all `### Requirement:` blocks
3. For each requirement, extract:
   - Title (text after "### Requirement:")
   - Normative language (SHALL, MUST, SHOULD, MAY)
   - All `#### Scenario:` blocks with Given/When/Then conditions
   - Any file references mentioned (patterns like `src/...` or backtick-quoted paths)

4. Build an inventory with unique IDs: `<capability>/<requirement-index>`

5. Flag any malformed specs:
   - Requirements without scenarios
   - Scenarios without Given/When/Then
   - Empty or unreadable files

RETURN FORMAT:
```json
{
  "dimension": "spec_parser",
  "capabilities_scanned": ["auth", "api", "payments"],
  "requirements": [
    {
      "id": "auth/1",
      "title": "User Authentication",
      "normative": "SHALL",
      "scenarios": [
        {"name": "Valid login", "given": "...", "when": "...", "then": "..."}
      ],
      "file_references": ["src/auth/login.ts", "src/auth/session.ts"]
    }
  ],
  "warnings": [
    {"capability": "api", "issue": "Requirement without scenarios", "location": "line 45"}
  ],
  "summary": {
    "total_requirements": 15,
    "total_scenarios": 42,
    "malformed": 2
  }
}
```
```

#### Sub-Agent 2: Code Mapper

```
You are a CODE MAPPER for a project-wide OpenSpec audit.

SCOPE: <SCOPE value>
REQUIREMENTS: <If <50 requirements, paste the requirements array here. Otherwise: "Read requirements from openspec/specs/<scope>/spec.md files">

TASK:
1. DEDUPLICATION PROTOCOL:
   - Check if any files have already been mapped by other sub-agents in this session.
   - If a file is already fully mapped, skip detailed analysis and use existing mapping.

2. For each requirement with explicit file references:
   - Verify the referenced files exist
   - Note any missing files

3. For requirements without explicit references:
   - Infer code locations from capability name
   - Search patterns: `**/<capability>/**`, `**/*<capability>*`
   - Include test files: `**/*.test.ts`, `**/*.spec.ts`, `test_*.py`, `*_test.py`, `*_test.go`
   - Assign confidence: HIGH (explicit ref), MEDIUM (name match), LOW (inferred)

4. Build a bidirectional map:
   - Spec requirement → Code files
   - Code file → Spec requirements (for orphan detection)

5. Flag unmapped specs (no code found)

RETURN FORMAT:
```json
{
  "dimension": "code_mapper",
  "mappings": [
    {
      "requirement_id": "auth/1",
      "files": [
        {"path": "src/auth/login.ts", "exists": true, "confidence": "HIGH"},
        {"path": "src/auth/session.ts", "exists": true, "confidence": "HIGH"}
      ]
    }
  ],
  "unmapped_requirements": ["payments/3"],
  "missing_files": [
    {"requirement_id": "api/2", "path": "src/api/deprecated.ts", "referenced_in": "spec line 23"}
  ],
  "summary": {
    "total_mappings": 12,
    "high_confidence": 8,
    "medium_confidence": 3,
    "low_confidence": 1,
    "unmapped": 1
  }
}
```
```

#### Sub-Agent 3: Drift Scanner

```
You are a DRIFT SCANNER for a project-wide OpenSpec audit.

SCOPE: <SCOPE value>
MAPPINGS: <Paste the mappings array from Code Mapper>

TASK:
For each mapped requirement:

1. CONSTRAINT DRIFT: Look for numeric or behavioral constraints in specs
   - Extract values from specs (e.g., "MUST expire after 30 minutes")
   - Search corresponding code for actual values
   - Flag mismatches with evidence

2. MISSING IMPLEMENTATION: Check scenario coverage
   - For each scenario's THEN clause, search for implementing code
   - Flag scenarios with no apparent implementation

3. TEST-SPEC MISALIGNMENT: Compare spec assertions to test assertions
   - Find test files for mapped code
   - Compare expected values in tests vs specs
   - Flag discrepancies

4. NORMATIVE VIOLATIONS: Check MUST NOT constraints
   - Extract negative constraints from specs
   - Search code for violations

5. Classify each finding by severity (see classification guide below)

SEVERITY CLASSIFICATION:
| Severity | Criteria | Examples |
|----------|----------|----------|
| HIGH | MUST/SHALL violation; security/auth issues; data loss risk | "MUST use HTTPS" but code allows HTTP; password stored in plaintext |
| MEDIUM | SHOULD violation; significant functional gap; test mismatch | "SHOULD log errors" but no logging; test expects 30s, spec says 60s |
| LOW | Minor inconsistency; documentation drift; style mismatch | Comment says "timeout: 30s" but spec says 30 seconds (same value) |
| REVIEW | Ambiguous; needs human judgment; context-dependent | Spec says "reasonable timeout" - code uses 5s, unclear if reasonable; function behavior changed but spec allows flexibility; partial implementation may satisfy vague requirement |

RETURN FORMAT:
```json
{
  "dimension": "drift_scanner",
  "findings": [
    {
      "type": "constraint_drift",
      "severity": "HIGH",
      "requirement_id": "auth/1",
      "spec_text": "Sessions MUST expire after 30 minutes",
      "spec_location": "openspec/specs/auth/spec.md:45",
      "code_text": "expiresIn: 3600000 // 60 minutes",
      "code_location": "src/auth/session.ts:23",
      "expected": "30 minutes",
      "actual": "60 minutes"
    },
    {
      "type": "missing_implementation",
      "severity": "MEDIUM",
      "requirement_id": "auth/2",
      "scenario": "User receives email notification on login",
      "spec_location": "openspec/specs/auth/spec.md:67"
    }
  ],
  "summary": {
    "total_findings": 5,
    "high": 1,
    "medium": 2,
    "low": 1,
    "review": 1
  }
}
```
```

#### Sub-Agent 4: Conflict Detector

```
You are a CONFLICT DETECTOR for a project-wide OpenSpec audit.

SCOPE: <SCOPE value>
REQUIREMENTS: <Paste requirements array from Spec Parser>
MAPPINGS: <If mappings <100 entries, paste inline. Otherwise: "Reference Code Mapper output for file mappings">

TASK:

1. CONTRADICTORY REQUIREMENTS: Cross-reference all requirements
   - Look for conflicting numeric constraints
   - Look for mutually exclusive behaviors
   - Flag with question: "Which applies?"

2. OVERLAPPING SCOPE: Check for specs addressing same code
   - Multiple requirements referencing same file
   - Unclear ownership boundaries
   - Suggest consolidation

3. STALE REFERENCES: Check for deprecated code references
   - Function/class names mentioned in specs
   - Verify they exist in codebase
   - Flag as "stale" if missing

4. INTERNAL CONSISTENCY: Within each spec
   - Scenarios that contradict each other
   - Requirements that conflict within same capability

RETURN FORMAT:
```json
{
  "dimension": "conflict_detector",
  "conflicts": [
    {
      "type": "contradictory",
      "severity": "HIGH",
      "specs": ["api/spec.md:30", "performance/spec.md:15"],
      "description": "API timeout MUST be 30s vs All operations MUST complete in 10s",
      "question": "Which timeout applies to API calls?"
    },
    {
      "type": "stale_reference",
      "severity": "MEDIUM",
      "spec": "auth/spec.md:89",
      "reference": "validateUser()",
      "description": "Function no longer exists in codebase"
    }
  ],
  "overlaps": [
    {
      "file": "src/shared/utils.ts",
      "referenced_by": ["auth/1", "api/3"],
      "suggestion": "Clarify ownership or create shared spec"
    }
  ],
  "summary": {
    "contradictions": 1,
    "stale_references": 2,
    "overlaps": 3
  }
}
```
```

### Collect Sub-Agent Results

Wait for all sub-agents to return (respecting the stage order above).

**Timeout Handling** (5-minute limit per sub-agent):
- Rationale: 5 minutes allows thorough exploration of ~500 files while preventing indefinite hangs
- If a sub-agent exceeds this limit, it typically indicates scope creep or infinite loops
- **Enforcement** (in order of preference):
  1. Use the Task tool's `timeout` parameter if available (preferred)
  2. Track wall-clock time: Record `start_time` before spawning, check elapsed time periodically
  3. **Fallback if neither works**: Proceed with caution; note in report that timeout could not be guaranteed
- **On timeout detection**:
  1. Do not wait indefinitely - proceed with available results
  2. Mark the timed-out dimension as "INCOMPLETE"
  3. Include note in final report: "Sub-agent <name> timed out after 5 minutes"

If any sub-agent times out:
- Mark that dimension as "INCOMPLETE"
- Note the timeout in the final report
- Continue with available results

### Sub-Agent Failure Handling

Sub-agents may fail or return partial results. Handle each case with specific fallbacks:

| Failure Type | Detection | Action | Fallback |
|--------------|-----------|--------|----------|
| Timeout | No response after 5 minutes | Mark dimension INCOMPLETE | For Spec Parser: count `### Requirement:` headers directly. For others: skip dimension |
| Empty response | Response is empty or only whitespace | Retry once with simplified scope | If retry fails, use direct file reading for that dimension |
| Invalid JSON | JSON parse fails | Extract any usable text; mark PARTIAL | Parse key-value pairs from response text if possible |
| Partial data | Missing expected fields in response | Use available fields; note gaps | Fill missing fields with empty arrays/zero counts |
| Error message | Response contains error instead of data | Log error; attempt fallback | Spec Parser: read files directly. Code Mapper: use glob patterns. Others: mark INCOMPLETE |

**Retry Policy**: Retry at most once per sub-agent (prevents doom loops). If retry fails, proceed without that dimension's data.

**HARD FALLBACK POLICY (No-Evidence Loop Prevention):**
- If a sub-agent fails and fallback provides no evidence (e.g., Code Mapper finds 0 files, Spec Parser finds 0 requirements):
  - **DO NOT CONTINUE** the audit for that scope.
  - Abort the phase and report: "Insufficient evidence to proceed with audit for <scope>."
  - This prevents the orchestrator from hallucinating an "ALIGNED" status based on zero data.

**Concrete retry strategies by failure type:**

| Failure | Retry Modification |
|---------|-------------------|
| Empty response | Reduce scope: if auditing "all", retry with single capability; if single capability, retry asking for plain text instead of JSON |
| Invalid JSON | Ask sub-agent to return plain text summary with key metrics on separate lines (e.g., "requirements: 15\nscenarios: 42") |
| Error message | Simplify the task: for Code Mapper, ask only for file list without mapping details; for Drift Scanner, ask only for HIGH severity issues |

Parse JSON outputs and store for synthesis.

---

## Phase 2: Orphan Detection

**Goal**: Identify significant code modules that lack specification coverage.

After receiving Code Mapper results, identify orphaned code:

1. **List source files not mapped to any spec**:
   - Focus on `src/`, `lib/`, `app/` directories
   - Exclude configuration files, type definitions, generated code

2. **Filter by significance** (line count thresholds):
   - **<20 lines**: Deprioritize (likely utility/helper files)
   - **20-50 lines**: Include if has multiple exports
   - **>50 lines**: Always include (substantial modules warrant specs)
   
   Rationale: Files under 20 lines rarely contain complex behavior needing specification. The 50-line threshold captures most meaningful business logic.

3. **Exclude common non-spec targets**:
   - `*.config.js`, `*.json`, `*.yaml`
   - `*.d.ts`, `types.ts`
   - Files with `// Generated` or `@generated` markers
   - Test files (covered by their source specs)

4. **Large codebase optimization** (>1000 source files):
   - Limit analysis to top 100 files by line count
   - Rationale: Analyzing 1000+ files exceeds practical sub-agent context; sampling top 100 captures ~80% of significant orphans by code volume
   - Note sampling in report with recommendation for targeted audits

Build orphan list:
```json
{
  "orphans": [
    {
      "path": "src/integrations/stripe.ts",
      "lines": 234,
      "exports": 8,
      "suggestion": "Create spec for payment integration"
    }
  ],
  "sampled": false,
  "sample_size": null,
  "total_source_files": 150
}
```

---

## Phase 3: Synthesis

**Goal**: Aggregate findings, determine overall health, generate recommendations.

> **Anti-Loop Protocol**: After receiving all sub-agent results, immediately proceed to merging findings. 
> 
> **>>> SYNTHESIS CHECKPOINT <<<**
> Verify that all findings from all active sub-agents have been collected. If any dimension is missing or incomplete, ensure it is clearly marked in the internal state before proceeding.
> 
> Proceed directly to the structured synthesis steps below. Skip prose summaries of sub-agent findings.

### Step 1: Merge All Findings

Combine issues from all dimensions:
- Drift findings (from Drift Scanner)
- Conflicts (from Conflict Detector)
- Unmapped specs (from Code Mapper)
- Orphaned code (from Phase 2)
- Malformed specs (from Spec Parser)

### Step 2: Deduplicate and Cross-Reference

- Remove duplicate findings (same file/line from different scanners)
- Link related issues (e.g., stale reference may explain drift)
- Group by affected component

### Step 3: Determine Overall Health

Calculate health status based on concrete thresholds (aligned with spec):

| Status | Criteria |
|--------|----------|
| **ALIGNED** | Zero HIGH findings AND zero MUST/SHALL violations AND <3 orphaned modules AND zero unresolved conflicts |
| **DRIFT_DETECTED** | Any HIGH severity drift OR >3 orphaned modules OR any SHOULD violations OR any stale references |
| **MAJOR_DRIFT** | Any MUST/SHALL constraint violation OR any contradictory requirements |

**Note on REVIEW findings**: REVIEW-severity findings indicate ambiguous cases needing human judgment. They do NOT affect the health status calculation but are included in the recommendations section for manual verification.

**Priority of criteria** (evaluated in order):
1. MUST/SHALL violations → always MAJOR_DRIFT
2. HIGH finding count → DRIFT_DETECTED if any present
3. Orphan count → >3 triggers DRIFT_DETECTED

### Step 4: Generate Prioritized Recommendations

Order by:
1. MUST/SHALL violations (fix spec or code)
2. Missing implementations (implement or remove from spec)
3. Stale references (update specs)
4. Orphaned code (create specs or document as intentionally unspecified)
5. Minor inconsistencies (cleanup)

---

## Final Report

Generate the audit report following this structure:

```
============================================================
               PROJECT AUDIT REPORT
============================================================

SCOPE: [all | <capability>]
OVERALL HEALTH: [ALIGNED | DRIFT_DETECTED | MAJOR_DRIFT]

SPECS AUDITED: N capabilities
REQUIREMENTS CHECKED: M
SCENARIOS VERIFIED: K

[If any dimension incomplete:]
⚠️  INCOMPLETE DIMENSIONS: <list timed-out sub-agents>

DRIFT SUMMARY
------------------------------------------------------------
Constraint Drift: N issues
Missing Implementation: N issues
Test-Spec Mismatch: N issues
Stale References: N issues

[If ALIGNED:]
✅ All specifications align with implementation

[If issues found:]
DETAILED FINDINGS
------------------------------------------------------------

## DRIFT: <capability>/<requirement>
### Requirement: <title>
- **Spec**: "<quoted spec text>"
- **Code**: <actual implementation>
- **Evidence**: <file:line>
- **Severity**: [HIGH|MEDIUM|LOW|REVIEW]
- **Action**: <remediation suggestion>

## CONFLICTS DETECTED
[List conflicts with specs involved and resolution question]

## STALE REFERENCES
[List specs referencing non-existent code]

## ORPHANED CODE (Unspecified)
[List significant modules without specs]

RECOMMENDATIONS
------------------------------------------------------------
1. [Highest priority action]
2. [Second priority]
3. [Third priority]
...

[If sampled:]
Note: Large codebase detected. Orphan analysis sampled top 100 modules.
Run `/openspec-audit <capability>` for comprehensive analysis of specific areas.

============================================================
```

### Health Status Display

**For ALIGNED:**
```
============================================================
               PROJECT AUDIT REPORT
============================================================

SCOPE: all
OVERALL HEALTH: ✅ ALIGNED

SPECS AUDITED: 5 capabilities
REQUIREMENTS CHECKED: 23
SCENARIOS VERIFIED: 67

✅ All specifications align with implementation

No drift, conflicts, or significant orphans detected.
============================================================
```

**For issues found:**
Show full detailed report with findings and recommendations.

### JSON Output Format

**If `OUTPUT_FORMAT = "json"`**, output the report as a JSON object instead of the text format above:

```json
{
  "health": "ALIGNED | DRIFT_DETECTED | MAJOR_DRIFT",
  "summary": {
    "specsAudited": 5,
    "requirementsChecked": 23,
    "scenariosVerified": 67,
    "scope": "all | <capability>"
  },
  "drift": [
    {
      "severity": "HIGH | MEDIUM | LOW | REVIEW",
      "type": "constraint | missing_implementation | test_spec_mismatch",
      "capability": "<capability>",
      "requirement": "<requirement title>",
      "spec": "<quoted spec text>",
      "code": "<actual implementation>",
      "evidence": "<file:line>",
      "action": "<remediation suggestion>"
    }
  ],
  "orphans": [
    {
      "file": "<file path>",
      "lines": 150,
      "exports": 5,
      "suggestion": "Create spec for <module purpose>"
    }
  ],
  "conflicts": [
    {
      "type": "contradictory | overlapping | stale",
      "specs": ["<spec1>", "<spec2>"],
      "description": "<conflict description>",
      "resolution": "<suggested resolution>"
    }
  ],
  "recommendations": [
    {
      "priority": 1,
      "action": "<prioritized action description>"
    }
  ],
  "incomplete_dimensions": ["<dimension names if any timed out>"]
}
```

**JSON output rules:**
- Output ONLY the JSON object, no markdown wrapping
- Use empty arrays `[]` for sections with no findings
- Omit `incomplete_dimensions` if all dimensions completed successfully

---

## Phase 4: Remediation (Targeted Fixes)

**Goal**: If issues exist, optionally spawn targeted sub-agents to fix specific problems under contract tracking.

### Decision Point

**If ALIGNED**: Skip to Final Report. No fixes needed. Emit completion banner directly.

**If DRIFT_DETECTED or MAJOR_DRIFT**: Use `mcp_question` to prompt user:

```
Use mcp_question with:
  header: "Fix Issues"
  question: "Found <N> drift issues. How would you like to proceed?"
  options:
    - label: "Fix all issues"
      description: "Apply fixes for all drift issues automatically"
    - label: "Fix high severity only"
      description: "Apply fixes for HIGH severity issues only"
    - label: "Show report only"
      description: "Display detailed report for manual fixing"
    - label: "Accept current state"
      description: "Skip fixes and proceed"
```

Wait for user selection before proceeding.

### Establish Fix Contract

**If user selects "Fix all issues" or "Fix high severity only"**, establish a contract:

```
============================================================
                    CONTRACT ACTIVE
============================================================

OBJECTIVE: Fix spec/implementation drift in <scope>

SUCCESS CRITERIA:
- [ ] (D1) <drift issue 1> - <spec:line> vs <code:line>
- [ ] (D2) <drift issue 2> - <spec:line> vs <code:line>
- [ ] (DN) <drift issue N> - <description>
- [ ] All fixes verified (specs and code aligned)

============================================================
```

Track each fix as a criterion. Mark complete only when verified.

### Spawn Fix Sub-Agents

Based on user choice, spawn targeted fix sub-agents with `subagent_type: "general"`:

#### Fix Sub-Agent Template

```
You are fixing a spec/implementation drift issue.

ISSUE TO FIX:
- Type: <constraint_drift | missing_implementation | stale_reference>
- Severity: <HIGH | MEDIUM | LOW>
- Spec: <spec location and text>
- Code: <code location and current value>
- Expected: <what spec says>
- Actual: <what code does>

TASK:
1. Determine if spec or code should be updated:
   - If code is wrong, fix the code
   - If spec is outdated, update the spec
   - If ambiguous, prefer updating code to match spec

2. Make the fix
3. Verify alignment

RETURN FORMAT:
```json
{
  "issue_id": "<type>:<file>:<line>",
  "status": "FIXED|PARTIAL|UNABLE",
  "fix_type": "code|spec",
  "changes_made": ["<description>"],
  "files_modified": ["<file>"],
  "verification": "<how you verified alignment>"
}
```
```

### Validate Fixes

After fix sub-agents complete:
1. Verify changes were made
2. Re-check alignment between spec and code
3. Mark each fix as VERIFIED, UNVERIFIED, or PROBLEMATIC

### Contract Completion (If Fixes Applied)

After all fixes are verified, emit CONTRACT FULFILLED:

```
============================================================
                  CONTRACT FULFILLED
============================================================

OBJECTIVE: Fix spec/implementation drift in <scope>

ALL CRITERIA MET:
- [x] (D1) <issue 1> - VERIFIED
- [x] (D2) <issue 2> - VERIFIED
...

============================================================
```

### Completion Banner

After the final report (and CONTRACT FULFILLED if fixes were applied), emit:

```
============================================================
      /openspec-audit <scope> COMPLETE
============================================================
Result: <ALIGNED | N drift issues fixed | Report only>
============================================================
```

---

## Execution

Now execute the project audit.

1. Run pre-flight checks
2. Spawn analysis sub-agents in parallel (Stage 1 → Stage 2 → Stage 3)
3. Perform orphan detection
4. Synthesize findings
5. Phase 4: Remediation (if issues found and user confirms)
6. Generate and display final report with completion banner

Begin with Step 1: Validate Specs Directory.
