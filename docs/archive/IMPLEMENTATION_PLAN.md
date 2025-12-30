# Goost Implementation Plan: Claude Code Feature Parity

This document analyzes four features from Claude Code/OhMyOpenCode that would enhance Goost's persistence mechanisms, evaluates their feasibility in OpenCode, and provides implementation plans.

---

## Executive Summary

| Feature | Value | Feasibility | Priority | Effort |
|---------|-------|-------------|----------|--------|
| Context Window Anxiety Management | **High** | **Easy** | P0 | 2 hours |
| Contract Preservation (Compaction) | **Critical** | **Medium** | P0 | 4 hours |
| Contract Persistence (File-based) | **Medium** | **Easy** | P1 | 3 hours |
| Sub-agent Completion Tracking | **Medium** | **Easy** | P2 | 2 hours |

---

## Feature 1: Context Window Anxiety Management

### What It Is

When context usage exceeds 70%, LLMs exhibit "anxiety" behaviors:
- Rushing to conclusions
- Skipping verification steps
- Declaring premature completion
- Cutting corners on quality

OhMyOpenCode implements this via `context-window-monitor.ts` which injects reminders that there's still plenty of context remaining.

### Why It's Valuable for Goost

**Direct alignment with Goost's mission**: Preventing premature completion is Goost's core purpose. Context anxiety is a *cause* of premature completion that contracts alone don't address.

Without this:
- Agent feels pressure → rushes → declares done at 70%
- Contract enforcement catches it → but damage is done (sloppy work)

With this:
- Agent reminded it has headroom → continues methodically
- Contract enforcement validates quality work

### Feasibility in OpenCode

**Rating: Easy (Pure prompt engineering)**

OpenCode doesn't expose token counts to plugins directly, BUT:

1. **Prompt-based solution**: We can add instructions that teach the agent to self-monitor
2. **Heuristic triggers**: Long sessions (many tool calls, large files read) = likely high usage
3. **Behavioral cues**: Agent saying "running low on context" or rushing = inject reminder

The OhMyOpenCode approach uses `message.create.after` to check `tokens` field on assistant messages, which OpenCode DOES expose:

```typescript
"message.create.after": async (input, output) => {
  if (output.role === "assistant" && output.tokens) {
    // tokens.input reflects current context usage
  }
}
```

### Implementation Plan

#### Phase 1: Instruction-based (Immediate)

Add to `goost_instructions.md`:

```markdown
## Context Window Management

You have a large context window. Even when it feels full, you likely have significant headroom remaining.

**Anti-Anxiety Protocol:**
- Do NOT rush because you "feel" the context is filling up
- Do NOT skip verification steps to "save tokens"
- Do NOT declare completion early due to context pressure
- Complete ALL contract criteria methodically

If you notice yourself rushing or cutting corners, STOP and ask:
> "Am I rushing due to context anxiety? I should continue methodically - there's room."
```

#### Phase 2: Plugin-based Detection (Follow-up)

Enhance `plugin/index.ts` to detect high context usage:

```typescript
// Add to state
let lastInputTokens = 0
let contextWarningIssued = false

// In message.create.after
if (output.tokens?.input) {
  const usage = output.tokens.input
  const MODEL_LIMITS: Record<string, number> = {
    'claude-sonnet-4': 200000,
    'claude-opus-4': 200000,
    'gpt-4o': 128000,
    // ... etc
  }
  
  const limit = MODEL_LIMITS[currentModel] || 200000
  const percentage = usage / limit
  
  if (percentage > 0.7 && !contextWarningIssued) {
    // Inject reminder on next prompt
    contextWarningIssued = true
  }
}
```

#### Effort Estimate: 2 hours

- 30 min: Add instructions
- 1 hour: Implement plugin detection
- 30 min: Testing

---

## Feature 2: Contract Preservation During Compaction

### What It Is

When OpenCode auto-compacts (summarizes conversation to reduce tokens), the detailed contract state could be lost or summarized into oblivion. Claude Code has a `PreCompact` hook and `session.compacted` event.

OhMyOpenCode's `compaction-context-injector` injects critical context before compaction.

### Why It's Valuable for Goost

**Critical**: Without this, contracts become useless after compaction.

Scenario without preservation:
1. Contract established with 5 criteria
2. Agent works, completes 3/5 criteria
3. Context compacted → contract summarized to "working on a task"
4. Agent loses track of remaining criteria
5. Declares done (only 3/5 complete)

Scenario with preservation:
1. Contract established
2. Agent works, completes 3/5
3. Before compaction → contract state explicitly re-injected
4. After compaction → agent knows exactly what remains
5. Completes all 5 criteria

### Feasibility in OpenCode

**Rating: Medium (Requires plugin hook)**

OpenCode exposes:

```typescript
"experimental.session.compacting"?: (
  input: { sessionID: string },
  output: { context: string[]; prompt?: string },
) => Promise
```

This is EXACTLY what we need. We can inject the current contract state into the `context` array, ensuring it survives compaction.

Additionally, we can listen for `session.compacted` event to detect when compaction occurred and potentially re-state the contract.

### Implementation Plan

#### Phase 1: Instruction-based (Immediate)

Add to `goost_instructions.md`:

```markdown
## Compaction Recovery

If you notice the conversation was compacted (context seems shorter, earlier details missing):

1. **Immediately re-state the contract** from memory or by searching for "CONTRACT ACTIVE" in history
2. **Re-output the full status block** with current progress
3. **Do not proceed** until contract state is confirmed

If you cannot find the contract after compaction:
```
[GOOST:EARTH]

⚠️ CONTRACT STATE UNCLEAR

The session appears to have been compacted and I've lost track of the contract.
Please confirm the current contract state or void/re-establish.
```
```

#### Phase 2: Plugin-based Preservation (Core)

Enhance `plugin/index.ts`:

```typescript
// Store contract state
let activeContract: string | null = null

// Capture contract when created
"message.create.after": async (input, output) => {
  const content = /* ... */
  if (CONTRACT_ACTIVE.test(content)) {
    // Extract and store the full contract block
    const match = content.match(/={60}\s+CONTRACT ACTIVE[\s\S]+?={60}/)
    if (match) {
      activeContract = match[0]
    }
  }
  // ... rest of existing logic
}

// Inject before compaction
"experimental.session.compacting": async (input, output) => {
  if (activeContract) {
    output.context.push(`
CRITICAL - PRESERVE THIS CONTRACT STATE:

${activeContract}

Current progress (from last status block):
${contractProgress}

This contract MUST be maintained after compaction.
`)
  }
}

// Detect compaction and remind
event: async (input) => {
  if (input.event.type === "session.compacted" && activeContract) {
    // Could inject a system message or mark state for next response
    console.log("[Goost] Session compacted - contract preservation active")
  }
}
```

#### Phase 3: File-based Backup (See Feature 3)

Write contract to `.goost/active-contract.md` as belt-and-suspenders backup.

#### Effort Estimate: 4 hours

- 30 min: Add instructions
- 2 hours: Implement compaction hook
- 1 hour: Testing compaction scenarios
- 30 min: Edge cases (contract voided, etc.)

---

## Feature 3: Contract Persistence (File-based)

### What It Is

Write the active contract to a file (`.goost/active-contract.md`) so it survives:
- Session crashes
- Manual session restarts
- OpenCode restarts
- Compaction failures

Claude Code has session resume capability. OhMyOpenCode has session recovery.

### Why It's Valuable for Goost

**Medium-High**: Provides durability beyond in-memory state.

Scenarios this helps:
- OpenCode crashes mid-task → restart → contract auto-loaded
- User accidentally closes terminal → resume → contract intact
- Long task spans multiple days → contract persists

Without this, contracts only exist in conversation history, which may be:
- Compacted beyond recognition
- Lost in crash
- Difficult to find in long sessions

### Feasibility in OpenCode

**Rating: Easy (File I/O is straightforward)**

Plugins have access to filesystem via the shell (`$`) and can write files directly.

### Implementation Plan

#### Phase 1: Slash Command Writes Contract

Modify `.opencode/command/contract.md` to instruct agent to write file:

```markdown
### Step 4: Persist Contract

After user confirms, create a persistence file:

1. Create `.goost/` directory if it doesn't exist
2. Write the contract to `.goost/active-contract.md`:

\`\`\`bash
mkdir -p .goost
cat > .goost/active-contract.md << 'EOF'
[CONTRACT CONTENT HERE]
EOF
\`\`\`

3. Confirm: "Contract persisted to `.goost/active-contract.md`"
```

#### Phase 2: Auto-load on Session Start

Add to `goost_instructions.md`:

```markdown
## Contract Recovery on Session Start

At the beginning of a new session, check for existing contracts:

1. Check if `.goost/active-contract.md` exists
2. If found, read and display: "Found existing contract. Resuming..."
3. Re-output the contract and current status
4. Ask: "Continue with this contract, or start fresh?"

This ensures contracts survive session restarts.
```

#### Phase 3: Plugin-based Auto-detection

```typescript
// On session start, check for contract file
event: async (input) => {
  if (input.event.type === "session.created" || input.event.type === "session.idle") {
    // Check for .goost/active-contract.md
    // If exists and no contract in memory, flag for attention
  }
}
```

#### Phase 4: Cleanup on Completion

When contract is FULFILLED or VOIDED:
- Archive to `.goost/contracts/YYYY-MM-DD-HH-MM-objective.md`
- Remove `active-contract.md`

#### Effort Estimate: 3 hours

- 30 min: Update slash command
- 1 hour: Add instructions for recovery
- 1 hour: Plugin auto-detection
- 30 min: Cleanup/archive logic

---

## Feature 4: Sub-agent Completion Tracking

### What It Is

When the agent spawns sub-agents via the `task` tool, track their lifecycle:
- Task started → update status to 🌕 Moon (waiting)
- Task completed successfully → process results, update status
- Task failed → detect and handle gracefully

Claude Code has `SubagentStop` event. OhMyOpenCode tracks background tasks.

### Why It's Valuable for Goost

**Medium**: Improves accuracy of status indicators and prevents zombie waits.

Current gap:
- Plugin shows 🌕 after task tool call
- But doesn't know WHEN sub-agent returns
- May show wrong status for extended periods

With tracking:
- More accurate status transitions
- Detect sub-agent failures
- Update contract criteria based on sub-agent results

### Feasibility in OpenCode

**Rating: Easy (Existing hooks sufficient)**

OpenCode's plugin API has:
- `tool.execute.before` - we use this
- `tool.execute.after` - we use this

The `task` tool calls complete when the sub-agent returns, so `tool.execute.after` fires when done.

Current implementation already handles this! But we can enhance:

```typescript
"tool.execute.after": async (input, output) => {
  if (input.tool === "task") {
    // Currently just shows 🌕
    // Could instead:
    // 1. Parse output.output for success/failure
    // 2. Update criteria if sub-agent reports completion
    // 3. Detect doom loops in sub-agents
  }
}
```

### Implementation Plan

#### Phase 1: Track Multiple Sub-agents

```typescript
// State
let pendingSubagents: Map<string, { description: string; started: number }> = new Map()

"tool.execute.before": async (input, output) => {
  if (input.tool === "task") {
    pendingSubagents.set(input.callID, {
      description: output.args?.description || "Sub-agent",
      started: Date.now()
    })
    updateTitle() // Shows "🌕 Waiting (1 pending)"
  }
}

"tool.execute.after": async (input, output) => {
  if (input.tool === "task") {
    pendingSubagents.delete(input.callID)
    
    // Check for failure indicators
    const failed = output.output?.includes("error") || output.output?.includes("failed")
    if (failed) {
      // Mark as potential doom loop contributor
    }
    
    // If no more pending, return to work state
    if (pendingSubagents.size === 0) {
      currentIcon = STATUS_EMOJIS.rocket
      currentStats = "Working"
    } else {
      currentStats = `Waiting (${pendingSubagents.size} pending)`
    }
    updateTitle()
  }
}
```

#### Phase 2: Sub-agent Timeout Detection

```typescript
// Periodically check for stuck sub-agents
setInterval(() => {
  const now = Date.now()
  for (const [callID, info] of pendingSubagents) {
    const elapsed = now - info.started
    if (elapsed > 5 * 60 * 1000) { // 5 minutes
      console.log(`[Goost] Sub-agent may be stuck: ${info.description}`)
      // Could update status to show warning
    }
  }
}, 60000)
```

#### Phase 3: Sub-agent Criteria Updates

Add to instructions:

```markdown
## Sub-agent Results and Criteria

When a sub-agent completes a task related to a contract criterion:

1. Parse the sub-agent's output for success/failure
2. If successful and criterion is met, update status: `[x]`
3. If failed, document the failure and consider doom loop detection
4. Always update the contract status block after sub-agent returns
```

#### Effort Estimate: 2 hours

- 30 min: Enhance tracking in plugin
- 30 min: Add timeout detection
- 30 min: Add instructions
- 30 min: Testing

---

## Implementation Priority Order

### Phase 1: Immediate (Prompt-based, no code changes)

1. **Context Window Anxiety Management** - Add instructions
2. **Compaction Recovery** - Add instructions
3. **Contract Persistence** - Update slash command to write file

**Time: 2-3 hours**

### Phase 2: Core Plugin Enhancements

1. **Compaction Preservation Hook** - `experimental.session.compacting`
2. **Context Window Detection** - Token monitoring
3. **Sub-agent Tracking** - Enhanced state management

**Time: 4-5 hours**

### Phase 3: Polish

1. **Contract File Auto-detection** - Session start check
2. **Contract Archival** - On completion
3. **Sub-agent Timeout Warnings** - Stuck detection

**Time: 2-3 hours**

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| `experimental.session.compacting` hook may change | Keep fallback instructions-based approach |
| Token counts not exposed in all contexts | Use heuristics + behavioral detection |
| File writes may fail in read-only contexts | Graceful degradation, warn user |
| Sub-agent tracking adds complexity | Keep state simple, clear on session end |

---

## Success Metrics

After implementation, measure:

1. **Contract survival rate after compaction** - Should be 100%
2. **Premature completion rate** - Should decrease significantly
3. **Sub-agent status accuracy** - Status should match actual state
4. **Session recovery rate** - Contracts should survive restarts

---

## Next Steps

1. Review and approve this plan
2. Implement Phase 1 (prompt-based, immediate value)
3. Test Phase 1 in real usage
4. Implement Phase 2 (core plugin work)
5. Iterate based on findings
