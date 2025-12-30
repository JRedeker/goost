# Tasks: Add /openspec-harden Command

## 1. Command Implementation

- [x] 1.1 Create `.opencode/command/openspec-harden.md` slash command file
- [x] 1.2 Define command frontmatter (description, agent)
- [x] 1.3 Implement argument parsing for change-id
- [x] 1.4 Add error handling for missing/invalid change-id

## 2. OpenSpec Integration

- [x] 2.1 Add step to run `openspec show <change-id> --json` for context
- [x] 2.2 Parse change details (affected files, specs, tasks)
- [x] 2.3 Handle OpenSpec CLI unavailable case
- [x] 2.4 Handle archived change case

## 3. Test Coverage Analysis

- [x] 3.1 Implement source file discovery from change context
- [x] 3.2 Implement test file pattern matching (*.test.ts, test_*.py, etc.)
- [x] 3.3 Calculate test coverage percentage
- [x] 3.4 Generate test coverage section of report

## 4. Implementation Quality Analysis

- [x] 4.1 Implement TODO/FIXME/HACK marker detection
- [x] 4.2 Implement debug artifact detection (console.log, debugger)
- [x] 4.3 Implement commented-out code detection
- [x] 4.4 Implement hacky code pattern detection (magic numbers, deep nesting, long functions, ts-ignore)
- [x] 4.5 Implement AI slop detection (obvious comments, placeholders, over-abstraction, inconsistent naming)
- [x] 4.6 Add error handling pattern checks (empty catch, generic catch, swallowed errors)
- [x] 4.7 Generate quality section of report

## 5. Documentation Analysis

- [x] 5.1 Implement README update detection
- [x] 5.2 Implement JSDoc/docstring coverage check
- [x] 5.3 Implement CHANGELOG entry detection
- [x] 5.4 Generate documentation section of report

## 6. Cleanup Analysis

- [x] 6.1 Implement obsolete file detection (*.bak, *.orig, etc.)
- [x] 6.2 Implement dead import detection
- [x] 6.3 Implement orphaned test file detection
- [x] 6.4 Implement development artifact detection
- [x] 6.5 Generate cleanup section of report

## 7. Spec Alignment Analysis

- [x] 7.1 Parse tasks.md and verify completed tasks have evidence
- [x] 7.2 Parse spec scenarios and check for corresponding tests
- [x] 7.3 Detect scope creep (files outside stated impact)
- [x] 7.4 Generate alignment section of report

## 8. Report Generation

- [x] 8.1 Implement overall status determination logic (READY/NEEDS_WORK/BLOCKED)
- [x] 8.2 Implement structured report format with ASCII box drawing
- [x] 8.3 Implement next steps prioritization (top 5 actions)
- [x] 8.4 Add status indicators (PASS/WARN/FAIL) per dimension

## 9. Documentation & Integration

- [x] 9.1 Update `goost_instructions.md` to document new command
- [x] 9.2 Copy command to global config `~/.config/opencode/command/`
- [x] 9.3 Test command against an existing OpenSpec change
