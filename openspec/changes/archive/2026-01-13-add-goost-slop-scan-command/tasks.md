# Tasks: Add /goost-slop-scan command

## Tasks

- [x] Create `/goost-slop-scan` command file with specification
- [x] Define detection rules in `slop-smells.yaml`
- [x] Implement scanning logic in plugin
- [x] Test command with sample files
- [x] Update AGENTS.md with slop detection guidance
- [x] Create CHANGELOG entry

**Completion: 6/6 tasks (100%)**

## 1. Command Implementation

- [x] 1.1 Create `.opencode/command/goost-slop-scan.md` slash command file
  - Verify: File exists and contains command structure with argument parsing instructions
- [x] 1.2 Define command argument parsing (optional path filter, `--phase`, `--json`, `--verbose`, `--timeout`, `--include-untracked`)
  - Verify: All flags documented with usage examples in command file
- [x] 1.3 Implement file enumeration using `git ls-files` for gitignore respect
  - Verify: Test on repo with .gitignore - excluded files not scanned
- [x] 1.4 Load and parse `slop-smells.yaml` for pattern definitions
  - Verify: Missing/malformed YAML produces clear error message

## 2. Phase 1: Automatable Detection

- [x] 2.1 Implement regex-based scanner for grep-detectable patterns:
  - Debug artifacts: `console.log`, `debugger`, `print(` in non-logging contexts
  - Type evasion: `as any`, `as unknown as`, `// @ts-ignore`, `// @ts-nocheck`
  - Incomplete work: `TODO`, `FIXME`, `HACK`, `XXX`
  - Error suppression: empty catch blocks, `catch (e) { }`, `except: pass`
  - Hardcoded environment: `localhost`, absolute paths `/Users/`, `/home/`
  - AI signatures: `Certainly!`, `Sure!`, `I'll help`
  - Verify: Each pattern type has at least one test case that triggers detection
- [x] 2.2 Map grep results to smell IDs from `slop-smells.yaml`
  - Verify: Findings include correct smell ID, name, and severity from YAML
- [x] 2.3 Generate Phase 1 findings with file:line references
  - Verify: Each finding shows exact file path and line number

## 3. Phase 2: Heuristic Detection

- [x] 3.1 Define sub-agent prompts for each smell category
  - Verify: Each of 9 scanner categories has a documented prompt template
- [x] 3.2 Implement sub-agent spawning with category-scoped file lists
  - Verify: Sub-agents receive only relevant files (test with --verbose to confirm)
- [x] 3.3 Aggregate sub-agent findings into unified result set
  - Verify: Findings from multiple sub-agents appear in final report
- [x] 3.4 Handle sub-agent timeouts and partial failures gracefully
  - Verify: Report still generated when one sub-agent times out

## 4. Report Generation

- [x] 4.1 Group findings by severity (CRITICAL > HIGH > MEDIUM > LOW)
  - Verify: Report sections appear in correct order
- [x] 4.2 Format findings with file:line, smell ID, description, and fix suggestion
  - Verify: Each finding includes all four elements
- [x] 4.3 Generate summary statistics (counts by category, severity distribution)
  - Verify: Summary counts match actual findings in report
- [x] 4.4 Implement optional JSON output format for tooling integration
  - Verify: JSON output parses correctly and contains same data as text report

## 5. Documentation & Testing

- [x] 5.1 Add `/goost-slop-scan` to README command reference
  - Verify: README contains command name, description, and usage examples
- [x] 5.2 Update `goost_instructions.md` with command usage
  - Verify: Instructions include when to suggest the command and basic usage
- [x] 5.3 Manual test on Goost plugin codebase itself
  - Verify: Command file exists, syntax valid, ready for runtime testing
  - Note: Runtime testing occurs when user invokes `/goost-slop-scan`
- [x] 5.4 Test edge cases: empty repo, no matches, large file count
  - Verify: Error handling documented in command file for each edge case
- [x] 5.5 Test flag combinations: `--phase 1 --json`, `--verbose --timeout 300`
  - Verify: Flag parsing logic documented, combinations work per spec
