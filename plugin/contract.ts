/**
 * Goost Plugin - Contract State Management
 *
 * Handles contract parsing, state management, and content processing.
 * Provides factory functions for consistent state initialization.
 */

import {
  type ContractState,
  type PluginState,
  type GoostStatus,
  type TaskOutput,
  CONTRACT_DELIMITER_MIN_LENGTH,
  CONTRACT_PATTERNS,
  GOOST_MARKERS,
  STATUS_EMOJIS,
  FAILURE_PATTERNS,
  DOOM_LOOP_THRESHOLD,
} from "./types"

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create an empty/inactive contract state.
 * Use when contract ends or on initial plugin load.
 */
export const createEmptyContract = (): ContractState => ({
  active: false,
  text: null,
  objective: null,
  criteriaStatus: [],
  progress: "",
})

/**
 * Create an active contract state from a contract block.
 *
 * @param block - The full contract block text
 * @returns ContractState with parsed objective and criteria
 */
export const createActiveContract = (block: string): ContractState => ({
  active: true,
  text: block,
  objective: extractObjective(block),
  criteriaStatus: extractCriteria(block),
  progress: "",
})

/**
 * Create initial plugin state.
 * Use on plugin initialization.
 */
export const createInitialState = (): PluginState => ({
  icon: STATUS_EMOJIS.idle,
  status: "idle",
  activeSubAgents: 0,
  contract: createEmptyContract(),
  subAgentFailures: new Map<string, number>(),
})

// =============================================================================
// Contract Parsing Functions
// =============================================================================

/**
 * Build regex for contract block matching.
 * Uses the configured delimiter length.
 */
const buildContractBlockRegex = (): RegExp => {
  const len = CONTRACT_DELIMITER_MIN_LENGTH
  return new RegExp(`={${len},}\\s*CONTRACT ACTIVE\\s*={${len},}[\\s\\S]*?={${len},}`)
}

/**
 * Build fallback regex for contract block (matches to end of text).
 */
const buildContractFallbackRegex = (): RegExp => {
  const len = CONTRACT_DELIMITER_MIN_LENGTH
  return new RegExp(`={${len},}\\s*CONTRACT ACTIVE\\s*={${len},}[\\s\\S]*`)
}

/**
 * Extract contract block from message content.
 * Matches from CONTRACT ACTIVE until the closing delimiter or end.
 *
 * @param text - Full message content
 * @returns Contract block text or null if not found
 */
export const extractContractBlock = (text: string): string | null => {
  // Match the full contract block - greedy match until closing delimiter
  const contractMatch = text.match(buildContractBlockRegex())
  if (contractMatch) {
    return contractMatch[0]
  }
  // Fallback: match until end of text if no closing delimiter
  const fallbackMatch = text.match(buildContractFallbackRegex())
  return fallbackMatch ? fallbackMatch[0] : null
}

/**
 * Extract objective from contract block.
 *
 * @param text - Contract block text
 * @returns Objective string or null if not found
 */
export const extractObjective = (text: string): string | null => {
  const match = text.match(/OBJECTIVE:\s*(.+)/i)
  return match ? match[1].trim() : null
}

/**
 * Extract criteria with their status.
 * Supports both [x] and [X] as checked.
 *
 * @param text - Contract block or status block text
 * @returns Array of criteria strings like "[x] Criterion text"
 */
export const extractCriteria = (text: string): string[] => {
  const criteria: string[] = []
  const criteriaMatches = text.matchAll(/- \[([ xX?])\] (.+)/g)
  for (const match of criteriaMatches) {
    // Normalize: lowercase x for checked, space for unchecked, ? for conflict
    const checkChar = match[1].toLowerCase() === "x" ? "x" : match[1] === "?" ? "?" : " "
    criteria.push(`[${checkChar}] ${match[2]}`)
  }
  return criteria
}

/**
 * Parse contract progress from text (e.g., "Criteria: 2/5 complete").
 *
 * @param text - Text containing progress info
 * @returns Progress string like "2/5" or empty string if not found
 */
export const parseContractStatus = (text: string): string => {
  const match = text.match(/Criteria:\s*(\d+)\/(\d+)/i)
  if (match) {
    return `${match[1]}/${match[2]}`
  }
  return ""
}

// =============================================================================
// Status Detection
// =============================================================================

/**
 * Detect status from response text based on markers and contract state.
 *
 * Priority order:
 * 1. Explicit GOOST markers (doom_loop and mic take highest priority)
 * 2. Contract end markers (FULFILLED/VOIDED)
 * 3. Inference from contract state
 *
 * @param text - Message content to analyze
 * @param contractActive - Whether a contract is currently active
 * @returns Detected GoostStatus
 */
export const detectStatus = (text: string, contractActive: boolean): GoostStatus => {
  // Check for explicit goost markers first (doom_loop and mic take priority)
  if (GOOST_MARKERS.doom_loop.test(text)) return "doom_loop"
  if (GOOST_MARKERS.mic.test(text)) return "mic"
  if (GOOST_MARKERS.moon.test(text)) return "moon"
  if (GOOST_MARKERS.rocket.test(text)) return "rocket"
  if (GOOST_MARKERS.earth.test(text)) return "earth"
  if (GOOST_MARKERS.work.test(text)) return "work"
  if (GOOST_MARKERS.idle.test(text)) return "idle"

  // Infer from contract state
  if (CONTRACT_PATTERNS.FULFILLED.test(text) || CONTRACT_PATTERNS.VOIDED.test(text)) {
    return "earth"
  }

  // Default to work if contract is active
  if (contractActive) {
    return "work"
  }

  return "idle"
}

// =============================================================================
// State Update Functions
// =============================================================================

/**
 * Get descriptive status text based on current state.
 *
 * @param status - Current Goost status
 * @param activeSubAgents - Number of active sub-agents
 * @param contractActive - Whether contract is active
 * @returns Human-readable status text
 */
export const getStatusText = (
  status: GoostStatus,
  activeSubAgents: number,
  contractActive: boolean
): string => {
  switch (status) {
    case "doom_loop":
      return "STUCK"
    case "mic":
      return ">>> APPROVAL NEEDED <<<"
    case "moon":
      return activeSubAgents > 1 ? `Agents(${activeSubAgents})` : "Agent"
    case "rocket":
      return "Launching"
    case "earth":
      return contractActive ? "Ready" : "Done"
    case "work":
      return "Working"
    case "idle":
      return contractActive ? "Contract" : ""
    default:
      return ""
  }
}

/**
 * Process message content for contract state changes.
 * Handles contract activation, status updates, and contract end.
 *
 * @param state - Current plugin state
 * @param content - Message content to process
 * @returns Updated plugin state
 */
export const processMessageContent = (state: PluginState, content: string): PluginState => {
  let newState = { ...state }

  // Check for contract activation
  if (CONTRACT_PATTERNS.ACTIVE.test(content)) {
    newState = processContractActivation(newState, content)
  }

  // Update criteria status from status blocks
  if (newState.contract.active) {
    newState = processStatusBlock(newState, content)
  }

  // Check for contract end
  if (CONTRACT_PATTERNS.FULFILLED.test(content) || CONTRACT_PATTERNS.VOIDED.test(content)) {
    newState = processContractEnd(newState)
  }

  // Parse progress
  const progress = parseContractStatus(content)
  if (progress) {
    newState = {
      ...newState,
      contract: { ...newState.contract, progress },
    }
  }

  // Detect and apply status
  const status = detectStatus(content, newState.contract.active)
  newState = updateStateStatus(newState, status)

  return newState
}

/**
 * Process contract activation from message content.
 *
 * @param state - Current plugin state
 * @param content - Message content containing CONTRACT ACTIVE
 * @returns Updated plugin state with active contract
 */
export const processContractActivation = (state: PluginState, content: string): PluginState => {
  const contractBlock = extractContractBlock(content)
  if (contractBlock) {
    return {
      ...state,
      contract: {
        ...createActiveContract(contractBlock),
        progress: parseContractStatus(content) || state.contract.progress,
      },
      // Reset failure tracking for new contract
      subAgentFailures: new Map<string, number>(),
    }
  }
  // Fallback: mark active but couldn't parse block
  return {
    ...state,
    contract: { ...state.contract, active: true },
  }
}

/**
 * Process status block updates in message content.
 *
 * @param state - Current plugin state
 * @param content - Message content potentially containing status block
 * @returns Updated plugin state with new criteria status
 */
export const processStatusBlock = (state: PluginState, content: string): PluginState => {
  const statusBlockMatch = content.match(/CONTRACT STATUS:[\s\S]*?(?=\n---|\n\n|$)/)
  if (statusBlockMatch) {
    const newCriteria = extractCriteria(statusBlockMatch[0])
    if (newCriteria.length > 0) {
      return {
        ...state,
        contract: { ...state.contract, criteriaStatus: newCriteria },
      }
    }
  }
  return state
}

/**
 * Process contract end (fulfilled or voided).
 *
 * @param state - Current plugin state
 * @returns Updated plugin state with empty contract
 */
export const processContractEnd = (state: PluginState): PluginState => ({
  ...state,
  contract: createEmptyContract(),
  // Clear failure tracking
  subAgentFailures: new Map<string, number>(),
})

/**
 * Update state with new status.
 *
 * @param state - Current plugin state
 * @param status - New status to set
 * @returns Updated plugin state with new status and icon
 */
export const updateStateStatus = (state: PluginState, status: GoostStatus): PluginState => ({
  ...state,
  status,
  icon: STATUS_EMOJIS[status],
})

// =============================================================================
// Contract Preservation for Compaction
// =============================================================================

/**
 * Build preservation context for session compaction.
 * This content is injected into the compaction to preserve contract state.
 *
 * @param contract - Current contract state
 * @returns Formatted preservation context string, or empty if no contract
 */
export const buildPreservationContext = (contract: ContractState): string => {
  if (!contract.text) return ""

  const criteriaList = contract.criteriaStatus.length > 0
    ? contract.criteriaStatus.map((c) => `  ${c}`).join("\n")
    : "  No criteria tracked yet"

  return `
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551             CRITICAL: ACTIVE CONTRACT - MUST PRESERVE            \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D

${contract.text}

CURRENT PROGRESS:
${criteriaList}

PROGRESS SUMMARY: ${contract.progress || "Not yet determined"}
${contract.objective ? `OBJECTIVE: ${contract.objective}` : ""}

\u26A0\uFE0F  This contract MUST be maintained after compaction.
\u26A0\uFE0F  All criteria status must be preserved.
\u26A0\uFE0F  The agent must continue working toward ALL remaining criteria.
`
}

// =============================================================================
// Sub-Agent Failure Tracking
// =============================================================================

/**
 * Check if sub-agent output indicates a failure.
 *
 * A result is considered a failure if:
 * - Output contains failure patterns (error:, cannot proceed, etc.)
 * - Output is empty (though this may be legitimate for some tasks)
 *
 * @param output - Task tool output
 * @returns true if output indicates failure
 */
export const isSubAgentFailure = (output: TaskOutput): boolean => {
  const taskOutput = output.output || ""
  return FAILURE_PATTERNS.test(taskOutput)
}

/**
 * Check if sub-agent output is empty.
 * Empty output is logged as a warning but not always a failure.
 *
 * @param output - Task tool output
 * @returns true if output is empty or whitespace only
 */
export const isSubAgentEmpty = (output: TaskOutput): boolean => {
  const taskOutput = output.output || ""
  return taskOutput.trim() === ""
}

/**
 * Extract criterion identifier from task description.
 * Used for tracking failures per criterion.
 *
 * @param description - Task description string
 * @returns Criterion identifier (description or "unknown")
 */
export const extractCriterionFromTask = (description: string | undefined): string => {
  return description?.trim() || "unknown"
}

/**
 * Record a sub-agent failure for a criterion.
 *
 * @param state - Current plugin state
 * @param criterion - Criterion identifier that failed
 * @returns Updated state with incremented failure count
 */
export const recordSubAgentFailure = (state: PluginState, criterion: string): PluginState => {
  const newFailures = new Map(state.subAgentFailures)
  const currentCount = newFailures.get(criterion) || 0
  newFailures.set(criterion, currentCount + 1)
  return {
    ...state,
    subAgentFailures: newFailures,
  }
}

/**
 * Check if a criterion has reached the doom loop threshold.
 *
 * @param state - Current plugin state
 * @param criterion - Criterion identifier to check
 * @returns true if failures >= DOOM_LOOP_THRESHOLD
 */
export const isDoomLoopReached = (state: PluginState, criterion: string): boolean => {
  const failures = state.subAgentFailures.get(criterion) || 0
  return failures >= DOOM_LOOP_THRESHOLD
}
