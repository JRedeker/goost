/**
 * Tests for contract.ts - Contract state management
 */

import { describe, it, expect } from "vitest"
import {
  createInitialState,
  createEmptyContract,
  createActiveContract,
  processMessageContent,
  updateStateStatus,
  extractCriterionFromTask,
  recordSubAgentFailure,
  clearSubAgentFailures,
  isDoomLoopReached,
} from "./contract"

describe("createInitialState", () => {
  it("creates state with all fields initialized to defaults", () => {
    const state = createInitialState()

    expect(state.status).toBe("idle")
    expect(state.activeSubAgents).toBe(0)
    expect(state.contract.active).toBe(false)
    expect(state.subAgentFailures.size).toBe(0)
    expect(state.openSpecChange).toBeNull()
  })

  it("returns a new object each time (not shared reference)", () => {
    const state1 = createInitialState()
    const state2 = createInitialState()

    expect(state1).not.toBe(state2)
    expect(state1.subAgentFailures).not.toBe(state2.subAgentFailures)
  })
})

describe("createEmptyContract", () => {
  it("creates an inactive contract state", () => {
    const contract = createEmptyContract()

    expect(contract.active).toBe(false)
    expect(contract.text).toBeNull()
    expect(contract.objective).toBeNull()
    expect(contract.criteriaStatus).toEqual([])
    expect(contract.progress).toBe("")
  })
})

describe("createActiveContract", () => {
  it("parses contract block and extracts objective", () => {
    const block = `========================================
CONTRACT ACTIVE
========================================
OBJECTIVE: Complete the task

SUCCESS CRITERIA:
- [ ] First criterion
- [ ] Second criterion
========================================`

    const contract = createActiveContract(block)

    expect(contract.active).toBe(true)
    expect(contract.text).toBe(block)
    expect(contract.objective).toBe("Complete the task")
  })

  it("extracts criteria from contract block", () => {
    const block = `========================================
CONTRACT ACTIVE
========================================
OBJECTIVE: Test

SUCCESS CRITERIA:
- [ ] Unchecked item
- [x] Checked item
- [?] Unknown item
========================================`

    const contract = createActiveContract(block)

    expect(contract.criteriaStatus).toEqual([
      "[ ] Unchecked item",
      "[x] Checked item",
      "[?] Unknown item",
    ])
  })
})

describe("processMessageContent", () => {
  it("detects CONTRACT ACTIVE and activates contract", () => {
    const state = createInitialState()
    const content = `========================================
CONTRACT ACTIVE
========================================
OBJECTIVE: Test objective

SUCCESS CRITERIA:
- [ ] Do something
========================================`

    const newState = processMessageContent(state, content)

    expect(newState.contract.active).toBe(true)
    expect(newState.contract.objective).toBe("Test objective")
  })

  it("detects CONTRACT FULFILLED and deactivates contract", () => {
    const state = {
      ...createInitialState(),
      contract: { ...createEmptyContract(), active: true },
    }
    const content = "CONTRACT FULFILLED - all criteria met"

    const newState = processMessageContent(state, content)

    expect(newState.contract.active).toBe(false)
    expect(newState.status).toBe("earth")
  })

  it("detects CONTRACT VOIDED and deactivates contract", () => {
    const state = {
      ...createInitialState(),
      contract: { ...createEmptyContract(), active: true },
    }
    const content = "CONTRACT VOIDED - user requested changes"

    const newState = processMessageContent(state, content)

    expect(newState.contract.active).toBe(false)
  })

  it("detects OpenSpec change from path references", () => {
    const state = createInitialState()
    const content = "Working on openspec/changes/add-feature/proposal.md"

    const newState = processMessageContent(state, content)

    expect(newState.openSpecChange).toBe("add-feature")
  })
})

describe("updateStateStatus", () => {
  it("updates status and icon", () => {
    const state = createInitialState()

    const newState = updateStateStatus(state, "work")

    expect(newState.status).toBe("work")
    expect(newState.icon).toBe("\u{1F680}") // Rocket emoji
  })

  it("preserves other state fields", () => {
    const state = {
      ...createInitialState(),
      activeSubAgents: 2,
      openSpecChange: "test-change",
    }

    const newState = updateStateStatus(state, "moon")

    expect(newState.activeSubAgents).toBe(2)
    expect(newState.openSpecChange).toBe("test-change")
  })
})

describe("extractCriterionFromTask", () => {
  it("normalizes task description to kebab-case", () => {
    expect(extractCriterionFromTask("Check the files")).toBe("check-the-files")
    expect(extractCriterionFromTask("Run Tests")).toBe("run-tests")
  })

  it("handles undefined input", () => {
    expect(extractCriterionFromTask(undefined)).toBe("unknown")
  })

  it("handles empty input", () => {
    expect(extractCriterionFromTask("")).toBe("unknown")
    expect(extractCriterionFromTask("   ")).toBe("unknown")
  })
})

describe("sub-agent failure tracking", () => {
  it("records failures for criterion", () => {
    let state = createInitialState()

    state = recordSubAgentFailure(state, "test-criterion")
    expect(state.subAgentFailures.get("test-criterion")).toBe(1)

    state = recordSubAgentFailure(state, "test-criterion")
    expect(state.subAgentFailures.get("test-criterion")).toBe(2)
  })

  it("clears failures for criterion", () => {
    let state = createInitialState()
    state = recordSubAgentFailure(state, "test-criterion")
    state = recordSubAgentFailure(state, "test-criterion")

    state = clearSubAgentFailures(state, "test-criterion")

    expect(state.subAgentFailures.has("test-criterion")).toBe(false)
  })

  it("detects doom loop threshold", () => {
    let state = createInitialState()

    // Below threshold
    state = recordSubAgentFailure(state, "test-criterion")
    state = recordSubAgentFailure(state, "test-criterion")
    expect(isDoomLoopReached(state, "test-criterion")).toBe(false)

    // At threshold (3)
    state = recordSubAgentFailure(state, "test-criterion")
    expect(isDoomLoopReached(state, "test-criterion")).toBe(true)
  })
})
