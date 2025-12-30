# Tasks: Add Gap Analysis Phase to /openspec-review

## 1. Command Update

- [x] 1.1 Add Phase 7: Gap Analysis section to `openspec-review.md`
- [x] 1.2 Define gap analysis steps and checklist
- [x] 1.3 Update final report template to include gap analysis section

## 2. Gap Analysis Implementation

### 2.1 Codebase Impact Discovery
- [x] 2.1.1 Extract key terms from spec (technologies, features, domain terms)
- [x] 2.1.2 Search codebase with grep/glob for matching files
- [x] 2.1.3 Compare with "Affected code" section
- [x] 2.1.4 Output potentially impacted files not mentioned

### 2.2 Cross-Cutting Concerns
- [x] 2.2.1 Define checklist of cross-cutting concerns (error handling, logging, security, config)
- [x] 2.2.2 Search spec for coverage of each concern
- [x] 2.2.3 Output status table with gaps flagged

### 2.3 Related Changes Detection
- [x] 2.3.1 List other active changes via `openspec list`
- [x] 2.3.2 Check for overlapping capabilities or affected files
- [x] 2.3.3 Flag potential conflicts

### 2.4 Commonly Forgotten Items
- [x] 2.4.1 Define checklist (migrations, versioning, feature flags, rollback, docs, deps)
- [x] 2.4.2 Mark items as applicable based on spec content
- [x] 2.4.3 Output checklist in report

## 3. Error Handling

- [x] 3.1 Handle OpenSpec CLI unavailable (skip related changes, note in report)
- [x] 3.2 Handle no matching files (report "No additional impacted files found")
- [x] 3.3 Handle missing "Affected code" section (note and treat all as impacted)
- [x] 3.4 Handle large result set >50 files (truncate and note)

## 4. Testing

- [x] 4.1 Test gap analysis on `enhance-subagent-contract-propagation` change
  - Assert: "Gap Analysis" section present in report
  - Assert: Cross-cutting concerns table rendered
  - Assert: Related changes lists other active changes

- [x] 4.2 Test gap analysis on `add-openspec-roadmap-command` change
  - Assert: Codebase impact section present
  - Assert: Commonly forgotten items checklist rendered
  
- [x] 4.3 Verify all gap analysis sections present in report
  - Assert: "Potentially Impacted Files" subsection present
  - Assert: "Cross-Cutting Concerns" table present
  - Assert: "Related Changes" subsection present
  - Assert: "Commonly Forgotten Items" checklist present

- [x] 4.4 Test error scenarios
  - Assert: Graceful handling when openspec CLI fails
  - Assert: Appropriate message when no files match
