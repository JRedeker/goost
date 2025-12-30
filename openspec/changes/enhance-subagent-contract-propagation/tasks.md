# Tasks: Enhance Sub-Agent Contract Propagation

## 1. Instructions Updates

### 1.1 Contract Context Enforcement
- [ ] 1.1.1 Add "Contract Context Enforcement" section to `goost_instructions.md`
- [ ] 1.1.2 Define required Contract Context Block format
- [ ] 1.1.3 Add self-check questions before spawning sub-agents
- [ ] 1.1.4 Document consequences of missing context

### 1.2 Parallel Sub-Agent Orchestration
- [ ] 1.2.1 Add "Parallel Sub-Agent Orchestration" section
- [ ] 1.2.2 Define Sub-Agent Dispatch Plan table format
- [ ] 1.2.3 Add non-overlapping scope requirements
- [ ] 1.2.4 Define coordination context for sibling awareness
- [ ] 1.2.5 Add merge results protocol
- [ ] 1.2.6 Define status block format for parallel work

### 1.3 Failure Escalation Protocol
- [ ] 1.3.1 Add "Sub-Agent Failure Escalation" section
- [ ] 1.3.2 Define failure detection criteria
- [ ] 1.3.3 Add failure tracking table format
- [ ] 1.3.4 Define escalation thresholds (1, 2, 3 failures)
- [ ] 1.3.5 Add doom loop trigger on 3rd failure
- [ ] 1.3.6 Define retry with escalating context pattern

### 1.4 Timeout Handling
- [ ] 1.4.1 Add "Sub-Agent Timeout Handling" section
- [ ] 1.4.2 Define timeout thresholds by sub-agent type
- [ ] 1.4.3 Add recovery options for stuck sub-agents
- [ ] 1.4.4 Add prevention tips for scoping tasks

### 1.5 Conflict Resolution
- [ ] 1.5.1 Add "Criteria Conflict Resolution" section
- [ ] 1.5.2 Define conflict types (evidence, implementation, scope)
- [ ] 1.5.3 Add resolution protocol for each type
- [ ] 1.5.4 Define `[?]` status marker for unresolved conflicts
- [ ] 1.5.5 Add prevention guidance (clear scope boundaries)

## 2. Plugin Enhancements

### 2.1 Sub-Agent Registry
- [ ] 2.1.1 Define `SubAgentInfo` interface with criterion tracking
- [ ] 2.1.2 Create `activeSubAgentRegistry` Map
- [ ] 2.1.3 Extract criterion from sub-agent prompt in `tool.execute.before`
- [ ] 2.1.4 Update title to show registry count

### 2.2 Failure Tracking
- [ ] 2.2.1 Define `SubAgentFailureTracker` interface
- [ ] 2.2.2 Create `failureTracker` Map by criterion
- [ ] 2.2.3 Detect failures in `tool.execute.after`
- [ ] 2.2.4 Increment failure count per criterion
- [ ] 2.2.5 Trigger doom loop state on 3rd failure
- [ ] 2.2.6 Log failure patterns for debugging

### 2.3 Timeout Detection
- [ ] 2.3.1 Define timeout threshold constants
- [ ] 2.3.2 Implement periodic timeout check interval
- [ ] 2.3.3 Log warnings for exceeded thresholds
- [ ] 2.3.4 Consider warning UI state (optional)

### 2.4 Contract Context Detection (Optional)
- [ ] 2.4.1 Check sub-agent prompts for contract context
- [ ] 2.4.2 Log warning if context missing when contract active
- [ ] 2.4.3 Consider injecting reminder (if feasible)

## 3. Documentation

### 3.1 Update README
- [ ] 3.1.1 Add sub-agent handling section to README
- [ ] 3.1.2 Document new plugin capabilities

### 3.2 Update CLAUDE.md
- [ ] 3.2.1 Add sub-agent contract propagation notes for agents

## 4. Testing & Verification

### 4.1 Plugin Unit Tests
- [ ] 4.1.1 Create test file `plugin/index.test.ts`
- [ ] 4.1.2 Test `SubAgentInfo` interface creation and registry operations
- [ ] 4.1.3 Test failure tracking increment logic
- [ ] 4.1.4 Test doom loop trigger on 3rd failure
- [ ] 4.1.5 Test timeout threshold detection
- [ ] 4.1.6 Mock `tool.execute.before` and `tool.execute.after` hooks

### 4.2 Manual Verification Checklist
- [ ] 4.2.1 Verify sub-agent prompt includes contract context (inspect prompt)
- [ ] 4.2.2 Verify failure count increments per criterion (check debug logs)
- [ ] 4.2.3 Verify doom loop triggers after 3 failures (observe `[GOOST:DOOM_LOOP]` marker)
- [ ] 4.2.4 Verify timeout warning appears after threshold (observe logs)
- [ ] 4.2.5 Verify `[?]` conflict marker displays correctly in status block
- [ ] 4.2.6 Verify parallel dispatch plan is created before multi-agent spawn

### 4.3 Integration Verification
- [ ] 4.3.1 End-to-end test: spawn sub-agent with contract active
- [ ] 4.3.2 End-to-end test: trigger doom loop via 3 failures
- [ ] 4.3.3 End-to-end test: parallel sub-agents with conflict resolution
