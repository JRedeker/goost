# Tasks: Add Architectural Improvement Suggestions

> **Research Validated**: 2026-01-12 - Design revised based on architectural research findings.

## 1. Create Standalone Command (Changed from Phase 4 Integration)
- [ ] 1.1 Create new `.opencode/command/goost-improve.md` file (~200 lines)
- [ ] 1.2 Add frontmatter (name, description, agent: general)
- [ ] 1.3 Write agent instructions with specification grounding (not pure free-form discovery)
- [ ] 1.4 Define 4 core categories with guiding questions and weights

## 2. Agent Analysis Instructions (Grounded Discovery)
- [ ] 2.1 Write preamble providing project conventions context
- [ ] 2.2 Define critical areas agent MUST check (explicit path)
- [ ] 2.3 Add guidance for discovering additional issues (implicit path)
- [ ] 2.4 Write instructions for 4 core categories:
  - Security Posture (weight: 1.0)
  - Testing Maturity (weight: 0.9)
  - Observability (weight: 0.7)
  - Developer Experience (weight: 0.6)
- [ ] 2.5 Add guidance for agent to discover categories beyond the 4 core

## 3. Evidence Requirements (Research Validated)
- [ ] 3.1 Define evidence sufficiency table:
  | Claim Type | Required Evidence |
  |------------|-------------------|
  | "X exists" | File path where found |
  | "X does not exist" | Directories/patterns searched |
  | "Pattern Y is used" | 1-3 example file paths |
  | "Configuration Z is present" | Config file path + key |
- [ ] 3.2 Add instructions requiring evidence for every finding
- [ ] 3.3 Add rejection criteria for findings without evidence

## 4. Hybrid Query Generation (Revised from Problem-Only)
- [ ] 4.1 Document hybrid query formulation:
  - Include tool/library names when detected
  - Add problem/solution context
  - Include temporal qualifiers (year, "alternatives", "vs")
  - Include tech stack context
- [ ] 4.2 Add examples of good hybrid queries:
  - "jest parallel testing typescript large suite 2024"
  - "zod vs yup vs joi typescript API validation 2024"
- [ ] 4.3 Explain why this outperforms pure abstraction (cite research)

## 5. Weighted Priority Scoring (Revised from Fixed Hierarchy)
- [ ] 5.1 Define severity tiers: Critical (4), High (3), Medium (2), Low (1)
- [ ] 5.2 Define category weights: Security (1.0), Testing (0.9), Observability (0.7), DX (0.6)
- [ ] 5.3 Document priority formula: Category Weight × Severity Score
- [ ] 5.4 Add examples showing how Critical DX can outrank Low Security
- [ ] 5.5 Keep 7-10 finding limit (research validated)

## 6. Analysis Depth Control (Simplified to 2 Modes)
- [ ] 6.1 Implement `--metadata-only` flag (configs, manifests, structure only)
- [ ] 6.2 Make full analysis the default (all source files in scope)
- [ ] 6.3 Support `--include/--exclude` patterns for targeted analysis
- [ ] 6.4 Remove sampling middle ground (creates false negatives per OWASP)

## 7. Report Output
- [ ] 7.1 Create "IMPROVEMENT OPPORTUNITIES" section template
- [ ] 7.2 Include severity label in category header: `[CATEGORY - Severity]`
- [ ] 7.3 Require Evidence field in finding format
- [ ] 7.4 Add "no significant gaps" message template
- [ ] 7.5 Add JSON output format with `improvements` array

## 8. Documentation
- [ ] 8.1 Document the command and its purpose (separate from /openspec-audit)
- [ ] 8.2 Document the 4 core categories and how to interpret weights
- [ ] 8.3 Add examples of expected output
- [ ] 8.4 Document hybrid query philosophy with examples
- [ ] 8.5 Add research sources in design.md

## 9. Testing
- [ ] 9.1 Manual test: Run on project with obvious testing gaps
- [ ] 9.2 Manual test: Run on project with security concerns
- [ ] 9.3 Manual test: Run on well-structured project (expect minimal findings)
- [ ] 9.4 Manual test: Verify `--metadata-only` limits scope correctly
- [ ] 9.5 Manual test: Verify findings include evidence
- [ ] 9.6 Manual test: Verify queries use hybrid format (tool + context + year)
- [ ] 9.7 Manual test: Verify priority scoring produces sensible ordering

## Dependencies

- This is a NEW standalone command (does not modify /openspec-audit)
- Works independently of `/goost-search` (suggestions are useful regardless)
- Suggestions become actionable once `/goost-search` is implemented

## Design Principles (Research-Validated)

**DO:**
- Ground agent with project conventions and critical check areas
- Require evidence (file paths, patterns) for every finding
- Use hybrid queries: tool names + context + temporal qualifiers
- Use weighted priority scoring, not fixed hierarchy
- Limit to 7-10 most impactful findings

**DON'T:**
- Pure free-form discovery (consistency issues)
- Problem-only queries (underperform hybrid)
- Sampling-based analysis (creates false negatives)
- Fixed category hierarchy (too rigid per AWS/Google SRE)
- Integrate into /openspec-audit (keep commands focused)

## Research Sources

- arXiv:2512.17540 - SGCR Framework (grounded LLM review)
- arXiv:2305.14627 - Citation requirements for LLM accuracy
- arXiv:2502.20747v1 - LLM consistency at temperature=0
- Google SRE Book - Error budgets, reliability trade-offs
- AWS Well-Architected - Context-dependent trade-offs
- OWASP Static Analysis - False negatives from sampling
- Stack Overflow/CROKAGE - Hybrid query effectiveness
