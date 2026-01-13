# Tasks: Add Architectural Improvement Suggestions

> **Research Validated**: 2026-01-13 - Design simplified based on architectural research findings.
> 
> Key changes from 2026-01-12 validation:
> - **Removed** weighted priority scoring (over-engineered; no industry precedent)
> - **Added** Reliability as 5th core category (ISO 25010/AWS gap)
> - **Deferred** `--metadata-only` and JSON output to post-MVP
> - **Simplified** to ~150 lines (was ~200)

## 1. Create Standalone Command
- [x] 1.1 Create new `.opencode/command/goost-improve.md` file (~150 lines)
- [x] 1.2 Add frontmatter (name, description, agent: general)
- [x] 1.3 Write agent instructions with specification grounding (SGCR dual-pathway)

## 2. Agent Analysis Instructions (Grounded Discovery)
- [x] 2.1 Write preamble providing project conventions context
- [x] 2.2 Define critical areas agent MUST check (explicit path):
  - Security Posture
  - Reliability (fault tolerance, error handling, recovery)
  - Testing Maturity
  - Observability
  - Developer Experience
- [x] 2.3 Add guidance for discovering additional issues (implicit path)
- [x] 2.4 Add guidance for agent to discover categories beyond the 5 core

## 3. Evidence Requirements (Research Validated)
- [x] 3.1 Define evidence sufficiency table:
  | Claim Type | Required Evidence |
  |------------|-------------------|
  | "X exists" | File path where found |
  | "X does not exist" | Directories/patterns searched |
  | "Pattern Y is used" | 1-3 example file paths |
  | "Configuration Z is present" | Config file path + key |
- [x] 3.2 Add instructions requiring evidence for every finding
- [x] 3.3 Add rejection criteria for findings without evidence

## 4. Hybrid Query Generation (Research Validated)
- [x] 4.1 Document hybrid query formulation:
  - Include tool/library names when detected
  - Add problem/solution context
  - Include temporal qualifiers when appropriate (not required)
  - Include tech stack context
- [x] 4.2 Add examples of good hybrid queries:
  - "jest parallel testing typescript large suite 2024"
  - "zod vs yup vs joi typescript API validation 2024"
- [x] 4.3 Note that temporal qualifiers are heuristic, not universal

## 5. Simple Severity Ranking (Simplified from Weighted Scoring)
- [x] 5.1 Define severity tiers: Critical, High, Medium, Low
- [x] 5.2 Document severity criteria:
  | Severity | Criteria |
  |----------|----------|
  | Critical | Security vulnerabilities, data loss risks, system instability |
  | High | Significant gaps affecting reliability, maintainability, or velocity |
  | Medium | Notable improvements that would strengthen the codebase |
  | Low | Minor enhancements or best practice suggestions |
- [x] 5.3 Sort by severity (Critical first), then by category
- [x] 5.4 Keep 7-10 finding limit

## 6. Report Output
- [x] 6.1 Create "IMPROVEMENT OPPORTUNITIES" section template
- [x] 6.2 Use format: `[SEVERITY] Title` with Category in body
- [x] 6.3 Require Evidence field in finding format
- [x] 6.4 Add "no significant gaps" message template

## 7. Testing
- [ ] 7.1 Manual test: Run on project with obvious testing gaps
  - Verify: At least one Testing category finding appears with evidence
- [ ] 7.2 Manual test: Run on project with security concerns
  - Verify: Security findings appear with specific file paths
- [ ] 7.3 Manual test: Run on well-structured project (expect minimal findings)
  - Verify: "No significant architectural gaps identified" message or low-severity only
- [ ] 7.4 Manual test: Verify findings include evidence
  - Verify: Every finding has Evidence field with file paths or search patterns
- [ ] 7.5 Manual test: Verify queries use hybrid format
  - Verify: Queries include tool names OR comparison format with temporal qualifiers
- [ ] 7.6 Manual test: Verify severity sorting is correct
  - Verify: Critical before High before Medium before Low

## 8. Documentation
- [x] 8.1 Add `/goost-improve` entry to README.md command list
  - Verify: Command appears with brief description matching spec

## Deferred to Post-MVP

- `--metadata-only` mode (quick config-only analysis)
- `--json` output format
- `--include/--exclude` pattern filtering

## Dependencies

- This is a NEW standalone command (does not modify /openspec-audit)
- Works independently of `/goost-search` (suggestions are useful regardless)
- Suggestions become actionable once `/goost-search` is implemented

## Design Principles (Research-Validated)

**DO:**
- Ground agent with project conventions and 5 critical check areas
- Require evidence (file paths, patterns) for every finding
- Use hybrid queries: tool names + context + temporal qualifiers (when appropriate)
- Use simple severity ranking (Critical/High/Medium/Low)
- Limit to 7-10 most impactful findings

**DON'T:**
- Pure free-form discovery (consistency issues)
- Problem-only queries (underperform hybrid due to vocabulary mismatch)
- Sampling-based analysis (creates false negatives per OWASP)
- Weighted priority scoring (over-engineered; no industry precedent)
- Integrate into /openspec-audit (keep commands focused)

## Research Sources

- arXiv:2512.17540 - SGCR Framework (grounded LLM review, 90.9% relative improvement)
- Shuster et al. EMNLP 2021 - Retrieval augmentation reduces hallucinations
- CoVe (Dhuliawala et al. 2023) - Chain-of-verification for LLM accuracy
- CROKAGE 2020 - Hybrid queries outperform abstract queries (vocabulary mismatch)
- NLP2API 2018 - Tool names bridge query-solution gap
- ISO 25010:2023 - Software quality model (9 characteristics)
- AWS Well-Architected - 6 pillars including Reliability
- OWASP Static Analysis - False negatives from incomplete analysis
