## 1. Define Banner Template

- [x] 1.1 Create banner template documentation
  - Define full banner format (header, target, result)
  - Define minimal banner format (header only)
  - Use Goost delimiter pattern (58-char width with ===)
  - Centered `/<command-name> COMPLETE` header
  - Sources: Research validated Cisco IOS banner pattern, Goost conventions

## 2. Convert Analysis Commands to Contract-Based

- [x] 2.1 Update `/openspec-review` to use contract for fix phase
  - Add CONTRACT ACTIVE after user confirms "Fix issues"
  - Track each fix as a criterion
  - Emit CONTRACT FULFILLED when fixes verified
- [x] 2.2 Update `/openspec-harden` to use contract for fix phase
- [x] 2.3 Update `/openspec-audit` to use contract for remediation phase
- [x] 2.4 Update `/openspec-research` to use contract for update phase
  - Research already updates files; add contract tracking

## 3. Add Completion Banners to Existing Contract Commands

- [x] 3.1 Update `/openspec-apply` to emit completion banner after CONTRACT FULFILLED
- [x] 3.2 Update `/openspec-ralph` to emit completion banner after CONTRACT FULFILLED
- [x] 3.3 Update `/openspec-prep` to emit completion banner after CONTRACT FULFILLED
- [x] 3.4 Update `/contract` to emit completion banner after CONTRACT FULFILLED
- [x] 3.5 Update `/contract-quick` to emit completion banner after CONTRACT FULFILLED

## 4. Add Completion Banners to Other Commands

- [x] 4.1 Update `/openspec-proposal` to emit completion banner after proposal created
- [x] 4.2 Update `/openspec-archive` to emit completion banner after archive complete
- [x] 4.3 Update `/openspec-coordinate` to emit completion banner
- [x] 4.4 Update `/openspec-clarify` to emit completion banner
- [x] 4.5 Update `/goost-search` to emit completion banner after CONTRACT FULFILLED
- [x] 4.6 Update `/goost-slop-scan` to emit completion banner
- [x] 4.7 Update `/goost-improve` to emit completion banner

## 5. Add Minimal Banners to Read-Only Commands

- [x] 5.1 Update `/openspec-status` to emit minimal banner
- [x] 5.2 Update `/openspec-roadmap` to emit minimal banner

## 6. Documentation

- [x] 6.1 Update `goost_instructions.md` to describe completion banner format
- [x] 6.2 Add banner template examples to instruction documentation

## 7. Validation

- [ ] 7.1 Manual test: Run `/openspec-review` with issues, confirm fixes, verify contract flow + banner
- [ ] 7.2 Manual test: Run `/openspec-review` with APPROVED verdict, verify banner without contract
- [ ] 7.3 Manual test: Run `/openspec-apply` and verify banner appears after CONTRACT FULFILLED
- [ ] 7.4 Manual test: Grep conversation for "COMPLETE" and verify findability
- [ ] 7.5 Verify: Banner is visually distinct from CONTRACT FULFILLED
- [ ] 7.6 Manual test: Void a contract mid-remediation and verify banner shows "CONTRACT VOIDED"
