# Change: Add Project Understanding Phase to /goost-improve

## Why

The `/goost-improve` command currently jumps straight into analyzing gaps across 5 categories without first understanding:

1. **What the project does** - Purpose, domain, problem it solves
2. **Intentional architecture** - Patterns chosen deliberately vs. missing by oversight
3. **Project constraints** - What's intentionally deferred or out of scope
4. **Existing documentation** - README, AGENTS.md contain rich context

This leads to irrelevant or noisy suggestions:
- Recommending circuit breakers for a CLI tool that makes no network calls
- Suggesting auth patterns for an internal library
- Flagging "missing observability" when the project intentionally defers to the host application
- Missing project-specific patterns documented in AGENTS.md

## What Changes

Add a **Phase 0: Project Understanding** step before gap analysis that:

1. Reads key documentation files (README.md, AGENTS.md)
2. Prepends documentation content to the analysis prompt
3. Instructs the LLM to skip irrelevant categories and respect documented constraints

The gap analysis then becomes **context-aware** - the LLM naturally considers project purpose and constraints when evaluating relevance of findings.

## Research Validation

Architectural research (January 2026) validated and simplified the design:

| Original Idea | Research Finding | Final Design |
|---------------|------------------|--------------|
| Classify into 5 project types | Over-engineered; LLMs infer naturally | Removed - LLM infers from context |
| Pattern match for constraints | High false positive risk | Removed - LLM understands semantically |
| Hard-coded category filtering | Anti-pattern per OWASP | Removed - LLM decides relevance |
| Read 4+ doc files | Low value for complexity | Simplified to README + AGENTS.md |

**Sources:** GitHub Copilot docs, Aider docs, simonwillison.net, OWASP ASVS, ESLint/SonarQube docs

## Acceptance Criteria

- [ ] Command reads README.md and AGENTS.md (if present) before analysis
- [ ] Documentation content is prepended to analysis prompt
- [ ] LLM is instructed to skip irrelevant categories based on context
- [ ] LLM respects documented constraints (no suggestions for deferred items)
- [ ] Context summary appears in output before findings
- [ ] Works gracefully when no documentation exists

## Impact

- Affected specs: `slash-commands` (Goost Improve Command requirement)
- Affected code: `.opencode/command/goost-improve.md`
- Dependencies: None
- No breaking changes - existing invocations work, just with better context
