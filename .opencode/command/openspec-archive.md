---
name: openspec-archive
description: Archive a deployed OpenSpec change and update specs.
agent: build
---
<!-- OPENSPEC:START -->

**Target Resolution Protocol (State-Changing Operation)**

Determine the target change ID:

1. **If $ARGUMENTS is provided and non-empty**: Use it directly as the target
2. **If $ARGUMENTS is empty or no target found**:
   a. Run `openspec list` to get active changes
   b. If exactly one active change exists:
      - Use `mcp_question` to confirm:
        ```
        header: "Confirm"
        question: "Proceed with '<change-id>'?"
        options: "Yes (Recommended)", "Cancel"
        ```
      - If user cancels, stop execution
   c. If multiple active changes exist:
      - Use `mcp_question` to present selection:
        ```
        header: "Select"
        question: "Which change would you like to archive?"
        options: list of changes with task progress (e.g., "feature-x (3/8 tasks)")
        ```
      - Proceed with user's selection
   d. If no active changes exist:
      - Display: "No active changes found"
      - Suggest: "Run `/openspec-proposal` to create a new change"
      - Stop execution
3. **If target provided but invalid or already archived**:
   - If not found: Display: "Change '<target>' not found in active changes"
   - If already archived: Display: "Change '<target>' has already been archived"
   - Suggest: "Run `openspec list` to see available changes"
   - Stop execution

**Guardrails**: See `openspec/AGENTS.md` for conventions and guidelines.

**Steps**
1. Validate the resolved change ID by running `openspec list` (or `openspec show <id>`) and stop if the change is missing, already archived, or otherwise not ready to archive.
2. Run `openspec archive <id> --yes` so the CLI moves the change and applies spec updates without prompts (use `--skip-specs` only for tooling-only work).
3. Review the command output to confirm the target specs were updated and the change landed in `changes/archive/`.
4. Validate with `openspec validate --strict` and inspect with `openspec show <id>` if anything looks off.

**Reference**
- Use `openspec list` to confirm change IDs before archiving.
- Inspect refreshed specs with `openspec list --specs` and address any validation issues before handing off.
<!-- OPENSPEC:END -->
