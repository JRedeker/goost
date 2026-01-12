# Change: Implement OpenSpec Coordinate Command

## Why

As the complexity of AI-driven development increases, multiple agents often work on the same codebase simultaneously. Without a formal coordination mechanism, agents are prone to:
- Overwriting each other's work due to stale context.
- Implementing contradictory requirements that only surface during integration or manual review.
- Wasting tokens by re-attempting tasks that have been invalidated by concurrent changes.
- Creating "specification drift" where the source of truth becomes fragmented and unreliable.

A centralized coordination command provides the "Control Shell" necessary for safe, high-concurrency multi-agent collaboration.

## What Changes

- **NEW** `/openspec-coordinate` slash command for cross-agent synchronization.
- **Coordination State**: Implements `.openspec/coordination.json` for tracking active changes and locks.
- **Conflict Detection**: Uses Identifier-Action Matrix to identify contradictory requirement intents.
- **Drift Prevention**: Implements 3-tier Contextual Hunk Anchoring to detect when code changes invalidate pending tasks.
- **Resource Management**: Enforces file-level resource locking and quotas.
- **Dependency Tracking**: Validates Directed Acyclic Graphs (DAG) to prevent circular dependencies between changes.

## Impact

- **Affected specs**: `slash-commands`
- **Affected code**:
  - `.opencode/command/openspec-coordinate.md` (New)
  - `openspec/specs/slash-commands/spec.md` (Modified)
  - `goost_instructions.md` (Update: add command to available commands table)
  - `README.md` (Update: add command to documentation)

## Design Decisions

### Blackboard-Hybrid Architecture
The command acts as a shared "blackboard" where state is projected from distributed proposal and task files. This ensures the state can always be reconstructed via the `--rebuild` mechanism.

### Contextual Hunk Anchoring
To handle code drift, we store a 3-line context anchor for each task. This allows the tool to find the "intended" location even if line numbers have shifted due to concurrent edits.

### Identifier-Action Matrix
Requirements are decomposed into (Identifier, Action) pairs. Conflicts are detected when different changes apply incompatible actions to the same identifier.

## Success Criteria
- [ ] Command `/openspec-coordinate` is available in the CLI.
- [ ] Command accurately identifies overlapping file changes between two active proposals.
- [ ] Command detects conflicting requirements using an Identifier-Action Matrix.
- [ ] Command identifies "drifted" tasks using 3-tier Contextual Hunk Anchoring.
- [ ] Command implements a File-Level Resource Locking mechanism with quotas and stale-lock cleanup.
- [ ] Command detects and blocks circular dependencies between changes via DAG validation.
- [ ] Command ensures state resilience with a `--rebuild` mechanism from distributed task files.
- [ ] Command generates a coordination report with actionable re-alignment steps.
