---
name: openspec-research
description: Research and validate architectural decisions in an OpenSpec spec using sub-agents
agent: build
---
The user has requested architectural research and validation for the following spec. Use sub-agents to thoroughly research and validate the design decisions.
<UserRequest>
  $ARGUMENTS
</UserRequest>

**Your Role**: You are a research coordinator that spawns multiple sub-agents to validate architectural decisions in OpenSpec specifications through authoritative documentation and industry best practices.

**Target Resolution Protocol (State-Changing - Updates Files)**

Determine the target (spec OR change):

1. **If $ARGUMENTS is provided and non-empty**: Use it directly
   - If it matches a spec name (e.g., "contract-system"), treat as spec
   - If it matches a change ID (e.g., "add-feature"), treat as change
   - If ambiguous, ask for clarification
2. **If $ARGUMENTS is empty or no target found**:
   a. Run `openspec list` and `openspec list --specs` in parallel
   b. If exactly one candidate exists (1 change OR 1 spec):
      - Use `mcp_question` to confirm:
        ```
        header: "Confirm"
        question: "Research '<target>' (<type>)?"
        options: "Yes (Recommended)", "Cancel"
        ```
      - If user cancels, stop execution
   c. If multiple candidates exist (changes AND/OR specs):
      - Use `mcp_question` to present selection with type labels:
        ```
        header: "Select"
        question: "What would you like to research?"
        options:
          - "[change] <change-id> - <task progress>"
          - "[spec] <capability-name> - <requirements count> requirements"
        ```
      - Proceed with user's selection
   d. If no candidates exist:
      - Display: "No specs or changes found"
      - Suggest: "Run `/openspec-proposal` or create specs"
      - Stop execution
3. **If target provided but not found**:
   - Display: "Target '<target>' not found"
   - Suggest: "Run `openspec list` and `openspec list --specs`"
   - Stop execution

**Step 1: Identify the Target Spec**

If target was resolved above, skip to Step 2. If still ambiguous or you need additional clarification, proceed.

Parse the user's request to identify the target spec path. Expected formats:
- `openspec/specs/<capability>/spec.md` (full path)
- `<capability>/spec.md` (relative to openspec/specs/)
- `<capability>` (just the capability name)

If ambiguous, list available specs using `openspec list --specs` and ask for clarification.

**Step 2: Read and Analyze the Spec**

Read the target spec file and extract:
1. **Architectural decisions** mentioned in requirements or scenarios
2. **Technologies/libraries** referenced (explicit or implicit)
3. **Design patterns** described in behavior
4. **Integration points** with external systems
5. **Performance/security assumptions** stated or implied

If the spec has a `design.md` file, read that as well for explicit architectural context.

**Step 3: Generate Research Questions**

For each architectural decision identified, formulate specific research questions:

**Technology Validation:**
- "Is [library/framework] the current best practice for [use case]?"
- "What are the documented patterns for [specific implementation]?"
- "Are there security considerations for [technology choice]?"

**Pattern Validation:**
- "Is [pattern name] appropriate for [context]?"
- "What are the trade-offs of [approach] vs alternatives?"
- "How does [library] recommend implementing [behavior]?"

**Integration Validation:**
- "What is the documented way to integrate [system A] with [system B]?"
- "Are there known compatibility issues between [tech A] and [tech B]?"

**Performance/Scale Validation:**
- "What are the performance characteristics of [approach]?"
- "How does [solution] scale to [expected usage]?"

**Simplicity/Complexity Analysis:**
- "Could [approach] be simplified without sacrificing the acceptance criteria?"
- "Is there a simpler, more maintainable pattern that achieves the same requirements?"
- "Are we over-engineering [solution] for the actual use case?"
- "What's the simplest proven approach for [requirement]?"
- "Does [library/framework] provide built-in functionality that eliminates custom implementation?"

**Step 4: Spawn Research Sub-Agents**

For EACH research question, spawn a dedicated sub-agent using the Task tool. Design your sub-agent prompts to:

1. **Use Context7 for library/framework research:**
   - Resolve the library ID using `resolve-library-id`
   - Fetch documentation using `get-library-docs` with appropriate mode ('code' for APIs, 'info' for concepts)
   - Focus on official best practices, recommended patterns, and security considerations

2. **Use web search for industry practices:**
   - Search for "[technology] best practices [year]"
   - Look for architectural comparisons and trade-off analyses
   - Find real-world case studies and production experiences

3. **Structured research output:**
   Each sub-agent MUST return findings in this format:
   ```
   RESEARCH QUESTION: [the question]
   
   FINDINGS:
   - [key finding 1 with source]
   - [key finding 2 with source]
   
   VALIDATION RESULT: ✅ VALIDATED | ⚠️ CONCERNS | ❌ ANTI-PATTERN
   
   RECOMMENDATION:
   [specific actionable recommendation]
   
   SOURCES:
   - [source 1 with URL/reference]
   - [source 2 with URL/reference]
   ```

**Sub-Agent Prompt Template:**

```
Research and validate the following architectural decision:

QUESTION: [specific research question]

CONTEXT FROM SPEC:
[relevant excerpt from spec showing the decision]

YOUR TASK:
1. Use Context7 to look up authoritative documentation for [technology/pattern]
2. Use web search to find current best practices and industry consensus
3. Identify any red flags, anti-patterns, or security concerns
4. Evaluate if a simpler approach could achieve the same acceptance criteria
5. Provide a clear validation result and specific recommendation

Return your findings in the structured format specified above.
```

**Step 5: Spawn Sub-Agents in Parallel**

Use a SINGLE response with MULTIPLE Task tool calls to spawn all research sub-agents in parallel for maximum efficiency.

Example:
```
I'm spawning [N] research sub-agents to validate different aspects of the spec:

1. Sub-agent for [technology choice validation]
2. Sub-agent for [pattern appropriateness]
3. Sub-agent for [integration approach]
...
```

Then make N Task tool calls in the same response.

**Step 6: Synthesize Research Results**

> **CRITICAL: Anti-Loop Protocol**
>
> After receiving sub-agent results, you MUST:
> 1. Output exactly: `>>> SYNTHESIS COMPLETE - GENERATING REPORT <<<`
> 2. **Immediately** write the structured report below
> 3. Proceed directly to the report—skip prose summaries of sub-agent findings
>
> **Loop check**: If you're writing "I received results from..." or re-stating the synthesis plan, you're in a planning loop. Write the report structure directly.

After all sub-agents complete, synthesize their findings into a comprehensive research report:

```markdown
# Architecture Research Report: [Capability Name]

## Summary
[2-3 sentence overview of validation results]

## Validated Decisions ✅
[Architectural choices that are confirmed as best practices]

## Simplification Opportunities 🎯
[Simpler approaches that achieve the same acceptance criteria]

## Concerns Identified ⚠️
[Decisions that have trade-offs or require attention]

## Anti-Patterns Found ❌
[Decisions that contradict best practices - requires revision]

## Detailed Findings

### [Decision Area 1]
**Current Spec Decision:** [what the spec says]
**Research Findings:** [synthesized findings from sub-agents]
**Simplicity Analysis:** [could this be simpler? what's the simplest proven approach?]
**Recommendation:** [specific action item]
**Sources:** [consolidated source list]

### [Decision Area 2]
...

## Action Items
- [ ] [Specific change needed based on research]
- [ ] [Simplification to consider]
- [ ] [Additional investigation required]
- [ ] [Documentation to add]

## Confidence Assessment
- High Confidence: [aspects with strong validation]
- Medium Confidence: [aspects with mixed signals]
- Low Confidence: [aspects needing more research]
```

**Step 7: Determine Research Scope**

Identify which type of OpenSpec artifact you're researching:

**A. Active Spec** (`openspec/specs/<capability>/spec.md`)
- Currently deployed/implemented capability
- Changes require creating a new change proposal

**B. Active Change** (`openspec/changes/<change-id>/`)
- In-progress proposal not yet implemented
- Can update directly: `proposal.md`, `design.md`, `tasks.md`, spec deltas

If the user provided a capability name that exists in BOTH locations, ask for clarification:
```
Found both an active spec and an active change for '[capability]':
- Active spec: openspec/specs/[capability]/spec.md
- Active change: openspec/changes/[change-id]/specs/[capability]/spec.md

Which would you like to research and update?
1. The deployed spec (will create a new change proposal for updates)
2. The in-progress change (will update directly)
```

**Step 8: Apply Research Findings**

Based on the research scope, apply updates automatically:

### A. For Active Specs (Deployed Capabilities)

If research identifies issues requiring changes:

1. **Create a change proposal** based on research findings:
   - Choose a unique `change-id` like `harden-[capability]` or `refactor-[capability]-[aspect]`
   - Scaffold: `openspec/changes/<change-id>/proposal.md`, `tasks.md`, `design.md` (if needed)

2. **Write proposal.md**:
   ```markdown
   # Change: [Brief description based on research findings]
   
   ## Why
   Research identified [list concerns/anti-patterns] in the current [capability] implementation.
   
   ## What Changes
   - [Specific change based on research recommendation 1]
   - [Specific change based on research recommendation 2]
   
   ## Impact
   - Affected specs: [capability]
   - Affected code: [files identified in spec]
   
   ## Research References
   - [Source 1 from research]
   - [Source 2 from research]
   ```

3. **Create spec deltas** in `specs/<capability>/spec.md`:
   - Use `## MODIFIED Requirements` for updated requirements
   - Use `## ADDED Requirements` for new best-practice requirements
   - Use `## REMOVED Requirements` for deprecated anti-patterns
   - Include research sources in requirement descriptions

4. **Write tasks.md** with implementation steps derived from research recommendations

5. **Create design.md** if research revealed:
   - Alternative architectural approaches to consider
   - Trade-off analyses from documentation
   - Migration complexity or breaking changes

### B. For Active Changes (In-Progress Proposals)

If research identifies issues in an active change, update directly:

1. **Update proposal.md**:
   - Add a `## Research Validation` section
   - Document which decisions were validated ✅ and which have concerns ⚠️/❌
   - Add research sources to support changes

2. **Update design.md** (create if missing when research reveals architectural concerns):
   - Add `## Research Findings` section
   - Document best practices discovered
   - Add trade-off analyses from authoritative sources
   - Include migration considerations if pattern changes required

3. **Update spec deltas** in `specs/<capability>/spec.md`:
   - Revise requirements based on research findings
   - Add scenarios for edge cases discovered in documentation
   - Update technology references to align with best practices
   - Cite sources in comments: `<!-- Source: [library docs URL] -->`

4. **Update tasks.md**:
   - Revise implementation steps to match researched best practices
   - Add validation tasks: "Verify [approach] matches [library] documentation"
   - Add new tasks for concerns identified: "Address [security concern] per [source]"
   - Reorder tasks if research revealed better sequencing

**Step 9: Summarize Updates**

After applying updates, provide a clear summary:

```markdown
## Research Complete ✅

### Files Updated:
- [List all files modified with brief description of changes]

### Key Changes Made:
1. **[Change category]**: [What was updated and why based on research]
2. **[Change category]**: [What was updated and why based on research]

### Next Steps:
- [ ] Review updated [proposal/spec/design] for accuracy
- [ ] [Additional validation if needed]
- [ ] [Approval step if creating new change]
```

**Important Constraints:**

1. **Always use Context7 first** for library/framework validation before web search
2. **Spawn sub-agents in parallel** - use a single message with multiple Task calls
3. **Demand structured output** from sub-agents for easy synthesis
4. **Cite sources** for every claim in the final report
5. **Be specific** - vague "looks good" is not acceptable; identify concrete validation points
6. **Flag uncertainties** - if research is inconclusive, say so explicitly
7. **Actionable recommendations** - every concern must have a suggested resolution
8. **Always update files** - research without application is incomplete
9. **Preserve existing content** - only modify sections related to research findings
10. **Document research sources** - add source citations in updated files
11. **Question complexity** - actively search for simpler alternatives that meet the same acceptance criteria
12. **Prefer boring solutions** - recommend proven, simple patterns over novel complex ones unless complexity is justified

**Example Invocation:**

```
User: /openspec-research contract-system
Agent: Reading openspec/specs/contract-system/spec.md...
Agent: Identified 6 architectural decisions to validate:
1. Git commit automation approach
2. Conventional commit message derivation
3. Sub-agent contract context propagation
4. Failure escalation protocol
5. OSC escape sequence usage for terminal integration
6. Simplicity: Could the contract state management be simpler?

Spawning 6 research sub-agents in parallel...
[Makes 6 Task tool calls in one response]
[Waits for results]
[Synthesizes findings]
[Creates change proposal with spec deltas based on findings]
[Updates tasks.md with researched implementation steps]

## Research Complete ✅

Created change proposal: openspec/changes/harden-contract-system/
- Added OSC escape sequence fallback handling per terminal compatibility research
- Updated git commit approach to match conventional-commits specification
- Added sub-agent failure recovery patterns from distributed systems best practices
- SIMPLIFIED: Replaced custom state serialization with built-in JSON.stringify (reduces code by 40 lines)
```

**Output:**

1. Present the synthesized research report to the user
2. Show which files were updated and why
3. Highlight any critical concerns requiring immediate attention
4. Provide clear next steps for the user
