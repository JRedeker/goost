# Tasks: Add OpenSpec Roadmap Command

## 1. Command Implementation

- [ ] 1.1 Create `.opencode/command/openspec-roadmap.md` with command definition
- [ ] 1.2 Define tiering logic (NOW/NEXT/LATER) based on OpenSpec data
- [ ] 1.3 Implement progress bar rendering format
- [ ] 1.4 Add dependency/blocker detection from proposal files
- [ ] 1.5 Handle missing OpenSpec CLI gracefully with clear error message

## 2. Integration

- [ ] 2.1 Test command with real OpenSpec changes in Goost project
- [ ] 2.2 Update `goost_instructions.md` to reference `/openspec-roadmap`
- [ ] 2.3 Document command in README.md

## 3. Optional: Global Roadmap Migration

- [ ] 3.1 Document recommendation to move project-specific `/roadmap` to project configs
- [ ] 3.2 Consider adding `/roadmap` alias that delegates to `/openspec-roadmap` for Goost users
