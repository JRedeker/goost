## ADDED Requirements

### Requirement: Goost Slop Scan Command

The `/goost-slop-scan` command SHALL scan the codebase for AI-generated code quality issues ("slop") as defined in `slop-smells.yaml`, using a two-phase detection strategy with parallel sub-agents.

#### Scenario: Basic invocation without arguments
- **GIVEN** a project with source files tracked by git
- **WHEN** user invokes `/goost-slop-scan`
- **THEN** the command SHALL scan all git-tracked files
- **AND** output a formatted report grouped by severity
- **AND** respect `.gitignore` patterns

#### Scenario: Scoped invocation with path filter
- **GIVEN** user wants to scan only a specific directory
- **WHEN** user invokes `/goost-slop-scan src/`
- **THEN** the command SHALL limit scanning to files under `src/`
- **AND** still respect `.gitignore` within that scope

#### Scenario: No git repository
- **GIVEN** the current directory is not a git repository
- **WHEN** user invokes `/goost-slop-scan`
- **THEN** the command SHALL display an error: "Not a git repository. Slop scan requires git to determine file scope."
- **AND** suggest initializing git or specifying explicit paths

#### Scenario: No files to scan
- **GIVEN** `git ls-files` returns no files (empty repo or all ignored)
- **WHEN** user invokes `/goost-slop-scan`
- **THEN** the command SHALL display: "No files to scan. Check your .gitignore or add files to git."

### Requirement: Two-Phase Detection Strategy

The slop scan SHALL execute in two phases: automatable pattern detection first, followed by heuristic AI-assisted detection.

#### Scenario: Phase 1 automatable detection
- **GIVEN** the scan begins
- **WHEN** Phase 1 executes
- **THEN** the command SHALL use regex/grep patterns to detect:
  - Debug artifacts (`console.log`, `debugger`, `print(`)
  - Type evasion (`as any`, `@ts-ignore`, `@ts-nocheck`)
  - Incomplete work markers (`TODO`, `FIXME`, `HACK`, `XXX`)
  - Error suppression (empty catch blocks)
  - Hardcoded environment (`localhost`, absolute paths)
  - AI signature phrases (`Certainly!`, `Sure!`, `I'll help`)
- **AND** complete Phase 1 before proceeding to Phase 2
- **AND** display Phase 1 findings immediately

#### Scenario: Phase 2 heuristic detection
- **GIVEN** Phase 1 has completed
- **WHEN** Phase 2 executes
- **THEN** the command SHALL spawn sub-agents to detect:
  - Happy path only (missing error handling)
  - Confident incorrectness (plausible but wrong logic)
  - Context amnesia (ignoring codebase conventions)
  - Premature abstraction (over-engineering)
  - Missing corner cases
  - Algorithmic inefficiency
- **AND** aggregate sub-agent findings into the final report

#### Scenario: Phase 1 only mode
- **GIVEN** user wants fast results without AI analysis
- **WHEN** user invokes `/goost-slop-scan --phase 1`
- **THEN** the command SHALL execute only Phase 1 automatable detection
- **AND** skip sub-agent spawning entirely
- **AND** note in the report that heuristic analysis was skipped

#### Scenario: Phase 2 only mode
- **GIVEN** user has already fixed Phase 1 issues
- **WHEN** user invokes `/goost-slop-scan --phase 2`
- **THEN** the command SHALL skip Phase 1 automatable detection
- **AND** proceed directly to heuristic sub-agent analysis

#### Scenario: Combined flag usage
- **GIVEN** user wants Phase 1 only with JSON output
- **WHEN** user invokes `/goost-slop-scan --phase 1 --json`
- **THEN** the command SHALL execute only Phase 1 automatable detection
- **AND** output findings in JSON format
- **AND** flags SHALL be combinable in any order

#### Scenario: Scan interruption
- **GIVEN** a scan is in progress (Phase 1 or Phase 2)
- **WHEN** the user interrupts the session (Ctrl+C, void contract, or explicit cancel)
- **THEN** the command SHALL stop all active sub-agents gracefully
- **AND** output partial results collected so far with a note: "Scan interrupted - partial results"
- **AND** not leave orphaned sub-agent processes

### Requirement: Sub-Agent Architecture

The slop scan SHALL use parallel sub-agents organized by smell category for efficient scanning.

#### Scenario: Sub-agent spawning by category
- **GIVEN** Phase 2 begins
- **WHEN** spawning sub-agents
- **THEN** the command SHALL spawn up to 9 parallel sub-agents:
  - Hallucination Scanner (HALLU-*)
  - Structure Scanner (STRUCT-*)
  - Quality Scanner (QUAL-*)
  - Documentation Scanner (DOC-*)
  - Dependency Scanner (DEP-*)
  - Maintainability Scanner (MAINT-*)
  - AI-Specific Scanner (AI-*)
  - Performance Scanner (PERF-*)
  - Test Scanner (TEST-*)
- **AND** each sub-agent SHALL receive only files relevant to its category
- **AND** each sub-agent SHALL return structured JSON findings

#### Scenario: Sub-agent timeout handling
- **GIVEN** a sub-agent exceeds the timeout threshold
- **WHEN** the main agent is waiting for results
- **THEN** the command SHALL mark that category as TIMEOUT
- **AND** proceed with available results from other sub-agents
- **AND** note the timeout in the final report

#### Scenario: Partial sub-agent failure
- **GIVEN** one or more sub-agents fail but others succeed
- **WHEN** generating the final report
- **THEN** the command SHALL include findings from successful sub-agents
- **AND** mark failed categories as INCOMPLETE
- **AND** list which scanners failed and why

#### Scenario: All sub-agents fail
- **GIVEN** all sub-agents fail (timeout, error, or invalid response)
- **WHEN** generating the report
- **THEN** the command SHALL fall back to Phase 1 results only
- **AND** display an error: "Heuristic analysis failed - showing automatable findings only"
- **AND** suggest retrying or checking system status

#### Scenario: Sub-agent timeout configuration
- **GIVEN** user wants longer timeout for complex codebases
- **WHEN** user invokes `/goost-slop-scan --timeout 300`
- **THEN** each sub-agent SHALL use 300 seconds as its timeout threshold
- **AND** the default timeout SHALL be 120 seconds if not specified

### Requirement: Slop Smells Integration

The slop scan SHALL read pattern definitions from `slop-smells.yaml`.

#### Scenario: Load smell definitions
- **GIVEN** `slop-smells.yaml` exists in the project root
- **WHEN** the scan initializes
- **THEN** the command SHALL parse the YAML file
- **AND** extract smell IDs, names, severities, indicators, and detection hints

#### Scenario: Missing slop-smells.yaml
- **GIVEN** `slop-smells.yaml` does not exist
- **WHEN** user invokes `/goost-slop-scan`
- **THEN** the command SHALL display an error: "slop-smells.yaml not found. This file defines the patterns to scan for."
- **AND** suggest copying from the Goost plugin or creating one

#### Scenario: Malformed slop-smells.yaml
- **GIVEN** `slop-smells.yaml` contains invalid YAML syntax
- **WHEN** the command attempts to parse it
- **THEN** the command SHALL display a clear error with the parse failure location
- **AND** suggest validating the YAML syntax

#### Scenario: Map findings to smell IDs
- **GIVEN** a pattern match is found
- **WHEN** generating findings
- **THEN** each finding SHALL include:
  - Smell ID (e.g., `QUAL-007`)
  - Smell name (e.g., `error_suppression`)
  - Severity from the YAML (critical, high, medium, low)
  - Description from the YAML
  - Detection source (Phase 1 regex or Phase 2 heuristic)

### Requirement: Report Format

The slop scan SHALL output a formatted report with severity grouping and fix suggestions.

#### Scenario: Report structure
- **GIVEN** scanning has completed
- **WHEN** generating the report
- **THEN** the output SHALL follow this structure:
```
============================================================
              SLOP SCAN REPORT
============================================================

SCAN SCOPE: <file count> files in <path>
PHASE 1: <N> findings | PHASE 2: <M> findings

SUMMARY BY SEVERITY
------------------------------------------------------------
CRITICAL: N | HIGH: M | MEDIUM: K | LOW: J

SUMMARY BY CATEGORY  
------------------------------------------------------------
Quality (QUAL): N | Hallucination (HALLU): M | ...

CRITICAL FINDINGS
------------------------------------------------------------
[QUAL-003] security_blindness
  src/api/auth.ts:42
  SQL query built with string concatenation
  FIX: Use parameterized queries or an ORM

HIGH FINDINGS
------------------------------------------------------------
...

MEDIUM FINDINGS
------------------------------------------------------------
...

LOW FINDINGS  
------------------------------------------------------------
...

============================================================
NEXT STEPS:
1. Fix CRITICAL issues immediately (security risk)
2. Address HIGH issues before merging
3. Consider MEDIUM issues for code quality
4. LOW issues are optional improvements
============================================================
```

#### Scenario: Finding format with fix suggestion
- **GIVEN** a smell is detected
- **WHEN** formatting the finding
- **THEN** each finding SHALL include:
  - Smell ID and name in brackets
  - File path and line number
  - Brief description of what was found
  - FIX suggestion based on the smell's remediation guidance

#### Scenario: No findings
- **GIVEN** the scan completes without detecting any smells
- **WHEN** generating the report
- **THEN** the command SHALL display: "No slop detected. Code looks clean!"
- **AND** show the scan scope and file count for confirmation

#### Scenario: JSON output format
- **GIVEN** user needs machine-readable output
- **WHEN** user invokes `/goost-slop-scan --json`
- **THEN** the command SHALL output findings as JSON:
```json
{
  "scope": { "files": 42, "path": "." },
  "summary": {
    "total": 15,
    "bySeverity": { "critical": 1, "high": 5, "medium": 7, "low": 2 },
    "byCategory": { "QUAL": 8, "HALLU": 3, "DOC": 4 }
  },
  "findings": [
    {
      "id": "QUAL-003",
      "name": "security_blindness", 
      "severity": "critical",
      "file": "src/api/auth.ts",
      "line": 42,
      "description": "SQL query built with string concatenation",
      "fix": "Use parameterized queries or an ORM",
      "phase": 1
    }
  ]
}
```

### Requirement: Gitignore Respect

The slop scan SHALL respect `.gitignore` patterns when determining scan scope.

#### Scenario: Use git ls-files for enumeration
- **GIVEN** the project is a git repository
- **WHEN** determining files to scan
- **THEN** the command SHALL use `git ls-files` to enumerate files
- **AND** automatically exclude files matching `.gitignore` patterns
- **AND** exclude the `.git/` directory

#### Scenario: Exclude common non-code directories
- **GIVEN** `.gitignore` may not cover all non-code content
- **WHEN** filtering files to scan
- **THEN** the command SHALL additionally exclude:
  - Binary files (images, compiled output)
  - Lock files (`package-lock.json`, `yarn.lock`, `Cargo.lock`)
  - Minified files (`*.min.js`, `*.min.css`)
- **AND** focus on source code files (`.ts`, `.js`, `.py`, `.go`, `.rs`, etc.)

#### Scenario: Include untracked files option
- **GIVEN** user wants to scan files not yet added to git
- **WHEN** user invokes `/goost-slop-scan --include-untracked`
- **THEN** the command SHALL include untracked files in the scan
- **AND** still respect `.gitignore` patterns for exclusion

### Requirement: Debug Output

The slop scan SHALL support verbose output for troubleshooting.

#### Scenario: Verbose mode
- **GIVEN** user wants to see detailed scan progress
- **WHEN** user invokes `/goost-slop-scan --verbose`
- **THEN** the command SHALL output:
  - Files being scanned as they are processed
  - Regex patterns being applied in Phase 1
  - Sub-agent spawn and completion events in Phase 2
  - Timing information for each phase
- **AND** normal report output SHALL still appear at the end

#### Scenario: Debug mode for troubleshooting
- **GIVEN** user is troubleshooting scan issues
- **WHEN** `GOOST_DEBUG=1` environment variable is set
- **THEN** the command SHALL output additional diagnostic information:
  - Raw sub-agent prompts being sent
  - Raw sub-agent responses received
  - Pattern match details with surrounding context
- **AND** this output SHALL go to stderr to avoid polluting report output
