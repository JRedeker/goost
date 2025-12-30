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
 */
export type GoostStatus = "moon" | "rocket" | "earth" | "work" | "idle" | "doom_loop" | "mic"

/**
 * Contract state tracking structure
 */
export interface ContractState {
  active: boolean
  text: string | null
  objective: string | null
  criteriaStatus: string[]
  progress: string
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
  MESSAGE_UPDATED: "message.updated",
  SESSION_COMPACTED: "session.compacted",
  PERMISSION_UPDATED: "permission.updated",
  PERMISSION_REPLIED: "permission.replied",
} as const

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
 * Schema for compaction hook output.
 * Used in experimental.session.compacting hook.
 */
export const CompactionOutputSchema = z.object({
  context: z.array(z.string()),
  prompt: z.string().optional(),
})

export type CompactionOutput = z.infer<typeof CompactionOutputSchema>

// =============================================================================
// Failure Detection
// =============================================================================

/**
 * Patterns that indicate a sub-agent task may have failed.
 * Used for doom loop tracking.
 */
export const FAILURE_PATTERNS = /\berror:|cannot proceed|unable to complete|failed to|exception:/i
