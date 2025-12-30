# Tasks: Add /openspec-roadmap Command

## 1. Command Implementation

- [ ] 1.1 Create `.opencode/command/openspec-roadmap.md` with command definition
  - **Verify by:** File exists and contains valid frontmatter with `description`, `agent`, `model` fields

- [ ] 1.2 Implement OpenSpec-only mode (no roadmap.yaml required)
  - **Verify by:** Run `/openspec-roadmap` in a project with only `openspec/` directory; displays changes correctly

- [ ] 1.3 Implement tiering logic:
  - NOW: in_progress OR critical priority
  - NEXT: proposed/ready
  - LATER: deferred/completed
  - **Verify by:** Create test items with each status; confirm correct tier placement

- [ ] 1.4 Implement progress bar rendering (ASCII art)
  - **Verify by:** Progress bars render correctly at 0%, 50%, 100%; bars are 10 characters wide

## 2. OpenSpec Integration

- [ ] 2.1 Query `openspec list --json` for active changes with task progress
  - **Verify by:** Run command; JSON output is parsed without errors

- [ ] 2.2 Parse task completion from OpenSpec change data
  - **Verify by:** Task counts (e.g., "5/10 tasks") match actual task.md completion

- [ ] 2.3 Handle missing OpenSpec CLI gracefully (show message)
  - **Verify by:** Temporarily rename `openspec` binary; command shows helpful message without crashing

- [ ] 2.4 Detect archived changes and mark as complete
  - **Verify by:** Archive an OpenSpec change; it shows as 100% complete in roadmap

## 3. Optional roadmap.yaml Support

- [ ] 3.1 Parse `roadmap.yaml` if present
  - **Verify by:** Create `roadmap.yaml` with 3 items; all items appear in roadmap output

- [ ] 3.2 Match `change_spec` field to OpenSpec change IDs
  - **Verify by:** Link item to existing change; progress syncs from OpenSpec

- [ ] 3.3 Override completion/tasks with OpenSpec data when linked
  - **Verify by:** Set manual progress in roadmap.yaml; confirm OpenSpec data takes precedence

- [ ] 3.4 Handle invalid `change_spec` references with warning
  - **Verify by:** Reference non-existent change; warning appears but command completes

## 4. Error Handling

- [ ] 4.1 Handle no openspec/ directory (show init message)
  - **Verify by:** Run in project without openspec/; shows "Run `openspec init`" message

- [ ] 4.2 Handle malformed roadmap.yaml with clear error
  - **Verify by:** Create invalid YAML syntax; error message identifies the issue

- [ ] 4.3 Handle empty roadmap (no items)
  - **Verify by:** Create empty roadmap.yaml; shows example of how to add item

- [ ] 4.4 Handle malformed JSON from OpenSpec CLI
  - **Verify by:** Mock invalid JSON response; falls back gracefully with error message

- [ ] 4.5 Handle empty openspec/ directory
  - **Verify by:** Create openspec/ with no changes; suggests `openspec new`

## 5. Documentation & Integration

- [ ] 5.1 Update `goost_instructions.md` to reference `/openspec-roadmap`
  - **Verify by:** Grep for `/openspec-roadmap` in goost_instructions.md

- [ ] 5.2 Document command in README.md
  - **Verify by:** README contains usage example and description

- [ ] 5.3 Test with real OpenSpec changes in Goost project
  - **Verify by:** Run `/openspec-roadmap` in Goost; displays all 4 active changes with correct progress

- [ ] 5.4 Validate roadmap.yaml against schema (if schema exists)
  - **Verify by:** Invalid roadmap.yaml fails validation with helpful error
