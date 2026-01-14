# Tasks: Standardize Question Tool Usage

## 1. Update goost_instructions.md

- [x] 1.1 Add "User Interaction Protocol" section after "Status Indicators" section
  - Document when to use `mcp_question` vs plain text prompts
  - Include fallback protocol for when tool is unavailable
  - Add examples for: contract confirmation, doom loop recovery, remediation options
- [x] 1.2 Update doom loop example (lines 401-436) to use `mcp_question` format
- [x] 1.3 Update user pressure resistance example (lines 115-121) to use `mcp_question` format
- [x] 1.4 Update post-compaction recovery example (lines 507-520) to use `mcp_question` format

## 2. Update Slash Commands

- [x] 2.1 Update `/contract` command to use `mcp_question` for confirmation
- [x] 2.2 Update `/contract-quick` command to use `mcp_question` for confirmation
- [x] 2.3 Update `/openspec-review` command to use `mcp_question` for remediation options
- [x] 2.4 Update `/openspec-harden` command to use `mcp_question` for remediation options
- [x] 2.5 Verify `/goost-search` uses `mcp_question` consistently (updated for explicit format)
- [x] 2.6 Verify `/goost-slop-scan` remediation prompt uses `mcp_question` (N/A - no interactive prompts)

## 3. Validation

- [x] 3.1 Run `openspec validate standardize-question-tool-usage --strict`
- [ ] 3.2 Manual test: /contract confirmation flow with question tool
- [ ] 3.3 Manual test: /contract-quick confirmation flow
- [ ] 3.4 Manual test: Doom loop recovery triggers question tool
- [ ] 3.5 Manual test: /openspec-review remediation prompt
- [ ] 3.6 Manual test: /openspec-harden remediation prompt
- [ ] 3.7 Manual test: Fallback to numbered list when question tool unavailable
