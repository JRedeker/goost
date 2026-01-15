## Context
The "Ralph Wiggum Loop" is an autonomous iteration pattern. Current OpenCode agents often stop and ask for clarification or help when a command fails (e.g., `npm test` fails). For many coding tasks, the agent can fix the error by just looking at the log and trying again.

## Goals
- Automate the fix-and-retry cycle for implementation tasks.
- Provide a "hands-off" experience for users applying OpenSpec changes.
- Prevent infinite loops using a retry budget.

## Decisions

### 1. New Command /openspec-ralph
Instead of modifying `/openspec-apply` and potentially surprising users with increased token usage or longer autonomous runs, we introduce a new command. This allows users to opt-in to the more "aggressive" autonomous behavior.

### 2. The Wiggum Protocol (Autonomous Fix Cycle)
The command instructions will explicitly direct the agent to:
1. Run the verification command (test/build).
2. If it fails, do NOT report back immediately.
3. Read the logs, analyze the error, apply a fix.
4. Retry the verification.
5. Limit this to 3 autonomous retries per task.

### 3. Stagnation Detection
If the retry budget (3) is exhausted, the agent MUST stop and report:
- What it tried.
- Why it thinks it's stuck.
- Request user guidance.

### 4. Global Final Loop
The `/openspec-ralph` command will require a final global verification (all tests, full build) at the end of the implementation phase. This ensures that individual task fixes haven't broken other parts of the system.

## Risks / Trade-offs
- **Token Usage**: Autonomous loops can consume significantly more tokens if the agent struggles with a complex bug.
- **Latency**: The user might wait longer for a response as the agent iterates in the background.
- **Complexity**: The agent might "hallucinate" fixes or drift from the original design if left unchecked for too many iterations. The budget of 3 is a conservative guardrail.

## Open Questions
- Should we use the `[GOOST:DOOM_LOOP]` indicator during retries?
- *Decision*: Yes, it provides excellent visual feedback that the agent is currently in an autonomous retry phase.

## Research Validation

### ✅ Validated Decisions

**1. Retry Budget of 3** - VALIDATED
- Aligns with Reflexion agent patterns (OxyGent uses exactly 3 iterations)
- Industry standard for LangChain ToolRetryMiddleware: `max_retries=3`
- Appropriate for hallucination prevention concerns
- Sources: LangChain docs, NVIDIA Agent Toolkit, OxyGent reflexion implementation

**2. Visual Feedback Approach** - VALIDATED
- OSC escape sequences for tab titles are the standard, widely-supported method (since xterm X11R4, 1989)
- Inline `[GOOST:DOOM_LOOP]` markers provide persistence in logs/non-TTY contexts
- Dual approach ensures visibility in ALL contexts (terminal, logs, CI, piped output)
- Sources: XTerm Control Sequences spec, Windows Terminal docs, existing Goost terminal.ts

**3. Opt-in via Separate Command** - VALIDATED (with concerns)
- Follows "pit of success" design principle - aggressive behavior requires explicit opt-in
- Consistent with codebase precedent (`/contract` vs `/contract-quick`)
- Valid concern: Users should not be surprised by increased token usage
- Sources: Rico Mariani/Brad Abrams "Pit of Success" principle

### ⚠️ Concerns Identified

**1. Command Duplication Risk**
- `/openspec-apply.md` is 158 lines of complex logic (Target Resolution Protocol, RSTC Protocol, etc.)
- Duplicating creates maintenance burden - changes to base won't automatically propagate
- **Mitigation**: Add sync warning header; consider shared template extraction in future

**2. Missing Incremental Verification**
- Current spec only mandates full verification at END of implementation
- "Shift-left" testing principle recommends early feedback
- **Mitigation**: Add incremental verification during task completion (typecheck, affected tests)
- Sources: Martin Fowler "Continuous Integration", Nx affected pattern

**3. Missing Error Classification**
- Spec treats all failures identically (3 retries then stop)
- Research shows different error types need different strategies:
  - TRANSIENT (network/flaky): retry with backoff
  - SEMANTIC (type error/logic bug): analyze and fix
  - ENVIRONMENTAL (missing dep): escalate immediately
- **Mitigation**: Add error classification phase before retry
- Sources: LangGraph error handling, RAGFlow error classification

**4. Missing Explicit Reflection Step**
- Reflexion research (Shinn et al., 2023) shows agents perform better when they verbalize diagnosis
- Current spec implies analysis but doesn't mandate articulation
- **Mitigation**: Require agent to state diagnosis before applying fix
- Sources: arXiv:2303.11366 (Reflexion paper)

### 🎯 Simplification Opportunities

**Alternative A: Minimal Change (Recommended if full feature not needed)**
- Modify existing doom loop behavior in `/contract.md` (~10 lines change)
- Add: "Before stopping, attempt ONE alternative approach autonomously"
- No new command, protocol naming, or contract format changes needed

**Alternative B: Flag-Based Extension**
- Add `--auto-retry=3` flag to existing `/openspec-apply`
- Keeps code DRY, single source of truth
- Users learn it's a variant, not separate workflow

**Decision**: Proceed with separate command (Alternative C) because:
1. Autonomous retry significantly changes UX expectations
2. Token usage implications warrant explicit opt-in
3. Matches codebase conventions
4. Research validates the retry mechanics themselves

### Research Sources
- LangChain AgentExecutor: github.com/langchain-ai/langchain (max_iterations=15)
- LangGraph RetryPolicy: github.com/langchain-ai/langgraph
- Reflexion paper: arXiv:2303.11366 (Shinn et al., 2023)
- NVIDIA ReAct Agent: docs.nvidia.com/aiqtoolkit
- Martin Fowler CI: martinfowler.com/articles/continuousIntegration.html
- XTerm Control Sequences: invisible-island.net/xterm/ctlseqs
- Pit of Success: blog.codinghorror.com/falling-into-the-pit-of-success
