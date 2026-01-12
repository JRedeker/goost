---
name: goost-slop-scan
description: Scan the codebase for AI-generated code quality issues ("slop") defined in slop-smells.yaml
agent: general
---

# Goost Slop Scan

> **SUB-AGENT CONTEXT**: You are running as a sub-agent. Do NOT emit `[GOOST:*]` status markers or CONTRACT STATUS blocks - these only work in the main session and waste your output buffer. Focus on returning useful results directly.

You are orchestrating a **codebase scan for AI-generated code quality issues ("slop")** using patterns defined in `slop-smells.yaml`.

This command uses a **two-phase detection strategy**:
1. **Phase 1**: Fast regex/grep-based detection of automatable patterns
2. **Phase 2**: AI-assisted heuristic detection via parallel sub-agents

## Argument Parsing

Parse `$ARGUMENTS` for options:

| Flag | Description | Default |
|------|-------------|---------|
| `--phase 1` | Run Phase 1 only (fast, automatable) | Both phases |
| `--phase 2` | Run Phase 2 only (heuristic) | Both phases |
| `--json` | Output in JSON format | Text format |
| `--verbose` | Show detailed scan progress | Off |
| `--timeout N` | Sub-agent timeout in seconds | 120 |
| `--include-untracked` | Include untracked git files | Off |
| `<path>` | Limit scan to specific directory | `.` (all) |

**Flag parsing logic:**
1. Extract `--phase N` → set `PHASE_MODE` to `1`, `2`, or `both`
2. Extract `--json` → set `OUTPUT_FORMAT` to `json`
3. Extract `--verbose` → set `VERBOSE` to `true`
4. Extract `--timeout N` → set `TIMEOUT` to N (default: 120)
5. Extract `--include-untracked` → set `INCLUDE_UNTRACKED` to `true`
6. Remaining non-flag argument → set `SCAN_PATH`

---

## Pre-flight Checks

### Step 1: Check Git Repository

```bash
git rev-parse --is-inside-work-tree 2>/dev/null || echo "NOT_GIT_REPO"
```

**If not a git repository:**
```
Not a git repository. Slop scan requires git to determine file scope.

Options:
- Initialize git: `git init && git add .`
- Or run from a git-tracked directory
```
Stop execution.

### Step 2: Load slop-smells.yaml

```bash
cat slop-smells.yaml 2>/dev/null || echo "YAML_NOT_FOUND"
```

**If file not found:**
```
slop-smells.yaml not found. This file defines the patterns to scan for.

To get started:
- Copy slop-smells.yaml from the Goost plugin
- Or create your own pattern definitions
```
Stop execution.

**If YAML is malformed** (parse error):
```
slop-smells.yaml contains invalid YAML syntax.

Error: <parse error details>

Validate your YAML at: https://www.yamllint.com/
```
Stop execution.

### Step 3: Enumerate Files to Scan

```bash
# Get git-tracked files
git ls-files <SCAN_PATH>

# If --include-untracked, also get untracked (respecting .gitignore)
git ls-files --others --exclude-standard <SCAN_PATH>
```

**Filter to source code files** (exclude non-code):
- Include: `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.go`, `.rs`, `.java`, `.rb`, `.php`, `.swift`, `.kt`, `.cs`, `.c`, `.cpp`, `.h`
- Exclude: `*.min.js`, `*.min.css`, `package-lock.json`, `yarn.lock`, `Cargo.lock`, `*.d.ts`
- Exclude: Binary files, images, compiled output

**If no files to scan:**
```
No files to scan. Check your .gitignore or add files to git.

Files found: 0
Path filter: <SCAN_PATH or ".">
```
Stop execution.

### Step 4: Display Scan Scope

```
============================================================
              SLOP SCAN STARTING
============================================================

SCOPE: <N> files in <SCAN_PATH>
PHASE: <1 | 2 | Both>
OPTIONS: <flags enabled>

============================================================
```

---

## Phase 1: Automatable Detection

**Goal**: Fast regex-based detection of obvious slop patterns.

Run grep/ripgrep for each pattern category. Map findings to smell IDs from `slop-smells.yaml`.

### Pattern Detection

Execute these searches (adjust regex for language context):

#### Debug Artifacts (AI-008, QUAL-*)
```bash
# console.log/print statements (not in logging files)
rg -n "console\.(log|debug|info|warn|error)" --type ts --type js
rg -n "print\(" --type py
rg -n "fmt\.Print" --type go

# debugger statements
rg -n "debugger" --type ts --type js
rg -n "breakpoint\(\)" --type py
```
Map to: `AI-008` (context_length_blindness indicators)

#### Type Evasion (AI-007, AI-006)
```bash
# TypeScript any/ignore
rg -n "as any" --type ts
rg -n "as unknown as" --type ts
rg -n "@ts-ignore" --type ts
rg -n "@ts-nocheck" --type ts
rg -n "eslint-disable" --type ts --type js
```
Map to: `AI-007` (type_evasion), `AI-006` (eslint_disable_abuse)

#### Incomplete Work (QUAL-004, QUAL-009)
```bash
# TODO/FIXME markers
rg -n "TODO|FIXME|HACK|XXX" --type-add 'code:*.{ts,js,py,go,rs,java,rb}'
```
Map to: `QUAL-004` (placeholder_pollution), `QUAL-009` (incomplete_generation)

#### Error Suppression (QUAL-007)
```bash
# Empty catch blocks (basic pattern)
rg -n "catch\s*\([^)]*\)\s*\{\s*\}" --type ts --type js
rg -n "except:\s*pass" --type py
rg -n "catch\s*\{[^}]*\}" --type go  # Go empty catch
```
Map to: `QUAL-007` (error_suppression)

#### Hardcoded Environment (MAINT-005)
```bash
# localhost and hardcoded paths
rg -n "localhost" --type-add 'code:*.{ts,js,py,go}'
rg -n '"/Users/' --type-add 'code:*.{ts,js,py,go}'
rg -n '"/home/' --type-add 'code:*.{ts,js,py,go}'
rg -n "127\.0\.0\.1" --type-add 'code:*.{ts,js,py,go}'
```
Map to: `MAINT-005` (hardcoded_environment)

#### AI Signature Phrases (DOC-003)
```bash
# ChatGPT-style phrases in comments
rg -n "Certainly!" --type-add 'code:*.{ts,js,py,go,md}'
rg -n "Sure!" --type-add 'code:*.{ts,js,py,go,md}'
rg -n "I'll help" --type-add 'code:*.{ts,js,py,go,md}'
rg -n "As an AI" --type-add 'code:*.{ts,js,py,go,md}'
```
Map to: `DOC-003` (ai_signature_phrases)

#### Security Blindness (QUAL-003)
```bash
# SQL injection risk patterns
rg -n 'query\s*\(' --type ts --type js  # Check for string concat
rg -n 'execute\s*\(' --type py

# Hardcoded secrets (basic patterns)
rg -n "password\s*=\s*['\"]" --type-add 'code:*.{ts,js,py,go}'
rg -n "api_key\s*=\s*['\"]" --type-add 'code:*.{ts,js,py,go}'
rg -n "secret\s*=\s*['\"]" --type-add 'code:*.{ts,js,py,go}'
```
Map to: `QUAL-003` (security_blindness)

### Phase 1 Finding Format

For each match, create a finding:
```json
{
  "id": "<smell-id>",
  "name": "<smell-name>",
  "severity": "<from yaml>",
  "file": "<file-path>",
  "line": <line-number>,
  "description": "<what was found>",
  "fix": "<remediation from yaml>",
  "phase": 1
}
```

### Phase 1 Summary

After all patterns scanned:

```
PHASE 1 COMPLETE
------------------------------------------------------------
Patterns scanned: 15
Files checked: <N>
Findings: <M>

[If --verbose:]
  Debug artifacts: N
  Type evasion: N
  Incomplete work: N
  Error suppression: N
  Hardcoded env: N
  AI signatures: N
  Security issues: N
```

**If `--phase 1` only:** Skip to Report Generation.

---

## Phase 2: Heuristic Detection

**Goal**: AI-assisted detection of complex patterns via parallel sub-agents.

### Sub-Agent Architecture

Spawn up to 9 parallel sub-agents, one per smell category:

| Scanner | Category | Focus |
|---------|----------|-------|
| Hallucination Scanner | HALLU-* | Phantom imports, invented methods, version confusion |
| Structure Scanner | STRUCT-* | Cargo cult patterns, context amnesia, frankencode |
| Quality Scanner | QUAL-* | Happy path only, confident incorrectness, missing corners |
| Documentation Scanner | DOC-* | Obvious comments, stale docs, copy-paste attribution |
| Dependency Scanner | DEP-* | Bloat, version roulette, phantom deps, training leakage |
| Maintainability Scanner | MAINT-* | Context collapse, style whiplash, language confusion |
| AI-Specific Scanner | AI-* | Sycophantic code, context blindness, hallucinated reports |
| Performance Scanner | PERF-* | N+1 queries, excessive renders, algorithmic inefficiency |
| Test Scanner | TEST-* | Magic numbers, assertion roulette, testing the mock |

### Sub-Agent Prompt Template

Each sub-agent receives:

```
You are a [CATEGORY] SCANNER for a slop scan.

SMELL DEFINITIONS:
<paste relevant smells from slop-smells.yaml for this category>

FILES TO SCAN:
<list of files relevant to this category>

TASK:
1. Read each file and analyze for the smell patterns in your category
2. For each finding, provide:
   - Smell ID (e.g., QUAL-002)
   - File and line number
   - Brief description of the issue
   - Suggested fix
3. Focus on semantic issues, not syntax (Phase 1 handles syntax patterns)
4. Return findings as JSON array

TIMEOUT: <TIMEOUT> seconds

RETURN FORMAT:
{
  "category": "<CATEGORY>",
  "files_scanned": <N>,
  "findings": [
    {
      "id": "<smell-id>",
      "name": "<smell-name>",
      "severity": "<severity>",
      "file": "<path>",
      "line": <number>,
      "description": "<what was found>",
      "fix": "<suggestion>",
      "phase": 2
    }
  ]
}
```

### Sub-Agent Spawning

Use the Task tool with `subagent_type: "explore"` for each scanner:

```
Spawning Phase 2 sub-agents...
- Hallucination Scanner: <N files>
- Structure Scanner: <N files>
- Quality Scanner: <N files>
- Documentation Scanner: <N files>
- Dependency Scanner: <N files>
- Maintainability Scanner: <N files>
- AI-Specific Scanner: <N files>
- Performance Scanner: <N files>
- Test Scanner: <N files>
```

### Sub-Agent Timeout Handling

**Default timeout**: 120 seconds per sub-agent (override with `--timeout`).

**If sub-agent times out:**
- Mark category as `TIMEOUT`
- Proceed with available results
- Note in report: `⚠️ <Category> Scanner: TIMEOUT`

**If sub-agent fails (error/invalid response):**
- Mark category as `INCOMPLETE`
- Note in report: `⚠️ <Category> Scanner: FAILED - <reason>`

**If ALL sub-agents fail:**
```
⚠️ Heuristic analysis failed - showing automatable findings only

All Phase 2 scanners encountered errors:
- Hallucination Scanner: <error>
- Structure Scanner: <error>
...

Suggestions:
- Check system status and retry
- Run with --phase 1 for automatable detection only
```

### Phase 2 Summary

```
PHASE 2 COMPLETE
------------------------------------------------------------
Sub-agents spawned: 9
Successful: <N>
Timed out: <N>
Failed: <N>
Total findings: <M>
```

---

## Report Generation

### Aggregate Findings

1. Combine Phase 1 and Phase 2 findings
2. Sort by severity: CRITICAL > HIGH > MEDIUM > LOW
3. Group by severity level
4. Calculate summary statistics

### Text Report Format

```
============================================================
              SLOP SCAN REPORT
============================================================

SCAN SCOPE: <N> files in <path>
PHASE 1: <N> findings | PHASE 2: <M> findings

SUMMARY BY SEVERITY
------------------------------------------------------------
CRITICAL: <N> | HIGH: <N> | MEDIUM: <N> | LOW: <N>

SUMMARY BY CATEGORY
------------------------------------------------------------
Quality (QUAL): <N> | Hallucination (HALLU): <N> | Structure (STRUCT): <N>
Documentation (DOC): <N> | AI-Specific (AI): <N> | Maintainability (MAINT): <N>
Performance (PERF): <N> | Test (TEST): <N> | Dependency (DEP): <N>

[If any Phase 2 scanner issues:]
⚠️ INCOMPLETE SCANNERS: <list>

CRITICAL FINDINGS
------------------------------------------------------------
[QUAL-003] security_blindness
  src/api/auth.ts:42
  SQL query built with string concatenation
  FIX: Use parameterized queries or an ORM

[DEP-004] training_data_leakage
  src/config/api.ts:15
  Hardcoded API key that appears to be from training data
  FIX: Use environment variables for secrets

HIGH FINDINGS
------------------------------------------------------------
[AI-007] type_evasion
  src/utils/parser.ts:89
  Excessive use of 'as any' bypassing type safety
  FIX: Define proper types or use type guards

[QUAL-007] error_suppression
  src/handlers/upload.ts:156
  Empty catch block silently swallows errors
  FIX: Log error and/or rethrow with context

MEDIUM FINDINGS
------------------------------------------------------------
[QUAL-004] placeholder_pollution
  src/services/email.ts:23
  TODO marker: "TODO: implement email validation"
  FIX: Implement the functionality or remove the code

LOW FINDINGS
------------------------------------------------------------
[DOC-003] ai_signature_phrases
  src/components/Button.tsx:5
  AI-generated comment: "Certainly! This component..."
  FIX: Rewrite comment in project style

============================================================
NEXT STEPS:
1. Fix CRITICAL issues immediately (security risk)
2. Address HIGH issues before merging
3. Consider MEDIUM issues for code quality
4. LOW issues are optional improvements
============================================================
```

### No Findings Report

```
============================================================
              SLOP SCAN REPORT
============================================================

SCAN SCOPE: <N> files in <path>
PHASE 1: 0 findings | PHASE 2: 0 findings

✅ No slop detected. Code looks clean!

============================================================
```

### JSON Report Format

**If `--json` flag set:**

```json
{
  "scope": {
    "files": 42,
    "path": "."
  },
  "phases": {
    "phase1": { "enabled": true, "findings": 5 },
    "phase2": { "enabled": true, "findings": 10, "incomplete": ["Performance"] }
  },
  "summary": {
    "total": 15,
    "bySeverity": {
      "critical": 1,
      "high": 5,
      "medium": 7,
      "low": 2
    },
    "byCategory": {
      "QUAL": 8,
      "HALLU": 2,
      "AI": 3,
      "DOC": 2
    }
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

---

## Verbose Mode

**If `--verbose` flag set**, output additional progress:

```
[VERBOSE] Enumerating files...
[VERBOSE] Found 142 source files, 23 excluded
[VERBOSE] Loading slop-smells.yaml (52 patterns)

[VERBOSE] Phase 1: Scanning debug artifacts...
[VERBOSE]   console.log: 5 matches
[VERBOSE]   debugger: 0 matches
[VERBOSE] Phase 1: Scanning type evasion...
[VERBOSE]   as any: 12 matches
...

[VERBOSE] Phase 2: Spawning sub-agents...
[VERBOSE]   Hallucination Scanner: started (15 files)
[VERBOSE]   Quality Scanner: started (42 files)
...
[VERBOSE]   Hallucination Scanner: complete (2 findings, 8.3s)
[VERBOSE]   Quality Scanner: complete (5 findings, 12.1s)
...

[VERBOSE] Timing:
[VERBOSE]   File enumeration: 0.2s
[VERBOSE]   Phase 1: 3.4s
[VERBOSE]   Phase 2: 45.2s
[VERBOSE]   Report generation: 0.1s
[VERBOSE]   Total: 48.9s
```

---

## Debug Mode

**If `GOOST_DEBUG=1` environment variable set**, output to stderr:

```
[DEBUG] Raw sub-agent prompt for Quality Scanner:
<full prompt text>

[DEBUG] Raw sub-agent response from Quality Scanner:
<full response text>

[DEBUG] Pattern match context for QUAL-007:
  File: src/handlers/upload.ts
  Line 156: } catch (e) { }
  Context: lines 154-158
```

---

## Execution

Now execute the slop scan.

1. Parse arguments and validate
2. Run pre-flight checks (git, yaml, files)
3. If Phase 1 enabled: Run automatable detection
4. If Phase 2 enabled: Spawn sub-agents for heuristic detection
5. Aggregate findings and generate report
6. Output in requested format (text or JSON)

Begin with argument parsing.
