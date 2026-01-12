/**
 * Tests for contract.ts - Anomaly state factory functions
 *
 * Covers spec scenarios:
 * - Throttle reset on new response (createInitialAnomalyState)
 * - Initial state structure
 */

import { describe, it, expect } from "vitest"
import { createInitialAnomalyState, createInitialState } from "./contract"

describe("createInitialAnomalyState", () => {
  it("creates state with all fields initialized to defaults", () => {
    const state = createInitialAnomalyState()

    expect(state).toEqual({
      lastAnalyzedLength: 0,
      abortedThisResponse: false,
      toolExecuting: false,
      abortQueued: false,
    })
  })

  it("returns a new object each time (not shared reference)", () => {
    const state1 = createInitialAnomalyState()
    const state2 = createInitialAnomalyState()

    expect(state1).not.toBe(state2)
    expect(state1).toEqual(state2)
  })

  it("has immutable-friendly structure", () => {
    const state = createInitialAnomalyState()

    // Can be spread for updates (immutable pattern)
    const updated = { ...state, abortedThisResponse: true }

    expect(updated.abortedThisResponse).toBe(true)
    expect(state.abortedThisResponse).toBe(false) // Original unchanged
  })
})

describe("createInitialState (plugin state)", () => {
  it("includes anomalyState in initial plugin state", () => {
    const state = createInitialState()

    expect(state.anomalyState).toBeDefined()
    expect(state.anomalyState).toEqual({
      lastAnalyzedLength: 0,
      abortedThisResponse: false,
      toolExecuting: false,
      abortQueued: false,
    })
  })

  it("creates complete plugin state structure", () => {
    const state = createInitialState()

    // Verify anomaly state is part of full state
    expect(state).toHaveProperty("status")
    expect(state).toHaveProperty("icon")
    expect(state).toHaveProperty("contract")
    expect(state).toHaveProperty("anomalyState")
  })
})

describe("anomaly state usage patterns", () => {
  it("tracks analysis progress via lastAnalyzedLength", () => {
    const initial = createInitialAnomalyState()
    expect(initial.lastAnalyzedLength).toBe(0)

    // After analyzing 25000 chars
    const afterAnalysis = { ...initial, lastAnalyzedLength: 25000 }
    expect(afterAnalysis.lastAnalyzedLength).toBe(25000)
  })

  it("tracks abort status via abortedThisResponse", () => {
    const initial = createInitialAnomalyState()
    expect(initial.abortedThisResponse).toBe(false)

    // After an abort is triggered
    const afterAbort = { ...initial, abortedThisResponse: true }
    expect(afterAbort.abortedThisResponse).toBe(true)
  })

  it("tracks tool execution state", () => {
    const initial = createInitialAnomalyState()
    expect(initial.toolExecuting).toBe(false)

    // During tool execution
    const duringTool = { ...initial, toolExecuting: true }
    expect(duringTool.toolExecuting).toBe(true)
  })

  it("tracks queued abort state", () => {
    const initial = createInitialAnomalyState()
    expect(initial.abortQueued).toBe(false)

    // When abort is queued during tool execution
    const queued = { ...initial, toolExecuting: true, abortQueued: true }
    expect(queued.abortQueued).toBe(true)
    expect(queued.toolExecuting).toBe(true)
  })

  it("resets all flags for new response (throttle reset scenario)", () => {
    // Simulate state after an abort was triggered and tool completed
    const afterActivity = {
      lastAnalyzedLength: 30000,
      abortedThisResponse: true,
      toolExecuting: false,
      abortQueued: false,
    }

    // On new response, reset to initial
    const reset = createInitialAnomalyState()

    expect(reset.lastAnalyzedLength).toBe(0)
    expect(reset.abortedThisResponse).toBe(false)
    expect(reset.toolExecuting).toBe(false)
    expect(reset.abortQueued).toBe(false)

    // Verify it's different from the active state
    expect(reset).not.toEqual(afterActivity)
  })
})
