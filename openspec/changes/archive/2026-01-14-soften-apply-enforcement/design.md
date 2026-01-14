# Design: Soften OpenSpec Apply Enforcement

## Context

The `/openspec-apply` command was originally simple task guidance, then evolved through multiple commits to become a strict contract-enforced TDD workflow:

- Dec 30, 2025: Added Goost contract integration
- Dec 30, 2025: Changed to implicit approval (removed confirmation)
- Jan 11, 2026: Added mandatory RSTC (TDD) protocol
- Jan 12, 2026: Added Anti-Loop Protocol (forbid conversational transitions)
- Jan 13, 2026: Added Smart Target Resolution

Each layer added safety but also friction. The current state is optimized for preventing agent failures but has become hostile to user experience.

## Goals

- Restore user verification gate without slowing down straightforward changes
- Allow human-readable transitions without enabling planning loops
- Reduce TDD overhead for trivial changes without compromising test coverage for logic
- Make language collaborative instead of commanding

## Non-Goals

- Remove contract enforcement entirely (contracts are core to Goost)
- Remove TDD for logic-heavy changes (TDD is valuable for complex work)
- Change Target Resolution Protocol (working well)

## Decisions

### Decision 1: Restore Confirmation with Quick Dismissal

**What**: Add `mcp_question` after contract display with streamlined options:
- "Begin work (Recommended)" - Proceeds immediately
- "Modify criteria" - Allows adjustment
- "Cancel" - Aborts

**Why**: Provides last-chance verification without multi-step friction. Users can quickly proceed (one click) if criteria look correct, or catch errors before immutability locks in.

**Alternatives considered**:
- Keep implicit approval + allow voiding: Requires user to notice error mid-work, then void and restart (high friction)
- Add "Skip confirmation" flag: Adds complexity, users won't know when to use it

### Decision 2: Intent Statement Protocol

**What**: Replace "Do NOT explain" with a protocol that allows single-line intent statements followed immediately by tool calls.

**Why**: Provides human-readable context ("Starting Phase 1: Database schema") without enabling multi-paragraph planning loops. The tool call requirement still prevents yapping.

**Example**:
```
Starting Phase 1: Database schema implementation

[Read tool call for schema file]
```

**Implementation**: The protocol relies on:

1. **Natural Language Convention** (human benefit):
   - Single-line intent statement describing next action
   - Immediately followed by a tool call (Read, Edit, Write, Bash)
   - NOT multi-paragraph explanations, plans, or summaries

2. **Goost Doom Loop Detection** (agent enforcement):
   - Goost plugin already tracks agent iterations and detects loops
   - `[GOOST:DOOM_LOOP]` marker triggers when agent is stuck
   - This is the existing mechanism for loop prevention

**State Markers**: Intent statements serve as state markers (similar to `>>> SYNTHESIS COMPLETE <<<` in other commands), providing clear phase transitions for human readers.

**Alternatives considered**:
- Allow unlimited prose: Enables planning loops, defeats the purpose
- Zero tolerance (current): Too robotic, poor UX
- Framework-only limits: Out of scope for Goost plugin

### Decision 3: Context-Aware TDD

**What**: Add guidance to RSTC Protocol:
> "For logic-heavy or breaking changes, follow full RSTC (Red/Green Evidence). For documentation, configuration, version bumps, or trivial UI changes, Red-Phase evidence may be skipped in favor of direct implementation and verification."

**Why**: TDD is valuable for complex logic where tests catch regressions. It's ceremony for changes like:
- Updating version in package.json
- Fixing typos in README
- Changing a button label
- Adding a comment

Forcing Red/Green cycles for these wastes agent tokens and risks doom loops on trivial work.

**Classification Heuristics**:
- **Requires RSTC**: New APIs, business logic, state management, breaking changes, security-critical code
- **Optional RSTC**: Documentation, config files, CSS/styling, UI labels, comments, version bumps

**Important Clarification**: "Simplified verification" means:
- Skipping formal test writing entirely for non-code changes
- Using build passes, linter clean, or manual inspection as verification
- NOT skipping the Red phase when unit tests ARE appropriate for logic changes

**Alternatives considered**:
- Keep strict TDD for everything: High overhead, poor ROI on simple tasks
- Remove TDD entirely: Loses valuable safety net for complex changes
- Make it fully opt-in: Agents will always skip it to save tokens

### Decision 4: Language Softening

**What**: Replace command language with descriptive guidance where enforcement is already handled by the plugin or workflow structure.

**Before**: "Do NOT re-state the plan"
**After**: "Provide a brief intent statement, then immediately begin implementation with a tool call"

**Keep "MUST"** for:
- Criterion evidence requirements (contract enforcement)
- Completion gates (all criteria [x])
- Safety boundaries (no skipping tasks)

**Why**: The plugin and contract system already enforce constraints. The markdown instructions should guide collaboration, not bark orders.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Re-introducing planning loops | Intent statement limited to 1 line, tool call still required immediately after |
| Agents skip TDD on borderline cases | Provide clear heuristics, keep "MUST" for logic-heavy work |
| Users skip confirmation habitually | Make "Begin work" the recommended option so it's one-click |
| Language too soft, agents ignore | Keep "MUST" for critical safety boundaries |

## Migration Plan

1. Update `slash-commands` spec with MODIFIED requirements
2. Update `.opencode/command/openspec-apply.md`
3. Test with sample change to verify confirmation works
4. No code changes needed (behavior is in markdown prompt)

## Open Questions

None - design is straightforward refinement of existing workflow.
