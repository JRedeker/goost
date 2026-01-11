/**
 * Goost Plugin - Terminal Utilities
 *
 * Handles terminal tab title updates via multiple strategies:
 * 1. tmux pane TTY with DCS passthrough (for Windows Terminal tab)
 * 2. tmux rename-window command (for tmux status bar)
 * 3. Direct /dev/tty or stdout (non-tmux fallback)
 *
 * Key insight: In tmux, we need DCS passthrough (\x1bPtmux;...\x1b\\) written
 * to the pane's actual TTY (e.g., /dev/pts/6) to reach Windows Terminal.
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
 */
export const isTmux = (): boolean => !!process.env.TMUX

/**
 * Get the tmux pane's TTY path (e.g., /dev/pts/6).
 * This is the actual terminal device we need to write to.
 */
const getTmuxPaneTty = (): string | null => {
  if (!isTmux()) {
    return null
  }

  try {
    const result = execSync("tmux display-message -p '#{pane_tty}'", {
      encoding: "utf8",
      timeout: 1000,
      stdio: ["pipe", "pipe", "pipe"],
    })
    const tty = result.trim()
    if (tty && tty.startsWith("/dev/")) {
      log(`getTmuxPaneTty: ${tty}`)
      return tty
    }
  } catch (error) {
    log(`getTmuxPaneTty: FAILED - ${error}`)
  }

  return null
}

// Cache the pane TTY path
let cachedPaneTty: string | null | undefined = undefined
const getPaneTty = (): string | null => {
  if (cachedPaneTty === undefined) {
    cachedPaneTty = getTmuxPaneTty()
  }
  return cachedPaneTty
}

// =============================================================================
// Title Setting Strategies
// =============================================================================

/**
 * Strategy 1: Write DCS passthrough to tmux pane TTY.
 *
 * This sends the OSC title sequence wrapped in tmux DCS passthrough
 * directly to the pane's TTY device, which reaches Windows Terminal.
 *
 * Format: \x1bPtmux;\x1b\x1b]0;TITLE\x07\x1b\\
 *
 * @returns true if successful
 */
const setTitleViaPaneTty = (title: string): boolean => {
  const paneTty = getPaneTty()
  if (!paneTty) {
    return false
  }

  try {
    // DCS passthrough: ESC P tmux; ESC ESC ] 0 ; title BEL ESC \
    // The inner ESC is doubled for passthrough
    const sequence = `\x1bPtmux;\x1b\x1b]0;${title}\x07\x1b\\`
    const fd = fs.openSync(paneTty, "w")
    fs.writeSync(fd, sequence)
    fs.closeSync(fd)
    log(`setTitleViaPaneTty: SUCCESS - "${title}" via ${paneTty}`)
    return true
  } catch (error) {
    log(`setTitleViaPaneTty: FAILED - ${error}`)
    // Invalidate cache in case TTY changed
    cachedPaneTty = undefined
    return false
  }
}

/**
 * Strategy 2: Set title via tmux rename-window command.
 *
 * Updates the tmux status bar window name.
 *
 * @returns true if successful
 */
const setTitleViaTmuxRename = (title: string): boolean => {
  if (!isTmux()) {
    return false
  }

  try {
    const safeTitle = title.replace(/"/g, '\\"').replace(/\$/g, "\\$")
    execSync(`tmux rename-window "${safeTitle}"`, {
      stdio: "ignore",
      timeout: 1000,
    })
    log(`setTitleViaTmuxRename: SUCCESS - "${title}"`)
    return true
  } catch (error) {
    log(`setTitleViaTmuxRename: FAILED - ${error}`)
    return false
  }
}

/**
 * Strategy 3: Write OSC sequence directly to /dev/tty.
 *
 * Fallback for non-tmux environments.
 *
 * @returns true if successful
 */
const setTitleViaTty = (title: string): boolean => {
  try {
    fs.accessSync("/dev/tty", fs.constants.W_OK)
    const sequence = `\x1b]0;${title}\x07`
    const fd = fs.openSync("/dev/tty", "w")
    fs.writeSync(fd, sequence)
    fs.closeSync(fd)
    log(`setTitleViaTty: SUCCESS - "${title}"`)
    return true
  } catch (error) {
    log(`setTitleViaTty: FAILED - ${error}`)
    return false
  }
}

/**
 * Strategy 4: Write OSC sequence to stdout.
 *
 * Last resort fallback - may not work if stdout is piped.
 *
 * @returns true (always, since we can't verify)
 */
const setTitleViaStdout = (title: string): boolean => {
  try {
    const sequence = `\x1b]0;${title}\x07`
    process.stdout.write(sequence)
    log(`setTitleViaStdout: ATTEMPTED - "${title}"`)
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
 * In tmux on Windows Terminal:
 * 1. DCS passthrough to pane TTY → Windows Terminal tab
 * 2. tmux rename-window → tmux status bar
 *
 * @param title - The title to set
 */
const setTitle = (title: string): void => {
  log(`setTitle: "${title}"`)

  if (isTmux()) {
    // Update Windows Terminal tab via DCS passthrough to pane TTY
    setTitleViaPaneTty(title)
    // Also update tmux status bar
    setTitleViaTmuxRename(title)
    return
  }

  // Not in tmux: try /dev/tty, then stdout
  if (!setTitleViaTty(title)) {
    setTitleViaStdout(title)
  }
}

/**
 * Reset the terminal title to empty.
 */
const resetTitle = (): void => {
  log("resetTitle")

  if (isTmux()) {
    // Reset Windows Terminal tab
    const paneTty = getPaneTty()
    if (paneTty) {
      try {
        const sequence = `\x1bPtmux;\x1b\x1b]0;\x07\x1b\\`
        const fd = fs.openSync(paneTty, "w")
        fs.writeSync(fd, sequence)
        fs.closeSync(fd)
      } catch {
        // Ignore
      }
    }

    // Reset tmux window name
    try {
      execSync('tmux rename-window ""', { stdio: "ignore", timeout: 1000 })
    } catch {
      // Ignore
    }
    return
  }

  // Not in tmux
  if (!setTitleViaTty("")) {
    try {
      process.stdout.write("\x1b]0;\x07")
    } catch {
      // Ignore
    }
  }
}

/**
 * Full cleanup - reset title.
 */
export const cleanupTerminal = (): void => {
  resetTitle()
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Extract project name from directory path.
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
    const emoji = statusText.split(" ")[0] || ""
    title = `${emoji} ${projectName}: ${openSpecChange}${progressText}`
  } else if (statusText.trim()) {
    title = `${statusText} ${projectName}${progressText}`
  } else {
    title = `🌍 ${projectName}${progressText}`
  }

  setTitle(title)
}
