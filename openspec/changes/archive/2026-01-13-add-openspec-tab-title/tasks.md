## 1. Implementation

- [x] 1.1 Add `SESSION_UPDATED` event type and `SessionUpdatedPropsSchema` to `types.ts`
  - Verify: Types exist in `plugin/types.ts`
- [x] 1.2 Add `handleSessionUpdated` handler in `index.ts` to extract change name from session title
  - Verify: Handler registered in `eventHandlers` map
- [x] 1.3 Update `updateTitle()` in `terminal.ts` to display change name prominently
  - Verify: Format is `projectName | emoji changeName [progress]`
- [x] 1.4 Add `OPENSPEC_USER_REQUEST_PATTERN` to `types.ts` as fallback detection
  - Verify: Pattern exists for `<UserRequest>` format
- [x] 1.5 Update `extractOpenSpecChange()` in `contract.ts` with additional patterns
  - Verify: Function checks UserRequest, command, and path patterns

## 2. Verification

- [x] 2.1 Run `npm run check` to verify typecheck, lint, and format pass
  - Verify: Command exits with code 0
- [ ] 2.2 Manual test: Run `/openspec-apply <change-id>` and verify tab title updates
  - Verify: Tab title shows change name after invoking command
- [ ] 2.3 Verify tab title format matches `projectName | emoji changeName [progress]`
  - Verify: All components appear in correct format

## 3. Documentation

- [x] 3.1 Update spec with new requirement for OpenSpec tab title tracking
  - Verify: `specs/contract-system/spec.md` contains OpenSpec tracking requirement
- [x] 3.2 Update proposal.md to reflect session.updated approach
  - Verify: Proposal describes the final implementation approach
