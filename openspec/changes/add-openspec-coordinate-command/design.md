# Design: OpenSpec Coordinate Command

## Architecture
The `/openspec-coordinate` command follows a **Blackboard-Hybrid** architecture. It acts as the **Control Shell** for the OpenSpec ecosystem, synchronizing multiple agents via a shared coordination state.

### Coordination Logic
1.  **Discovery**: Uses `openspec list --json` and `openspec show <id> --json` to build a global map of active changes.
2.  **Overlap Analysis**: 
    -   Compare `affected_files` lists between all active changes.
    -   Identify "hot files" (modified by 3+ changes).
3.  **Conflict Detection (Identifier-Action Matrix)**:
    -   Parse `spec.md` deltas from active changes to extract identifiers (functions, classes, APIs) and associated actions (verbs).
    -   Search for shared identifiers targeted by conflicting actions (e.g., Change A: "Rename", Change B: "Update").
    -   Use LLM-based semantic similarity to catch synonym collisions (e.g., "Client" vs "Customer").
4.  **Task Validation (Contextual Hunk Anchoring)**:
    -   For each task, store a 3-line context anchor (pre-context, target-hash, post-context).
    -   **Direct Match**: Check if the current code at line N matches the anchor hash.
    -   **Fuzzy Search**: If direct match fails, search +/- 50 lines for the context anchor.
    -   **Semantic Fallback**: Search for the hunk header/function name.
    -   Flag tasks as "DRIFTED" or "LOST" based on the search result.
5.  **Resource Locking**:
    -   Maintain a global "Lock Table" in `.openspec/coordination.json`.
    -   Files in an active change's `affected_files` are locked to that `change-id`.
    -   Tasks from other changes requiring these files are marked as `BLOCKED`.
6.  **Alignment Report**:
    -   Output a "Coordination Dashboard" showing blocking dependencies.
    -   Suggest re-ordering tasks to resolve resource contention.

## User Interface
The command will output a structured report similar to `/openspec-audit` but focused on cross-change alignment.

## Security & Safety
- **Strict Validation**: All change identifiers are validated against `^[a-zA-Z0-9_-]+$` to prevent command injection. 
- **Atomic State Access**: Use atomic file writes (write-to-tmp then rename) and file-level locking for `.openspec/coordination.json`.
- **Resource Quotas**: Max 20 locks per change-id; 60-second timeout for LLM similarity checks to prevent DoS.
- **Transient State**: The coordination JSON is a projection. A `--rebuild` flag allows reconstructing the state from active `proposal.md` and `tasks.md` files.
- **Dependency Validation**: Uses a Directed Acyclic Graph (DAG) validator to detect and flag circular dependencies between changes.
- **Ambiguity Escalation**: If hunk anchoring matches multiple locations, the task is flagged as "AMBIGUOUS" and requires semantic verification via hunk headers.
