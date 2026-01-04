/**
 * Goost Status Plugin
 *
 * Displays contract-aware status in Windows Terminal tab title.
 * Works standalone or alongside wsl-status-title.
 * Supports tmux passthrough for escape sequences.
 *
 * Status Icons:
 * - Full Moon: Waiting for sub-agent tasks to complete
 * - Rocket: Setting up/spawning sub-agents OR actively working
 * - Earth: Complete, awaiting user input
 * - Loop: Doom loop detected - stuck in retry cycle
 * - Mic: Needs user approval - MAGENTA TAB (auto-detected via permission.updated)
 *
 * Permission Detection:
 * - Automatically detects OpenCode permission.updated events (shell execution, etc.)
 * - Switches to bright magenta tab with ">>> APPROVAL NEEDED <<<" title
 * - Returns to normal state when permission.replied event fires
 *
 * Contract Preservation:
 * - Stores full contract text when CONTRACT ACTIVE is detected
 * - Injects contract into compaction context via experimental.session.compacting
 * - Detects session.compacted events to ensure contract recovery
 */

import type { Plugin } from "@opencode-ai/plugin"

// Internal modules
import {
  type PluginState,
  type GoostStatus,
  EVENT_TYPES,
  TOOL_NAMES,
  SessionStatusPropsSchema,
  MessageUpdatedPropsSchema,
  TaskArgsSchema,
  TaskOutputSchema,
} from "./types"
import { cleanupTerminal, getProjectName, updateTabColor, updateTitle, isTmux } from "./terminal"
import {
  createInitialState,
  processMessageContent,
  getStatusText,
  updateStateStatus,
  buildPreservationContext,
  isSubAgentFailure,
  isSubAgentEmpty,
  extractCriterionFromTask,
  recordSubAgentFailure,
  isDoomLoopReached,
  extractOpenSpecChange,
} from "./contract"

// =============================================================================
// Debug Logging
// =============================================================================

const DEBUG = process.env.GOOST_DEBUG === "1"
const TRACE = process.env.GOOST_TRACE === "1"

/**
 * Log debug message to stderr.
 * Only outputs when GOOST_DEBUG=1 environment variable is set.
 *
 * @param msg - Message to log
 */
const log = (msg: string): void => {
  if (DEBUG) {
    console.error(`[Goost] ${msg}`)
  }
}

/**
 * Trace log - always outputs to stderr for debugging UI issues.
 * Only outputs when GOOST_TRACE=1 environment variable is set.
 */
const trace = (msg: string): void => {
  if (TRACE) {
    console.error(`[Goost:TRACE] ${msg}`)
  }
}

// =============================================================================
// UI Update Helper
// =============================================================================

/**
 * Update all UI elements (tab color and title) based on current state.
 *
 * @param state - Current plugin state
 * @param projectName - Project name for title (fallback if no openSpecChange)
 */
const updateUI = (state: PluginState, projectName: string): void => {
  trace(`updateUI: status=${state.status}, activeSubAgents=${state.activeSubAgents}`)
  updateTabColor(state.status)
  const statusText = getStatusText(state.status, state.activeSubAgents, state.contract.active)
  updateTitle(projectName, statusText, state.contract.progress, state.openSpecChange)
}

// =============================================================================
// Event Handlers
// =============================================================================

type EventHandlerContext = {
  state: PluginState
  projectName: string
  log: (msg: string) => void
}

type EventHandler = (properties: unknown, ctx: EventHandlerContext) => PluginState

/**
 * Handle session.status event.
 * Updates UI based on session idle/busy state.
 */
const handleSessionStatus: EventHandler = (properties, ctx) => {
  const parsed = SessionStatusPropsSchema.safeParse(properties)
  if (!parsed.success) {
    ctx.log(`Invalid session.status properties: ${parsed.error.message}`)
    return ctx.state
  }

  const { status } = parsed.data

  if (status.type === "idle") {
    const newStatus: GoostStatus = ctx.state.contract.active ? "earth" : "idle"
    return updateStateStatus(ctx.state, newStatus)
  } else if (status.type === "busy") {
    return updateStateStatus(ctx.state, "work")
  }

  return ctx.state
}

/**
 * Handle message.updated event.
 * Processes messages for contract state changes and OpenSpec tracking.
 *
 * - Assistant messages: Full processing (contract, status, OpenSpec)
 * - User messages: OpenSpec change detection only (for /openspec-xxx commands)
 */
const handleMessageUpdated: EventHandler = (properties, ctx) => {
  const parsed = MessageUpdatedPropsSchema.safeParse(properties)
  if (!parsed.success) {
    ctx.log(`Invalid message.updated properties: ${parsed.error.message}`)
    return ctx.state
  }

  const { info } = parsed.data
  if (!info?.parts) {
    return ctx.state
  }

  let newState = ctx.state

  // Process user messages for OpenSpec command detection only
  if (info.role === "user") {
    for (const part of info.parts) {
      if (part.type === "text" && part.text) {
        const openSpecChange = extractOpenSpecChange(part.text)
        if (openSpecChange) {
          ctx.log(`OpenSpec change detected from user command: ${openSpecChange}`)
          newState = { ...newState, openSpecChange }
        }
      }
    }
    return newState
  }

  // Process assistant messages for full contract/status tracking
  if (info.role === "assistant") {
    for (const part of info.parts) {
      if (part.type === "text" && part.text) {
        newState = processMessageContent(newState, part.text)
      }
    }
  }

  return newState
}

/**
 * Handle session.compacted event.
 * Logs contract preservation status for debugging.
 */
const handleSessionCompacted: EventHandler = (_properties, ctx) => {
  if (ctx.state.contract.text) {
    ctx.log("Session compacted - contract preservation active")
    ctx.log(`Contract objective: ${ctx.state.contract.objective || "Unknown"}`)
    ctx.log(`Progress: ${ctx.state.contract.progress || "Unknown"}`)
  }
  return ctx.state
}

/**
 * Handle permission.updated event.
 * Switches to mic status when OpenCode requests approval.
 */
const handlePermissionUpdated: EventHandler = (_properties, ctx) => {
  ctx.log("Permission request detected - switching to mic state")
  return updateStateStatus(ctx.state, "mic")
}

/**
 * Handle permission.replied event.
 * Returns to work/idle state after permission is granted/denied.
 * Note: session.status event will follow to set the correct terminal state if needed.
 */
const handlePermissionReplied: EventHandler = (_properties, ctx) => {
  ctx.log("Permission replied - returning to work state")
  const newStatus: GoostStatus = ctx.state.contract.active ? "work" : "idle"
  return updateStateStatus(ctx.state, newStatus)
}

/**
 * Handle session.deleted event.
 * Cleans up terminal state when session ends (e.g., /exit command).
 */
const handleSessionDeleted: EventHandler = (_properties, ctx) => {
  ctx.log("Session deleted - cleaning up terminal state")
  cleanupTerminal()
  return ctx.state
}

/**
 * Event handler dispatch map.
 * Maps event type strings to handler functions.
 */
const eventHandlers: Partial<Record<string, EventHandler>> = {
  [EVENT_TYPES.SESSION_STATUS]: handleSessionStatus,
  [EVENT_TYPES.SESSION_DELETED]: handleSessionDeleted,
  [EVENT_TYPES.MESSAGE_UPDATED]: handleMessageUpdated,
  [EVENT_TYPES.SESSION_COMPACTED]: handleSessionCompacted,
  [EVENT_TYPES.PERMISSION_UPDATED]: handlePermissionUpdated,
  [EVENT_TYPES.PERMISSION_REPLIED]: handlePermissionReplied,
}

// =============================================================================
// Plugin Entry Point
// =============================================================================

const GoostStatusPlugin: Plugin = async ({ directory }) => {
  // Extract project name from directory
  const projectName = getProjectName(directory || process.cwd())
  log(`Project name: ${projectName}`)
  log(`TTY mode: isTmux=${isTmux()}`)

  // Initialize state
  let state = createInitialState()

  // Helper to update state and UI
  const setState = (newState: PluginState): void => {
    state = newState
    updateUI(state, projectName)
  }

  // ==========================================================================
  // Process Exit Handlers
  // ==========================================================================
  // Note: These handlers are registered once per plugin initialization.
  // OpenCode typically loads plugins once per session, so accumulation is
  // unlikely. If hot-reloading is ever supported, consider tracking and
  // removing previous listeners.

  /** Cleanup handler for normal exit */
  const handleExit = (): void => {
    cleanupTerminal()
  }

  /** Cleanup handler for SIGINT (Ctrl+C) */
  const handleSigInt = (): void => {
    cleanupTerminal()
    process.exit(0)
  }

  /** Cleanup handler for SIGTERM */
  const handleSigTerm = (): void => {
    cleanupTerminal()
    process.exit(0)
  }

  /** Cleanup handler for uncaught exceptions */
  const handleUncaughtException = (err: Error): void => {
    log(`Uncaught exception: ${err}`)
    cleanupTerminal()
    process.exit(1)
  }

  // Register cleanup handlers - use named functions for potential future removal
  process.on("exit", handleExit)
  process.on("SIGINT", handleSigInt)
  process.on("SIGTERM", handleSigTerm)
  process.on("uncaughtException", handleUncaughtException)

  // ===========================================================================
  // Hook Implementations
  // ===========================================================================

  return {
    // Track session status and compaction events
    event: async (input): Promise<void> => {
      try {
        const { event } = input
        trace(`event: type="${event.type}"`)
        const handler = eventHandlers[event.type]

        if (handler) {
          const ctx: EventHandlerContext = { state, projectName, log }
          const newState = handler(event.properties, ctx)
          if (newState !== state) {
            trace(`event ${event.type} changed state: ${state.status} -> ${newState.status}`)
            setState(newState)
          }
        }
      } catch (error) {
        log(`Error in event handler: ${error}`)
      }
    },

    // Watch for task tool calls (sub-agent spawning)
    // Before: show moon because sub-agent is about to run (we'll be waiting)
    "tool.execute.before": async (input, toolArgs): Promise<void> => {
      trace(`tool.execute.before: tool="${input.tool}" (expecting "${TOOL_NAMES.TASK}")`)
      // Debug: log all tool executions
      if (input.tool !== TOOL_NAMES.TASK) {
        trace(`Ignoring non-task tool: ${input.tool}`)
        return
      }

      try {
        const parsedArgs = TaskArgsSchema.safeParse(toolArgs.args)
        const taskParams = parsedArgs.success ? parsedArgs.data : {}

        const description = taskParams.description || "Unknown"
        log(`=== SUB-AGENT STARTING: ${description} ===`)
        log(`Before: activeSubAgents=${state.activeSubAgents}`)
        trace(`Setting status to MOON for task: ${description}`)

        // Warn if contract active but prompt lacks context (debug only)
        if (state.contract.active && taskParams.prompt) {
          const hasContractContext =
            /parent contract|contract objective|assigned criterion|your assigned/i.test(
              taskParams.prompt
            )
          if (!hasContractContext) {
            log("Warning: Sub-agent prompt may lack contract context")
          }
        }

        const newState = updateStateStatus(
          {
            ...state,
            activeSubAgents: state.activeSubAgents + 1,
          },
          "moon"
        )
        log(`After: activeSubAgents=${newState.activeSubAgents}, status=${newState.status}`)
        trace(`Calling setState with moon status`)
        setState(newState)
        trace(`setState called, checking UI...`)
      } catch (error) {
        log(`Error in tool.execute.before: ${error}`)
      }
    },

    // After task tool completes, sub-agent is done
    "tool.execute.after": async (input, output): Promise<void> => {
      if (input.tool !== TOOL_NAMES.TASK) {
        trace(`Ignoring non-task tool in after: ${input.tool}`)
        return
      }

      try {
        const parsedOutput = TaskOutputSchema.safeParse(output)
        const taskOutput = parsedOutput.success ? parsedOutput.data : {}

        const taskTitle = taskOutput.title || "Unknown"
        log(`=== SUB-AGENT FINISHED: ${taskTitle} ===`)
        log(`Before: activeSubAgents=${state.activeSubAgents}`)

        let newState = {
          ...state,
          activeSubAgents: Math.max(0, state.activeSubAgents - 1),
        }

        // Track failures for doom loop detection
        if (isSubAgentFailure(taskOutput)) {
          const criterion = extractCriterionFromTask(taskTitle)
          newState = recordSubAgentFailure(newState, criterion)
          log(`Sub-agent may have failed: ${taskTitle}`)
          log("  Reason: Output contains failure indicator")

          if (isDoomLoopReached(newState, criterion)) {
            log(`Doom loop threshold reached for: ${criterion}`)
          }
        } else if (isSubAgentEmpty(taskOutput)) {
          log(`Sub-agent returned empty output: ${taskTitle}`)
          log("  Note: May be normal for cleanup/deletion tasks")
        }

        // Update status based on remaining sub-agents
        // Preserve terminal states (earth/idle) - they were set by session.status
        const isTerminalState = newState.status === "earth" || newState.status === "idle"
        const newStatus: GoostStatus =
          newState.activeSubAgents > 0 ? "moon" : isTerminalState ? newState.status : "work"
        log(`After: activeSubAgents=${newState.activeSubAgents}, status=${newStatus}`)
        trace(
          `Deciding status: activeCount=${newState.activeSubAgents}, isTerminal=${isTerminalState}`
        )
        newState = updateStateStatus(newState, newStatus)
        trace(`Calling setState after task completion`)

        setState(newState)
        trace(`setState completed after task completion`)
      } catch (error) {
        log(`Error in tool.execute.after: ${error}`)
      }
    },

    // Contract preservation during compaction
    "experimental.session.compacting": async (_input, output): Promise<void> => {
      try {
        if (state.contract.text) {
          const preservationContext = buildPreservationContext(state.contract)
          output.context.push(preservationContext)
          log("Injected contract preservation context into compaction")
        }
      } catch (error) {
        log(`Error in experimental.session.compacting: ${error}`)
      }
    },
  }
}

export default GoostStatusPlugin
