RESEARCH QUESTION: Is the Set-based deduplication approach (tracking findings by "file:line:type" key) appropriate for preventing redundant analysis in parallel AI agent workflows?

FINDINGS:

1. **SIMPLICITY IS A STRENGTH FOR THIS USE CASE**
   - The `file:line:type` key format aligns with industry patterns for issue tracking (GitHub issues, static analyzers, code scanners)
   - LangGraph and similar agent frameworks use similar memory-based deduplication for stateless agents
   - The design document explicitly rejects semantic deduplication as "too complex for current scope" - this is a reasonable trade-off for initial implementation

2. **THE APPROACH IS CONSISTENT WITH COMMAND-LEVEL DEDUPLICATION**
   - Both `openspec-review.md` and `openspec-audit.md` include explicit deduplication steps in synthesis phases (lines 435-441 in openspec-review.md, lines 515-519 in openspec-audit.md)
   - The commands are already designed to handle deduplication at the aggregation layer
   - Plugin-level deduplication provides an additional guardrail, not the primary mechanism

3. **EDGE CASES IDENTIFIED WHERE SIMPLE KEY FAILS:**
   - **Multi-line issues**: A finding spanning lines 100-110 would only be deduplicated if reported exactly at line 100
   - **Same issue, different severities**: One agent reports "HIGH" and another "CRITICAL" for the same issue - both would be kept (potentially correct behavior for reporting)
   - **Refactoring scenarios**: Code moves from line 50 to line 75 - duplicate detection fails, but new findings are appropriate
   - **Different tooling precision**: One agent reports line 42, another reports line 43 for the same logical issue

4. **COMPARISON TO ALTERNATIVE APPROACHES:**
   - **Semantic deduplication** (e.g., embedding-based similarity): More accurate but requires vector store, significantly more complex, rejected in design.md
   - **Fuzzy line matching** (e.g., line +/- 2): Would catch refactoring but increases false positive risk
   - **Hash-based content deduplication**: Would miss renamed variables with same logic
   - **The current approach is simpler than all alternatives** and adequate for the stated goal of "preventing multiple sub-agents from reporting the same issue"

5. **RESEARCH ON MULTI-AGENT DEDUPLICATION:**
   - The "More Agents Is All You Need" paper (arXiv:2402.05120) shows that sampling-and-voting with multiple agents inherently produces duplicates that require deduplication
   - LangChain/LangGraph documentation emphasizes checkpoint-based memory rather than complex deduplication for agent coordination
   - Industry practice (GitHub Dependabot, Snyk, ESLint) uses simple key-based deduplication at the reporting layer

6. **DESIGN DOCUMENT SHOWS AWARENESS OF LIMITATIONS:**
   - Trade-offs explicitly listed: "Same issue reported at different severity counts as duplicate"
   - Alternative was considered and deliberately rejected
   - Design acknowledges "Requires coordination across sub-agents"

VALIDATION RESULT: ⚠️ CONCERNS

The approach is APPROPRIATE for the stated goal with the following caveats:

**Strengths:**
- Simple, implementable, maintainable
- Consistent with command-level deduplication already in place
- Low computational overhead
- Matches patterns used in production static analysis tools

**Concerns:**
1. **Not yet implemented**: The design.md shows the deduplication as proposed but `grep` confirms no `seenFindings` Set exists in the actual plugin code (index.ts, contract.ts, types.ts)
2. **No coordination mechanism**: The design notes "Requires coordination across sub-agents" but doesn't specify how this coordination happens in a stateless plugin environment
3. **Line number fragility**: AI-generated line numbers can vary by +/- 1-3 lines due to context window variations, making exact matching fragile

RECOMMENDATION:

1. **IMPLEMENT AS PROPOSED** - The simple Set-based deduplication is a reasonable starting point and matches industry patterns

2. **ADD FUZZY MATCHING**: Consider line number tolerance (e.g., `Math.abs(finding.line - existing.line) <= 2`) to handle AI precision variation:
   ```typescript
   const isDuplicate = Array.from(seenFindings).some(existing => {
     const [f, l, t] = existing.split(':')
     return f === finding.file && Math.abs(parseInt(l) - finding.line) <= 2 && t === finding.type
   })
   ```

3. **COORDINATION MECHANISM**: Since the plugin is stateless between calls, document that deduplication happens:
   - At command synthesis phase (primary)
   - At plugin layer (secondary guardrail)
   - Not shared across independent command invocations

4. **PRIORITIZE COMMAND-LEVEL DEDUPLICATION**: The existing steps in openspec-review.md and openspec-audit.md are the primary deduplication mechanism. Plugin-level deduplication is a secondary safety net.

SOURCES:
- Goost design document: `/home/jon/dev/plugins/goost/openspec/changes/harden-loop-prevention/design.md` (lines 116-147)
- OpenSpec Review command: `/home/jon/dev/plugins/goost/.opencode/command/openspec-review.md` (lines 435-441)
- OpenSpec Audit command: `/home/jon/dev/plugins/goost/.opencode/command/openspec-audit.md` (lines 515-519)
- "More Agents Is All You Need" (arXiv:2402.05120) - LLM multi-agent sampling and voting research
- LangGraph README - agent coordination and memory patterns (https://github.com/langchain-ai/langgraph)
