# Design: Contract Conversion Mode for /goost-search

## Context

The `/goost-search` command fetches prompts from curated libraries and displays them with security warnings. Currently, using a prompt requires manual copy/paste. This design adds an optional conversion step that transforms the prompt into a structured contract.

## Goals / Non-Goals

**Goals:**
- Seamless flow from prompt discovery to structured implementation
- Extract actionable steps from any prompt type
- Generate contracts that follow existing Goost format
- Preserve user control (opt-in, review before lock)
- **Block malicious prompts from contract conversion entirely**

**Non-Goals:**
- Automatic contract execution (security concern)
- Modifying the prompt content itself
- Supporting prompts that aren't actionable (purely informational)
- Converting prompts from untrusted/arbitrary sources

## Decision 1: Conversion Trigger

**What:** After displaying the prompt, present a question: "Would you like me to convert this into a contract?"

**Why:**
- Opt-in preserves the security model (user reviews before acting)
- Clear user intent prevents accidental contract creation
- Matches the existing friction-as-feature philosophy

**Implementation:**
```
============================================================
To use this prompt:
1. Review the content above carefully
2. Copy the relevant portions manually
3. Adapt to your specific needs

Would you like me to convert this into a contract? [Yes/No]
============================================================
```

Use the `question` tool with two options: "Yes, create a contract" and "No, I'll use it manually"

## Decision 2: Step Extraction Strategy

**What:** Analyze the prompt to identify actionable instructions and convert them to numbered steps.

**Why:**
- Prompts vary widely in structure (narrative, bullet points, role-play instructions)
- Simple line-by-line copying misses the semantic meaning
- AI analysis can group related instructions and identify success criteria

**Extraction Heuristics:**
1. Look for imperative verbs (create, implement, add, ensure, check)
2. Identify conditional logic (if X then Y)
3. Extract constraints (must, never, always, avoid)
4. Group related instructions into logical phases
5. Infer success criteria from instructions (e.g., "add tests" → "tests pass")

**Example Transformation:**

Input prompt:
```
I want you to act as a code reviewer. I will provide code and you will:
1. Check for bugs and logic errors
2. Suggest performance improvements
3. Ensure consistent naming conventions
4. Point out security vulnerabilities
Always explain your reasoning.
```

Extracted contract:
```
OBJECTIVE: Review code and provide comprehensive feedback

SUCCESS CRITERIA:
- [ ] (C1) Identified bugs and logic errors (if any)
- [ ] (C2) Suggested performance improvements (if applicable)
- [ ] (C3) Checked naming conventions for consistency
- [ ] (C4) Identified security vulnerabilities (if any)
- [ ] (C5) All feedback includes clear reasoning

CONSTRAINTS:
- MUST: Explain reasoning for each suggestion
```

## Decision 3: Contract Generation Format

**What:** Generate a draft contract that matches the standard `/contract` format but is marked as a draft.

**Why:**
- Consistency with existing Goost contract system
- Users familiar with contracts know what to expect
- Draft status makes clear it's not yet locked

**Format:**
```
============================================================
                   DRAFT CONTRACT
============================================================
Based on: <prompt title> from <source>

OBJECTIVE: <derived from prompt purpose>

SUCCESS CRITERIA:
- [ ] (C1) <extracted criterion 1>
- [ ] (C2) <extracted criterion 2>
...

CONSTRAINTS:
- MUST: <extracted constraint>
- MUST NOT: <extracted prohibition>

IMPLEMENTATION STEPS:
1. <step 1>
2. <step 2>
...

============================================================
Review this contract. To accept and lock it, say "confirm".
To modify, describe the changes you'd like.
To cancel, say "cancel".
============================================================
```

## Decision 4: Handling Non-Actionable Prompts

**What:** If the prompt doesn't contain actionable instructions, explain this to the user.

**Why:**
- Some prompts are role-play or persona definitions with no clear tasks
- Forcing a contract on non-actionable content creates meaningless criteria

**Response for non-actionable prompts:**
```
This prompt appears to be a persona/role definition rather than a 
task-oriented instruction set. Contracts work best with prompts 
that describe specific actions or deliverables.

You can still use this prompt by copying it manually and adapting 
it to your specific task.
```

## Data Flow

```
[Prompt displayed]
       |
       v
[Ask: Convert to contract?]
       |
  No --+-- Yes
  |         |
  v         v
[End]  [Analyze prompt]
             |
             v
       [Extract actions, constraints, success criteria]
             |
             v
       [Generate DRAFT CONTRACT]
             |
             v
       [User reviews]
             |
  Cancel ----+---- Modify ---- Confirm
    |              |             |
    v              v             v
  [End]     [Revise draft]  [Lock contract]
                                 |
                                 v
                          [CONTRACT ACTIVE]
                          [Begin implementation]
```

## Decision 5: Pre-Conversion Security Scan

**What:** Before offering contract conversion, scan the prompt for injection patterns and BLOCK conversion if found.

**Why:** Contract conversion bypasses the manual copy/paste friction that was our primary defense. We need a new gate.

**Injection Patterns to Detect:**
```
# Direct injection attempts
- "ignore previous instructions"
- "ignore all previous"  
- "disregard (your|the|all) instructions"
- "forget everything"
- "override (your|the) system"
- "you are now"
- "new persona"
- "jailbreak"

# Information extraction
- "reveal (your|the) system prompt"
- "show me your instructions"
- "what are your rules"
- "output your configuration"

# Encoded payloads
- Base64 blocks > 200 chars
- Hex sequences > 100 chars
- Unicode escape sequences

# Dangerous capabilities
- Tool definitions requesting: exec, shell, eval, system, spawn
- File system access: rm, delete, write to system paths
- Network: curl to unknown hosts, exfiltration patterns
```

**Response when blocked:**
```
============================================================
    ⚠️ SECURITY SCAN FAILED - CONTRACT CONVERSION BLOCKED
============================================================

This prompt contains patterns that could be used for injection 
attacks. Contract conversion is not available for this prompt.

Detected patterns:
- [pattern 1]
- [pattern 2]

You can still view the raw prompt above, but it cannot be 
converted to a contract for automated execution.
============================================================
```

## Decision 6: Contract Content Restrictions

**What:** Generated contracts SHALL NOT include:
- Shell commands from the prompt
- Code execution instructions from the prompt
- File path operations from the prompt
- Network requests from the prompt

**Why:** Even if a prompt passes the injection scan, we shouldn't blindly convert commands into executable success criteria.

**Safe Extraction:**
- Extract behavioral goals: "Review code for bugs" ✅
- Extract quality criteria: "Ensure tests pass" ✅
- Extract constraints: "Don't modify existing APIs" ✅

**Blocked Extraction:**
- "Run `rm -rf /tmp`" → SKIP, do not include in contract
- "Execute `curl http://evil.com`" → SKIP
- "Create file at /etc/passwd" → SKIP

## Open Questions

- Should there be a `--contract` flag to skip the prompt and go directly to contract mode?
- Should contract conversion preserve the source URL for reference?
- How should we handle very long prompts (>100 lines) during extraction?

## Research Validation (January 2026)

### Pattern-Based Injection Detection ⚠️ CONCERNS

**Finding:** Pattern-based detection is trivially bypassable and may create false sense of security.

- OWASP LLM01:2025 lists encoding, multilingual attacks, and rephrasing as common bypasses
- Simon Willison: "Working most of the time is just going to turn into a game... they will break it"
- Trail of Bits demonstrated one-shot prompt injection bypassing regex guardrails (Oct 2025)
- OWASP does NOT recommend pattern matching as primary control

**Decision:** KEEP patterns but DOWNGRADE role - it's a "speed bump" not a security guarantee.
- Document as "basic filtering" not "injection protection"
- Primary defense is the source restriction + human review
- Pattern scan is supplementary noise reduction only

**Sources:** OWASP LLM01:2025, Trail of Bits blog, Simon Willison interviews

### Defense-in-Depth Strategy ✅ VALIDATED

**Finding:** The 5-layer approach aligns with OWASP best practices.

| Layer | Spec Design | OWASP Mapping |
|-------|-------------|---------------|
| Source restriction | 2 approved repos | Least Privilege |
| Pattern scanning | Block suspicious | Input Validation |
| Content filtering | Exclude shell cmds | Output Filtering |
| User review | Draft before lock | HITL (PRIMARY) |
| Manual fallback | View raw prompt | Transparency |

**Key insight:** OWASP marks Human-in-the-Loop as PRIMARY defense, not supplementary.
Blocking is preferred over smart filtering (filters can be defeated systematically).

**Sources:** OWASP Prompt Injection Prevention Cheat Sheet, Best-of-N Jailbreaking research

### AI Instruction Extraction ✅ VALIDATED

**Finding:** Draft + Human Review is the established HITL pattern.

- Amazon Science: Specialized models can reliably extract structured data from text
- IBM: HITL achieves "significantly higher accuracy than purely automated systems"
- EU AI Act Article 14 mandates HITL for high-risk systems
- The pattern directly addresses LLM hallucination risks

**Sources:** Amazon Science EMNLP 2024, IBM Think, ACM TOIS hallucination survey

### Draft-Confirm Workflow ✅ VALIDATED

**Finding:** Industry-standard pattern for AI-generated content.

- Microsoft Copilot UX: "Human in control" is Principle #1
- AWS documents "evaluator reflect-refine loop patterns"
- Zapier, Permit.io document HITL as core pattern for agent workflows
- Nielsen Norman Group: Confirmation appropriate for high-stakes actions

**Sources:** Microsoft Learn, AWS Prescriptive Guidance, shapeof.ai pattern library

### Simplification Opportunities 🎯 RECOMMENDED

**Finding:** The design is over-engineered. 37 tasks for 5 acceptance criteria.

**Simplifications applied:**
1. **Single inline security check** instead of separate scanning phase
2. **Natural failure handling** for non-actionable prompts (don't detect, let extraction fail)
3. **Reuse /contract semantics** for confirm/modify flow
4. **Defer edge cases to v2:** Tool definitions, long prompt special handling
5. **Reduce pattern enumeration** to single catch-all regex

**Result:** Reduced from 37 tasks to ~15 tasks.

**Sources:** Internal analysis of tasks.md vs acceptance criteria
