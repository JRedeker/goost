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
  CONTRACT_STATUS_HEADER,
  GOOST_MARKERS,
  STATUS_EMOJIS,
  FAILURE_PATTERNS,
  DOOM_LOOP_THRESHOLD,
  OPENSPEC_COMMAND_PATTERN,
  OPENSPEC_CHANGE_PATH_PATTERN,
  OPENSPEC_USER_REQUEST_PATTERN,
  TEST_RUNNER_PATTERNS,
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
  redPhaseSeen: false,
  greenPhaseSeen: false,
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
  redPhaseSeen: false,
  greenPhaseSeen: false,
})

/**
 * Create initial anomaly detection state.
 * Reset when session status changes (new response starts).
 */
export const createInitialAnomalyState = () => ({
  lastAnalyzedLength: 0,
  abortedThisResponse: false,
  toolExecuting: false,
  abortQueued: false,
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
  openSpecChange: null,
  sessionID: null,
  anomalyState: createInitialAnomalyState(),
})

// =============================================================================
// Contract Parsing Functions
// =============================================================================

/**
 * Pre-compiled regex for contract block matching.
 * Matches from CONTRACT ACTIVE to the closing delimiter.
 */
const CONTRACT_BLOCK_REGEX = new RegExp(
  `={${CONTRACT_DELIMITER_MIN_LENGTH},}\\s*CONTRACT ACTIVE\\s*={${CONTRACT_DELIMITER_MIN_LENGTH},}[\\s\\S]*?={${CONTRACT_DELIMITER_MIN_LENGTH},}`
)

/**
 * Pre-compiled fallback regex for contract block (matches to end of text).
 */
const CONTRACT_FALLBACK_REGEX = new RegExp(
  `={${CONTRACT_DELIMITER_MIN_LENGTH},}\\s*CONTRACT ACTIVE\\s*={${CONTRACT_DELIMITER_MIN_LENGTH},}[\\s\\S]*`
)

/**
 * Pre-compiled regex for status block matching.
 * Matches from CONTRACT STATUS: until end delimiter (---), double newline, or end of text.
 */
const STATUS_BLOCK_REGEX = new RegExp(`${CONTRACT_STATUS_HEADER}[\\s\\S]*?(?=\\n---|\\n\\n|$)`)

/**
 * Extract contract block from message content.
 * Matches from CONTRACT ACTIVE until the closing delimiter or end.
 *
 * @param text - Full message content
 * @returns Contract block text or null if not found
 */
const extractContractBlock = (text: string): string | null => {
  // Match the full contract block - greedy match until closing delimiter
  const contractMatch = text.match(CONTRACT_BLOCK_REGEX)
  if (contractMatch) {
    return contractMatch[0]
  }
  // Fallback: match until end of text if no closing delimiter
  const fallbackMatch = text.match(CONTRACT_FALLBACK_REGEX)
  return fallbackMatch ? fallbackMatch[0] : null
}

/**
 * Extract objective from contract block.
 *
 * @param text - Contract block text
 * @returns Objective string or null if not found
 */
const extractObjective = (text: string): string | null => {
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
const extractCriteria = (text: string): string[] => {
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
 * Extract TDD phase from status block (e.g., "phase: red|green").
 *
 * @param text - Text containing phase info
 * @returns "red" | "green" | null
 */
export const extractTestPhase = (text: string): "red" | "green" | null => {
  const match = text.match(/phase:\s*(red|green)/i)
  if (match) {
    return match[1].toLowerCase() as "red" | "green"
  }
  return null
}

/**
 * Check if a command string is a known test runner.
 *
 * @param command - The command string to check
 * @returns true if command matches test runner patterns
 */
export const isTestRunner = (command: string): boolean => {
  return TEST_RUNNER_PATTERNS.test(command)
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
// OpenSpec Detection
// =============================================================================

/**
 * Extract OpenSpec change name from message content.
 *
 * Detection priority:
 * 1. <UserRequest>change-id</UserRequest> - expanded slash command template
 * 2. /openspec-xxx change-id - direct command usage (if not expanded)
 * 3. openspec/changes/<id>/ - path references in assistant messages
 *
 * @param text - Message content to analyze
 * @returns Change name or null if not found
 */
export const extractOpenSpecChange = (text: string): string | null => {
  // Primary: Check for expanded slash command template <UserRequest>change-id</UserRequest>
  const userRequestMatch = text.match(OPENSPEC_USER_REQUEST_PATTERN)
  if (userRequestMatch) {
    return userRequestMatch[1]
  }

  // Secondary: Check for direct command usage: /openspec-xxx <change-id>
  const commandMatch = text.match(OPENSPEC_COMMAND_PATTERN)
  if (commandMatch) {
    return commandMatch[1]
  }

  // Tertiary: Check for openspec/changes/<id>/ path references
  const pathMatch = text.match(OPENSPEC_CHANGE_PATH_PATTERN)
  if (pathMatch) {
    return pathMatch[1]
  }

  return null
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
  // Debug: trace which markers we're checking
  const DEBUG = process.env.GOOST_DEBUG === "1"
  if (DEBUG) {
    const hasDoom = GOOST_MARKERS.doom_loop.test(text)
    const hasMic = GOOST_MARKERS.mic.test(text)
    const hasMoon = GOOST_MARKERS.moon.test(text)
    const hasRocket = GOOST_MARKERS.rocket.test(text)
    const hasEarth = GOOST_MARKERS.earth.test(text)
    const hasWork = GOOST_MARKERS.work.test(text)
    const hasIdle = GOOST_MARKERS.idle.test(text)
    if (hasDoom || hasMic || hasMoon || hasRocket || hasEarth || hasWork || hasIdle) {
      console.error(
        `[Goost:detectStatus] Markers found - doom:${hasDoom} mic:${hasMic} moon:${hasMoon} rocket:${hasRocket} earth:${hasEarth} work:${hasWork} idle:${hasIdle}`
      )
    }
  }

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
    case "tdd_red":
      return "RED PHASE"
    case "tdd_green":
      return "GREEN PHASE"
    default:
      return ""
  }
}

/**
 * Process message content for contract state changes.
 * Handles contract activation, status updates, OpenSpec tracking, and contract end.
 *
 * @param state - Current plugin state
 * @param content - Message content to process
 * @returns Updated plugin state
 */
export const processMessageContent = (state: PluginState, content: string): PluginState => {
  let newState = { ...state }

  // Cache pattern match results to avoid redundant regex execution
  const contractActivated = CONTRACT_PATTERNS.ACTIVE.test(content)
  const contractEnded =
    CONTRACT_PATTERNS.FULFILLED.test(content) || CONTRACT_PATTERNS.VOIDED.test(content)

  // Detect OpenSpec change name (only update if we find one, preserve existing)
  const openSpecChange = extractOpenSpecChange(content)
  if (openSpecChange) {
    newState = { ...newState, openSpecChange }
  }

  // Check for contract activation
  if (contractActivated) {
    newState = processContractActivation(newState, content)
  }

  // Update criteria status from status blocks
  if (newState.contract.active) {
    newState = processStatusBlock(newState, content)

    // Update TDD phase from status block
    const phase = extractTestPhase(content)
    if (phase) {
      const status: GoostStatus = phase === "red" ? "tdd_red" : "tdd_green"
      newState = updateStateStatus(newState, status)

      // Update contract state with phases seen
      if (phase === "red") {
        newState.contract.redPhaseSeen = true
      } else if (phase === "green") {
        newState.contract.greenPhaseSeen = true
      }
    }
  }

  // Check for contract end
  if (contractEnded) {
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
  // Priority: Explicit markers > Contract state changes > Current state
  const detectedStatus = detectStatus(content, newState.contract.active)
  const isTerminalState = newState.status === "earth" || newState.status === "idle"
  const hasExplicitMarker = Object.values(GOOST_MARKERS).some((pattern) => pattern.test(content))

  // Always update status if there's an explicit marker
  // Also update if contract ended
  // Also update if not in terminal state (allows status inference from message content)
  if (hasExplicitMarker || contractEnded || !isTerminalState) {
    const DEBUG = process.env.GOOST_DEBUG === "1"
    if (DEBUG) {
      console.error(
        `[Goost:processMessageContent] Applying status: ${detectedStatus} (explicit=${hasExplicitMarker}, ended=${contractEnded}, terminal=${isTerminalState})`
      )
    }
    newState = updateStateStatus(newState, detectedStatus)
  }

  return newState
}

/**
 * Process contract activation from message content.
 *
 * @param state - Current plugin state
 * @param content - Message content containing CONTRACT ACTIVE
 * @returns Updated plugin state with active contract
 */
const processContractActivation = (state: PluginState, content: string): PluginState => {
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
const processStatusBlock = (state: PluginState, content: string): PluginState => {
  const statusBlockMatch = content.match(STATUS_BLOCK_REGEX)
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
const processContractEnd = (state: PluginState): PluginState => ({
  ...state,
  contract: createEmptyContract(),
  // Clear failure tracking
  subAgentFailures: new Map<string, number>(),
  // Clear OpenSpec change tracking
  openSpecChange: null,
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

  const criteriaList =
    contract.criteriaStatus.length > 0
      ? contract.criteriaStatus.map((c) => `  ${c}`).join("\n")
      : "  No criteria tracked yet"

  return `
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D

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
