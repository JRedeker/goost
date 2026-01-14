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
  type SubAgentWork,
  ConvergencePhase,
  CONTRACT_DELIMITER_MIN_LENGTH,
  CONTRACT_PATTERNS,
  CONTRACT_STATUS_HEADER,
  GOOST_MARKERS,
  STATUS_EMOJIS,
  FAILURE_PATTERNS,
  getDoomLoopThreshold,
  OPENSPEC_COMMAND_PATTERN,
  OPENSPEC_CHANGE_PATH_PATTERN,
  OPENSPEC_USER_REQUEST_PATTERN,
  TEST_RUNNER_PATTERNS,
  CHECKPOINT_PATTERN,
} from "./types"

// =============================================================================
// Security & Validation
// =============================================================================

/**
 * Validate criterion ID format to prevent injection or malformed state keys.
 * Matches alphanumeric, underscores, and hyphens.
 */
export const validateCriterionId = (id: string): boolean => {
  return /^[a-zA-Z0-9_-]+$/.test(id)
}

/**
 * Sanitize file path to prevent path traversal and normalize separators.
 * Normalizes to forward slashes.
 */
export const sanitizePath = (path: string): string => {
  // Normalize separators
  const normalized = path.replace(/\\/g, "/")
  // Basic path traversal prevention - remove ../
  return normalized.replace(/\.\.\//g, "")
}

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
 */
export const createInitialAnomalyState = () => ({
  lastAnalyzedLength: 0,
  abortedThisResponse: false,
  toolExecuting: false,
  abortQueued: false,
})

/**
 * Create initial convergence state.
 */
export const createInitialConvergenceState = () => ({
  phase: ConvergencePhase.DISCOVERY,
  progress: 0,
  checkpoints: [],
  pendingSubAgents: new Set<string>(),
  expectedFindings: 0,
  receivedFindings: 0,
  startTime: Date.now(),
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
  subAgentWork: new Map<string, SubAgentWork>(),
  convergenceState: null,
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
  const contractMatch = text.match(CONTRACT_BLOCK_REGEX)
  if (contractMatch) {
    return contractMatch[0]
  }
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

/**
 * Process checkpoint markers in content.
 */
export const processCheckpoints = (state: PluginState, content: string): PluginState => {
  const matches = content.matchAll(CHECKPOINT_PATTERN)
  let newState = { ...state }

  for (const match of matches) {
    const type = match[1]
    const paramsStr = match[2]
    const params: Record<string, string> = {}

    // Parse key=value pairs
    const paramMatches = paramsStr.matchAll(/(\w+)=([^\s\]]+)/g)
    for (const pMatch of paramMatches) {
      params[pMatch[1]] = pMatch[2]
    }

    if (process.env.GOOST_DEBUG === "1") {
      console.error(`[Goost] Checkpoint detected: ${type}`, params)
    }

    // Update convergence state if active
    if (newState.convergenceState) {
      const { convergenceState } = newState
      const checkpoints = [...convergenceState.checkpoints, type]

      // Handle phase transitions
      let { phase } = convergenceState
      if (type === "PHASE_COMPLETE" || type.endsWith("_COMPLETE")) {
        const nextPhaseMap: Record<string, ConvergencePhase> = {
          [ConvergencePhase.DISCOVERY]: ConvergencePhase.MAPPING,
          [ConvergencePhase.MAPPING]: ConvergencePhase.SYNTHESIS,
          [ConvergencePhase.SYNTHESIS]: ConvergencePhase.COMPLETE,
          [ConvergencePhase.COMPLETE]: ConvergencePhase.COMPLETE,
        }
        phase = nextPhaseMap[phase] || phase
      }

      newState = {
        ...newState,
        convergenceState: {
          ...convergenceState,
          phase,
          checkpoints,
          lastCheckpointTime: Date.now(),
          receivedFindings: params.findings
            ? parseInt(params.findings, 10)
            : convergenceState.receivedFindings,
        },
      }
    }
  }

  return newState
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
  const userRequestMatch = text.match(OPENSPEC_USER_REQUEST_PATTERN)
  if (userRequestMatch) {
    return userRequestMatch[1]
  }

  const commandMatch = text.match(OPENSPEC_COMMAND_PATTERN)
  if (commandMatch) {
    return commandMatch[1]
  }

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
 */
export const detectStatus = (text: string, contractActive: boolean): GoostStatus => {
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

  if (GOOST_MARKERS.doom_loop.test(text)) return "doom_loop"
  if (GOOST_MARKERS.mic.test(text)) return "mic"
  if (GOOST_MARKERS.moon.test(text)) return "moon"
  if (GOOST_MARKERS.rocket.test(text)) return "rocket"
  if (GOOST_MARKERS.earth.test(text)) return "earth"
  if (GOOST_MARKERS.work.test(text)) return "work"
  if (GOOST_MARKERS.idle.test(text)) return "idle"

  if (CONTRACT_PATTERNS.FULFILLED.test(text) || CONTRACT_PATTERNS.VOIDED.test(text)) {
    return "earth"
  }

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
 */
export const getStatusText = (
  status: GoostStatus,
  activeSubAgents: number,
  contractActive: boolean
): string => {
  switch (status) {
    case "doom_loop":
      return "\u{1F6A8} LOOP DETECTED"
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
 */
export const processMessageContent = (state: PluginState, content: string): PluginState => {
  let newState = { ...state }

  const contractActivated = CONTRACT_PATTERNS.ACTIVE.test(content)
  const contractEnded =
    CONTRACT_PATTERNS.FULFILLED.test(content) || CONTRACT_PATTERNS.VOIDED.test(content)

  const openSpecChange = extractOpenSpecChange(content)
  if (openSpecChange) {
    newState = { ...newState, openSpecChange }
  }

  if (contractActivated) {
    newState = processContractActivation(newState, content)
    // Initialize convergence state if it looks like an analysis command
    if (newState.openSpecChange?.match(/audit|review|slop-scan/i)) {
      newState.convergenceState = createInitialConvergenceState()
    }
  }

  // Process checkpoints
  newState = processCheckpoints(newState, content)

  if (newState.contract.active) {
    newState = processStatusBlock(newState, content)

    const phase = extractTestPhase(content)
    if (phase) {
      const status: GoostStatus = phase === "red" ? "tdd_red" : "tdd_green"
      newState = updateStateStatus(newState, status)
      if (phase === "red") {
        newState.contract.redPhaseSeen = true
      } else if (phase === "green") {
        newState.contract.greenPhaseSeen = true
      }
    }
  }

  if (contractEnded) {
    newState = processContractEnd(newState)
  }

  const progress = parseContractStatus(content)
  if (progress) {
    newState = {
      ...newState,
      contract: { ...newState.contract, progress },
    }
  }

  const detectedStatus = detectStatus(content, newState.contract.active)
  const isTerminalState = newState.status === "earth" || newState.status === "idle"
  const hasExplicitMarker = Object.values(GOOST_MARKERS).some((pattern) => pattern.test(content))

  if (hasExplicitMarker || contractEnded || !isTerminalState) {
    newState = updateStateStatus(newState, detectedStatus)
  }

  return newState
}

/**
 * Process contract activation from message content.
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
      subAgentFailures: new Map<string, number>(),
    }
  }
  return {
    ...state,
    contract: { ...state.contract, active: true },
  }
}

/**
 * Process status block updates in message content.
 */
const processStatusBlock = (state: PluginState, content: string): PluginState => {
  const statusBlockMatch = content.match(STATUS_BLOCK_REGEX)
  if (statusBlockMatch) {
    const newCriteria = extractCriteria(statusBlockMatch[0])
    if (newCriteria.length > 0) {
      const newlyCompleted = newCriteria.filter((c) => {
        if (!c.startsWith("[x]")) return false
        const criterionText = c.substring(4)
        return state.contract.criteriaStatus.some(
          (old) => !old.startsWith("[x]") && old.substring(4) === criterionText
        )
      })

      let newState = {
        ...state,
        contract: { ...state.contract, criteriaStatus: newCriteria },
      }

      for (const criterion of newlyCompleted) {
        const criterionId = criterion.substring(4)
        newState = clearSubAgentFailures(newState, criterionId)
      }

      return newState
    }
  }
  return state
}

/**
 * Process contract end (fulfilled or voided).
 */
const processContractEnd = (state: PluginState): PluginState => ({
  ...state,
  contract: createEmptyContract(),
  subAgentFailures: new Map<string, number>(),
  openSpecChange: null,
  convergenceState: null,
})

/**
 * Update state with new status.
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
// Sub-Agent Tracking & Failure Management
// =============================================================================

/**
 * Check if sub-agent output indicates a failure.
 */
export const isSubAgentFailure = (output: TaskOutput): boolean => {
  const taskOutput = output.output || ""
  return FAILURE_PATTERNS.test(taskOutput)
}

/**
 * Check if sub-agent output is empty.
 */
export const isSubAgentEmpty = (output: TaskOutput): boolean => {
  const taskOutput = output.output || ""
  return taskOutput.trim() === ""
}

/**
 * Extract criterion identifier from task description.
 * Normalizes to a safe ID format (kebab-case).
 */
export const extractCriterionFromTask = (description: string | undefined): string => {
  const text = description?.trim() || "unknown"
  // Normalize to kebab-case for safe Map keys and ID validation
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Record a sub-agent failure for a criterion.
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
 * Clear sub-agent failures for a specific criterion.
 */
export const clearSubAgentFailures = (state: PluginState, criterionId: string): PluginState => {
  const newFailures = new Map(state.subAgentFailures)
  newFailures.delete(criterionId)

  if (process.env.GOOST_DEBUG === "1") {
    console.error(`[Goost] Cleared failure count for completed criterion: ${criterionId}`)
  }

  return {
    ...state,
    subAgentFailures: newFailures,
  }
}

/**
 * Check if a criterion has reached the doom loop threshold.
 */
export const isDoomLoopReached = (state: PluginState, criterion: string): boolean => {
  const threshold = getDoomLoopThreshold(state.openSpecChange)
  const failures = state.subAgentFailures.get(criterion) || 0
  return failures >= threshold
}

/**
 * Record sub-agent work scope.
 */
export const recordSubAgentWork = (
  state: PluginState,
  criterionId: string,
  files: string[]
): PluginState => {
  const newWork = new Map(state.subAgentWork)
  const sanitizedFiles = new Set(files.map(sanitizePath))

  newWork.set(criterionId, {
    criterionId,
    files: sanitizedFiles,
    findingsCount: 0,
    status: "pending",
    lastUpdated: Date.now(),
  })

  return { ...state, subAgentWork: newWork }
}

/**
 * Update sub-agent work on completion.
 */
export const updateSubAgentWork = (
  state: PluginState,
  criterionId: string,
  findingsCount: number,
  status: "complete" | "failed"
): PluginState => {
  const newWork = new Map(state.subAgentWork)
  const existing = newWork.get(criterionId)

  if (existing) {
    newWork.set(criterionId, {
      ...existing,
      findingsCount,
      status,
      lastUpdated: Date.now(),
    })
  }

  return { ...state, subAgentWork: newWork }
}
