/**
 * Goost Plugin - Terminal Utilities
 *
 * Handles OSC escape sequences for Windows Terminal tab color and title.
 * Supports tmux passthrough for escape sequences.
 */

import * as fs from "fs"
import { TAB_COLORS, STATUS_EMOJIS, type GoostStatus } from "./types"

// =============================================================================
// Environment Detection
// =============================================================================

/**
 * Detect if running inside tmux session.
 * @returns true if TMUX environment variable is set
 */
export const isTmux = (): boolean => !!process.env.TMUX

// =============================================================================
// TTY Output
// =============================================================================

/**
 * File descriptor for TTY output.
 * We write directly to the terminal to bypass any stdout capturing by OpenCode.
 * Falls back to stderr then stdout if terminal is not available.
 */
let ttyFd: number | null = null
let ttyFdAttempted = false

/**
 * Get file descriptor for TTY output.
 * Tries multiple approaches to find the actual terminal:
 * 1. /dev/tty (controlling terminal)
 * 2. Current process's stdout if it's a tty (via /proc/self/fd/1)
 * 3. Falls back to null (will use stderr)
 */
const getTtyFd = (): number | null => {
  if (ttyFd !== null) return ttyFd
  if (ttyFdAttempted) return null
  ttyFdAttempted = true

  // Try /dev/tty first
  try {
    ttyFd = fs.openSync("/dev/tty", "w")
    return ttyFd
  } catch {
    // /dev/tty not available
  }

  // Try to find our own process's terminal via /proc/self
  // OpenCode plugins run in the same process, so /proc/self/fd/1 should point to the terminal
  try {
    const selfStdout = fs.readlinkSync("/proc/self/fd/1")
    if (selfStdout.startsWith("/dev/pts/") || selfStdout.startsWith("/dev/tty")) {
      ttyFd = fs.openSync(selfStdout, "w")
      return ttyFd
    }
  } catch {
    // Self stdout not accessible or not a tty
  }

  // Return null - will fall back to stderr in writeTty
  return null
}

/**
 * Write directly to TTY, bypassing stdout.
 * Falls back to stderr if TTY is not available (stderr is less likely to be captured).
 */
const writeTty = (data: string): void => {
  const fd = getTtyFd()
  if (fd !== null) {
    try {
      fs.writeSync(fd, data)
      return
    } catch {
      // Fall through to stderr
    }
  }
  // Fallback to stderr (less likely to be captured than stdout)
  process.stderr.write(data)
}

// =============================================================================
// OSC Sequence Utilities
// =============================================================================

/**
 * Write OSC escape sequence to TTY with tmux passthrough support.
 *
 * When running inside tmux, escape sequences must be wrapped in DCS passthrough:
 * \x1bPtmux;\x1b<escaped_sequence>\x1b\\
 *
 * Where <escaped_sequence> has all ESC (\x1b) characters doubled.
 *
 * @param sequence - The OSC escape sequence to write
 * @sideeffect Writes to TTY or stdout
 */
export const writeOSC = (sequence: string): void => {
  try {
    if (isTmux()) {
      // tmux passthrough: wrap sequence and double all ESC characters
      const escaped = sequence.replace(/\x1b/g, "\x1b\x1b")
      writeTty(`\x1bPtmux;${escaped}\x1b\\`)
    } else {
      writeTty(sequence)
    }
  } catch {
    // Silently ignore write errors (e.g., stdout closed)
    // Debug logging happens at plugin level
  }
}

/**
 * Set Windows Terminal tab color using OSC 9;9.
 * This is a Windows Terminal proprietary extension.
 *
 * @param color - Hex color string (e.g., "#FF0000")
 * @sideeffect Writes to process.stdout via writeOSC
 */
const setTabColor = (color: string): void => {
  if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
    writeOSC(`\x1b]9;9;${color}\x07`)
  }
}

/**
 * Reset Windows Terminal tab color to default.
 * @sideeffect Writes to process.stdout via writeOSC
 */
const resetTabColor = (): void => {
  // OSC 9;9; with empty/default resets the color
  writeOSC(`\x1b]9;9;\x07`)
}

/**
 * Set window/tab title using OSC 0 (standard xterm title).
 *
 * @param title - The title string to display
 * @sideeffect Writes to process.stdout via writeOSC
 */
const setTabTitle = (title: string): void => {
  writeOSC(`\x1b]0;${title}\x07`)
}

/**
 * Reset tab title to default (empty lets terminal use its default).
 * @sideeffect Writes to process.stdout via writeOSC
 */
const resetTabTitle = (): void => {
  writeOSC(`\x1b]0;\x07`)
}

/**
 * Full cleanup - reset both title and color, close TTY fd.
 * Call this on process exit to restore terminal state.
 * @sideeffect Writes to TTY via writeOSC
 */
export const cleanupTerminal = (): void => {
  resetTabTitle()
  resetTabColor()
  // Close TTY file descriptor if open
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
// Project Name Utilities
// =============================================================================

/**
 * Extract project name from directory path.
 * Returns the last segment of the path.
 *
 * @param directory - Full directory path
 * @returns Project name (last path segment) or "opencode" as fallback
 */
export const getProjectName = (directory: string): string => {
  if (!directory) return "opencode"
  // Get the last segment of the path
  const segments = directory.replace(/\\/g, "/").split("/").filter(Boolean)
  return segments[segments.length - 1] || "opencode"
}

// =============================================================================
// UI Update Functions
// =============================================================================

/**
 * Update tab color based on current status.
 *
 * @param status - The current Goost status
 * @sideeffect Writes to process.stdout via setTabColor
 */
export const updateTabColor = (status: GoostStatus): void => {
  setTabColor(TAB_COLORS[status])
}

/**
 * Build and set the tab title.
 *
 * Format (with openSpecChange): <emoji> <openSpecChange>: <statusText> [<progress>]
 * Format (without): <emoji> <projectName>: <statusText> [<progress>]
 * Example: 🚀 add-contract-completion: Working [2/5]
 *
 * @param projectName - The project name to display (fallback)
 * @param status - Current Goost status
 * @param statusText - Descriptive status text
 * @param progress - Optional progress string (e.g., "2/5")
 * @param openSpecChange - Optional OpenSpec change name (takes priority over projectName)
 * @sideeffect Writes to process.stdout via setTabTitle
 */
export const updateTitle = (
  projectName: string,
  status: GoostStatus,
  statusText: string,
  progress: string,
  openSpecChange?: string | null
): void => {
  const icon = STATUS_EMOJIS[status]
  const progressText = progress ? ` [${progress}]` : ""

  // Use openSpecChange if available, otherwise fall back to projectName
  const displayName = openSpecChange || projectName

  let display: string
  if (statusText) {
    display = `${icon} ${displayName}: ${statusText}${progressText}`
  } else {
    // Idle with no contract - just show display name
    display = `${icon} ${displayName}${progressText}`
  }

  setTabTitle(display)
}
