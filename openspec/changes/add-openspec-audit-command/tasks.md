# Tasks: Add OpenSpec Audit Command

## 1. Command Implementation

- [ ] 1.1 Create `.opencode/command/openspec-audit.md` command file
- [ ] 1.2 Implement Phase 1: Spec Discovery (inventory all specs and requirements)
- [ ] 1.3 Implement Phase 2: Implementation Mapping (map specs to code locations)
- [ ] 1.4 Implement Phase 3: Drift Detection (compare spec assertions to implementation)
- [ ] 1.5 Implement Phase 4: Orphan Detection (find unspecified code)
- [ ] 1.6 Implement Phase 5: Conflict Analysis (cross-check specs for contradictions)
- [ ] 1.7 Implement Phase 6: Report Generation (structured output with remediation)

## 2. Sub-Agent Orchestration

- [ ] 2.1 Define Spec Parser sub-agent prompt (explore type)
- [ ] 2.2 Define Code Mapper sub-agent prompt (explore type)
- [ ] 2.3 Define Drift Scanner sub-agent prompt (explore type)
- [ ] 2.4 Define Conflict Detector sub-agent prompt (explore type)
- [ ] 2.5 Implement result aggregation and synthesis logic

## 3. Documentation

- [ ] 3.1 Update README.md with `/openspec-audit` command documentation
- [ ] 3.2 Update goost_instructions.md command table
- [ ] 3.3 Add usage examples to command description

## 4. Validation

- [ ] 4.1 Test command with no arguments (should audit all specs)
- [ ] 4.2 Test command with scope argument (should filter to specific capability)
- [ ] 4.3 Verify report output format matches spec
- [ ] 4.4 Test error handling for missing OpenSpec CLI
