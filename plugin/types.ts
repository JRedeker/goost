/**
 * Goost Plugin - Type Definitions
 *
 * Contains all types, interfaces, constants, and Zod schemas for runtime validation.
 * Centralized here to ensure type safety across all modules.
 */

import { z } from "zod"

// =============================================================================
// Core Types
// =============================================================================

/**
 * Status indicators for Goost contract system.
 *
 * Semantic meanings:
 * - moon: Waiting for sub-agent tasks to complete
 * - rocket: Setting up/spawning sub-agents (launching phase)
 * - earth: Complete, awaiting user input
 * - work: Active work in progress (same icon as rocket, different semantic)
 * - idle: Idle without active contract (same icon as earth, different semantic)
 * - doom_loop: Stuck in retry cycle - needs intervention
 * - mic: Needs user approval for command execution
 * - tdd_red: Red Phase - test failing (TDD mandate)
 * - tdd_green: Green Phase - test passing (TDD mandate)
 */
export type GoostStatus =
  | "moon"
  | "rocket"
  | "earth"
  | "work"
  | "idle"
  | "doom_loop"
  | "mic"
  | "tdd_red"
  | "tdd_green"

/**
 * Contract state tracking structure
 */
export interface ContractState {
  active: boolean
  text: string | null
  objective: string | null
  criteriaStatus: string[]
  progress: string
  /** Whether a Red Phase (failing test) has been detected for the current contract */
  redPhaseSeen: boolean
  /** Whether a Green Phase (passing test) has been detected for the current contract */
  greenPhaseSeen: boolean
}

/**
 * Consolidated plugin state - single source of truth
 */
export interface PluginState {
  /** Current status icon emoji */
  icon: string
  /** Current status type */
  status: GoostStatus
  /** Number of active sub-agent tasks */
  activeSubAgents: number
  /** Active contract state */
  contract: ContractState
  /** Sub-agent failure tracking per criterion (for doom loop detection) */
  subAgentFailures: Map<string, number>
  /** Current OpenSpec change name (for tab title display) */
  openSpecChange: string | null
  /** Current session ID for abort calls */
  sessionID: string | null
  /** Anomaly detection state for current response */
  anomalyState: AnomalyState
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Status emojis for tab title display.
 *
 * Note: work/rocket and idle/earth share icons intentionally.
 * They represent different semantic states with the same visual indicator:
 * - rocket vs work: "launching" vs "actively working"
 * - earth vs idle: "contract complete" vs "no contract active"
 */
export const STATUS_EMOJIS: Record<GoostStatus, string> = {
  moon: "\u{1F315}", // Full Moon - waiting for sub-agents
  rocket: "\u{1F680}", // Rocket - setting up sub-agents / launching
  earth: "\u{1F30D}", // Earth - complete/ready for input
  work: "\u{1F680}", // Rocket - active work (same icon, different semantic: working vs launching)
  idle: "\u{1F30D}", // Earth - idle without contract (same icon, different semantic)
  doom_loop: "\u{1F504}", // Loop - stuck in retry cycle
  mic: "\u{1F3A4}", // Mic - needs user approval
  tdd_red: "\u{1F534}\u{1F9EA}", // Red Circle + Test Tube
  tdd_green: "\u{1F7E2}\u{1F9EA}", // Green Circle + Test Tube
}

/**
 * Tab colors for Windows Terminal OSC 9;9 extension.
 * Colors chosen for visibility and semantic meaning.
 */
export const TAB_COLORS: Record<GoostStatus, string> = {
  moon: "#5865F2", // Discord blurple - waiting for sub-agents
  rocket: "#ED4245", // Red - active work / launching
  earth: "#57F287", // Green - complete/ready for input
  work: "#ED4245", // Red - same as rocket (active work)
  idle: "#57F287", // Green - idle/ready for input
  doom_loop: "#FFA500", // Orange - warning, stuck in loop
  mic: "#FF00FF", // Magenta/hot pink - URGENT: needs user approval
  tdd_red: "#FFA500", // Orange - Red Phase (failing)
  tdd_green: "#57F287", // Green - Green Phase (passing)
}

/**
 * Regex patterns for detecting GOOST markers in AI responses.
 * These are emitted by the AI to signal status changes.
 */
export const GOOST_MARKERS: Record<GoostStatus, RegExp> = {
  moon: /\[GOOST:MOON\]/,
  rocket: /\[GOOST:ROCKET\]/,
  earth: /\[GOOST:EARTH\]/,
  work: /\[GOOST:WORK\]/,
  idle: /\[GOOST:IDLE\]/,
  doom_loop: /\[GOOST:DOOM_LOOP\]/,
  mic: /\[GOOST:MIC\]/,
  tdd_red: /\[GOOST:TDD_RED\]/,
  tdd_green: /\[GOOST:TDD_GREEN\]/,
}

/**
 * Minimum equals signs for contract delimiter.
 * Matches the === banners used in contract markdown format.
 */
export const CONTRACT_DELIMITER_MIN_LENGTH = 40

/**
 * Contract detection patterns
 */
export const CONTRACT_PATTERNS = {
  ACTIVE: /CONTRACT ACTIVE/,
  FULFILLED: /CONTRACT FULFILLED/,
  VOIDED: /CONTRACT VOIDED/,
} as const

/**
 * Event type constants to avoid magic strings.
 * These match the OpenCode SDK event types.
 */
export const EVENT_TYPES = {
  SESSION_STATUS: "session.status",
  SESSION_DELETED: "session.deleted",
  SESSION_UPDATED: "session.updated",
  MESSAGE_UPDATED: "message.updated",
  SESSION_COMPACTED: "session.compacted",
  PERMISSION_UPDATED: "permission.updated",
  PERMISSION_REPLIED: "permission.replied",
} as const

/**
 * Tool name constants to avoid magic strings.
 * OpenCode may use either "task" or "mcp_task" depending on version/context.
 */
export const TOOL_NAMES = {
  TASK: "task",
  TASK_ALT: "mcp_task",
} as const

/**
 * Check if a tool name is a Task tool (sub-agent spawning).
 */
export const isTaskTool = (toolName: string): boolean =>
  toolName === TOOL_NAMES.TASK || toolName === TOOL_NAMES.TASK_ALT

/**
 * Contract status block patterns.
 */
export const CONTRACT_STATUS_HEADER = "CONTRACT STATUS:"

/**
 * Threshold for sub-agent failures before doom loop warning.
 * After this many consecutive failures for the same criterion,
 * the AI should be warned to consider alternative approaches.
 */
export const DOOM_LOOP_THRESHOLD = 3

// =============================================================================
// Zod Schemas for Runtime Validation
// =============================================================================

/**
 * Schema for session.status event properties.
 * Validates the structure before type assertion.
 */
export const SessionStatusPropsSchema = z.object({
  sessionID: z.string(),
  status: z.object({
    type: z.string(),
  }),
})

export type SessionStatusProps = z.infer<typeof SessionStatusPropsSchema>

/**
 * Schema for message.updated event properties.
 * Handles the nested optional structure safely.
 */
export const MessageUpdatedPropsSchema = z.object({
  info: z
    .object({
      role: z.string().optional(),
      parts: z
        .array(
          z.object({
            type: z.string(),
            text: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
})

export type MessageUpdatedProps = z.infer<typeof MessageUpdatedPropsSchema>

/**
 * Schema for task tool arguments.
 * Used in tool.execute.before hook.
 */
export const TaskArgsSchema = z.object({
  description: z.string().optional(),
  prompt: z.string().optional(),
})

export type TaskArgs = z.infer<typeof TaskArgsSchema>

/**
 * Schema for task tool output.
 * Used in tool.execute.after hook.
 */
export const TaskOutputSchema = z.object({
  title: z.string().optional(),
  output: z.string().optional(),
  metadata: z.unknown().optional(),
})

export type TaskOutput = z.infer<typeof TaskOutputSchema>

/**
 * Schema for bash tool output.
 * Used in tool.execute.after hook for test runner detection.
 */
export const BashOutputSchema = z.object({
  output: z.string().optional(),
  metadata: z
    .object({
      exitCode: z.number().optional(),
    })
    .optional(),
})

export type BashOutput = z.infer<typeof BashOutputSchema>

/**
 * Patterns that indicate test failure in output (when exitCode is unavailable).
 * More robust than simple "error" matching - looks for test-specific failure indicators.
 */
export const TEST_FAILURE_PATTERNS =
  /\b(FAIL|FAILED|FAILURES?|ERROR|ERRORS|✕|✖|×)\b|\d+\s+(?:failing|failed)|AssertionError|expect\(.*\)\.to/i

/**
 * Schema for session.updated event properties.
 * This event fires when session metadata changes, including title.
 */
export const SessionUpdatedPropsSchema = z.object({
  info: z.object({
    id: z.string(),
    title: z.string(),
  }),
})

export type SessionUpdatedProps = z.infer<typeof SessionUpdatedPropsSchema>

// =============================================================================
// Failure Detection
// =============================================================================

/**
 * Patterns that indicate a sub-agent task may have failed.
 * Used for doom loop tracking.
 */
export const FAILURE_PATTERNS = /\berror:|cannot proceed|unable to complete|failed to|exception:/i

// =============================================================================
// OpenSpec Detection
// =============================================================================

/**
 * Pattern to detect OpenSpec command usage in messages.
 * Matches /openspec-xxx patterns and captures any arguments.
 */
export const OPENSPEC_COMMAND_PATTERN = /\/openspec-\w+\s+([^\s]+)/i

/**
 * Pattern to detect OpenSpec change directory references.
 * Matches openspec/changes/<change-id>/ paths.
 */
export const OPENSPEC_CHANGE_PATH_PATTERN = /openspec\/changes\/([^/\s]+)\//

/**
 * Pattern to detect OpenSpec change from expanded slash command template.
 * Matches <UserRequest>\s*change-id\s*</UserRequest> format.
 * The change-id is typically a kebab-case identifier.
 */
export const OPENSPEC_USER_REQUEST_PATTERN =
  /<UserRequest>\s*([a-zA-Z0-9][\w-]*)\s*<\/UserRequest>/i

/**
 * Patterns for detecting test runner execution in bash commands.
 */
export const TEST_RUNNER_PATTERNS =
  /\b(npm test|yarn test|pnpm test|jest|mocha|pytest|vitest|go test|cargo test|rspec|bundle exec rspec|phpunit|npm run test|npm run spec|npm run coverage|pytest|tox|nox|nosetests)\b/i

// =============================================================================
// Loop Anomaly Detection
// =============================================================================

/**
 * Parse environment variable as integer with fallback to default.
 * Returns default if value is non-numeric or invalid.
 * Logs warning in debug mode when value is invalid.
 *
 * @internal Exported for testing only
 */
export const parseEnvInt = (
  value: string | undefined,
  defaultValue: number,
  envName?: string
): number => {
  if (!value) return defaultValue
  const parsed = parseInt(value, 10)
  if (Number.isNaN(parsed)) {
    if (process.env.GOOST_DEBUG === "1" && envName) {
      console.error(
        `[Goost] Warning: Invalid value for ${envName}="${value}", using default ${defaultValue}`
      )
    }
    return defaultValue
  }
  return parsed
}

/**
 * Parse environment variable as boolean (1/0 string).
 * Default is true (enabled).
 *
 * @internal Exported for testing only
 */
export const parseEnvBool = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) return defaultValue
  return value !== "0"
}

/**
 * Anomaly detection configuration.
 * Loaded from environment variables with sensible defaults.
 */
export const ANOMALY_CONFIG = {
  /** Size threshold in characters before detection runs (default: 20000) */
  SIZE_THRESHOLD: parseEnvInt(process.env.GOOST_ANOMALY_SIZE, 20000, "GOOST_ANOMALY_SIZE"),

  /** Minimum substring length to check for repetition (80 chars ~= 10-15 words) */
  REPETITION_MIN_LENGTH: 80,

  /** Minimum occurrences to trigger detection */
  REPETITION_MIN_COUNT: 3,

  /** Interval between analysis checks during streaming (2000 chars) */
  ANALYSIS_INTERVAL: 2000,

  /** Whether to emit terminal bell on detection */
  BELL_ENABLED: parseEnvBool(process.env.GOOST_ANOMALY_BELL, true),
} as const

/**
 * State for anomaly detection within a single response.
 * Reset when session status changes (new response starts).
 */
export interface AnomalyState {
  /** Length of content when last analysis was performed */
  lastAnalyzedLength: number

  /** Whether an abort has been triggered for the current response */
  abortedThisResponse: boolean

  /** Whether a tool is currently executing (prevents abort during tool) */
  toolExecuting: boolean

  /** Whether an abort is queued pending tool completion */
  abortQueued: boolean
}
