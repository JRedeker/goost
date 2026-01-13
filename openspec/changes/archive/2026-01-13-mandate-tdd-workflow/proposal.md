# Change Proposal: Mandate TDD Workflow

## Summary
Further mandate Test-Driven Development (TDD) across the Goost rules, commands, and plugin. This change ensures that tests are planned upfront, written before implementation, and verified throughout the lifecycle of a contract.

## Why
Current testing rules are advisory and often bypassed or delayed until after implementation. Enforcing mandatory TDD through the RSTC protocol reduces "slop," ensures comprehensive coverage, and provides immediate, verifiable evidence of success criteria fulfillment.

## Scope
- **Rules**: Update `rules.yaml` with a new **P24: RSTC-Protocol** rule for mandatory TDD.
- **Instructions**: Update `goost_instructions.md` to mandate the **Requirement-Spec-Test-Code (RSTC)** sequence and defined evidence provenance (Red/Green phases).
- **Commands**: Update `/contract`, `/contract-quick`, and `/openspec-apply` templates to explicitly link `TEST PLAN` to `SUCCESS CRITERIA`.
- **Plugin**: Enhance the plugin to automatically detect test runner execution and provide visual tab feedback for evidence-gathering phases.
- **Hardening**: Integrate TDD sequence auditing into the `/openspec-harden` command.

## Research Validation
Research based on **TDDev** and **TENET** (2025) benchmarks confirms that a structured RSTC protocol provides ~15% accuracy gains by forcing early fault detection. The design leverages **Evidence Provenance** to provide high-integrity validation of implementation quality, aligning with SLSA 1.0 provenance standards.

## Affected code
- `rules.yaml`
- `goost_instructions.md`
- `.opencode/command/contract.md`
- `.opencode/command/contract-quick.md`
- `.opencode/command/openspec-apply.md`
- `.opencode/command/openspec-harden.md`
- `plugin/types.ts`
- `plugin/contract.ts`
- `plugin/index.ts`
- `plugin/terminal.ts`
