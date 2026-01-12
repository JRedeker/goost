/**
 * Goost Plugin - Terminal Utilities
 *
 * Handles terminal tab title updates via multiple strategies:
 * 1. OSC sequence to tmux pane TTY (sets pane_title, forwarded by tmux)
 * 2. tmux rename-window command (for tmux status bar)
 * 3. Direct /dev/tty or stdout (non-tmux fallback)
 *
 * Key insight: In tmux, we send simple OSC sequences (\x1b]0;title\x07) to
 * the pane's TTY. This sets the pane_title variable, which tmux forwards
 * to the outer terminal via set-titles-string "#{pane_title}".
 *
 * Note: We do NOT use DCS passthrough (\x1bPtmux;...) for setting titles.
 * DCS passthrough bypasses tmux and sends directly to the outer terminal,
 * but it doesn't set the pane_title variable that tmux uses for forwarding.
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
 * Always writes to file regardless of DEBUG setting.
 */
const logToFile = (msg: string): void => {
  try {
    fs.appendFileSync("/tmp/goost-debug.log", `${new Date().toISOString()} ${msg}\n`)
  } catch {
    // ignore
  }
}

// Immediately log on module load to confirm plugin is being loaded
logToFile("=== GOOST TERMINAL MODULE LOADED ===")

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

/**
 * Get the tmux client's TTY path (e.g., /dev/pts/12).
 * This is the outer terminal that Windows Terminal is connected to.
 * Writing here bypasses tmux's title handling and goes direct to WT.
 */
const getTmuxClientTty = (): string | null => {
  if (!isTmux()) {
    return null
  }

  try {
    const result = execSync("tmux display-message -p '#{client_tty}'", {
      encoding: "utf8",
      timeout: 1000,
      stdio: ["pipe", "pipe", "pipe"],
    })
    const tty = result.trim()
    if (tty && tty.startsWith("/dev/")) {
      log(`getTmuxClientTty: ${tty}`)
      return tty
    }
  } catch (error) {
    log(`getTmuxClientTty: FAILED - ${error}`)
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

// Cache the client TTY path
let cachedClientTty: string | null | undefined = undefined
const getClientTty = (): string | null => {
  if (cachedClientTty === undefined) {
    cachedClientTty = getTmuxClientTty()
  }
  return cachedClientTty
}

// =============================================================================
// Title Setting Strategies
// =============================================================================

/**
 * Strategy 1: Write OSC sequence directly to tmux pane TTY.
 *
 * This sends the OSC title sequence directly to the pane's TTY device.
 * The simple OSC sequence sets the pane_title, which tmux can then
 * forward to the outer terminal via set-titles-string.
 *
 * Format: \x1b]0;TITLE\x07
 *
 * Note: We use the simple OSC sequence, NOT DCS passthrough. The DCS
 * passthrough (\x1bPtmux;...) is for when you want sequences to bypass
 * tmux and reach the outer terminal directly. But for setting pane_title,
 * which is a tmux variable, we need the simple OSC sequence.
 *
 * @returns true if successful
 */
const setTitleViaPaneTty = (title: string): boolean => {
  const paneTty = getPaneTty()
  if (!paneTty) {
    return false
  }

  try {
    // Simple OSC sequence: ESC ] 0 ; title BEL
    // This sets the pane_title in tmux, which then gets forwarded
    // to the outer terminal via set-titles-string "#{pane_title}"
    const sequence = `\x1b]0;${title}\x07`
    fs.writeFileSync(paneTty, sequence)
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
 * Strategy 1b: Write OSC sequence directly to tmux client TTY.
 *
 * This sends the OSC title sequence directly to the outer terminal
 * (Windows Terminal), bypassing tmux's pane_title mechanism entirely.
 *
 * Uses writeFileSync for atomic write (avoids buffering issues).
 *
 * @returns true if successful
 */
const setTitleViaClientTty = (title: string): boolean => {
  const clientTty = getClientTty()
  if (!clientTty) {
    return false
  }

  try {
    const sequence = `\x1b]0;${title}\x07`
    fs.writeFileSync(clientTty, sequence)
    log(`setTitleViaClientTty: SUCCESS - "${title}" via ${clientTty}`)
    return true
  } catch (error) {
    log(`setTitleViaClientTty: FAILED - ${error}`)
    cachedClientTty = undefined
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
    fs.writeFileSync("/dev/tty", sequence)
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
 * Set terminal/pane title using all applicable methods.
 *
 * In tmux on Windows Terminal:
 * 1. Client TTY → Windows Terminal tab (direct, bypasses tmux title handling)
 * 2. Pane TTY → sets pane_title (backup, relies on tmux set-titles)
 * 3. tmux rename-window → tmux status bar
 *
 * @param title - The title to set
 */
const setTitle = (title: string): void => {
  log(`setTitle: "${title}"`)
  log(`isTmux=${isTmux()}`)

  if (isTmux()) {
    // Primary: Write directly to client TTY (outer terminal / Windows Terminal)
    const success1 = setTitleViaClientTty(title)
    // Backup: Write to pane TTY (sets pane_title for tmux's set-titles)
    const success2 = setTitleViaPaneTty(title)
    // Also update tmux status bar
    const success3 = setTitleViaTmuxRename(title)
    log(`setTitle: clientTty=${success1}, paneTty=${success2}, tmuxRename=${success3}`)
    return
  }

  // Not in tmux: try /dev/tty, then stdout
  const ttySuccess = setTitleViaTty(title)
  const stdoutSuccess = !ttySuccess && setTitleViaStdout(title)
  log(`setTitle: tty=${ttySuccess}, stdout=${stdoutSuccess}`)
}

/**
 * Reset the terminal title to empty.
 */
const resetTitle = (): void => {
  log("resetTitle")

  if (isTmux()) {
    // Reset client TTY (Windows Terminal tab)
    const clientTty = getClientTty()
    if (clientTty) {
      try {
        fs.writeFileSync(clientTty, `\x1b]0;\x07`)
      } catch {
        // Ignore
      }
    }

    // Reset pane title
    const paneTty = getPaneTty()
    if (paneTty) {
      try {
        fs.writeFileSync(paneTty, `\x1b]0;\x07`)
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

  log(`updateTitle: FINAL title="${title}"`)
  setTitle(title)
}
