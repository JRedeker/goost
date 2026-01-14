/**
 * Tests for types.ts - Type definitions and constants
 */

import { describe, it, expect } from "vitest"
import {
  STATUS_EMOJIS,
  TAB_COLORS,
  GOOST_MARKERS,
  CONTRACT_PATTERNS,
  EVENT_TYPES,
  TOOL_NAMES,
  isTaskTool,
  DOOM_LOOP_THRESHOLD,
  SessionStatusPropsSchema,
  MessageUpdatedPropsSchema,
  TaskArgsSchema,
  TaskOutputSchema,
} from "./types"

describe("STATUS_EMOJIS", () => {
  it("has emojis for all statuses", () => {
    expect(STATUS_EMOJIS.idle).toBeDefined()
    expect(STATUS_EMOJIS.work).toBeDefined()
    expect(STATUS_EMOJIS.moon).toBeDefined()
    expect(STATUS_EMOJIS.earth).toBeDefined()
    expect(STATUS_EMOJIS.mic).toBeDefined()
    expect(STATUS_EMOJIS.doom_loop).toBeDefined()
    expect(STATUS_EMOJIS.tdd_red).toBeDefined()
    expect(STATUS_EMOJIS.tdd_green).toBeDefined()
  })

  it("work and rocket share the same icon", () => {
    expect(STATUS_EMOJIS.work).toBe(STATUS_EMOJIS.rocket)
  })

  it("idle and earth share the same icon", () => {
    expect(STATUS_EMOJIS.idle).toBe(STATUS_EMOJIS.earth)
  })
})

describe("TAB_COLORS", () => {
  it("has colors for all statuses", () => {
    expect(TAB_COLORS.idle).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(TAB_COLORS.work).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(TAB_COLORS.moon).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(TAB_COLORS.earth).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(TAB_COLORS.mic).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(TAB_COLORS.doom_loop).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })
})

describe("GOOST_MARKERS", () => {
  it("has regex patterns for all statuses", () => {
    expect(GOOST_MARKERS.moon.test("[GOOST:MOON]")).toBe(true)
    expect(GOOST_MARKERS.earth.test("[GOOST:EARTH]")).toBe(true)
    expect(GOOST_MARKERS.work.test("[GOOST:WORK]")).toBe(true)
    expect(GOOST_MARKERS.doom_loop.test("[GOOST:DOOM_LOOP]")).toBe(true)
  })

  it("does not match incorrect markers", () => {
    expect(GOOST_MARKERS.moon.test("[GOOST:EARTH]")).toBe(false)
    expect(GOOST_MARKERS.earth.test("[GOOST:MOON]")).toBe(false)
  })
})

describe("CONTRACT_PATTERNS", () => {
  it("matches CONTRACT ACTIVE", () => {
    expect(CONTRACT_PATTERNS.ACTIVE.test("CONTRACT ACTIVE")).toBe(true)
    expect(CONTRACT_PATTERNS.ACTIVE.test("Some text CONTRACT ACTIVE more text")).toBe(true)
  })

  it("matches CONTRACT FULFILLED", () => {
    expect(CONTRACT_PATTERNS.FULFILLED.test("CONTRACT FULFILLED")).toBe(true)
  })

  it("matches CONTRACT VOIDED", () => {
    expect(CONTRACT_PATTERNS.VOIDED.test("CONTRACT VOIDED")).toBe(true)
  })
})

describe("EVENT_TYPES", () => {
  it("has expected event type constants", () => {
    expect(EVENT_TYPES.SESSION_STATUS).toBe("session.status")
    expect(EVENT_TYPES.SESSION_DELETED).toBe("session.deleted")
    expect(EVENT_TYPES.MESSAGE_UPDATED).toBe("message.updated")
    expect(EVENT_TYPES.SESSION_COMPACTED).toBe("session.compacted")
    expect(EVENT_TYPES.PERMISSION_UPDATED).toBe("permission.updated")
    expect(EVENT_TYPES.PERMISSION_REPLIED).toBe("permission.replied")
  })
})

describe("TOOL_NAMES and isTaskTool", () => {
  it("has task tool constants", () => {
    expect(TOOL_NAMES.TASK).toBe("task")
    expect(TOOL_NAMES.TASK_ALT).toBe("mcp_task")
  })

  it("isTaskTool identifies task tools", () => {
    expect(isTaskTool("task")).toBe(true)
    expect(isTaskTool("mcp_task")).toBe(true)
    expect(isTaskTool("bash")).toBe(false)
  })
})

describe("DOOM_LOOP_THRESHOLD", () => {
  it("has a reasonable default threshold", () => {
    expect(DOOM_LOOP_THRESHOLD).toBe(3)
  })
})

describe("Zod schemas", () => {
  describe("SessionStatusPropsSchema", () => {
    it("validates correct structure", () => {
      const valid = {
        sessionID: "abc-123",
        status: { type: "idle" },
      }
      expect(SessionStatusPropsSchema.safeParse(valid).success).toBe(true)
    })

    it("rejects missing fields", () => {
      const invalid = { status: { type: "idle" } }
      expect(SessionStatusPropsSchema.safeParse(invalid).success).toBe(false)
    })
  })

  describe("MessageUpdatedPropsSchema", () => {
    it("validates correct structure", () => {
      const valid = {
        info: {
          role: "assistant",
          parts: [{ type: "text", text: "Hello" }],
        },
      }
      expect(MessageUpdatedPropsSchema.safeParse(valid).success).toBe(true)
    })

    it("allows optional info", () => {
      const valid = { info: undefined }
      expect(MessageUpdatedPropsSchema.safeParse(valid).success).toBe(true)
    })
  })

  describe("TaskArgsSchema", () => {
    it("validates task arguments", () => {
      const valid = {
        description: "Test task",
        prompt: "Do something",
      }
      expect(TaskArgsSchema.safeParse(valid).success).toBe(true)
    })

    it("allows empty object", () => {
      expect(TaskArgsSchema.safeParse({}).success).toBe(true)
    })
  })

  describe("TaskOutputSchema", () => {
    it("validates task output", () => {
      const valid = {
        title: "Task completed",
        output: "Results here",
      }
      expect(TaskOutputSchema.safeParse(valid).success).toBe(true)
    })
  })
})
