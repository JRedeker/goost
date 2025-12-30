---
name: openspec-roadmap
description: Display a tiered progress dashboard for OpenSpec changes and optional roadmap.yaml items.
agent: general
---

# OpenSpec Roadmap Dashboard

Display a tiered progress dashboard showing project roadmap status.

## Data Collection

### Step 1: Check for OpenSpec

```bash
# Check if openspec/ directory exists
ls openspec/ 2>/dev/null
```

If openspec/ directory does not exist:
- Check if `roadmap.yaml` exists in project root
- If neither exists, output:
  ```
  No openspec/ directory found. Run `openspec init` to get started.
  
  Alternatively, create a roadmap.yaml file to define manual roadmap items.
  ```

### Step 2: Get OpenSpec Data

Run the OpenSpec CLI to get change data:

```bash
openspec list
```

Parse the output to extract:
- Change IDs (e.g., `add-openspec-roadmap-command`)
- Task progress (e.g., `0/21 tasks` or `✓ Complete`)
- Status indicators

**If OpenSpec CLI is not available:**
- Note: "OpenSpec CLI not available - using roadmap.yaml only"
- Continue with roadmap.yaml data if present

**If openspec/ exists but has no changes:**
- Output: "No OpenSpec changes found in openspec/"
- Suggest: "Run `openspec new <change-name>` to create one"

### Step 3: Check for roadmap.yaml (Optional)

```bash
cat roadmap.yaml 2>/dev/null
```

If roadmap.yaml exists, parse it for additional items with schema:
```yaml
items:
  - id: feature-name
    title: Human Readable Title
    description: Optional description
    status: in_progress | proposed | ready | deferred | completed | archived
    priority: critical | high | medium | low
    change_spec: openspec-change-id  # Links to OpenSpec change
    tasks_total: 10      # Manual count (overridden by change_spec)
    tasks_completed: 5   # Manual count (overridden by change_spec)
```

**If roadmap.yaml has YAML syntax errors:**
- Output error with line number if available
- Suggest fixing the syntax

**If roadmap.yaml exists but has no items:**
- Output: "roadmap.yaml exists but has no items defined"
- Show example item format

### Step 4: Merge Data Sources

For each item:
1. If `change_spec` links to an OpenSpec change, use OpenSpec progress data
2. Otherwise, use manual `tasks_total`/`tasks_completed` from roadmap.yaml
3. For OpenSpec-only items (no roadmap.yaml), derive from OpenSpec data directly

**If change_spec references a non-existent change:**
- Show warning: "Warning: change_spec 'X' not found in OpenSpec"
- Use manual values from roadmap.yaml

## Tiering Logic

### With roadmap.yaml
Tier items based on `status` and `priority`:

| Tier | Criteria |
|------|----------|
| **NOW** | `status: in_progress` OR `priority: critical` |
| **NEXT** | `status: proposed` OR `status: ready` |
| **LATER** | `status: deferred` OR `status: completed` |

Items with `status: archived` are excluded from display.

### OpenSpec-Only Mode (no roadmap.yaml)
Tier based on progress:

| Tier | Criteria |
|------|----------|
| **NOW** | Changes with >0% completion (work in progress) |
| **NEXT** | Changes with 0% completion (not started) |
| **LATER** | Archived changes (100% complete) |

## Output Format

Render the dashboard with this exact format:

```
============================================================
                    PROJECT ROADMAP
============================================================

NOW (In Progress)
-----------------
  [████████░░] add-oauth-support (8/10 tasks)
    OAuth2 authentication flow
    
  [██████████] fix-session-timeout (10/10 tasks)  DONE

NEXT (Ready)
------------
  [░░░░░░░░░░] add-rate-limiting (0/5 tasks)
    API rate limiting

LATER (Backlog)
---------------
  [░░░░░░░░░░] refactor-db-layer (0/12 tasks)
    Database abstraction

============================================================
Total: 4 items | 18/27 tasks (67%)
============================================================
```

### Progress Bar Rendering

Use 10-character progress bars with block characters:
- `█` (U+2588) for filled portion
- `░` (U+2591) for empty portion

Calculate filled blocks: `round(percentage / 10)`

Examples:
- 0%: `[░░░░░░░░░░]`
- 50%: `[█████░░░░░]`
- 100%: `[██████████]`

Items at 100% completion show `DONE` badge after task count.

### Item Display

For each item show:
1. Progress bar
2. Item ID or title
3. Task count `(X/Y tasks)`
4. `DONE` badge if 100%
5. Description on next line (indented, if available)

### Summary Footer

Show aggregate totals:
- Total item count (excluding archived)
- Completed tasks / Total tasks
- Overall percentage

### Special Cases

**All items complete (100%):**
```
============================================================
                    PROJECT ROADMAP
============================================================

🎉 All roadmap items complete!

LATER (Complete)
----------------
  [██████████] feature-a (10/10 tasks)  DONE
  [██████████] feature-b (5/5 tasks)  DONE

============================================================
Total: 2 items | 15/15 tasks (100%)
============================================================
```

**No active items after filtering:**
```
============================================================
                    PROJECT ROADMAP
============================================================

No active roadmap items found.
(3 items archived)

Run `openspec new <change-name>` to add a new change.
============================================================
```

## Execution

Now execute the steps above and render the roadmap dashboard for this project.
