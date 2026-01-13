# Slash Commands Capability Delta

## ADDED Requirements

### Requirement: OpenSpec Coordinate Command

The `/openspec-coordinate` command SHALL synchronize multiple active OpenSpec changes to prevent requirement conflicts, task invalidation, and implementation drift during high-concurrency development.

#### Scenario: Detect overlapping file changes
- **GIVEN** two active changes `A` and `B` exist
- **AND** both changes list `src/core/engine.ts` in their "Affected code" section
- **WHEN** user invokes `/openspec-coordinate`
- **THEN** the command SHALL flag `src/core/engine.ts` as an overlapping file
- **AND** identify the specific requirements in each spec that affect this file

#### Scenario: Detect conflicting requirements
- **GIVEN** Change `A` adds a requirement to "Rename `getUser` to `fetchUser`"
- **AND** Change `B` adds a requirement to "Add `email` parameter to `getUser`"
- **WHEN** user invokes `/openspec-coordinate`
- **THEN** the command SHALL extract the identifier `getUser` and associated actions ("Rename", "Add parameter")
- **AND** flag a "Semantic Conflict" in the Identifier-Action Matrix
- **AND** suggest a synchronization meeting or priority resolution

#### Scenario: Detect task drift with hunk anchoring
- **GIVEN** Change `A` has a task with a stored anchor (pre-context, code-hash, post-context)
- **AND** Change `B` has modified the file such that the code has shifted by 15 lines
- **WHEN** user invokes `/openspec-coordinate`
- **THEN** the command SHALL perform a fuzzy search for the context anchor
- **AND** if found at a new location, mark the task as "MOVED" and update the reference
- **AND** if not found, mark the task as "DRIFTED" or "LOST"

#### Scenario: Enforce resource locking
- **GIVEN** Change `A` is actively being implemented and has locked `src/auth.ts`
- **AND** Change `B` also lists `src/auth.ts` in its affected code
- **WHEN** user invokes `/openspec-coordinate`
- **THEN** the command SHALL identify the resource contention
- **AND** mark the relevant tasks in Change `B` as `BLOCKED` by Change `A`
- **AND** display the lock status in the coordination report

#### Scenario: Coordination report generation
- **GIVEN** coordination analysis is complete
- **WHEN** displaying results
- **THEN** the command SHALL output a "Coordination Dashboard" including:
  - Hot Files (overlapping files)
  - Semantic Conflicts (requirement collisions)
  - Task Drift status
  - Suggested Sequence (task ordering recommendations)

#### Scenario: Handle corrupted coordination state
- **GIVEN** the coordination state file `.openspec/coordination.json` is corrupted or unreadable
- **WHEN** user invokes `/openspec-coordinate`
- **THEN** the command SHALL attempt to reconstruct the state using the `--rebuild` mechanism
- **AND** log a warning about the state corruption

#### Scenario: LLM similarity check timeout
- **GIVEN** the Identifier-Action Matrix analysis requires LLM semantic checks
- **AND** the LLM service is unresponsive or times out (exceeding 60s)
- **WHEN** user invokes `/openspec-coordinate`
- **THEN** the command SHALL fall back to direct string matching for identifiers
- **AND** mark the conflict analysis as "PARTIAL" with a warning about LLM timeout

#### Scenario: Enforce resource quotas
- **GIVEN** an active change `A` has already locked 20 files
- **AND** Change `A` attempts to lock an additional file `src/extra.ts`
- **WHEN** user invokes `/openspec-coordinate`
- **THEN** the command SHALL deny the additional lock
- **AND** report that Change `A` has exceeded its resource quota

#### Scenario: Detect circular dependencies
- **GIVEN** Change `A` depends on Change `B`
- **AND** Change `B` depends on Change `A` (circular dependency)
- **WHEN** user invokes `/openspec-coordinate`
- **THEN** the command SHALL identify the cycle via DAG validation
- **AND** block both changes from proceeding until the cycle is resolved
- **AND** report the specific cycle path

#### Scenario: Logging coordination events
- **GIVEN** coordination events occur (lock acquired, conflict detected, state rebuilt)
- **WHEN** processing events
- **THEN** the command SHALL emit structured logs (JSON) to stderr
- **AND** include the `change-id` and timestamp for each event

> **Note**: Observability is handled via stderr logging to ensure compatibility with non-interactive environments and log aggregators.

#### Scenario: No active changes exist
- **GIVEN** no active OpenSpec changes exist in `openspec/changes/`
- **WHEN** user invokes `/openspec-coordinate`
- **THEN** the command SHALL display: "No active changes to coordinate"
- **AND** suggest running `/openspec-proposal` to create a new change

#### Scenario: Only one active change exists
- **GIVEN** exactly one active OpenSpec change exists
- **WHEN** user invokes `/openspec-coordinate`
- **THEN** the command SHALL display: "Only one active change found - coordination not needed"
- **AND** show the change name and its current progress
- **AND** suggest checking back when multiple changes are active

#### Scenario: OpenSpec CLI unavailable
- **GIVEN** the `openspec` CLI is not installed or not in PATH
- **WHEN** user invokes `/openspec-coordinate`
- **THEN** the command SHALL display: "OpenSpec CLI not available"
- **AND** suggest checking installation with `which openspec`

#### Scenario: Malformed proposal.md in a change
- **GIVEN** an active change has a `proposal.md` with invalid or missing sections
- **WHEN** user invokes `/openspec-coordinate`
- **THEN** the command SHALL log a warning for the malformed change
- **AND** exclude it from coordination analysis
- **AND** continue processing other valid changes
- **AND** include the warning in the final report

#### Scenario: Large result set truncation
- **GIVEN** coordination analysis finds more than 50 overlapping files or 20 conflicts
- **WHEN** generating the coordination report
- **THEN** the command SHALL truncate results to the top 50 overlaps and 20 conflicts
- **AND** note the truncation with total counts
- **AND** suggest filtering by specific change-id for detailed view

#### Scenario: Partial anchor verification failure
- **GIVEN** a change has 10 tasks with stored anchors
- **AND** 3 anchors are found at original locations (STABLE)
- **AND** 4 anchors are found at shifted locations (MOVED)
- **AND** 3 anchors cannot be found (LOST)
- **WHEN** user invokes `/openspec-coordinate`
- **THEN** the command SHALL report each task with its anchor status
- **AND** group tasks by status (STABLE, MOVED, LOST) in the report
- **AND** prioritize LOST tasks in the "Suggested Sequence" section

> **Note**: Configuration for quotas (default: 20 files/change) and timeouts (default: 60s for LLM) can be adjusted in `.openspec/coordination.json` under the `config` key. If not specified, defaults are used.
