# Design: Pink Elephant Refactoring

## Context

Research shows negative instructions are less effective for LLMs because negation tokens have limited impact on the statistical representations learned during training (Singh et al., 2024; Vrabcová et al., 2025). This is a mechanical limitation, not a psychological phenomenon—the "Pink Elephant" name is a convenient metaphor but the underlying cause is architectural, not cognitive.

**Current state**: Goost uses many negative instructions:
- "Do NOT emit status markers" (12 instances in sub-agent contexts)
- "You CANNOT declare the task complete until..." (completion gates)
- "Do NOT re-explain findings in prose" (anti-loop protocols)
- "Never skip the status block" (behavioral rules)

**Goal**: Improve instruction-following by reframing negatives to positives while preserving semantic intent.

## Goals / Non-Goals

**Goals:**
- Reframe negative instructions to positive equivalents where semantically clear
- Preserve safety-critical boundaries (MUST NOT constraints in contracts)
- Maintain existing command behavior—this is prompt wording only

**Non-Goals:**
- Changing command functionality
- Adding new features
- Modifying the plugin code

## Decisions

### Decision 1: Simplified 2-Rule Approach

Research validation found the original 5-category system was over-engineered. All categories except safety boundaries use the same transformation strategy. Simplified to:

| Rule | Strategy | Example |
|------|----------|---------|
| **Default** | Convert negative → positive | "Do NOT emit markers" → "Return findings directly" |
| **Exception** | Preserve safety constraints | "MUST NOT: Break existing functionality" (keep as-is) |

**Transformation patterns:**
| Pattern | Example |
|---------|---------|
| "Do NOT X" → "Do Y directly" | "Do NOT emit markers" → "Return findings directly" |
| "CANNOT X until Y" → "X when Y" | "CANNOT declare complete until verified" → "Declare complete when all verified" |
| "NEVER X" → "Always Y" | "Never skip status" → "Always include status" |
| "Avoid X" → "Prefer Y" | "Avoid multi-paragraph explanations" → "Pair intent with immediate tool call" |

**Rationale**: The 5 categories (sub-agent context, anti-loop, completion gates, user authority, safety) describe WHERE negatives appear, not HOW to transform them. Only safety boundaries require different treatment.

### Decision 2: Standardize Sub-Agent Context Block

Current (varies across commands):
```markdown
> **SUB-AGENT CONTEXT**: You are running as a sub-agent. Do NOT emit `[GOOST:*]` status markers or CONTRACT STATUS blocks - these only work in the main session and waste your output buffer. Focus on returning useful results directly.
```

Proposed (consistent, positive):
```markdown
> **SUB-AGENT CONTEXT**: Return findings directly. Status markers and CONTRACT STATUS blocks are for main sessions only—omit them to maximize your output buffer.
```

### Decision 3: Reframe Anti-Loop Protocols

Current:
```markdown
> Do NOT re-explain each sub-agent's findings in prose before starting Step 1. If you find yourself writing "Sub-agent 1 found..." STOP and proceed directly to aggregation.
```

Proposed:
```markdown
> Proceed directly to aggregation. Skip prose summaries of sub-agent findings—go straight to Step 1.
```

The warning about loop detection can be kept as a secondary note:
```markdown
> **Loop check**: If you're writing "Sub-agent 1 found..." or similar summaries, you're in a planning loop. Proceed to aggregation immediately.
```

### Decision 4: Preserve Contract Constraints Section (with Enhancement)

The `CONSTRAINTS: MUST NOT: <boundary>` format in contracts is user-facing and intentionally prohibitive. Research (Anthropic Constitutional AI) shows safety constraints benefit from negative framing.

**Keep as-is:**
```markdown
CONSTRAINTS:
- MUST NOT: Break existing route functionality
- MUST: Maintain backward compatibility
```

**Optional enhancement** (per research recommendation): Pair negatives with positive alternatives where helpful:
```markdown
CONSTRAINTS:
- MUST NOT: Delete production data
  → Instead: Use staging environments for destructive testing
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Over-conversion removes important emphasis | Review each instance; keep safety-critical negatives |
| Positive framing is longer/wordier | Prefer concise positive phrasing; test for clarity |
| Some negatives have no clean positive equivalent | Mark as "keep as-is" with rationale |

## Open Questions

1. Should we add a "Pink Elephant" note to AGENTS.md advising future command authors to prefer positive framing?
2. Should `rules.yaml` rules be updated to use positive framing in the `rule` field?

## Research Findings

Research validation completed 2026-01-14. Key insights:

### Validated ✅
- Positive framing improves LLM instruction-following (VILA-Lab, Anthropic, Google)
- Safety constraints should preserve negative framing (Anthropic Constitutional AI)
- Standardizing sub-agent context blocks is good practice

### Revised ⚠️
- **Causal explanation**: The psychological "Ironic Process Theory" analogy is scientifically inaccurate. LLMs fail negation for mechanical reasons (limited effect of negation tokens on representations), not cognitive ones. MIT research explicitly warns against comparing neural networks to human brains.
- **5-category approach simplified to 2-rule system**: Original categories were descriptive (where negatives appear) not prescriptive (how to transform them).

### Sources
- Anthropic Claude 4 Best Practices: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices
- VILA-Lab "26 Principles" (arXiv:2312.16171)
- Vrabcová et al. (2025) "Negation: A Pink Elephant in LLMs' Room" (arXiv:2503.22395)
- Singh et al. (2024) on negation token representations
- MIT News (2022) "Study urges caution when comparing neural networks to the brain"
