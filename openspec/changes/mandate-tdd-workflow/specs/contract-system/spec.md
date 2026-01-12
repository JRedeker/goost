# contract-system Specification Delta

## MODIFIED Requirements

### Requirement: Contract Completion Commit
When a contract is fulfilled (all criteria verified with evidence), the agent SHALL automatically create an atomic git commit containing all contract-related changes.

The commit MUST:
- Include all staged and unstaged changes related to the contract work
- Use a conventional commit message derived from the contract objective
- Be skipped if there are no changes to commit (clean working tree)
- Exclude CHANGELOG.md (updated separately after commit to include correct hash)
- **PROHIBITED**: SHALL NOT be created unless **Red Phase (failure)** and **Green Phase (success)** raw provenance is provided for all criteria.

#### Scenario: Contract completion with valid TDD evidence
- **GIVEN** all criteria are marked `[x]`
- **AND** valid Red Phase and Green Phase evidence is provided for each criterion
- **WHEN** the agent declares CONTRACT FULFILLED
- **THEN** the agent SHALL automatically create an atomic git commit
- **AND** the commit message SHALL follow conventional commit standards
- 
#### Scenario: Contract completion without test evidence
- **GIVEN** all criteria are marked `[x]`
- **AND** no evidence of test execution is provided in the session
- **WHEN** the agent attempts to declare CONTRACT FULFILLED
- **THEN** the protocol SHALL block the fulfillment
- **AND** the agent SHOULD prompt the user to run tests and provide evidence
