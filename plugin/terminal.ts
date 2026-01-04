/**
 * Goost Plugin - Terminal Utilities
 *
 * Handles OSC escape sequences for Windows Terminal tab color and title.
 * Supports tmux passthrough for escape sequences.
 *
 * IMPORTANT: OpenCode plugins run with stdout piped for tool output capture.
 * To write directly to the terminal, we must use the parent process's TTY
 * via /proc/<ppid>/fd/1 on Linux.
 */

import * as fs from "fs"
import { TAB_COLORS, type GoostStatus } from "./types"

// =============================================================================
// Environment Detection
// =============================================================================

/**
 * Detect if running inside tmux session.
 * @returns true if TMUX environment variable is set
 */
export const isTmux = (): boolean => !!process.env.TMUX

// =============================================================================
// TTY Access
// =============================================================================

/** Cached file descriptor for the parent's TTY, or null if unavailable */
let ttyFd: number | null = null

/** Flag to prevent repeated failed attempts to open TTY */
let ttyOpenAttempted = false

/**
 * Get a file descriptor for the parent process's TTY.
 *
 * OpenCode plugins have stdout piped for tool output capture, so we need
 * to write directly to the parent's TTY for OSC sequences to work.
 *
 * @returns File descriptor number, or null if TTY unavailable
 */
const getTtyFd = (): number | null => {
  if (ttyFd !== null) {
    return ttyFd
  }

  if (ttyOpenAttempted) {
    return null
  }

  ttyOpenAttempted = true

  try {
    // On Linux, access parent's stdout via /proc/<ppid>/fd/1
    const parentStdout = `/proc/${process.ppid}/fd/1`
    ttyFd = fs.openSync(parentStdout, "w")
    return ttyFd
  } catch {
    // Parent TTY not accessible (e.g., Windows, or permissions issue)
    return null
  }
}

/**
 * Close the TTY file descriptor if open.
 * Called during cleanup to release resources.
 */
const closeTtyFd = (): void => {
  if (ttyFd !== null) {
    try {
      fs.closeSync(ttyFd)
    } catch {
      // Ignore close errors
    }
    ttyFd = null
  }
}

// =============================================================================
// OSC Sequence Utilities
// =============================================================================

/**
 * Write OSC escape sequence to the terminal with tmux passthrough support.
 *
 * This function writes directly to the parent process's TTY to bypass
 * OpenCode's stdout capture. Falls back to process.stdout if TTY is unavailable.
 *
 * When running inside tmux, escape sequences are wrapped in DCS passthrough:
 * \x1bPtmux;\x1b<escaped_sequence>\x1b\\
 * Where <escaped_sequence> has all ESC (\x1b) characters doubled.
 *
 * @param sequence - The OSC escape sequence to write
 * @sideeffect Writes to terminal (parent's TTY or stdout)
 */
export const writeOSC = (sequence: string): void => {
  try {
    let output: string
    if (isTmux()) {
      // tmux passthrough: wrap sequence and double all ESC characters
      const escaped = sequence.replace(/\x1b/g, "\x1b\x1b")
      output = `\x1bPtmux;${escaped}\x1b\\`
    } else {
      output = sequence
    }

    // Try writing to parent's TTY first (bypasses OpenCode's stdout capture)
    const fd = getTtyFd()
    if (fd !== null) {
      fs.writeSync(fd, output)
    } else {
      // Fallback to stdout (may not work if piped, but worth trying)
      process.stdout.write(output)
    }
  } catch {
    // Silently ignore write errors (e.g., TTY closed, stdout closed)
  }
}

/**
 * Set Windows Terminal tab color using OSC 9;9.
 * This is a Windows Terminal proprietary extension.
 * @param color - Hex color string (e.g., "#FF0000") or "0" to reset
 * @sideeffect Writes OSC sequence to terminal
 */
const setTabColor = (color: string): void => {
  if (color === "0") {
    writeOSC("\x1b]9;9;0\x07")
  } else if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
    writeOSC(`\x1b]9;9;${color}\x07`)
  }
}

/**
 * Reset Windows Terminal tab color to default.
 * @sideeffect Writes OSC sequence to terminal
 */
const resetTabColor = (): void => {
  writeOSC("\x1b]9;9;0\x07")
}

/**
 * Set window/tab title using OSC 0 (standard xterm title).
 * @param title - The title string to display
 * @sideeffect Writes OSC sequence to terminal
 */
const setTabTitle = (title: string): void => {
  writeOSC(`\x1b]0;${title}\x07`)
}

/**
 * Reset tab title to default.
 * @sideeffect Writes OSC sequence to terminal
 */
const resetTabTitle = (): void => {
  writeOSC(`\x1b]0;\x07`)
}

/**
 * Full cleanup - reset both title and color, close TTY handle.
 * Call this on process exit to restore terminal state.
 * @sideeffect Writes to terminal, closes file descriptor
 */
export const cleanupTerminal = (): void => {
  resetTabTitle()
  resetTabColor()
  closeTtyFd()
}

// =============================================================================
// Tab Title Assembly
// =============================================================================

/**
 * Extract project name from directory path.
 * @param directory - Full directory path
 * @returns Last directory name or "Unknown" if cannot determine
 */
export const getProjectName = (directory: string): string => {
  try {
    const parts = directory.split("/")
    const projectName = parts[parts.length - 1] || "Unknown"
    return projectName
  } catch {
    return "Unknown"
  }
}

/**
 * Update terminal tab color based on status.
 * @param status - Current GoostStatus
 * @sideeffect Writes OSC sequence to terminal
 */
export const updateTabColor = (status: GoostStatus): void => {
  const color = TAB_COLORS[status]
  if (color) {
    setTabColor(color)
  }
}

/**
 * Update terminal tab title.
 * @param projectName - Project name
 * @param statusText - Status text for title
 * @param contractProgress - Optional contract progress (e.g., "1/3")
 * @param openSpecChange - Optional OpenSpec change name
 * @sideeffect Writes OSC sequence to terminal
 */
export const updateTitle = (
  projectName: string,
  statusText: string,
  contractProgress: string | null,
  openSpecChange: string | null
): void => {
  let title = `${projectName} | ${statusText}`

  if (contractProgress) {
    title += ` [${contractProgress}]`
  }

  if (openSpecChange) {
    title += ` (${openSpecChange})`
  }

  setTabTitle(title)
}
