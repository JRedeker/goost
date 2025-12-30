# Tasks: Enhance Sub-Agent Contract Propagation

## 1. Instructions Updates

### 1.1 Contract Context Propagation
- [x] 1.1.1 Update "Contract-Aware Sub-Agent Prompts" section in `goost_instructions.md`
- [x] 1.1.2 Add guidance that context is SHOULD not MUST (flexible)
- [x] 1.1.3 Document what to include: objective, criterion, constraints, expected evidence

### 1.2 When to Use Sub-Agents
- [x] 1.2.1 Add "When to Use Sub-Agents" decision guidance
- [x] 1.2.2 Add "Do NOT use sub-agents when" counter-guidance

### 1.3 Parallel Sub-Agent Coordination
- [x] 1.3.1 Add guidance for ensuring non-overlapping scope
- [x] 1.3.2 Add guidance for merging results and checking conflicts

### 1.4 Failure Escalation Protocol
- [x] 1.4.1 Add "Sub-Agent Failure Escalation" section
- [x] 1.4.2 Define 3-strike rule leading to doom loop
- [x] 1.4.3 Add guidance for adjusting prompts between retries

### 1.5 Tight Task Scoping
- [x] 1.5.1 Add examples of good vs bad task scoping
- [x] 1.5.2 Emphasize narrow, focused tasks

### 1.6 Conflict Resolution
- [x] 1.6.1 Add `[?]` marker for unresolved conflicts
- [x] 1.6.2 Document resolution protocol

### 1.7 Documentation Verification
- [x] 1.7.1 Add lightweight reminder template for implementation sub-agents
- [x] 1.7.2 Document that sub-agents have full MCP access (Context7, etc.)
- [x] 1.7.3 Add example prompt snippet

## 2. Plugin Enhancements

Note: Plugin changes are minimal. Failure tracking and doom loop are **agent behaviors** defined in instructions, not plugin automation. This avoids duplicating OpenCode's existing capabilities.

### 2.1 Failure Logging (Debug Only)
- [x] 2.1.1 Improve failure detection logging in `tool.execute.after` (debug mode only)
- [x] 2.1.2 Log sub-agent description/prompt summary on failure for debugging

### 2.2 Contract Context Detection (Optional - Debug Only)
- [x] 2.2.1 Log warning if sub-agent prompt appears to lack contract context when contract active (debug mode only)

## 3. Documentation

### 3.1 Update README
- [x] 3.1.1 Add sub-agent handling section to README
- [x] 3.1.2 Document failure tracking behavior

## 4. Testing & Verification

### 4.1 Manual Verification Checklist
- [x] 4.1.1 Verify sub-agent prompt includes contract context (inspect prompt)
- [x] 4.1.2 Verify failure count increments per criterion
- [x] 4.1.3 Verify doom loop triggers after 3 failures
- [x] 4.1.4 Verify `[?]` conflict marker displays correctly
