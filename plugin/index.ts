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

const GoostStatusPlugin: Plugin = async () => {
  // State
  let currentIcon = STATUS_EMOJIS.idle
  let currentStats = "Goost"
  
  let contract: ContractState = {
    active: false,
    text: null,
    objective: null,
    criteriaStatus: [],
    progress: ""
  }

  /**
   * Update window/tab title using OSC 0 (standard xterm title)
   */
  const updateTitle = (): void => {
    const display = contract.progress 
      ? `${currentIcon} ${currentStats} [${contract.progress}]`
      : `${currentIcon} ${currentStats}`
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
    currentIcon = STATUS_EMOJIS[status]
    setTabColor(TAB_COLORS[status])

    switch (status) {
      case "doom_loop":
        currentStats = "STUCK"
        break
      case "mic":
        currentStats = "Approval Needed"
        break
      case "moon":
        currentStats = "Sub-agents"
        break
      case "rocket":
        currentStats = "Launching"
        break
      case "earth":
        currentStats = contract.active ? "Ready" : "Complete"
        break
      case "work":
        currentStats = "Working"
        break
      default:
        currentStats = "Goost"
    }

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
        
        if (event.type === "session.status") {
          const status = (event.properties as { status: { type: string } }).status
          
          if (status.type === "idle") {
            currentIcon = STATUS_EMOJIS.earth
            setTabColor(TAB_COLORS.earth)
            currentStats = contract.active ? "Contract" : "Goost"
          } else if (status.type === "busy") {
            currentIcon = STATUS_EMOJIS.work
            setTabColor(TAB_COLORS.work)
          }
          updateTitle()
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
        if (event.type === "message.updated") {
          const props = event.properties as { 
            message?: { 
              role?: string
              parts?: Array<{ type: string; text?: string }>
            } 
          }
          
          if (props.message?.role === "assistant" && props.message.parts) {
            for (const part of props.message.parts) {
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
    "tool.execute.before": async (input, _output) => {
      try {
        if (input.tool === "task") {
          currentIcon = STATUS_EMOJIS.rocket
          setTabColor(TAB_COLORS.rocket)
          currentStats = "Spawning"
          updateTitle()
        }
      } catch (error) {
        log(`Error in tool.execute.before: ${error}`)
      }
    },

    // After task tool, we're waiting for sub-agent
    "tool.execute.after": async (input, output) => {
      try {
        if (input.tool === "task") {
          // Check for sub-agent failure indicators
          const taskOutput = output?.output || ""
          const failed = /error|failed|exception/i.test(taskOutput)
          
          if (failed) {
            log(`Sub-agent may have failed: ${output?.title || 'Unknown task'}`)
          }
          
          currentIcon = STATUS_EMOJIS.moon
          setTabColor(TAB_COLORS.moon)
          currentStats = "Waiting"
          updateTitle()
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
