# Token Cost Analysis

## Overview

Advance's hybrid storage (JSON for structure, markdown for prose) affects token consumption when AI agents read and write spec files. This document quantifies the tradeoffs.

## Summary

| Content Type | Format Change | Token Impact |
|--------------|---------------|--------------|
| Structured data (tasks, requirements, scenarios) | Markdown → JSON | **20-30% reduction** |
| Prose content (proposals, designs) | Unchanged (markdown) | **No change** |
| Overall typical change | Mixed | **~15% reduction** |

## Detailed Comparison

### Task List (4 tasks with dependencies)

**Markdown (current OpenSpec)**
```markdown
## 1. Command Scaffold

- [ ] 1.1 Create .opencode/command/adv-search.md with frontmatter
- [ ] 1.2 Add argument parsing section for query extraction
  - blocked by: 1.1

## 2. Security Layer

- [ ] 2.1 Implement content sanitization function
- [ ] 2.2 Create secure display template
  - blocked by: 2.1
```
**Tokens**: ~180-220

**JSON (ADV)**
```json
{
  "tasks": [
    {"id": "tk-Hf7dK2mN", "title": "Create adv-search.md with frontmatter", "section": "Command Scaffold", "status": "pending", "deps": []},
    {"id": "tk-Jm4nP8qR", "title": "Add argument parsing section", "section": "Command Scaffold", "status": "pending", "deps": [{"type": "blocked_by", "target": "tk-Hf7dK2mN"}]},
    {"id": "tk-Qp3xY9wL", "title": "Implement content sanitization", "section": "Security Layer", "status": "pending", "deps": []},
    {"id": "tk-Sw8tG1jE", "title": "Create secure display template", "section": "Security Layer", "status": "pending", "deps": [{"type": "blocked_by", "target": "tk-Qp3xY9wL"}]}
  ]
}
```
**Tokens**: ~140-160

**Savings**: ~25%

### Requirement with 2 Scenarios

**Markdown (current OpenSpec)**
```markdown
### Requirement: Contract Completion Commit

When a contract is fulfilled (all criteria verified with evidence), the agent SHALL automatically create an atomic git commit containing all contract-related changes.

The commit MUST:
- Include all staged and unstaged changes related to the contract work
- Use a conventional commit message derived from the contract objective

#### Scenario: Contract completion with valid TDD evidence

- **GIVEN** all criteria are marked `[x]`
- **AND** valid Red Phase and Green Phase evidence is provided
- **WHEN** the agent declares CONTRACT FULFILLED
- **THEN** the agent SHALL automatically create an atomic git commit

#### Scenario: Contract completion without test evidence

- **GIVEN** all criteria are marked `[x]`
- **AND** no evidence of test execution is provided
- **WHEN** the agent attempts to declare CONTRACT FULFILLED
- **THEN** the protocol SHALL block the fulfillment
```
**Tokens**: ~200-250

**JSON (ADV)**
```json
{
  "id": "rq-V1StGXR8",
  "title": "Contract Completion Commit",
  "body": "When a contract is fulfilled (all criteria verified with evidence), the agent SHALL automatically create an atomic git commit.\n\nThe commit MUST:\n- Include all staged and unstaged changes\n- Use a conventional commit message",
  "priority": "must",
  "scenarios": [
    {
      "id": "rq-V1StGXR8.1",
      "title": "With valid TDD evidence",
      "given": ["all criteria are marked [x]", "valid Red/Green Phase evidence provided"],
      "when": "agent declares CONTRACT FULFILLED",
      "then": ["agent creates atomic git commit"]
    },
    {
      "id": "rq-V1StGXR8.2",
      "title": "Without test evidence",
      "given": ["all criteria are marked [x]", "no test execution evidence"],
      "when": "agent attempts CONTRACT FULFILLED",
      "then": ["protocol blocks fulfillment"]
    }
  ]
}
```
**Tokens**: ~160-190

**Savings**: ~20%

### Prose Content (Proposal)

**Markdown (unchanged in both systems)**
```markdown
# Change: Add ADV Search Command

## Why

Users need a way to discover and apply high-quality prompts from curated 
community libraries when tackling unfamiliar problems. Currently, finding 
the right prompt requires manually browsing multiple GitHub repositories.

**Security Imperative**: External prompts represent an injection attack 
vector. Any prompt fetched from the internet could contain malicious 
instructions designed to manipulate AI behavior.

## What Changes

- Add `/adv-search` slash command that searches curated prompt libraries
- Implement live GitHub fetching for prompt content
- AI-powered relevance ranking of search results
- **Security controls**:
  - Display-only mode (never auto-execute fetched prompts)
  - Prominent "UNTRUSTED CONTENT" warning banners
  - Content sanitization (strip zero-width chars, escape control sequences)

## Impact

- Affected specs: slash-commands
- Affected code: .opencode/command/adv-search.md
- Breaking changes: None
```
**Tokens**: ~350-400

**Savings**: 0% (prose stays as markdown)

## Why JSON Saves Tokens

1. **No formatting overhead**: Markdown uses `###`, `- [ ]`, `**GIVEN**` etc. JSON uses structural delimiters
2. **Compact arrays**: `["a", "b", "c"]` vs `- a\n- b\n- c`
3. **No redundant labels**: JSON keys are shorter than markdown headers
4. **Predictable structure**: Agents don't need to parse varying formats

## Why Prose Stays in Markdown

1. **No token benefit**: Prose is mostly content, not structure
2. **Readability**: Humans read proposals directly in GitHub
3. **Editing experience**: Markdown editors are ubiquitous
4. **Formatting needs**: Tables, code blocks, links, emphasis

## Cumulative Impact

For a typical change with:
- 8 tasks with dependencies
- 3 requirements with 2 scenarios each
- 500-word proposal
- 300-word design doc

| Component | Markdown Tokens | JSON Tokens | Savings |
|-----------|-----------------|-------------|---------|
| Tasks (8) | ~400 | ~300 | 25% |
| Requirements (3) | ~600 | ~480 | 20% |
| Proposal | ~600 | ~600 | 0% |
| Design | ~400 | ~400 | 0% |
| **Total** | **~2000** | **~1780** | **~11%** |

## Context Window Implications

At 11-15% token reduction for structured content:

| Model Context | Markdown Capacity | JSON Capacity | Extra Specs |
|---------------|-------------------|---------------|-------------|
| 8K tokens | ~4 changes | ~4.5 changes | +12% |
| 32K tokens | ~16 changes | ~18 changes | +12% |
| 128K tokens | ~64 changes | ~73 changes | +14% |

**Practical benefit**: More specs fit in context during validation and cross-spec queries, reducing the need for retrieval or summarization.

## Agent Processing Efficiency

Beyond token count, JSON provides:

1. **Deterministic parsing**: No regex, no format variations
2. **Direct field access**: `task.status` vs regex for `- [x]` or `- [ ]`
3. **Type safety**: Schema validation catches errors before processing
4. **Query support**: SQLite indexing on JSON-derived tables

These reduce agent reasoning overhead even when token counts are similar.
