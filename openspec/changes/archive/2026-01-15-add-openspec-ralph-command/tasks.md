## 1. Preparation
- [x] 1.1 Review `/openspec-apply.md` to identify sections that will be inherited vs modified
- [x] 1.2 Identify specific verification command insertion points (test/build steps)
- [x] 1.3 Add SYNC WARNING header noting dependency on `/openspec-apply` base logic

## 2. Implementation
- [x] 2.1 Create `.opencode/command/openspec-ralph.md` starting from `/openspec-apply` structure
- [x] 2.2 Add error classification phase: TRANSIENT vs SEMANTIC vs ENVIRONMENTAL (per LangGraph patterns)
- [x] 2.3 Add explicit reflection requirement: agent must verbalize diagnosis before fix (per Reflexion research)
- [x] 2.4 Implement retry budget (3 for semantic errors, 1 for transient, 0 for environmental → immediate escalation)
- [x] 2.5 Add incremental verification: run affected tests after each task (per shift-left principle)
- [x] 2.6 Add mandatory Global Final Loop verification before contract fulfillment
- [x] 2.7 Integrate `[GOOST:DOOM_LOOP]` marker emission during retry phases

## 3. Documentation & Reference
- [x] 3.1 Update `openspec/AGENTS.md` to mention `/openspec-ralph` as autonomous implementation option
- [x] 3.2 Document the autonomous retry protocol inline (avoid "Wiggum Protocol" naming - use descriptive terms)

## 4. Validation
- [x] 4.1 Verify `/openspec-ralph` correctly parses existing change proposals (same as `/openspec-apply`)
- [x] 4.2 Manual test: Simulate SEMANTIC failure (type error) → verify 3-retry cycle with diagnosis
- [x] 4.3 Manual test: Simulate TRANSIENT failure (flaky test) → verify immediate retry
- [x] 4.4 Manual test: Verify incremental verification runs after task completion
- [x] 4.5 Manual test: Simulate ENVIRONMENTAL failure (missing dep) → verify immediate escalation without retry
