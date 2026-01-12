/**
 * Tests for types.ts - Environment variable parsing and config
 *
 * Covers spec scenarios:
 * - Custom size threshold via GOOST_ANOMALY_SIZE
 * - Default thresholds when env vars not set
 * - Invalid size threshold value (debug warning)
 * - Bell enable/disable via GOOST_ANOMALY_BELL
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { parseEnvInt, parseEnvBool, ANOMALY_CONFIG } from "./types"

describe("parseEnvInt", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  const originalDebug = process.env.GOOST_DEBUG

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    process.env.GOOST_DEBUG = originalDebug
  })

  it("returns default when value is undefined", () => {
    expect(parseEnvInt(undefined, 100)).toBe(100)
    expect(parseEnvInt(undefined, 20000)).toBe(20000)
  })

  it("returns default when value is empty string", () => {
    expect(parseEnvInt("", 100)).toBe(100)
  })

  it("parses valid integer strings", () => {
    expect(parseEnvInt("50000", 20000)).toBe(50000)
    expect(parseEnvInt("100", 20000)).toBe(100)
    expect(parseEnvInt("0", 20000)).toBe(0)
  })

  it("returns default for non-numeric strings", () => {
    expect(parseEnvInt("abc", 20000)).toBe(20000)
    expect(parseEnvInt("not-a-number", 100)).toBe(100)
  })

  it("returns default for partially numeric strings", () => {
    // parseInt will parse "123abc" as 123, which is valid
    expect(parseEnvInt("123abc", 20000)).toBe(123)
    // But "abc123" will return NaN
    expect(parseEnvInt("abc123", 20000)).toBe(20000)
  })

  it("handles negative numbers", () => {
    expect(parseEnvInt("-100", 20000)).toBe(-100)
  })

  it("handles floating point by truncating", () => {
    expect(parseEnvInt("123.456", 20000)).toBe(123)
  })

  describe("debug warning", () => {
    it("logs warning when GOOST_DEBUG=1 and value is invalid", () => {
      process.env.GOOST_DEBUG = "1"
      parseEnvInt("invalid", 20000, "GOOST_ANOMALY_SIZE")
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Goost] Warning: Invalid value for GOOST_ANOMALY_SIZE="invalid", using default 20000'
      )
    })

    it("does not log warning when GOOST_DEBUG is not set", () => {
      delete process.env.GOOST_DEBUG
      parseEnvInt("invalid", 20000, "GOOST_ANOMALY_SIZE")
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it("does not log warning when envName is not provided", () => {
      process.env.GOOST_DEBUG = "1"
      parseEnvInt("invalid", 20000)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it("does not log warning when value is valid", () => {
      process.env.GOOST_DEBUG = "1"
      parseEnvInt("50000", 20000, "GOOST_ANOMALY_SIZE")
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })
  })
})

describe("parseEnvBool", () => {
  it("returns default when value is undefined", () => {
    expect(parseEnvBool(undefined, true)).toBe(true)
    expect(parseEnvBool(undefined, false)).toBe(false)
  })

  it("returns false when value is '0'", () => {
    expect(parseEnvBool("0", true)).toBe(false)
    expect(parseEnvBool("0", false)).toBe(false)
  })

  it("returns true for any non-'0' value", () => {
    expect(parseEnvBool("1", false)).toBe(true)
    expect(parseEnvBool("true", false)).toBe(true)
    expect(parseEnvBool("yes", false)).toBe(true)
    expect(parseEnvBool("anything", false)).toBe(true)
    expect(parseEnvBool("", false)).toBe(true) // empty string is not "0"
  })
})

describe("ANOMALY_CONFIG", () => {
  it("has expected default values", () => {
    // These are the defaults when env vars are not set
    expect(ANOMALY_CONFIG.SIZE_THRESHOLD).toBe(20000)
    expect(ANOMALY_CONFIG.REPETITION_MIN_LENGTH).toBe(80)
    expect(ANOMALY_CONFIG.REPETITION_MIN_COUNT).toBe(3)
    expect(ANOMALY_CONFIG.ANALYSIS_INTERVAL).toBe(2000)
    // BELL_ENABLED defaults to true, but might be overridden by env
    expect(typeof ANOMALY_CONFIG.BELL_ENABLED).toBe("boolean")
  })

  it("config values are readonly", () => {
    // TypeScript ensures this at compile time via `as const`
    // At runtime, we verify the object structure exists
    expect(Object.keys(ANOMALY_CONFIG)).toEqual([
      "SIZE_THRESHOLD",
      "REPETITION_MIN_LENGTH",
      "REPETITION_MIN_COUNT",
      "ANALYSIS_INTERVAL",
      "BELL_ENABLED",
    ])
  })
})
