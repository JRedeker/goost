/**
 * Goost Plugin - Terminal Utilities
 *
 * Handles OSC escape sequences for Windows Terminal tab color and title.
 * Supports tmux passthrough for escape sequences.
 */

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
// OSC Sequence Utilities
// =============================================================================

/**
 * Write OSC escape sequence to stdout with tmux passthrough support.
 *
 * When running inside tmux, escape sequences must be wrapped in DCS passthrough:
 * \x1bPtmux;\x1b<escaped_sequence>\x1b\\
 *
 * Where <escaped_sequence> has all ESC (\x1b) characters doubled.
 *
 * @param sequence - The OSC escape sequence to write
 * @sideeffect Writes to process.stdout
 */
export const writeOSC = (sequence: string): void => {
  try {
    if (isTmux()) {
      // tmux passthrough: wrap sequence and double all ESC characters
      const escaped = sequence.replace(/\x1b/g, "\x1b\x1b")
      process.stdout.write(`\x1bPtmux;${escaped}\x1b\\`)
    } else {
      process.stdout.write(sequence)
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
export const setTabColor = (color: string): void => {
  if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
    writeOSC(`\x1b]9;9;${color}\x07`)
  }
}

/**
 * Reset Windows Terminal tab color to default.
 * @sideeffect Writes to process.stdout via writeOSC
 */
export const resetTabColor = (): void => {
  // OSC 9;9; with empty/default resets the color
  writeOSC(`\x1b]9;9;\x07`)
}

/**
 * Set window/tab title using OSC 0 (standard xterm title).
 *
 * @param title - The title string to display
 * @sideeffect Writes to process.stdout via writeOSC
 */
export const setTabTitle = (title: string): void => {
  writeOSC(`\x1b]0;${title}\x07`)
}

/**
 * Reset tab title to default (empty lets terminal use its default).
 * @sideeffect Writes to process.stdout via writeOSC
 */
export const resetTabTitle = (): void => {
  writeOSC(`\x1b]0;\x07`)
}

/**
 * Full cleanup - reset both title and color.
 * Call this on process exit to restore terminal state.
 * @sideeffect Writes to process.stdout via writeOSC
 */
export const cleanupTerminal = (): void => {
  resetTabTitle()
  resetTabColor()
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
 * Format: <emoji> <projectName>: <statusText> [<progress>]
 * Example: 🚀 myproject: Working [2/5]
 *
 * @param projectName - The project name to display
 * @param status - Current Goost status
 * @param statusText - Descriptive status text
 * @param progress - Optional progress string (e.g., "2/5")
 * @sideeffect Writes to process.stdout via setTabTitle
 */
export const updateTitle = (
  projectName: string,
  status: GoostStatus,
  statusText: string,
  progress: string
): void => {
  const icon = STATUS_EMOJIS[status]
  const progressText = progress ? ` [${progress}]` : ""

  let display: string
  if (statusText) {
    display = `${icon} ${projectName}: ${statusText}${progressText}`
  } else {
    // Idle with no contract - just show project name
    display = `${icon} ${projectName}${progressText}`
  }

  setTabTitle(display)
}
