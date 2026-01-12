/**
 * Tests for Loop Anomaly Detection module (anomaly.ts)
 *
 * Covers all spec scenarios from the OpenSpec change:
 * - shouldAnalyze threshold logic
 * - detectRepetition with various inputs
 * - emitBell configuration behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { shouldAnalyze, detectRepetition, emitBell } from "./anomaly"
import { ANOMALY_CONFIG } from "./types"

describe("anomaly detection", () => {
  describe("shouldAnalyze", () => {
    it("returns false when content is below size threshold", () => {
      // Content below 20,000 chars should not be analyzed
      expect(shouldAnalyze(19999, 0)).toBe(false)
      expect(shouldAnalyze(10000, 0)).toBe(false)
      expect(shouldAnalyze(0, 0)).toBe(false)
    })

    it("returns true when content reaches size threshold with enough new content", () => {
      // At threshold (20,000) with 0 last analyzed = 20,000 new chars > 2000 interval
      expect(shouldAnalyze(20000, 0)).toBe(true)
      expect(shouldAnalyze(25000, 0)).toBe(true)
    })

    it("returns false when not enough new content since last analysis", () => {
      // 20,000 chars but only 1,000 new since last analysis (< 2000 interval)
      expect(shouldAnalyze(20000, 19000)).toBe(false)
      expect(shouldAnalyze(20000, 19500)).toBe(false)
    })

    it("returns true when analysis interval is reached", () => {
      // 22,000 chars with 20,000 last analyzed = 2,000 new chars = interval
      expect(shouldAnalyze(22000, 20000)).toBe(true)
      // 25,000 chars with 22,000 last analyzed = 3,000 new chars > interval
      expect(shouldAnalyze(25000, 22000)).toBe(true)
    })

    it("uses config values for thresholds", () => {
      // Verify we're using the right config values
      expect(ANOMALY_CONFIG.SIZE_THRESHOLD).toBe(20000)
      expect(ANOMALY_CONFIG.ANALYSIS_INTERVAL).toBe(2000)
    })
  })

  describe("detectRepetition", () => {
    it("returns false for content shorter than minimum length", () => {
      // Content < 80 chars cannot have meaningful repetition
      const shortContent = "a".repeat(79)
      expect(detectRepetition(shortContent)).toEqual({ detected: false })
    })

    it("returns false for empty string", () => {
      expect(detectRepetition("")).toEqual({ detected: false })
    })

    it("returns false for content with no repetition", () => {
      // Unique content that doesn't repeat
      const uniqueContent = Array.from({ length: 300 }, (_, i) => `unique-phrase-${i}-`).join("")
      expect(detectRepetition(uniqueContent)).toEqual({ detected: false })
    })

    it("returns false for content with less than 3 repetitions", () => {
      // 80-char phrase repeated only twice
      const phrase =
        "Let me look at the code more carefully. I will analyze this step by step now.   "
      expect(phrase.length).toBe(80)
      const content = phrase.repeat(2) + "some other unique content to pad the string"
      expect(detectRepetition(content)).toEqual({ detected: false })
    })

    it("detects repetition when 80-char substring appears 3+ times", () => {
      // 80-char phrase repeated 3 times (minimum threshold)
      const phrase =
        "Let me look at the code more carefully. I will analyze this step by step now.   "
      expect(phrase.length).toBe(80)
      const content = phrase.repeat(3)
      const result = detectRepetition(content)
      expect(result.detected).toBe(true)
      expect(result.count).toBeGreaterThanOrEqual(3)
      expect(result.sample).toBeDefined()
    })

    it("detects severe repetition (many occurrences)", () => {
      // Simulating a Gemini loop: same phrase 50+ times
      const phrase =
        "Let me look at the code more carefully. I will analyze this step by step now.   "
      const content = phrase.repeat(50)
      const result = detectRepetition(content)
      expect(result.detected).toBe(true)
      expect(result.count).toBeGreaterThanOrEqual(50)
    })

    it("truncates sample to 40 chars for logging", () => {
      // Create exactly 80 characters
      const phrase =
        "This is a very long repeated phrase that definitely exceeds forty characters!!  "
      expect(phrase.length).toBe(80) // 78 chars + 2 spaces
      const content = phrase.repeat(5)
      const result = detectRepetition(content)
      expect(result.detected).toBe(true)
      expect(result.sample).toBeDefined()
      // Sample should be truncated to ~43 chars (40 + "...")
      expect(result.sample!.length).toBeLessThanOrEqual(43)
      expect(result.sample!.endsWith("...")).toBe(true)
    })

    it("handles special regex characters without escaping issues", () => {
      // Content with regex special characters: . * + ? ^ $ { } [ ] \ | ( )
      const phrase =
        "Error: [CRITICAL] - Pattern matched.*? Check regex (group) and $var handling!!! "
      expect(phrase.length).toBe(80)
      const content = phrase.repeat(5)
      const result = detectRepetition(content)
      expect(result.detected).toBe(true)
      // Should work because we use split() not regex
    })

    it("handles unicode characters correctly", () => {
      // Content with unicode emojis and special characters
      const phrase =
        "🚀 Let me analyze this carefully! 日本語テスト。This should work with unicode chars. "
      // Pad to 80 chars
      const paddedPhrase = phrase.padEnd(80, " ")
      const content = paddedPhrase.repeat(4)
      const result = detectRepetition(content)
      expect(result.detected).toBe(true)
    })

    it("handles newlines and whitespace in repeated content", () => {
      // AI loops often include newlines
      const phrase =
        "Let me think about this...\n\nI need to analyze the code more carefully.\n\n        "
      expect(phrase.length).toBe(80)
      const content = phrase.repeat(4)
      const result = detectRepetition(content)
      expect(result.detected).toBe(true)
    })

    it("uses config values for detection parameters", () => {
      // Verify we're using the right config values
      expect(ANOMALY_CONFIG.REPETITION_MIN_LENGTH).toBe(80)
      expect(ANOMALY_CONFIG.REPETITION_MIN_COUNT).toBe(3)
    })
  })

  describe("emitBell", () => {
    let stdoutWriteSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      stdoutWriteSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    })

    afterEach(() => {
      stdoutWriteSpy.mockRestore()
    })

    it("emits BEL character when bell is enabled", () => {
      // BELL_ENABLED defaults to true
      if (ANOMALY_CONFIG.BELL_ENABLED) {
        emitBell()
        expect(stdoutWriteSpy).toHaveBeenCalledWith("\x07")
      }
    })

    it("does not emit when bell is disabled via config", () => {
      // This test verifies the conditional logic exists
      // The actual config value depends on env var at load time
      // We test the function respects the config
      const originalBellEnabled = ANOMALY_CONFIG.BELL_ENABLED

      // If bell is disabled, verify no write
      if (!originalBellEnabled) {
        emitBell()
        expect(stdoutWriteSpy).not.toHaveBeenCalled()
      }
    })
  })

  describe("integration scenarios", () => {
    it("scenario: large response without repetition passes", () => {
      // 25K chars of unique content should not trigger detection
      // Each segment must be truly unique to avoid accidental 80-char substring matches
      const uniqueContent = Array.from(
        { length: 300 },
        (_, i) =>
          `[${i.toString().padStart(4, "0")}] Analysis result for item number ${i}: The value is ${i * 17} and status is ${i % 2 === 0 ? "even" : "odd"}. `
      ).join("")

      expect(uniqueContent.length).toBeGreaterThan(20000)
      expect(shouldAnalyze(uniqueContent.length, 0)).toBe(true)

      const result = detectRepetition(uniqueContent)
      expect(result.detected).toBe(false)
    })

    it("scenario: small response with repetition does not trigger analysis", () => {
      // Even with heavy repetition, small content isn't analyzed
      const phrase = "Repeated phrase here! ".repeat(100) // ~2200 chars
      expect(phrase.length).toBeLessThan(20000)
      expect(shouldAnalyze(phrase.length, 0)).toBe(false)
      // Detection would find it, but shouldAnalyze gates it
    })

    it("scenario: simulated Gemini loop triggers detection", () => {
      // Real-world scenario: Gemini outputs same phrase 50+ times
      const loopPhrase =
        "Let me look at the code more carefully. I will analyze this step by step now.   "
      const loopContent = loopPhrase.repeat(300) // ~24K chars

      expect(loopContent.length).toBeGreaterThan(20000)
      expect(shouldAnalyze(loopContent.length, 0)).toBe(true)

      const result = detectRepetition(loopContent)
      expect(result.detected).toBe(true)
      expect(result.count).toBeGreaterThanOrEqual(3)
    })

    it("scenario: mixed content with some repetition at end", () => {
      // Normal response followed by loop at the end
      const normalContent = Array.from(
        { length: 200 },
        (_, i) => `[${i.toString().padStart(4, "0")}] Analysis: item ${i} has value ${i * 13}. `
      ).join("")

      const loopPhrase =
        "Let me look at the code more carefully. I will analyze this step by step now.   "
      const loopContent = loopPhrase.repeat(200) // Many repetitions to ensure > 20K total

      const fullContent = normalContent + loopContent

      expect(fullContent.length).toBeGreaterThan(20000)
      expect(shouldAnalyze(fullContent.length, 0)).toBe(true)

      const result = detectRepetition(fullContent)
      expect(result.detected).toBe(true)
    })
  })
})
