# Tasks: Add Architectural Weakness Detection

## 1. Phase 4 Integration
- [ ] 1.1 Add Phase 4 section to `/openspec-audit` command after synthesis phase
- [ ] 1.2 Create agent instructions for open-ended architectural analysis
- [ ] 1.3 Define analysis category prompts (guiding questions, not checklists)
- [ ] 1.4 Integrate Phase 4 output into final report generation

## 2. Agent Analysis Instructions
- [ ] 2.1 Write instructions for examining project structure and organization
- [ ] 2.2 Write instructions for evaluating testing maturity (without hardcoded tool names)
- [ ] 2.3 Write instructions for assessing security posture (pattern-based, not library-based)
- [ ] 2.4 Write instructions for identifying performance/scalability patterns
- [ ] 2.5 Write instructions for evaluating observability and debugging capabilities
- [ ] 2.6 Write instructions for assessing code quality and maintainability
- [ ] 2.7 Write instructions for evaluating developer experience gaps
- [ ] 2.8 Write instructions for analyzing dependency health
- [ ] 2.9 Write instructions for assessing CI/CD maturity
- [ ] 2.10 Add guidance for agent to discover additional relevant categories

## 3. Search Query Generation Guidelines
- [ ] 3.1 Document query formulation principles (problem-focused, not tool-focused)
- [ ] 3.2 Add examples of good vs bad query formulations
- [ ] 3.3 Add instructions for including tech stack context dynamically
- [ ] 3.4 Add guidelines for query specificity (searchable but not prescriptive)

## 4. Finding Format and Prioritization
- [ ] 4.1 Define finding structure (category, observation, evidence, impact, query)
- [ ] 4.2 Add instructions for evidence-based observations
- [ ] 4.3 Add instructions for impact assessment
- [ ] 4.4 Define prioritization criteria (security > reliability > scalability > velocity)
- [ ] 4.5 Add limit guidance (7-10 most impactful findings)

## 5. Report Integration
- [ ] 5.1 Create "IMPROVEMENT OPPORTUNITIES" section template
- [ ] 5.2 Add section header with explanatory text
- [ ] 5.3 Define finding display format with category labels
- [ ] 5.4 Add "no significant gaps" message template
- [ ] 5.5 Add `improvements` array to JSON output schema

## 6. Command Flags
- [ ] 6.1 Add `--skip-suggestions` flag to omit improvement opportunities section
- [ ] 6.2 Add `--deep` flag for thorough analysis (more file reading)
- [ ] 6.3 Add `--quick` flag for lightweight config-only analysis
- [ ] 6.4 Update argument parsing section for new flags
- [ ] 6.5 Add flag documentation to command help output

## 7. Analysis Depth Control
- [ ] 7.1 Define default analysis scope (configs, structure, samples)
- [ ] 7.2 Define deep analysis scope (additional source files, CI/CD, deps)
- [ ] 7.3 Define quick analysis scope (manifests and configs only)
- [ ] 7.4 Add depth indicator to report output

## 8. Documentation
- [ ] 8.1 Update command description to mention architectural analysis
- [ ] 8.2 Document the analysis categories and guiding questions
- [ ] 8.3 Add examples of expected output in different scenarios
- [ ] 8.4 Document the query formulation philosophy (problem-focused)
- [ ] 8.5 Add guidance on interpreting improvement suggestions

## 9. Testing
- [ ] 9.1 Manual test: Run on project with obvious testing gaps
- [ ] 9.2 Manual test: Run on project with security concerns
- [ ] 9.3 Manual test: Run on well-structured project (expect minimal findings)
- [ ] 9.4 Manual test: Verify `--skip-suggestions` hides section
- [ ] 9.5 Manual test: Verify `--deep` performs additional analysis
- [ ] 9.6 Manual test: Verify `--quick` limits to config files
- [ ] 9.7 Manual test: Verify JSON output includes improvements array
- [ ] 9.8 Manual test: Verify queries don't contain hardcoded tool names

## Dependencies

- This change modifies the existing `/openspec-audit` command
- Works independently of `/goost-search` (suggestions are useful regardless)
- Suggestions become actionable once `/goost-search` is implemented

## Design Principles (Reference)

**DO:**
- Let the agent discover issues based on what it observes
- Require evidence for every finding
- Phrase queries as problems to solve, not tools to install
- Allow agent to identify categories beyond the predefined list
- Prioritize by impact on users/security/reliability

**DON'T:**
- Hardcode specific library or tool names
- Create static checklists to match against
- Make assumptions without evidence from the codebase
- Prescribe solutions (let search results provide options)
- Overwhelm with too many suggestions (limit to 7-10)

## Notes

- The agent should reason about what it finds, not pattern-match against a list
- Query quality matters more than quantity - each should be actionable
- Categories are guidance, not constraints - agent can identify new ones
- "No significant gaps" is a valid finding for well-maintained projects
