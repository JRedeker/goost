## ADDED Requirements

### Requirement: Contract Completion Commit

When a contract is fulfilled (all criteria verified with evidence), the agent SHALL automatically create an atomic git commit containing all contract-related changes.

The commit MUST:
- Include all staged and unstaged changes related to the contract work
- Use a conventional commit message derived from the contract objective
- Be skipped if there are no changes to commit (clean working tree)
- Exclude CHANGELOG.md (updated separately after commit to include correct hash)

The commit MUST NOT:
- Be created for voided or partially completed contracts
- Include unrelated changes that were not part of the contract work
- Include CHANGELOG.md (to avoid circular hash dependency)
- Proceed if git state is invalid (e.g., merge conflict, detached HEAD)

#### Scenario: Successful contract completion with changes

- **GIVEN** a contract with objective "Implement user authentication"
- **AND** all criteria are marked `[x]` with evidence
- **AND** there are uncommitted changes in the working tree
- **WHEN** the agent declares CONTRACT FULFILLED
- **THEN** the agent stages all relevant changes
- **AND** creates a commit with message `feat: implement user authentication`
- **AND** outputs the commit hash in the fulfillment block

#### Scenario: Contract completion with no changes

- **GIVEN** a contract is fulfilled
- **AND** the working tree is clean (no uncommitted changes)
- **WHEN** the agent declares CONTRACT FULFILLED
- **THEN** no commit is created
- **AND** the agent notes "No changes to commit" in the fulfillment block

#### Scenario: Voided contract

- **GIVEN** a contract is voided by the user
- **WHEN** the agent outputs CONTRACT VOIDED
- **THEN** no automatic commit is created
- **AND** no CHANGELOG entry is added

#### Scenario: Git commit rejected by pre-commit hook

- **GIVEN** a contract is fulfilled with uncommitted changes
- **AND** a pre-commit hook is configured
- **WHEN** the agent attempts to create the commit
- **AND** the pre-commit hook rejects the commit
- **THEN** the agent reports the hook failure with the error message
- **AND** does NOT output CONTRACT FULFILLED
- **AND** prompts the user with options: fix issues and retry, bypass hook (if appropriate), or void contract

#### Scenario: Invalid git state - merge conflict

- **GIVEN** a contract is fulfilled
- **AND** the repository has unresolved merge conflicts
- **WHEN** the agent attempts to create the commit
- **THEN** the agent detects the invalid git state
- **AND** reports "Cannot commit: unresolved merge conflicts"
- **AND** does NOT output CONTRACT FULFILLED
- **AND** lists conflicted files for user review

#### Scenario: Invalid git state - detached HEAD

- **GIVEN** a contract is fulfilled
- **AND** the repository is in detached HEAD state
- **WHEN** the agent attempts to create the commit
- **THEN** the agent warns "Repository is in detached HEAD state"
- **AND** prompts user to confirm commit or create a branch first

#### Scenario: Git permission error

- **GIVEN** a contract is fulfilled with uncommitted changes
- **WHEN** the agent attempts to stage or commit
- **AND** a permission error occurs
- **THEN** the agent reports the specific error
- **AND** does NOT output CONTRACT FULFILLED
- **AND** suggests remediation (e.g., check file permissions, git config)

---

### Requirement: Conventional Commit Derivation

The agent SHALL derive the conventional commit type from the contract objective using these rules:

| Objective Pattern | Commit Type |
|-------------------|-------------|
| "Add", "Implement", "Create", "Introduce" | `feat:` |
| "Fix", "Resolve", "Repair", "Correct", "Patch" | `fix:` |
| "Refactor", "Restructure", "Reorganize", "Clean up", "Simplify" | `refactor:` |
| "Optimize", "Improve performance", "Speed up" | `perf:` |
| "Update", "Modify", "Change", "Adjust" + bug/error/issue context | `fix:` |
| "Update", "Modify", "Change", "Adjust" + feature/enhancement context | `feat:` |
| "Update", "Modify", "Change", "Adjust" (ambiguous) | `chore:` |
| "Remove", "Delete", "Deprecate" | `refactor:` |
| "Document", "Add docs", "Update README", "Write docs" | `docs:` |
| "Test", "Add tests", "Improve coverage", "Write tests" | `test:` |
| "Configure", "Setup", "Initialize", "Bootstrap" | `chore:` |
| "Build", "Bundle", "Compile", "Package" | `build:` |
| "CI", "Pipeline", "Workflow", "Deploy config" | `ci:` |
| "Format", "Lint", "Style", "Prettify" | `style:` |
| Default (no clear match) | `chore:` |

**Context Detection for Update/Modify:**
- **Bug context keywords**: "bug", "error", "issue", "broken", "failing", "crash", "wrong", "incorrect"
- **Feature context keywords**: "feature", "enhancement", "new", "capability", "support", "enable"
- If neither context is detected, default to `chore:` (safe, non-semantic default)

The commit message body MAY include:
- List of completed criteria
- Contract ID or reference (if applicable)

#### Scenario: Feature objective derivation

- **GIVEN** contract objective "Implement dark mode toggle"
- **WHEN** deriving commit message
- **THEN** commit type is `feat:`
- **AND** message is `feat: implement dark mode toggle`

#### Scenario: Bug fix objective derivation

- **GIVEN** contract objective "Fix authentication timeout issue"
- **WHEN** deriving commit message
- **THEN** commit type is `fix:`
- **AND** message is `fix: authentication timeout issue`

#### Scenario: Documentation objective derivation

- **GIVEN** contract objective "Document API endpoints"
- **WHEN** deriving commit message
- **THEN** commit type is `docs:`
- **AND** message is `docs: document API endpoints`

#### Scenario: Performance objective derivation

- **GIVEN** contract objective "Optimize database query performance"
- **WHEN** deriving commit message
- **THEN** commit type is `perf:`
- **AND** message is `perf: optimize database query performance`

#### Scenario: Build system objective derivation

- **GIVEN** contract objective "Configure webpack for production builds"
- **WHEN** deriving commit message
- **THEN** commit type is `build:`
- **AND** message is `build: configure webpack for production builds`

#### Scenario: CI/CD objective derivation

- **GIVEN** contract objective "Add GitHub Actions workflow for testing"
- **WHEN** deriving commit message
- **THEN** commit type is `ci:`
- **AND** message is `ci: add GitHub Actions workflow for testing`

#### Scenario: Style/formatting objective derivation

- **GIVEN** contract objective "Apply prettier formatting to codebase"
- **WHEN** deriving commit message
- **THEN** commit type is `style:`
- **AND** message is `style: apply prettier formatting to codebase`

#### Scenario: Ambiguous update objective - bug context

- **GIVEN** contract objective "Update error handling for login failures"
- **WHEN** deriving commit message
- **AND** objective contains bug context keyword "error"
- **THEN** commit type is `fix:`
- **AND** message is `fix: update error handling for login failures`

#### Scenario: Ambiguous update objective - feature context

- **GIVEN** contract objective "Update API to support pagination"
- **WHEN** deriving commit message
- **AND** objective contains feature context keyword "support"
- **THEN** commit type is `feat:`
- **AND** message is `feat: update API to support pagination`

#### Scenario: Ambiguous update objective - no context

- **GIVEN** contract objective "Update configuration values"
- **WHEN** deriving commit message
- **AND** no bug or feature context keywords are present
- **THEN** commit type is `chore:`
- **AND** message is `chore: update configuration values`

---

### Requirement: Changelog Entry (Optional)

When a contract is fulfilled, the agent SHOULD append an entry to the project root `CHANGELOG.md` file following the [Keep a Changelog](https://keepachangelog.com/) format.

**Skip CHANGELOG update when:**
- No existing CHANGELOG.md file in project root (don't create for trivial changes)
- The change is trivial (typo fixes, minor refactors, internal cleanup)
- The user has indicated they manage changelogs manually

**Proceed with CHANGELOG update when:**
- A CHANGELOG.md already exists in the project
- The change is user-facing (new features, bug fixes, breaking changes)

When updating, the entry MUST:
- Be added under the `## [Unreleased]` section (create if missing)
- Use the appropriate category: Added, Changed, Fixed, Deprecated, Removed, Security
- Include a concise description derived from the contract objective
- Reference the commit hash (short form)

The entry MUST NOT:
- Duplicate existing entries for the same work
- Be added for voided contracts

**Commit Type to Changelog Category Mapping:**

| Commit Type | Changelog Category |
|-------------|-------------------|
| `feat:` | Added |
| `fix:` | Fixed |
| `refactor:` | Changed |
| `perf:` | Changed |
| `docs:` | Changed |
| `build:` | Changed |
| `ci:` | Changed |
| `style:` | Changed |
| `chore:` | Changed |
| `test:` | Changed |
| Deprecation-related | Deprecated |
| Removal-related | Removed |
| Security-related | Security |

#### Scenario: New feature changelog entry

- **GIVEN** contract objective "Implement user authentication"
- **AND** commit hash `a1b2c3d`
- **WHEN** the agent updates CHANGELOG.md
- **THEN** entry is added under `### Added`
- **AND** entry text is `- Implement user authentication (a1b2c3d)`

#### Scenario: Bug fix changelog entry

- **GIVEN** contract objective "Fix login redirect loop"
- **AND** commit hash `e4f5g6h`
- **WHEN** the agent updates CHANGELOG.md
- **THEN** entry is added under `### Fixed`
- **AND** entry text is `- Fix login redirect loop (e4f5g6h)`

#### Scenario: CHANGELOG.md does not exist - user-facing change

- **GIVEN** no CHANGELOG.md file exists in project root
- **AND** the contract represents a user-facing change (new feature, bug fix)
- **WHEN** the agent completes a contract
- **THEN** the agent creates CHANGELOG.md with standard Keep a Changelog header
- **AND** adds the `## [Unreleased]` section
- **AND** adds the entry under the appropriate category

#### Scenario: CHANGELOG.md does not exist - trivial change

- **GIVEN** no CHANGELOG.md file exists in project root
- **AND** the contract represents a trivial change (typo fix, internal refactor)
- **WHEN** the agent completes a contract
- **THEN** the agent skips CHANGELOG creation
- **AND** notes "No CHANGELOG update (trivial change)" in the fulfillment block

#### Scenario: Unreleased section missing

- **GIVEN** CHANGELOG.md exists but has no `## [Unreleased]` section
- **WHEN** the agent completes a contract
- **THEN** the agent adds `## [Unreleased]` section at the top (below header)
- **AND** adds the entry under the appropriate category

#### Scenario: Duplicate entry prevention

- **GIVEN** contract objective "Implement user authentication"
- **AND** commit hash `a1b2c3d`
- **AND** CHANGELOG.md already contains entry "- Implement user authentication (a1b2c3d)"
- **WHEN** the agent attempts to update CHANGELOG.md
- **THEN** no duplicate entry is added
- **AND** the agent notes "Changelog entry already exists"
