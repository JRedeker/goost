---
name: openspec-status
description: Fast overview of OpenSpec project state - active changes, specs, dependencies, and recommendations.
---

# OpenSpec Status

You are providing a **fast, formatted status overview** of the OpenSpec project.

> **IMPORTANT**: This command prioritizes speed. Do NOT spawn sub-agents. Do NOT perform deep file analysis. Complete within 2-3 seconds.

## Step 1: Check OpenSpec Directory

First, verify OpenSpec is initialized:

```bash
ls openspec/ 2>/dev/null
```

**If directory does not exist:**
```
============================================================
                OPENSPEC STATUS
============================================================

OpenSpec not initialized in this project.

RECOMMENDATION:
> Run `openspec init` to get started
============================================================
```
Then STOP.

## Step 2: Gather Data

Run these commands to gather project state:

### 2.1 Get Active Changes

```bash
openspec list
```

Parse the output to extract change names and task counts (format: `<change-name>     N/M tasks`).

**If command fails:**
- Display: "OpenSpec CLI not available"
- Suggest: "Check that `openspec` is installed and in PATH"
- STOP

### 2.2 Get Specs Summary

```bash
openspec list --specs
```

Parse the output to extract capability names and requirement counts.

### 2.3 Get Change Details (for dependency detection)

For each active change found in step 2.1:

```bash
openspec show <change-name> --json --deltas-only
```

Extract the capability names from the JSON (look for `specs/<capability>/` paths).

**If JSON parsing fails for a change:**
- Note "Unable to load details" for that change
- Continue with other changes (graceful degradation)

## Step 3: Detect Dependencies

Analyze the gathered data for potential dependencies:

1. Build a map: `capability -> [list of changes modifying it]`
2. For each capability with 2+ changes: flag as potential dependency
3. Check for name-based relationships (one change name is prefix/suffix of another)

## Step 4: Generate Recommendations

Based on state, determine recommendations:

| Condition | Recommendation |
|-----------|----------------|
| A change has 100% tasks complete | "Ready to archive: `/openspec-archive <change>`" |
| Multiple changes share a capability | "Review potential conflicts between <changes>" |
| No active changes | "Create a change: `/openspec-proposal`" |
| Changes exist with <50% progress | "Continue work on `<change>` (<N>/<M> tasks)" |

## Step 5: Format and Display Output

Generate the formatted status report:

```
============================================================
                OPENSPEC STATUS
============================================================

ACTIVE CHANGES
------------------------------------------------------------
<change-id>          [========> ] 8/10 tasks
<change-id-2>        [===>      ] 3/8 tasks

(If no active changes: "No active changes")

SPECS
------------------------------------------------------------
<capability>         N requirements
<capability-2>       M requirements

(If no specs: "No specs defined")

DEPENDENCIES
------------------------------------------------------------
! <change-a> and <change-b> both modify: <capability>

(Only show this section if dependencies detected)

RECOMMENDATIONS
------------------------------------------------------------
> <recommendation 1>
> <recommendation 2>
============================================================
```

### Progress Bar Format

Generate progress bars using this formula:
- Total width: 10 characters
- Filled: `=` characters proportional to completion
- Arrow: `>` at the end of filled section
- Empty: ` ` (space) for remaining

Examples:
- 0/10 tasks: `[>         ]`
- 3/10 tasks: `[==>       ]`
- 5/10 tasks: `[====>     ]`
- 10/10 tasks: `[==========]`

### Sorting

Sort active changes by progress (most complete first) to highlight what's close to done.

## Error Handling

### OpenSpec CLI Not Available

```
============================================================
                OPENSPEC STATUS
============================================================

OpenSpec CLI not available.

RECOMMENDATION:
> Check that `openspec` is installed and in PATH
> Run `npm install -g openspec` to install
============================================================
```

### Malformed JSON Output

If `openspec show --json` returns invalid JSON:
- Log warning: "Failed to parse OpenSpec output for <change>"
- Continue with available data
- Note in output: "<change>  [Unable to load details]"

### Partial Failures

If some changes load successfully and others fail:
- Display successful changes with full progress
- Display failed changes with "Unable to load details" note
- Do NOT abort the entire report

## Performance Notes

This command MUST be fast:
- No sub-agent spawning
- No file content analysis beyond what CLI provides
- No network requests
- Target completion: 2-3 seconds
