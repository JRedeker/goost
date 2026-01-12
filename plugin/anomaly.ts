/**
 * Goost Plugin - Loop Anomaly Detection
 *
 * Detects runaway AI responses with repetitive content and terminates them.
 * Uses simple substring matching for efficiency and reliability.
 *
 * Detection triggers when BOTH conditions are met:
 * 1. Response size exceeds threshold (default: 20,000 characters)
 * 2. Any 80+ character substring appears 3+ times
 */

import { ANOMALY_CONFIG } from "./types"

// =============================================================================
// Types
// =============================================================================

/**
 * Result of anomaly detection check.
 */
export interface AnomalyDetectionResult {
  /** Whether an anomaly was detected */
  detected: boolean
  /** Sample of the repeated substring (truncated for logging) */
  sample?: string
  /** Number of times the substring was found */
  count?: number
}

// =============================================================================
// Detection Logic
// =============================================================================

/**
 * Check if content should be analyzed for anomalies.
 * Only analyze when size threshold is reached and enough new content exists.
 *
 * @param contentLength - Current content length
 * @param lastAnalyzedLength - Length when last analysis was performed
 * @returns Whether analysis should be performed
 */
export function shouldAnalyze(contentLength: number, lastAnalyzedLength: number): boolean {
  return (
    contentLength >= ANOMALY_CONFIG.SIZE_THRESHOLD &&
    contentLength - lastAnalyzedLength >= ANOMALY_CONFIG.ANALYSIS_INTERVAL
  )
}

/**
 * Detect repetitive content in a string.
 * Uses substring matching with stride to find repeated phrases.
 *
 * Algorithm:
 * - Stride through content at half the minimum length (overlapping windows)
 * - For each position, extract an 80-char substring
 * - Count occurrences using string split (avoids regex escaping issues)
 * - If any substring appears 3+ times, return detected
 *
 * @param content - Text content to analyze
 * @returns Detection result with sample if found
 */
export function detectRepetition(content: string): AnomalyDetectionResult {
  const minLength = ANOMALY_CONFIG.REPETITION_MIN_LENGTH
  const minCount = ANOMALY_CONFIG.REPETITION_MIN_COUNT
  const stride = Math.floor(minLength / 2) // 40 chars - overlapping windows

  // Not enough content for meaningful detection
  if (content.length < minLength) {
    return { detected: false }
  }

  for (let i = 0; i <= content.length - minLength; i += stride) {
    const substr = content.substring(i, i + minLength)

    // Count occurrences using split (handles special chars without regex escaping)
    // split returns N+1 elements when there are N occurrences
    const count = content.split(substr).length - 1

    if (count >= minCount) {
      // Truncate sample for logging (show first 40 chars)
      const sample = substr.length > 40 ? substr.slice(0, 40) + "..." : substr
      return { detected: true, sample, count }
    }
  }

  return { detected: false }
}

/**
 * Emit terminal bell if enabled.
 * BEL character (0x07) triggers audible alert in most terminals.
 *
 * @sideeffect Writes to stdout
 */
export function emitBell(): void {
  if (ANOMALY_CONFIG.BELL_ENABLED) {
    process.stdout.write("\x07")
  }
}
