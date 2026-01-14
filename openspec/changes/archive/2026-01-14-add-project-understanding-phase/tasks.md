# Tasks: Add Project Understanding Phase to /goost-improve

## Overview

Simplified from original 17-task design to 10 tasks based on research validation.

Key simplifications:
- Remove explicit project type classification (LLM infers from context)
- Remove pattern matching for constraints (LLM understands semantically)
- Remove hard-coded category filtering rules (anti-pattern per OWASP)
- Use "prepend context to prompt" approach (industry standard)

## 1. Documentation Reading
- [x] 1.1 Add Phase 0: Read README.md before analysis
  - Verify: Command reads README.md content before any gap analysis
- [x] 1.2 Read AGENTS.md if present (contains AI-specific context)
  - Verify: If AGENTS.md exists, its content is included in context
- [x] 1.3 Truncate documentation to ~2000 chars if needed (avoid context overflow)
  - Verify: Test with >2000 char README shows "(truncated)" in output
- [x] 1.4 Handle AGENTS.md-only case (README missing but AGENTS.md present)
  - Verify: Output notes "Source: AGENTS.md (no README.md found)"
- [x] 1.5 Handle empty/malformed README gracefully
  - Verify: Empty README treated as "no documentation found"

## 2. Context Injection
- [x] 2.1 Prepend raw documentation content to analysis prompt
- [x] 2.2 Add instruction: "Skip categories that don't apply to this type of project"
- [x] 2.3 Add instruction: "Ignore gaps documented as out-of-scope or deferred"

## 3. Context Summary Output
- [x] 3.1 Extract purpose statement from README (first paragraph or ## Purpose section)
- [x] 3.2 Output PROJECT CONTEXT block before IMPROVEMENT OPPORTUNITIES
- [x] 3.3 Include: Purpose, key constraints identified, categories analyzed/skipped

## 4. Testing
- [ ] 4.1 Test on project with README (should show context summary)
  - Verify: PROJECT CONTEXT block appears before IMPROVEMENT OPPORTUNITIES
  - Verify: Purpose field is populated from README content
- [ ] 4.2 Test on project without README (should note "no documentation found")
  - Verify: Output contains "No project documentation found"
  - Verify: All 5 categories are analyzed (none skipped)
- [ ] 4.3 Test on Goost itself (should respect documented constraints)
  - Verify: Constraints from README/AGENTS.md appear in context summary
  - Verify: No suggestions for items marked as deferred in documentation

## Dependencies

- All tasks modify: `.opencode/command/goost-improve.md`
- No TypeScript/plugin code changes required
- Existing Step 1 (Verify Project Structure) becomes Step 1 after new Step 0

## What Was Removed (per research)

The following were removed based on architectural research:

| Removed | Reason |
|---------|--------|
| Project type classification | LLM infers from context naturally |
| Constraint pattern matching | LLM semantic understanding is more reliable |
| Hard-coded category filtering | Anti-pattern - auth libraries need auth analysis |
| Reading CONTRIBUTING.md, ARCHITECTURE.md | Rarely present, low value vs complexity |
| Weighting adjustments | LLM naturally weighs based on context |

## Research Sources

- GitHub Copilot docs (copilot-instructions.md pattern)
- Aider docs (CONVENTIONS.md pattern)
- simonwillison.net ("context is king")
- OWASP ASVS (risk-based filtering, not type-based)
- ESLint/SonarQube docs (user-configured, not hard-coded)
