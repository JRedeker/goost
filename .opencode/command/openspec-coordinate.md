---
name: openspec-coordinate
description: Synchronize multiple active OpenSpec changes, detect conflicts, and align task lists.
agent: general
---

# OpenSpec Coordinate

> **SUB-AGENT CONTEXT**: Return findings directly. Status markers and CONTRACT STATUS blocks are for main sessions only—omit them to maximize your output buffer.

You are orchestrating a **cross-agent coordination and conflict audit** for all active OpenSpec changes.

## Pre-flight Checks

### Step 1: Verify OpenSpec CLI

```bash
which openspec && openspec --version 2>/dev/null || echo "CLI_UNAVAILABLE"
```

**If CLI unavailable:**
```
============================================================
                COORDINATION DASHBOARD
============================================================

OpenSpec CLI not available.

RECOMMENDATION:
> Check that `openspec` is installed and in PATH
> Run `which openspec` to verify installation
============================================================
```
Then STOP.

### Step 2: Check for Active Changes

```bash
openspec list 2>/dev/null || echo "NO_CHANGES"
```

**If no changes directory or no active changes:**
```
============================================================
                COORDINATION DASHBOARD
============================================================

No active changes to coordinate.

RECOMMENDATION:
> Run `/openspec-proposal` to create a new change
============================================================
```
Then STOP.

**If only one active change:**
```
============================================================
                COORDINATION DASHBOARD
============================================================

Only one active change found - coordination not needed.

ACTIVE CHANGE: <change-id>
  Progress: <N/M tasks>

RECOMMENDATION:
> Check back when multiple changes are active
============================================================
```
Then STOP.

## Phase 1: State Reconstruction

### Step 1: Rebuild Coordination State

Run the coordination script to rebuild state from proposal files:

```bash
node scripts/openspec/coordination.js rebuild
```

This creates/updates `.openspec/coordination.json` with:
- All active changes and their affected files
- File lock mappings (which changes touch which files)
- Extracted requirements for conflict detection
- Quota violations (if any change exceeds 20 file limit)

**If rebuild fails:**
- Log the error
- Attempt to proceed with stale state if it exists
- Otherwise, report the failure and stop

### Step 2: Get Full State

```bash
node scripts/openspec/coordination.js show
```

Parse the JSON to understand:
- `changes`: Map of change-id to affected files
- `locks`: Map of file to owning change-ids
- `requirements`: Map of change-id to extracted requirements
- `warnings`: Any issues found during rebuild

## Phase 2: Analysis

Run analysis commands in parallel for efficiency:

### Step 1: Parallel Analysis

Spawn these commands simultaneously:

```bash
# Get overlapping files
node scripts/openspec/coordination.js overlaps

# Get semantic conflicts
node scripts/openspec/coordination.js conflicts

# Check for dependency cycles
node scripts/openspec/coordination.js cycles
```

### Step 2: Parse Results

**Overlaps**: Files modified by 2+ changes - these are "hot files" requiring coordination.

**Conflicts**: Identifier-Action Matrix results showing:
- Same identifier targeted by different changes
- Potentially incompatible actions (Rename vs Update, Delete vs Modify)

**Cycles**: Dependency cycle detection results:
- Empty array = no cycles, safe to proceed
- Non-empty = circular dependencies that must be resolved

## Phase 3: Task Drift Analysis (Optional)

If any change has stored task anchors, verify them:

```bash
# For each anchor in .openspec/anchors.json (if exists)
node scripts/openspec/coordination.js anchor-verify '<anchor-json>'
```

Categorize results:
- **STABLE**: Task location unchanged
- **MOVED**: Task found at new line number (code shifted)
- **DRIFTED**: Task target code not found
- **LOST**: File no longer exists
- **AMBIGUOUS**: Multiple possible matches (needs manual review)

## Phase 4: Generate Report

> **Anti-Loop Protocol**: After Phase 3 analysis, immediately run the report command below. Skip prose summaries—let the report generator handle that.

Run the built-in report generator:

```bash
node scripts/openspec/coordination.js report
```

This outputs a formatted coordination dashboard. If additional context is needed, supplement with your analysis.

## Alternative: Full Manual Report

If the script report is insufficient, generate a comprehensive report:

```
============================================================
                COORDINATION DASHBOARD
============================================================

ACTIVE CHANGES: <N>
------------------------------------------------------------
<change-id-1>     <N/M tasks>    <affected files count> files
<change-id-2>     <N/M tasks>    <affected files count> files

HOT FILES (Overlaps)
------------------------------------------------------------
! <file-path> : Modified by <id1>, <id2>
! <file-path> : Modified by <id1>, <id3> (3+ = critical)

(Show top 50, note if truncated)

SEMANTIC CONFLICTS
------------------------------------------------------------
? <identifier> :
  - <id1> (<action>): <requirement title>
  - <id2> (<action>): <requirement title>

(Show top 20, note if truncated)

DEPENDENCIES & CYCLES
------------------------------------------------------------
X CYCLE: <id-a> -> <id-b> -> <id-a> (BLOCKING)

(List all cycles - these MUST be resolved)

TASK DRIFT
------------------------------------------------------------
~ MOVED: <change-id> / Task "<name>" shifted from line X to Y
! DRIFTED: <change-id> / Task "<name>" - code not found
X LOST: <change-id> / Task "<name>" - file deleted

QUOTA WARNINGS
------------------------------------------------------------
⚠ <change-id> affects <N> files but quota is 20

SUGGESTED SEQUENCE
------------------------------------------------------------
1. <Highest priority action>
2. <Second priority action>
3. <Third priority action>

============================================================
```

## Suggested Sequence Logic

Determine recommendations based on findings:

| Finding | Priority | Recommendation |
|---------|----------|----------------|
| Dependency cycles | CRITICAL | "RESOLVE CYCLES: Break the dependency between <changes>" |
| Hot files (3+ owners) | HIGH | "SERIALIZE: Implement <change> first for <file>" |
| Semantic conflicts | HIGH | "REVIEW CONFLICT: <id1> and <id2> both target <identifier>" |
| Hot files (2 owners) | MEDIUM | "COORDINATE: <id1> and <id2> both modify <file>" |
| Drifted tasks | MEDIUM | "UPDATE TASKS: <change> has drifted task references" |
| Quota exceeded | LOW | "REDUCE SCOPE: <change> exceeds file quota" |

## Error Handling

### Malformed Coordination State

If `.openspec/coordination.json` is corrupted:

```bash
# Force rebuild
rm -f .openspec/coordination.json
node scripts/openspec/coordination.js rebuild
```

### Script Not Found

If `scripts/openspec/coordination.js` doesn't exist:
- Report that coordination script is missing
- Suggest re-installing Goost or checking the installation

### Partial Failures

If some analysis commands fail:
- Continue with available results
- Note which dimensions are incomplete in the report
- Suggest manual investigation for failed dimensions
