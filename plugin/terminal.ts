/**
 * Goost Plugin - Terminal Utilities
 *
 * Handles terminal tab title updates via multiple strategies:
 * 1. Direct /dev/tty access (most reliable, bypasses TUI buffering)
 * 2. tmux rename-window command (when in tmux)
 * 3. OSC escape sequences to stdout (fallback)
 *
 * Research: See tech-notes/Terminal Title Update Technical Reference
 */

import * as fs from "fs"
import { execSync } from "child_process"
import { type GoostStatus } from "./types"

// =============================================================================
// Debug Logging
// =============================================================================

const DEBUG = process.env.GOOST_DEBUG === "1"

/**
 * Log debug message to file for debugging plugin issues.
 * Always logs to file regardless of DEBUG setting.
 */
const logToFile = (msg: string): void => {
  try {
    fs.appendFileSync("/tmp/goost-debug.log", `${new Date().toISOString()} ${msg}\n`)
  } catch {
    // ignore
  }
}

/**
 * Log debug message - to file and stderr if DEBUG is enabled.
 */
const log = (msg: string): void => {
  logToFile(msg)
  if (DEBUG) {
    console.error(`[Goost:terminal] ${msg}`)
  }
}

// =============================================================================
// Environment Detection
// =============================================================================

/**
 * Detect if running inside tmux session.
 * @returns true if TMUX environment variable is set
 */
export const isTmux = (): boolean => !!process.env.TMUX

/**
 * Check if /dev/tty is accessible for direct terminal writes.
 */
const canAccessTty = (): boolean => {
  try {
    fs.accessSync("/dev/tty", fs.constants.W_OK)
    return true
  } catch {
    return false
  }
}

// Cache TTY availability check
let ttyAvailable: boolean | null = null
const isTtyAvailable = (): boolean => {
  if (ttyAvailable === null) {
    ttyAvailable = canAccessTty()
    log(`TTY availability: ${ttyAvailable}`)
  }
  return ttyAvailable
}

// =============================================================================
// Title Setting Strategies
// =============================================================================

/**
 * Strategy 1: Set title via tmux command (most reliable in tmux).
 *
 * Uses `tmux rename-window` which directly updates the window name
 * without needing passthrough escape sequences.
 *
 * @returns true if successful
 */
const setTitleViaTmux = (title: string): boolean => {
  if (!isTmux()) {
    return false
  }

  try {
    // Escape double quotes and special shell characters
    const safeTitle = title.replace(/"/g, '\\"').replace(/\$/g, "\\$")
    execSync(`tmux rename-window "${safeTitle}"`, {
      stdio: "ignore",
      timeout: 1000,
    })
    log(`setTitleViaTmux: SUCCESS - "${title}"`)
    return true
  } catch (error) {
    log(`setTitleViaTmux: FAILED - ${error}`)
    return false
  }
}

/**
 * Strategy 2: Write OSC sequence directly to /dev/tty.
 *
 * Bypasses stdout buffering and TUI interception by writing
 * directly to the controlling terminal.
 *
 * @returns true if successful
 */
const setTitleViaTty = (title: string): boolean => {
  if (!isTtyAvailable()) {
    return false
  }

  try {
    const sequence = `\x1b]0;${title}\x07`
    const fd = fs.openSync("/dev/tty", "w")
    fs.writeSync(fd, sequence)
    fs.closeSync(fd)
    log(`setTitleViaTty: SUCCESS - "${title}"`)
    return true
  } catch (error) {
    log(`setTitleViaTty: FAILED - ${error}`)
    // Mark TTY as unavailable to avoid repeated failures
    ttyAvailable = false
    return false
  }
}

/**
 * Strategy 3: Write OSC sequence to stdout with tmux passthrough.
 *
 * This is the original approach - may not work if OpenCode's TUI
 * intercepts stdout, but worth trying as a fallback.
 *
 * When running inside tmux, escape sequences must be wrapped in DCS passthrough:
 * \x1bPtmux;\x1b<escaped_sequence>\x1b\\
 *
 * @returns true (always, since we can't verify success)
 */
const setTitleViaStdout = (title: string): boolean => {
  try {
    const sequence = `\x1b]0;${title}\x07`

    if (isTmux()) {
      // tmux passthrough: wrap sequence and double all ESC characters
      const escaped = sequence.replace(/\x1b/g, "\x1b\x1b")
      process.stdout.write(`\x1bPtmux;${escaped}\x1b\\`)
    } else {
      process.stdout.write(sequence)
    }

    log(`setTitleViaStdout: ATTEMPTED - "${title}" (in tmux: ${isTmux()})`)
    return true
  } catch (error) {
    log(`setTitleViaStdout: FAILED - ${error}`)
    return false
  }
}

// =============================================================================
// Title Management
// =============================================================================

/**
 * Set the terminal/pane title using all applicable methods.
 *
 * In tmux on Windows Terminal, we need BOTH:
 * 1. tmux rename-window - updates tmux status bar
 * 2. OSC sequence - updates Windows Terminal tab title
 *
 * These are not mutually exclusive - we want both to succeed.
 *
 * @param title - The title to set
 */
const setTitle = (title: string): void => {
  log(`setTitle: "${title}"`)

  // In tmux: do BOTH tmux rename AND OSC sequence
  // tmux rename-window updates the tmux status bar
  // OSC sequence (via passthrough) updates Windows Terminal tab
  if (isTmux()) {
    setTitleViaTmux(title)
    // Also send OSC via TTY or stdout passthrough for Windows Terminal
    if (!setTitleViaTty(title)) {
      setTitleViaStdout(title)
    }
    return
  }

  // Not in tmux: try TTY first, then stdout
  if (setTitleViaTty(title)) {
    return
  }

  setTitleViaStdout(title)
}

/**
 * Reset the terminal title to empty.
 */
const resetTitle = (): void => {
  log("resetTitle")

  // In tmux: reset BOTH tmux window name AND send OSC for Windows Terminal
  if (isTmux()) {
    try {
      execSync('tmux rename-window ""', { stdio: "ignore", timeout: 1000 })
    } catch {
      // Continue anyway
    }

    // Also send OSC via TTY or stdout passthrough for Windows Terminal
    if (isTtyAvailable()) {
      try {
        const fd = fs.openSync("/dev/tty", "w")
        fs.writeSync(fd, "\x1b]0;\x07")
        fs.closeSync(fd)
      } catch {
        // Try stdout passthrough
        try {
          process.stdout.write("\x1bPtmux;\x1b\x1b]0;\x07\x1b\\")
        } catch {
          // Ignore
        }
      }
    } else {
      try {
        process.stdout.write("\x1bPtmux;\x1b\x1b]0;\x07\x1b\\")
      } catch {
        // Ignore
      }
    }
    return
  }

  // Not in tmux: try TTY first, then stdout
  if (isTtyAvailable()) {
    try {
      const fd = fs.openSync("/dev/tty", "w")
      fs.writeSync(fd, "\x1b]0;\x07")
      fs.closeSync(fd)
      return
    } catch {
      // Continue to fallback
    }
  }

  try {
    process.stdout.write("\x1b]0;\x07")
  } catch {
    // Ignore
  }
}

/**
 * Full cleanup - reset title.
 * Call this on process exit to restore terminal state.
 */
export const cleanupTerminal = (): void => {
  resetTitle()
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Extract project name from directory path.
 * @param directory - Full directory path
 * @returns Last directory name or "Unknown" if cannot determine
 */
export const getProjectName = (directory: string): string => {
  try {
    const parts = directory.split("/")
    return parts[parts.length - 1] || "Unknown"
  } catch {
    return "Unknown"
  }
}

/**
 * Update terminal tab color based on status.
 * Currently a no-op - tab colors are not reliably supported.
 */
export const updateTabColor = (_status: GoostStatus): void => {
  // Tab coloration removed - not consistently supported
}

/**
 * Update terminal tab title.
 *
 * Format: "emoji projectName: status [progress]"
 *
 * @param projectName - Project name
 * @param statusText - Status text for title (includes emoji)
 * @param contractProgress - Optional contract progress (e.g., "1/3")
 * @param openSpecChange - Optional OpenSpec change name
 */
export const updateTitle = (
  projectName: string,
  statusText: string,
  contractProgress: string | null,
  openSpecChange: string | null
): void => {
  log(
    `updateTitle: project=${projectName}, status=${statusText}, progress=${contractProgress}, change=${openSpecChange}`
  )

  const progressText = contractProgress ? ` [${contractProgress}]` : ""

  let title: string
  if (openSpecChange) {
    // Show OpenSpec change name
    const emoji = statusText.split(" ")[0] || ""
    title = `${emoji} ${projectName}: ${openSpecChange}${progressText}`
  } else if (statusText.trim()) {
    title = `${statusText} ${projectName}${progressText}`
  } else {
    // Idle with no contract - just show project name with emoji
    title = `🌍 ${projectName}${progressText}`
  }

  setTitle(title)
}
