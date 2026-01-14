import { describe, it, expect } from "vitest"
import {
  createInitialState,
  processCheckpoints,
  recordSubAgentWork,
  updateSubAgentWork,
  validateCriterionId,
  sanitizePath,
  extractCriterionFromTask,
} from "./contract"
import { ConvergencePhase } from "./types"

describe("Sub-Agent Work Tracking", () => {
  it("records work scope with sanitized paths", () => {
    const state = createInitialState()
    const newState = recordSubAgentWork(state, "test-id", ["src/foo.ts", "src\\bar.ts"])

    const work = newState.subAgentWork.get("test-id")
    expect(work).toBeDefined()
    expect(work?.files).toContain("src/foo.ts")
    expect(work?.files).toContain("src/bar.ts")
    expect(work?.status).toBe("pending")
  })

  it("updates work status and findings count on completion", () => {
    const state = createInitialState()
    const state1 = recordSubAgentWork(state, "test-id", ["src/foo.ts"])
    const state2 = updateSubAgentWork(state1, "test-id", 5, "complete")

    const work = state2.subAgentWork.get("test-id")
    expect(work?.status).toBe("complete")
    expect(work?.findingsCount).toBe(5)
  })
})

describe("Convergence State Management", () => {
  it("advances phase on checkpoint", () => {
    const state = {
      ...createInitialState(),
      convergenceState: {
        phase: ConvergencePhase.DISCOVERY,
        progress: 0,
        checkpoints: [],
        pendingSubAgents: new Set<string>(),
        expectedFindings: 0,
        receivedFindings: 0,
        startTime: Date.now(),
      },
    }

    const newState = processCheckpoints(state, "[GOOST:CHECKPOINT:DISCOVERY_COMPLETE findings=10]")
    expect(newState.convergenceState?.phase).toBe(ConvergencePhase.MAPPING)
    expect(newState.convergenceState?.receivedFindings).toBe(10)
    expect(newState.convergenceState?.checkpoints).toContain("DISCOVERY_COMPLETE")
  })

  it("handles multiple checkpoints and state transitions", () => {
     let state = {
      ...createInitialState(),
      convergenceState: {
        phase: ConvergencePhase.DISCOVERY,
        progress: 0,
        checkpoints: [],
        pendingSubAgents: new Set<string>(),
        expectedFindings: 0,
        receivedFindings: 0,
        startTime: Date.now(),
      },
    }

    state = processCheckpoints(state, "[GOOST:CHECKPOINT:DISCOVERY_COMPLETE]")
    expect(state.convergenceState?.phase).toBe(ConvergencePhase.MAPPING)

    state = processCheckpoints(state, "[GOOST:CHECKPOINT:MAPPING_COMPLETE]")
    expect(state.convergenceState?.phase).toBe(ConvergencePhase.SYNTHESIS)

    state = processCheckpoints(state, "[GOOST:CHECKPOINT:SYNTHESIS_COMPLETE]")
    expect(state.convergenceState?.phase).toBe(ConvergencePhase.COMPLETE)
  })
})

describe("Security & Validation", () => {
  it("validates criterion IDs", () => {
    expect(validateCriterionId("safe_id-123")).toBe(true)
    expect(validateCriterionId("invalid ID!")).toBe(false)
    expect(validateCriterionId("../secret")).toBe(false)
  })

  it("sanitizes paths", () => {
    expect(sanitizePath("src\\foo\\bar.ts")).toBe("src/foo/bar.ts")
    expect(sanitizePath("../../etc/passwd")).toBe("etc/passwd")
  })

  it("extracts and normalizes criterion ID from description", () => {
    expect(extractCriterionFromTask("Record work scope")).toBe("record-work-scope")
    expect(extractCriterionFromTask("Handle error in phase 1")).toBe("handle-error-in-phase-1")
    expect(extractCriterionFromTask("??? suspicious !!!")).toBe("suspicious")
  })
})
