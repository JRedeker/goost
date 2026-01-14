# Design: Project Understanding Phase for /goost-improve

## Context

The `/goost-improve` command analyzes codebases for architectural gaps and generates `/goost-search` suggestions. Currently it applies the same 5-category checklist to all projects regardless of type or stated constraints.

## Goals / Non-Goals

**Goals:**
- Understand project purpose before suggesting improvements
- Respect intentional design decisions and documented constraints
- Skip irrelevant categories based on project context
- Provide more actionable, less noisy suggestions

**Non-Goals:**
- Deep semantic understanding of all code
- Replacing human judgment about what matters
- Supporting every possible project type

## Research Validation (January 2026)

### Documentation-First Approach ✅ VALIDATED

**Finding:** Reading README.md and AGENTS.md before analysis is industry best practice for LLM-based tools.

- GitHub Copilot uses `copilot-instructions.md` and `AGENTS.md` for repository context
- Aider recommends `CONVENTIONS.md` for coding guidelines
- Simon Willison: "Most of the craft comes down to managing context"

**Sources:** GitHub Copilot docs, Aider docs, simonwillison.net

### Project Type Classification ⚠️ SIMPLIFIED

**Finding:** Explicit classification into CLI/Library/Service/Plugin/Monorepo is over-engineered.

- No standard taxonomy exists (npm/yarn don't detect project types)
- Monorepo is orthogonal (can contain any combination of types)
- LLMs naturally recognize project types from README content

**Decision:** Remove explicit classification logic. Let LLM infer from context.

**Sources:** npm docs, GitHub Linguist, JetBrains DevEco survey

### Constraint Extraction via Pattern Matching ⚠️ SIMPLIFIED

**Finding:** Pattern matching ("does not handle X") has high false positive/negative risk.

- Natural language has too much variability
- "Does not return null" vs "Does not handle auth" look similar to regex
- LLM semantic understanding is more reliable and simpler

**Decision:** Remove pattern matching. Prepend docs to prompt and let LLM understand constraints semantically.

**Sources:** Requirements engineering research, existing Goost pattern analysis

### Hard-Coded Category Filtering ❌ ANTI-PATTERN REMOVED

**Finding:** Skipping categories by project type creates false security.

Counter-examples that break the original rules:
- Auth libraries (passport.js, Spring Security) need auth analysis MORE than consumers
- CLI tools often handle credentials (aws-cli, gh, kubectl)
- Logging libraries need observability security analysis (OWASP)

**Decision:** Remove hard-coded exclusions. Surface all findings, instruct LLM to skip irrelevant categories based on context.

**Sources:** ESLint docs, SonarQube docs, OWASP ASVS, OWASP Logging Cheat Sheet

### Simplification Opportunity 🎯 APPLIED

**Finding:** Industry tools use a much simpler approach than the original 5-decision design.

| Original Design | Simplified Design |
|-----------------|-------------------|
| Read 4+ doc files | Read README.md + AGENTS.md |
| Classify into 5 project types | LLM infers from context |
| Pattern match for constraints | LLM reads docs semantically |
| Apply filtering rules per type | Prompt says "skip irrelevant" |
| Weighting adjustments | LLM naturally weighs |

**Sources:** GitHub Copilot, Cody, simonwillison.net, harper.blog

## Final Design: Simplified 2-Step Approach

### Step 1: Read Project Documentation

Read available documentation files:
1. `README.md` (primary - almost always present)
2. `AGENTS.md` (if present - rich context for AI tools)

That's it. No CONTRIBUTING.md, ARCHITECTURE.md parsing needed.

### Step 2: Prepend Context to Analysis Prompt

Instead of complex classification/filtering logic, prepend raw documentation to the analysis prompt:

```
PROJECT CONTEXT (from README.md):
---
<raw README content, truncated to ~2000 chars if needed>
---

PROJECT CONTEXT (from AGENTS.md):
---
<raw AGENTS content if present>
---

Given the above context about this project, analyze the codebase for architectural gaps.

IMPORTANT:
- Skip categories that don't apply to this type of project
- Ignore gaps that are explicitly documented as out-of-scope or deferred
- Consider the project's stated purpose when evaluating relevance

Categories to evaluate (skip irrelevant ones based on context):
1. Security Posture
2. Reliability
3. Testing Maturity
4. Observability
5. Developer Experience

[rest of existing analysis prompt]
```

### What's Preserved

- ✅ Still reads README.md and AGENTS.md before analysis
- ✅ Still outputs a context summary (for transparency)
- ✅ Still respects documented constraints (LLM understands them)
- ✅ Still skips irrelevant categories (LLM decides based on context)

### What's Removed

- ❌ Explicit project type classification logic
- ❌ Pattern matching for constraints
- ❌ Hard-coded category filtering rules
- ❌ Weighting adjustment logic

## Output Format

Keep the context summary for transparency:

```
PROJECT CONTEXT
------------------------------------------------------------
Purpose: <extracted from README, first paragraph or ## Purpose section>
Key constraints identified:
  - <constraint 1, if LLM identified any>
  - <constraint 2>
Categories analyzed: <list of categories that had findings>
Categories skipped: <list with brief reason from LLM>
------------------------------------------------------------

IMPROVEMENT OPPORTUNITIES
------------------------------------------------------------
[findings...]
```

## Open Questions (Resolved)

~~Should there be a `--full` flag to ignore project type and analyze all categories?~~
**Resolved:** Not needed. LLM decides relevance dynamically. Users can add "analyze all categories regardless of project type" to their query if needed.

~~How to handle monorepos with mixed project types?~~
**Resolved:** LLM handles this naturally from context. README usually describes the monorepo structure.

~~Should we cache project context for repeated runs?~~
**Resolved:** Out of scope for initial implementation. README reading is fast.
