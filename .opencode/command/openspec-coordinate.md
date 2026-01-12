---
name: openspec-coordinate
description: Synchronize multiple active OpenSpec changes, detect conflicts, and align task lists.
agent: general
---

# OpenSpec Coordinate

> **SUB-AGENT CONTEXT**: You are running as a sub-agent. Do NOT emit `[GOOST:*]` status markers or CONTRACT STATUS blocks - these only work in the main session and waste your output buffer. Focus on returning useful results directly.

You are orchestrating a **cross-agent coordination and conflict audit** for all active OpenSpec changes.

## Phase 1: Discovery (Sub-Agent Scanning)

**Goal**: Spawn specialized sub-agents to analyze overlaps and conflicts.

### Step 1: Rebuild Coordination State

First, rebuild the global coordination state to ensure it's up-to-date:

```bash
node scripts/openspec/coordination.js rebuild
```

### Step 2: Spawn Analysis Sub-Agents

Spawn 3 parallel sub-agents using the Task tool with `subagent_type: "explore"`:

#### Sub-Agent 1: Overlap & Lock Analyzer
- **TASK**: Run `node scripts/openspec/coordination.js overlaps` and analyze the impact. Identify "Hot Files" and resource contention.
- **RETURN**: List of overlapping files and their current "owners" (change-ids).

#### Sub-Agent 2: Conflict & Semantic Analyzer
- **TASK**: Run `node scripts/openspec/coordination.js conflicts` and perform LLM-based semantic checks on the output. Identify contradictory requirement intents.
- **RETURN**: List of semantic conflicts with evidence from spec deltas.

#### Sub-Agent 3: Dependency & Drift Analyzer
- **TASK**: Run `node scripts/openspec/coordination.js cycles` and check `tasks.md` for drift using `node scripts/openspec/coordination.js anchor-verify`.
- **RETURN**: List of dependency cycles and "DRIFTED" tasks requiring re-alignment.

## Phase 2: Synthesis

Combine findings into a **Coordination Dashboard**:

1. **Hot Files**: Files modified by multiple changes.
2. **Semantic Conflicts**: Contradictory intents detected in requirements.
3. **Deadlocks & Cycles**: Circular dependencies that block implementation.
4. **Task Drift**: Tasks that need line number updates or scope reassessment.

## Final Report

Output the dashboard with actionable re-alignment steps.

```
============================================================
                COORDINATION DASHBOARD
============================================================

HOT FILES (Overlaps)
------------------------------------------------------------
! <file-path> : Modified by <id1>, <id2>

SEMANTIC CONFLICTS
------------------------------------------------------------
? <identifier> : <id1> (<action1>) vs <id2> (<action2>)

DEPENDENCIES & DRIFT
------------------------------------------------------------
X CYCLE: <id-a> -> <id-b> -> <id-a> (BLOCKING)
~ DRIFT: <id> : Task "<task name>" has shifted

SUGGESTED SEQUENCE
------------------------------------------------------------
1. <id1> finish Phase X
2. <id2> start Phase Y
============================================================
```
