import { type Plugin } from "@opencode-ai/plugin"

/**
 * Goost Status Plugin
 * 
 * Displays contract-aware status in Windows Terminal tab title.
 * Works standalone or alongside wsl-status-title.
 * Supports tmux passthrough for escape sequences.
 * 
 * Status Icons:
 * - Full Moon (🌕): Waiting for sub-agent tasks to complete
 * - Rocket (🚀): Setting up/spawning sub-agents OR actively working
 * - Earth (🌍): Complete, awaiting user input
 * - Loop (🔄): Doom loop detected - stuck in retry cycle
 * - Mic (🎤): Needs user approval for a command/action
 * 
 * Contract Preservation:
 * - Stores full contract text when CONTRACT ACTIVE is detected
 * - Injects contract into compaction context via experimental.session.compacting
 * - Detects session.compacted events to ensure contract recovery
 */

// =============================================================================
// Types
// =============================================================================

type GoostStatus = "moon" | "rocket" | "earth" | "work" | "idle" | "doom_loop" | "mic"

interface ContractState {
  active: boolean
  text: string | null
  objective: string | null
  criteriaStatus: string[]
  progress: string
}

// =============================================================================
// Constants
// =============================================================================

const STATUS_EMOJIS: Record<GoostStatus, string> = {
  moon: "🌕",      // Waiting for sub-agents
  rocket: "🚀",    // Setting up sub-agents / active work
  earth: "🌍",     // Awaiting user input / complete
  work: "🚀",      // Active work (default busy state)
  idle: "🌍",      // Idle = same as awaiting input
  doom_loop: "🔄", // Stuck in retry loop
  mic: "🎤",       // Needs user approval for command
}

const TAB_COLORS: Record<GoostStatus, string> = {
  moon: "#5865F2",      // Discord blurple - waiting for sub-agents
  rocket: "#ED4245",    // Red - active work / launching
  earth: "#57F287",     // Green - complete/ready for input
  work: "#ED4245",      // Red - same as rocket (active work)
  idle: "#57F287",      // Green - idle/ready for input
  doom_loop: "#FFA500", // Orange - warning, stuck in loop
  mic: "#FFCC00",       // Yellow - needs user approval
}

// Contract status patterns to detect in responses
const GOOST_MARKERS: Record<GoostStatus, RegExp> = {
  moon: /\[GOOST:MOON\]/,
  rocket: /\[GOOST:ROCKET\]/,
  earth: /\[GOOST:EARTH\]/,
  work: /\[GOOST:WORK\]/,
  idle: /\[GOOST:IDLE\]/,
  doom_loop: /\[GOOST:DOOM_LOOP\]/,
  mic: /\[GOOST:MIC\]/,
}

// Contract detection patterns
const CONTRACT_ACTIVE = /CONTRACT ACTIVE/
const CONTRACT_FULFILLED = /CONTRACT FULFILLED/
const CONTRACT_VOIDED = /CONTRACT VOIDED/

// Debug mode
const DEBUG = process.env.GOOST_DEBUG === "1"

// =============================================================================
// Helpers
// =============================================================================

const log = (msg: string) => {
  if (DEBUG) {
    console.error(`[Goost] ${msg}`)
  }
}

/**
 * Detect if running inside tmux
 */
const isTmux = (): boolean => !!process.env.TMUX

/**
 * Write OSC escape sequence with tmux passthrough support
 * 
 * When running inside tmux, escape sequences must be wrapped in DCS passthrough:
 * \x1bPtmux;\x1b<escaped_sequence>\x1b\\
 * 
 * Where <escaped_sequence> has all ESC (\x1b) characters doubled.
 */
const writeOSC = (sequence: string): void => {
  try {
    if (isTmux()) {
      // tmux passthrough: wrap sequence and double all ESC characters
      const escaped = sequence.replace(/\x1b/g, '\x1b\x1b')
      process.stdout.write(`\x1bPtmux;${escaped}\x1b\\`)
    } else {
      process.stdout.write(sequence)
    }
  } catch (error) {
    log(`Error writing OSC sequence: ${error}`)
  }
}

/**
 * Set Windows Terminal tab color using OSC 9;9
 * This is a Windows Terminal proprietary extension
 */
const setTabColor = (color: string): void => {
  if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
    writeOSC(`\x1b]9;9;${color}\x07`)
  }
}

/**
 * Reset Windows Terminal tab color to default
 */
const resetTabColor = (): void => {
  // OSC 9;9; with empty/default resets the color
  writeOSC(`\x1b]9;9;\x07`)
}

/**
 * Reset tab title to default (empty lets terminal use its default)
 */
const resetTabTitle = (): void => {
  // Set to empty string to let terminal use its default title
  writeOSC(`\x1b]0;\x07`)
}

/**
 * Full cleanup - reset both title and color
 */
const cleanupTerminal = (): void => {
  log("Cleaning up terminal state")
  resetTabTitle()
  resetTabColor()
}

/**
 * Extract project name from directory path
 */
const getProjectName = (directory: string): string => {
  if (!directory) return "opencode"
  // Get the last segment of the path
  const segments = directory.replace(/\\/g, '/').split('/').filter(Boolean)
  return segments[segments.length - 1] || "opencode"
}

/**
 * Parse contract status from text (e.g., "Criteria: 2/5 complete")
 */
const parseContractStatus = (text: string): string => {
  const match = text.match(/Criteria:\s*(\d+)\/(\d+)/i)
  if (match) {
    return `${match[1]}/${match[2]}`
  }
  return ""
}

/**
 * Extract contract block from message content
 * Matches from CONTRACT ACTIVE until the closing delimiter or end
 */
const extractContractBlock = (text: string): string | null => {
  // Match the full contract block - greedy match until closing delimiter or specific end markers
  const contractMatch = text.match(
    /={40,}\s*CONTRACT ACTIVE\s*={40,}[\s\S]*?={40,}/
  )
  if (contractMatch) {
    return contractMatch[0]
  }
  // Fallback: match until end of text if no closing delimiter
  const fallbackMatch = text.match(
    /={40,}\s*CONTRACT ACTIVE\s*={40,}[\s\S]*/
  )
  return fallbackMatch ? fallbackMatch[0] : null
}

/**
 * Extract objective from contract block
 */
const extractObjective = (text: string): string | null => {
  const match = text.match(/OBJECTIVE:\s*(.+)/i)
  return match ? match[1].trim() : null
}

/**
 * Extract criteria with their status (supports both [x] and [X])
 */
const extractCriteria = (text: string): string[] => {
  const criteria: string[] = []
  const criteriaMatches = text.matchAll(/- \[([ xX])\] (.+)/g)
  for (const match of criteriaMatches) {
    const checked = match[1].toLowerCase() === 'x' ? 'x' : ' '
    criteria.push(`[${checked}] ${match[2]}`)
  }
  return criteria
}

// =============================================================================
// Plugin
// =============================================================================

const GoostStatusPlugin: Plugin = async ({ directory }) => {
  // Extract project name from directory
  const projectName = getProjectName(directory || process.cwd())
  log(`Project name: ${projectName}`)
  
  // State
  let currentIcon = STATUS_EMOJIS.idle
  let currentStatus: GoostStatus = "idle"
  let activeSubAgents = 0  // Track running sub-agents
  
  let contract: ContractState = {
    active: false,
    text: null,
    objective: null,
    criteriaStatus: [],
    progress: ""
  }
  
  // Register cleanup handlers for process exit
  const exitHandler = () => {
    cleanupTerminal()
  }
  
  // Handle various exit scenarios
  process.on('exit', exitHandler)
  process.on('SIGINT', () => {
    cleanupTerminal()
    process.exit(0)
  })
  process.on('SIGTERM', () => {
    cleanupTerminal()
    process.exit(0)
  })
  
  // Also handle uncaught exceptions to ensure cleanup
  process.on('uncaughtException', (err) => {
    log(`Uncaught exception: ${err}`)
    cleanupTerminal()
  })

  /**
   * Get descriptive status text based on current state
   */
  const getStatusText = (): string => {
    switch (currentStatus) {
      case "doom_loop":
        return "STUCK"
      case "mic":
        return "Approval"
      case "moon":
        return activeSubAgents > 1 ? `Agents(${activeSubAgents})` : "Agent"
      case "rocket":
        return "Launching"
      case "earth":
        return contract.active ? "Ready" : "Done"
      case "work":
        return "Working"
      case "idle":
        return contract.active ? "Contract" : ""
      default:
        return ""
    }
  }
  
  /**
   * Update window/tab title using OSC 0 (standard xterm title)
   * Format: 🚀 projectname: Status [1/3]
   */
  const updateTitle = (): void => {
    const statusText = getStatusText()
    const progressText = contract.progress ? ` [${contract.progress}]` : ""
    
    // Build title: emoji project: status [progress]
    let display: string
    if (statusText) {
      display = `${currentIcon} ${projectName}: ${statusText}${progressText}`
    } else {
      // Idle with no contract - just show project name
      display = `${currentIcon} ${projectName}${progressText}`
    }
    
    writeOSC(`\x1b]0;${display}\x07`)
  }

  /**
   * Detect status from response text based on markers and contract state
   */
  const detectStatus = (text: string): GoostStatus => {
    // Check for explicit goost markers first (doom_loop and mic take priority)
    if (GOOST_MARKERS.doom_loop.test(text)) return "doom_loop"
    if (GOOST_MARKERS.mic.test(text)) return "mic"
    if (GOOST_MARKERS.moon.test(text)) return "moon"
    if (GOOST_MARKERS.rocket.test(text)) return "rocket"
    if (GOOST_MARKERS.earth.test(text)) return "earth"
    if (GOOST_MARKERS.work.test(text)) return "work"
    if (GOOST_MARKERS.idle.test(text)) return "idle"

    // Infer from contract state
    if (CONTRACT_FULFILLED.test(text) || CONTRACT_VOIDED.test(text)) {
      return "earth"
    }

    // Default to work if contract is active
    if (contract.active) {
      return "work"
    }

    return "idle"
  }

  /**
   * Update UI state (icon, color, title) based on detected status
   */
  const updateUIState = (status: GoostStatus): void => {
    currentStatus = status
    currentIcon = STATUS_EMOJIS[status]
    setTabColor(TAB_COLORS[status])
    updateTitle()
  }

  /**
   * Process message content for contract state changes
   */
  const processMessageContent = (content: string): void => {
    // Track contract state and extract full contract text
    if (CONTRACT_ACTIVE.test(content)) {
      const contractBlock = extractContractBlock(content)
      if (contractBlock) {
        contract = {
          active: true,
          text: contractBlock,
          objective: extractObjective(contractBlock),
          criteriaStatus: extractCriteria(contractBlock),
          progress: parseContractStatus(content) || contract.progress
        }
        log(`Contract captured: ${contract.objective || 'Unknown objective'}`)
      } else {
        contract.active = true
      }
    }
    
    // Update criteria status from status blocks
    const statusBlockMatch = content.match(/CONTRACT STATUS:[\s\S]*?(?=\n---|\n\n|$)/)
    if (statusBlockMatch && contract.active) {
      const newCriteria = extractCriteria(statusBlockMatch[0])
      if (newCriteria.length > 0) {
        contract.criteriaStatus = newCriteria
      }
    }
    
    // Check for contract end
    if (CONTRACT_FULFILLED.test(content) || CONTRACT_VOIDED.test(content)) {
      log("Contract ended")
      contract = {
        active: false,
        text: null,
        objective: null,
        criteriaStatus: [],
        progress: ""
      }
    }

    // Parse progress
    const progress = parseContractStatus(content)
    if (progress) {
      contract.progress = progress
    }

    // Detect and apply status
    const status = detectStatus(content)
    updateUIState(status)
  }

  /**
   * Build preservation context for compaction
   */
  const buildPreservationContext = (): string => {
    if (!contract.text) return ""
    
    return `
╔══════════════════════════════════════════════════════════════════╗
║             CRITICAL: ACTIVE CONTRACT - MUST PRESERVE            ║
╚══════════════════════════════════════════════════════════════════╝

${contract.text}

CURRENT PROGRESS:
${contract.criteriaStatus.map(c => `  ${c}`).join('\n') || '  No criteria tracked yet'}

PROGRESS SUMMARY: ${contract.progress || 'Not yet determined'}
${contract.objective ? `OBJECTIVE: ${contract.objective}` : ''}

⚠️  This contract MUST be maintained after compaction.
⚠️  All criteria status must be preserved.
⚠️  The agent must continue working toward ALL remaining criteria.
`
  }

  // ===========================================================================
  // Hook Implementations
  // ===========================================================================

  return {
    // Track session status and compaction events
    event: async (input) => {
      try {
        const { event } = input
        
        // SDK type: EventSessionStatus = { type: "session.status"; properties: { sessionID: string; status: SessionStatus } }
        // SessionStatus = { type: "idle" } | { type: "retry"; ... } | { type: "busy" }
        if (event.type === "session.status") {
          const { status } = event.properties as { sessionID: string; status: { type: string } }
          
          if (status.type === "idle") {
            updateUIState(contract.active ? "earth" : "idle")
          } else if (status.type === "busy") {
            updateUIState("work")
          }
        }
        
        // Detect compaction events
        if (event.type === "session.compacted") {
          if (contract.text) {
            log("Session compacted - contract preservation active")
            log(`Contract objective: ${contract.objective || 'Unknown'}`)
            log(`Progress: ${contract.progress || 'Unknown'}`)
          }
        }

        // Listen for message events to track contract state
        // SDK type: EventMessageUpdated = { type: "message.updated"; properties: { info: Message } }
        if (event.type === "message.updated") {
          const props = event.properties as { 
            info?: { 
              role?: string
              parts?: Array<{ type: string; text?: string }>
            } 
          }
          
          if (props.info?.role === "assistant" && props.info.parts) {
            for (const part of props.info.parts) {
              if (part.type === "text" && part.text) {
                processMessageContent(part.text)
              }
            }
          }
        }
      } catch (error) {
        log(`Error in event handler: ${error}`)
      }
    },

    // Watch for task tool calls (sub-agent spawning)
    // Before: show moon because sub-agent is about to run (we'll be waiting)
    "tool.execute.before": async (input, _output) => {
      try {
        if (input.tool === "task") {
          activeSubAgents++
          log(`Sub-agent starting (active: ${activeSubAgents})`)
          updateUIState("moon")
        }
      } catch (error) {
        log(`Error in tool.execute.before: ${error}`)
      }
    },

    // After task tool completes, sub-agent is done
    "tool.execute.after": async (input, output) => {
      try {
        if (input.tool === "task") {
          activeSubAgents = Math.max(0, activeSubAgents - 1)
          log(`Sub-agent finished (active: ${activeSubAgents})`)
          
          // Check for sub-agent failure indicators
          const taskOutput = output?.output || ""
          const failed = /error|failed|exception/i.test(taskOutput)
          
          if (failed) {
            log(`Sub-agent may have failed: ${output?.title || 'Unknown task'}`)
          }
          
          // If still have active sub-agents, stay in moon state
          if (activeSubAgents > 0) {
            updateUIState("moon")
          } else {
            // All sub-agents done, back to working state
            updateUIState("work")
          }
        }
      } catch (error) {
        log(`Error in tool.execute.after: ${error}`)
      }
    },

    // Contract preservation during compaction
    "experimental.session.compacting": async (_input, output) => {
      try {
        if (contract.text) {
          const preservationContext = buildPreservationContext()
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
