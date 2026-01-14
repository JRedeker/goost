## 1. Create Target Resolution Protocol Template

- [ ] 1.1 Create a reusable "Target Resolution Protocol" markdown section that can be embedded in each command
- [ ] 1.2 Implement the two-priority algorithm: explicit > structured selection
- [ ] 1.3 Include `mcp_question` call templates for confirmation (state-changing) and selection (multiple candidates)
- [ ] 1.4 Include auto-proceed logic for read-only operations with single candidate
- [ ] 1.5 Include error handling for no-changes scenario

## 2. Update /openspec-apply Command (State-Changing)

- [ ] 2.1 Modify `.opencode/command/openspec-apply.md` to include Target Resolution Protocol
- [ ] 2.2 Add Step 0 for target resolution before reading proposal files
- [ ] 2.3 Implement confirmation prompt for single-candidate case
- [ ] 2.4 Implement selection prompt for multiple-candidate case
- [ ] 2.5 Ensure explicit target case bypasses resolution (existing behavior preserved)
- [ ] 2.6 Test: invoke without args when single change exists (expect confirmation)
- [ ] 2.7 Test: invoke without args when multiple changes exist (expect selection)

## 3. Update /openspec-review Command (Read-Only)

- [ ] 3.1 Modify `.opencode/command/openspec-review.md` to include Target Resolution Protocol
- [ ] 3.2 Replace "Step 1: Validate Arguments" with resolution protocol
- [ ] 3.3 Implement auto-proceed with notification for single-candidate case
- [ ] 3.4 Implement selection prompt for multiple-candidate case
- [ ] 3.5 Ensure explicit target case proceeds directly to Step 2
- [ ] 3.6 Test: invoke without args when single change exists (expect auto-proceed)
- [ ] 3.7 Test: invoke without args when multiple changes exist (expect selection)

## 4. Update /openspec-harden Command (State-Changing)

- [ ] 4.1 Modify `.opencode/command/openspec-harden.md` to include Target Resolution Protocol
- [ ] 4.2 Replace "Step 1: Validate Arguments" with resolution protocol
- [ ] 4.3 Implement confirmation prompt for single-candidate case (offers fixes = state-changing)
- [ ] 4.4 Implement selection prompt for multiple-candidate case
- [ ] 4.5 Ensure explicit target case proceeds directly to Step 2
- [ ] 4.6 Test: invoke without args when single change exists (expect confirmation)

## 5. Update /openspec-archive Command (State-Changing)

- [ ] 5.1 Modify `.opencode/command/openspec-archive.md` to include Target Resolution Protocol
- [ ] 5.2 Consolidate existing partial resolution logic with standard protocol
- [ ] 5.3 Implement confirmation prompt for single-candidate case
- [ ] 5.4 Ensure consistency with other state-changing commands
- [ ] 5.5 Test: invoke without args when single change exists (expect confirmation)

## 6. Update /openspec-research Command (State-Changing)

- [ ] 6.1 Modify `.opencode/command/openspec-research.md` to include Target Resolution Protocol
- [ ] 6.2 Extend resolution to consider both specs and changes as candidates
- [ ] 6.3 Implement confirmation for single-candidate case (updates files = state-changing)
- [ ] 6.4 Add type labels in selection (e.g., "[change] feature-x", "[spec] contract-system")
- [ ] 6.5 Test: invoke without args when only specs exist
- [ ] 6.6 Test: invoke without args when both spec and change exist

## 7. Validation and Documentation

- [ ] 7.1 Run `openspec validate add-smart-target-resolution --strict`
- [ ] 7.2 Manual test all five commands with and without arguments
- [ ] 7.3 Verify read-only operations auto-proceed (no confirmation fatigue)
- [ ] 7.4 Verify state-changing operations require confirmation
- [ ] 7.5 Verify `mcp_question` calls match `standardize-question-tool-usage` spec
- [ ] 7.6 Update CHANGELOG.md with new capability
