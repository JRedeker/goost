/**
 * Tests for index.ts - Plugin integration
 */

import { describe, it, expect } from "vitest"
import { createInitialState, updateStateStatus } from "./contract"
import { isTaskTool } from "./types"

describe("plugin state management", () => {
  it("creates initial state with idle status", () => {
    const state = createInitialState()

    expect(state.status).toBe("idle")
    expect(state.activeSubAgents).toBe(0)
  })

  it("tracks sub-agent count", () => {
    let state = createInitialState()

    // Simulate sub-agent starting
    state = {
      ...state,
      activeSubAgents: state.activeSubAgents + 1,
    }
    state = updateStateStatus(state, "moon")

    expect(state.activeSubAgents).toBe(1)
    expect(state.status).toBe("moon")

    // Simulate sub-agent completing
    state = {
      ...state,
      activeSubAgents: Math.max(0, state.activeSubAgents - 1),
    }
    state = updateStateStatus(state, "work")

    expect(state.activeSubAgents).toBe(0)
    expect(state.status).toBe("work")
  })
})

describe("isTaskTool", () => {
  it("recognizes task tool names", () => {
    expect(isTaskTool("task")).toBe(true)
    expect(isTaskTool("mcp_task")).toBe(true)
  })

  it("rejects non-task tool names", () => {
    expect(isTaskTool("bash")).toBe(false)
    expect(isTaskTool("read")).toBe(false)
    expect(isTaskTool("edit")).toBe(false)
  })
})

describe("status transitions", () => {
  it("transitions from idle to work on busy", () => {
    const state = createInitialState()
    const newState = updateStateStatus(state, "work")

    expect(newState.status).toBe("work")
  })

  it("transitions to moon when sub-agent starts", () => {
    const state = createInitialState()
    const newState = updateStateStatus({ ...state, activeSubAgents: 1 }, "moon")

    expect(newState.status).toBe("moon")
  })

  it("transitions to earth when contract complete", () => {
    const state = {
      ...createInitialState(),
      contract: { ...createInitialState().contract, active: true },
    }
    const newState = updateStateStatus(state, "earth")

    expect(newState.status).toBe("earth")
  })

  it("transitions to mic on permission request", () => {
    const state = createInitialState()
    const newState = updateStateStatus(state, "mic")

    expect(newState.status).toBe("mic")
  })
})
