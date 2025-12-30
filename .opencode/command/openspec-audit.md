---
name: openspec-audit
description: Project-wide audit to detect spec/implementation drift, identify unspecified code, and find conflicting requirements.
---

# OpenSpec Project Audit

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
- Check for active changes that may affect audit accuracy:
```bash
openspec list 2>/dev/null
```
- If active changes exist, warn: "Note: Active changes may affect audit accuracy. Consider archiving completed changes."

### Step 3: Determine Audit Scope

**If `$ARGUMENTS` is empty:**
- Audit ALL capability specs under `openspec/specs/`
- Set `SCOPE = "all"`

**If `$ARGUMENTS` is provided (e.g., "auth"):**
- Verify `openspec/specs/$ARGUMENTS/` exists
- If not found, display error and list available capabilities
- Set `SCOPE = "$ARGUMENTS"`

### Step 4: Build Spec Inventory

List all capability directories to audit:

```bash
find openspec/specs -mindepth 1 -maxdepth 1 -type d -exec basename {} \; 2>/dev/null
```

Store the list - you'll pass it to sub-agents.

---

## Phase 1: Analysis (Sub-Agent Scanning)

**Goal**: Spawn specialized sub-agents to analyze different dimensions in parallel.

Create a TODO list tracking each analysis sub-agent:
- [ ] Spec Parser (inventory requirements and scenarios)
- [ ] Code Mapper (map specs to implementation files)
- [ ] Drift Scanner (check requirements against code)
- [ ] Conflict Detector (cross-reference specs for contradictions)

### Spawn Analysis Sub-Agents

Spawn **4 parallel sub-agents** using the Task tool with `subagent_type: "explore"`:

#### Sub-Agent 1: Spec Parser

```
You are parsing SPECIFICATIONS for a project-wide audit.

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
You are mapping SPECIFICATIONS TO CODE for a project-wide audit.

SCOPE: <SCOPE value>
REQUIREMENTS: <Pass the requirements array from Spec Parser, or instruct to read specs directly>

TASK:
1. For each requirement with explicit file references:
   - Verify the referenced files exist
   - Note any missing files

2. For requirements without explicit references:
   - Infer code locations from capability name
   - Search patterns: `**/<capability>/**`, `**/*<capability>*`
   - Include test files: `**/*.test.ts`, `**/*.spec.ts`
   - Assign confidence: HIGH (explicit ref), MEDIUM (name match), LOW (inferred)

3. Build a bidirectional map:
   - Spec requirement → Code files
   - Code file → Spec requirements (for orphan detection)

4. Flag unmapped specs (no code found)

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
You are detecting DRIFT between specifications and implementation.

SCOPE: <SCOPE value>
MAPPINGS: <Pass the mappings from Code Mapper>

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

5. Classify each finding:
   - HIGH: MUST/SHALL violation, security risk, data integrity
   - MEDIUM: SHOULD violation, test mismatch, significant gap
   - LOW: Minor inconsistency, style drift
   - REVIEW: Ambiguous, needs manual verification

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
You are detecting CONFLICTS between specifications.

SCOPE: <SCOPE value>
REQUIREMENTS: <Pass the requirements from Spec Parser>
MAPPINGS: <Pass the mappings from Code Mapper>

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

Wait for all 4 sub-agents to return. If any sub-agent times out (exceeds 5 minutes):
- Mark that dimension as "INCOMPLETE"
- Note the timeout in the final report
- Continue with available results

Parse JSON outputs and store for synthesis.

---

## Phase 2: Orphan Detection

**Goal**: Identify significant code modules that lack specification coverage.

After receiving Code Mapper results, identify orphaned code:

1. **List source files not mapped to any spec**:
   - Focus on `src/`, `lib/`, `app/` directories
   - Exclude configuration files, type definitions, generated code

2. **Filter by significance**:
   - Deprioritize files <20 lines
   - Focus on files >50 lines or with multiple exports

3. **Exclude common non-spec targets**:
   - `*.config.js`, `*.json`, `*.yaml`
   - `*.d.ts`, `types.ts`
   - Files with `// Generated` or `@generated` markers
   - Test files (covered by their source specs)

4. **Large codebase optimization**:
   - If >1000 source files, limit to top 100 by line count
   - Note sampling in report

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
  "total_source_files": 150
}
```

---

## Phase 3: Synthesis

**Goal**: Aggregate findings, determine overall health, generate recommendations.

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

Based on aggregated findings:

| Status | Criteria |
|--------|----------|
| **ALIGNED** | No drift, no conflicts, <3 minor orphans |
| **DRIFT_DETECTED** | Any HIGH severity drift OR >3 orphans |
| **MAJOR_DRIFT** | Any MUST/SHALL constraint violations |

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

---

## Execution

Now execute the project audit.

1. Run pre-flight checks
2. Spawn analysis sub-agents in parallel
3. Perform orphan detection
4. Synthesize findings
5. Generate and display final report

Begin with Step 1: Validate Specs Directory.
