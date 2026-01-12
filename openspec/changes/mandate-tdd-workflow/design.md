# Design: Mandate TDD Workflow (RSTC Protocol)

## Overview
This design implements strict Test-Driven Development (TDD) enforcement using the **Requirement-Spec-Test-Code (RSTC)** protocol. It prioritizes **Evidence Provenance** (raw logs) over simple file-tracking to ensure verifiable implementation quality.

## Contract Protocol Changes

### Updated Structure
Contracts now link `TEST PLAN` scenarios to `SUCCESS CRITERIA` via shared IDs (e.g., C1, C2).

```
============================================================
                    CONTRACT ACTIVE
============================================================

OBJECTIVE: <objective>

SUCCESS CRITERIA:
- [ ] (C1) <criterion>

TEST PLAN:
- [ ] (C1) <test scenario - file: path/to/test.ts>

...
```

### TDD Enforcement Logic (RSTC)
1.  **Requirement (R)**: Decompose objective into atomic criteria.
2.  **Spec (S)**: Elaborate criteria into detailed technical specs.
3.  **Test (T)**: Create tests and provide **Red Phase Evidence** (failing logs).
4.  **Code (C)**: Implement and provide **Green Phase Evidence** (passing logs).

## Plugin Enhancements

### Evidence Detection
The plugin will monitor `bash` tool execution for common test runners (npm test, pytest, etc.):
- Detects the exit code and presence of test results.
- Updates tab title to `🧪 RED` (if test fails) or `🧪 GREEN` (if test passes).

### Status Indicators
- `[GOOST:TDD_RED]`: 🔴🧪 (Failing test evidence captured)
- `[GOOST:TDD_GREEN]`: 🟢🧪 (Passing test evidence captured)

## Rule Changes
- **P24: RSTC-Protocol**: "Follow the Requirement-Spec-Test-Code sequence. Never implement until a failing test exists and its logs are provided as evidence."
- **P11: Lifecycle**: Updated to "Understand → Research → Plan (RSTC) → Implement → Verify."
