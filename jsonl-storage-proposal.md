# Proposal: Hybrid Storage for AI Agent Spec Management

## Summary

A new spec-driven development system using **hybrid storage**: JSON files for structured data (specs, tasks, deltas) and markdown for prose-heavy content (proposals, designs). Inspired by OpenSpec's workflow and Beads' state-file pattern, this improves AI agent reliability and enables explicit task dependencies while preserving human readability for documentation.

This is a proposal for a **new project**, not a migration of existing systems.

## Motivation

### Problems with Pure Markdown Storage

1. **Parsing Fragility**: Extracting structured data from markdown requires regex patterns that break on formatting variations
2. **Merge Conflicts**: Multiple agents editing `tasks.md` simultaneously causes conflicts
3. **Implicit Relationships**: Task dependencies are inferred from ordering, not explicitly declared
4. **Mixed Concerns**: Structured data (tasks, requirements) and prose (rationale, context) use the same format

### Why Not Pure JSON/JSONL?

Evaluated making everything JSON, but prose content suffers:

- Markdown formatting embedded in JSON strings (escaping hell)
- Can't use markdown preview/renderer
- Editing multi-paragraph text in JSON fields is miserable
- Git diffs become unreadable for documentation changes
- Loses the "document" feel for proposals and designs

### Why Hybrid (JSON + Markdown)?

```
┌─────────────────────────┬──────────────────────────┬──────────────────────────┐
│ Concern                 │ Pure Markdown            │ Hybrid (Proposed)        │
├─────────────────────────┼──────────────────────────┼──────────────────────────┤
│ Structured data parsing │ Fragile (regex)          │ Reliable (JSON)          │
│ Task dependencies       │ Implicit (ordering)      │ Explicit (blocked_by)    │
│ Merge conflicts         │ Frequent                 │ Reduced (separate files) │
│ Prose/documentation     │ Excellent                │ Excellent (kept as .md)  │
│ Human editing           │ Easy                     │ Easy for prose, CLI for  │
│                         │                          │ structured data          │
│ Git diffs               │ Readable                 │ Mixed (JSON less pretty) │
│ AI parseability         │ Medium                   │ High                     │
│ State inspection        │ Read file                │ Read file                │
│ Audit trail             │ Git history              │ Git history              │
└─────────────────────────┴──────────────────────────┴──────────────────────────┘
```

## Design

### Storage Layout

```
project/
├── AGENTS.md                                    # Agent instructions (prose)
├── project.md                                   # Project conventions (prose)
├── specs/
│   ├── contract-system/
│   │   └── spec.json                            # Living spec (JSON)
│   ├── slash-commands/
│   │   └── spec.json
│   └── plugin/
│       └── spec.json
└── changes/
    ├── add-feature/
    │   ├── proposal.md                          # Why, impact (prose)
    │   ├── design.md                            # Decisions, risks (prose)
    │   ├── tasks.json                           # Task DAG with dependencies
    │   └── deltas/
    │       └── slash-commands.json              # Spec mutations
    └── archive/
        └── 2026-01-13-add-feature/
            ├── proposal.md
            ├── design.md
            ├── tasks.json
            └── deltas/
                └── slash-commands.json
```

### File Format Rationale

| Content Type | Format | Rationale |
|--------------|--------|-----------|
| Specs (requirements, scenarios) | JSON | Structured, queryable, explicit relationships |
| Tasks (with dependencies) | JSON | DAG structure, status tracking, priority |
| Deltas (spec mutations) | JSON | Typed operations (add/modify/remove) |
| Proposal (why, impact) | Markdown | Rich prose, formatting, links, unlimited length |
| Design (decisions, risks) | Markdown | Narrative content, diagrams, tables |
| Instructions (AGENTS.md) | Markdown | Documentation for humans and AI |
| Project config | Markdown | Conventions, guidelines |

## Schema Definitions

### specs/{capability}/spec.json

```json
{
  "name": "contract-system",
  "title": "Contract System",
  "purpose": "The contract-system capability defines the behavior of the immutable contract enforcement mechanism.",
  "requirements": [
    {
      "id": "rq-1a2b",
      "title": "Contract Completion Commit",
      "body": "When a contract is fulfilled (all criteria verified with evidence), the agent SHALL automatically create an atomic git commit containing all contract-related changes.\n\nThe commit MUST:\n- Include all staged and unstaged changes related to the contract work\n- Use a conventional commit message derived from the contract objective",
      "scenarios": [
        {
          "id": "sc-3c4d",
          "title": "Contract completion with valid TDD evidence",
          "given": "all criteria are marked [x] AND valid Red Phase and Green Phase evidence is provided",
          "when": "the agent declares CONTRACT FULFILLED",
          "then": "the agent SHALL automatically create an atomic git commit"
        },
        {
          "id": "sc-5e6f",
          "title": "Contract completion without test evidence",
          "given": "all criteria are marked [x] AND no evidence of test execution is provided",
          "when": "the agent attempts to declare CONTRACT FULFILLED",
          "then": "the protocol SHALL block the fulfillment"
        }
      ]
    }
  ]
}
```

**Notes:**
- `body` field supports full markdown formatting (lists, tables, code blocks)
- `given`, `when`, `then` fields are plain text (no markdown)
- IDs are hash-based for multi-agent collision prevention

### changes/{name}/tasks.json

```json
{
  "change": "add-goost-search-command",
  "tasks": [
    {
      "id": "tk-7g8h",
      "title": "Create .opencode/command/goost-search.md with frontmatter",
      "section": "Command Scaffold",
      "priority": 0,
      "status": "pending",
      "blocked_by": []
    },
    {
      "id": "tk-9i0j",
      "title": "Add argument parsing section for query extraction",
      "section": "Command Scaffold",
      "priority": 0,
      "status": "pending",
      "blocked_by": ["tk-7g8h"]
    },
    {
      "id": "tk-1k2l",
      "title": "Implement content sanitization function",
      "section": "Security Layer",
      "priority": 0,
      "status": "pending",
      "blocked_by": []
    },
    {
      "id": "tk-3m4n",
      "title": "Create secure display template",
      "section": "Display Formatting",
      "priority": 0,
      "status": "pending",
      "blocked_by": ["tk-1k2l"]
    }
  ]
}
```

**Task status values**: `pending` | `in_progress` | `done` | `cancelled`

**Key features:**
- `blocked_by` array enables explicit dependency tracking (DAG)
- `section` field (optional) groups related tasks for display
- `priority` enables ordering within ready tasks (0 = highest)

### changes/{name}/deltas/{capability}.json

```json
{
  "change": "add-goost-search-command",
  "spec": "slash-commands",
  "deltas": [
    {
      "id": "dl-5o6p",
      "operation": "add",
      "requirement": {
        "id": "rq-7q8r",
        "title": "Goost Search Command",
        "body": "The /goost-search command SHALL search curated prompt libraries for prompts matching the user's query.",
        "scenarios": [
          {
            "id": "sc-9s0t",
            "title": "Basic search with single result",
            "given": "user has a specific prompt need",
            "when": "user invokes /goost-search code review AND exactly one prompt strongly matches",
            "then": "the command SHALL display the full prompt content in review mode"
          }
        ]
      }
    },
    {
      "id": "dl-1u2v",
      "operation": "modify",
      "requirement_id": "rq-3w4x",
      "changes": {
        "body": "Updated requirement body with new behavior..."
      }
    },
    {
      "id": "dl-5y6z",
      "operation": "remove",
      "requirement_id": "rq-7a8b",
      "reason": "Deprecated in favor of new approach"
    }
  ]
}
```

**Delta operations**: `add` | `modify` | `remove`

### changes/{name}/proposal.md (prose — unchanged from current practice)

```markdown
# Change: Add Goost Search Command

## Why

Users need a way to discover and apply high-quality prompts from curated 
community libraries when tackling unfamiliar problems. Currently, finding 
the right prompt requires manually browsing multiple GitHub repositories.

**Security Imperative**: External prompts represent an injection attack 
vector. Any prompt fetched from the internet could contain malicious 
instructions designed to manipulate AI behavior.

## What Changes

- Add `/goost-search` slash command that searches curated prompt libraries
- Implement live GitHub fetching for prompt content
- AI-powered relevance ranking of search results
- **Security controls**:
  - Display-only mode (never auto-execute fetched prompts)
  - Prominent "UNTRUSTED CONTENT" warning banners
  - Content sanitization (strip zero-width chars, escape control sequences)

## Impact

- Affected specs: slash-commands
- Affected code: .opencode/command/goost-search.md
- Breaking changes: None
```

### changes/{name}/design.md (prose — unchanged from current practice)

```markdown
## Context

Users currently have no way to discover prompts within the workflow.
They must manually browse GitHub repositories...

## Decisions

**Using display-only mode because:**
- Security: Never auto-execute external content
- Trust: User must explicitly copy/paste after review
- Auditability: User makes conscious decision to use prompt

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Prompt injection | Medium | High | Security scanning, warnings |
| Library unavailable | Low | Medium | Graceful degradation |

## Open Questions

- Should we cache library indexes locally?
- How to handle prompts with embedded tool definitions?
```

## ID Generation

Use short hash-based IDs to prevent collisions when multiple agents work concurrently.

**Format**: `{prefix}-{hash}`

| Entity | Prefix | Example |
|--------|--------|---------|
| Requirement | `rq-` | `rq-1a2b` |
| Scenario | `sc-` | `sc-3c4d` |
| Task | `tk-` | `tk-5e6f` |
| Delta | `dl-` | `dl-7g8h` |

**Generation algorithm**:
```
hash = sha256(title + ISO8601_timestamp + random_bytes(4))
id = prefix + hash[0:4]
```

**Why hash-based IDs?** (from Beads FAQ)
- Sequential IDs cause collisions when multiple agents/branches create items concurrently
- Hash IDs from random UUIDs eliminate collision risk
- Short hashes (4 chars) sufficient for most projects
- Can extend to 5-6 chars as database grows

**CLI convenience**: Support name lookup for human use:
```bash
spec task done "Create goost-search.md"  # Resolves to tk-7g8h
```

## Entity Relationships

```
                    ┌─────────────┐
                    │   Project   │
                    │  project.md │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
      ┌─────────┐     ┌─────────┐     ┌─────────┐
      │  Spec   │     │  Spec   │     │ Change  │
      │spec.json│     │spec.json│     │  (dir)  │
      └────┬────┘     └─────────┘     └────┬────┘
           │                               │
     ┌─────┴─────┐         ┌───────────────┼───────────────┐
     ▼           ▼         ▼               ▼               ▼
┌─────────┐ ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐
│   Req   │ │   Req   │ │tasks.json│ │deltas/*.  │ │proposal.md│
│(nested) │ │(nested) │ │          │ │   json    │ │design.md  │
└────┬────┘ └─────────┘ └────┬─────┘ └───────────┘ └───────────┘
     │                       │
┌────┴────┐            ┌─────┴─────┐
▼         ▼            ▼           ▼
┌──────┐ ┌──────┐ ┌────────┐ ┌────────┐
│ Scn  │ │ Scn  │ │  Task  │ │  Task  │
│(nest)│ │(nest)│ │blocked │ │blocked │
└──────┘ └──────┘ │   by   │ │   by   │
                  └────────┘ └────────┘
```

## Multi-Capability Changes

When a change affects multiple specs, create one delta file per capability:

```
changes/add-auth-logging/
├── proposal.md
├── design.md
├── tasks.json
└── deltas/
    ├── auth.json           # Deltas for auth spec
    └── logging.json        # Deltas for logging spec
```

This mirrors the current OpenSpec approach where delta specs are organized by capability.

## Archive Operation

When archiving a completed change:

1. **Validate**: All tasks in `tasks.json` have `status: done`
2. **Apply deltas**: For each delta in `deltas/*.json`:
   - `add` → Insert requirement into `specs/{capability}/spec.json`
   - `modify` → Update requirement fields in `specs/{capability}/spec.json`
   - `remove` → Remove requirement from `specs/{capability}/spec.json`
3. **Move to archive**: Copy entire `changes/{name}/` to `archive/{YYYY-MM-DD}-{name}/`
4. **Remove from active**: Delete `changes/{name}/`

This mirrors the current OpenSpec archive workflow.

## Querying Ready Tasks

Simple file read + filter:

```python
import json

def get_ready_tasks(change_name):
    with open(f"changes/{change_name}/tasks.json") as f:
        data = json.load(f)
    
    tasks = {t["id"]: t for t in data["tasks"]}
    ready = []
    
    for task in data["tasks"]:
        if task["status"] != "pending":
            continue
        blockers = task.get("blocked_by", [])
        if all(tasks[b]["status"] == "done" for b in blockers):
            ready.append(task)
    
    return sorted(ready, key=lambda t: t["priority"])
```

No event replay. Just read the file.

## CLI Commands

Essential commands (inspired by OpenSpec CLI):

```bash
# List and show
spec list                      # List active changes
spec list --specs              # List specifications  
spec show <change>             # Display change details
spec show <spec> --type spec   # Display spec details

# Validation
spec validate <change>         # Validate change
spec validate --strict         # Comprehensive validation

# Task management
spec task list <change>        # List all tasks
spec task ready <change>       # List unblocked tasks only
spec task done <task-id>       # Mark task complete
spec task add <change> "title" # Add new task

# Lifecycle
spec archive <change>          # Archive completed change

# Output formats
spec show <change> --json      # Machine-readable output
```

## Benefits

### For AI Agents

```
┌────────────────────────────────┬─────────────────────────┬─────────────────────────┐
│ Problem                        │ Markdown Storage        │ Hybrid (Proposed)       │
├────────────────────────────────┼─────────────────────────┼─────────────────────────┤
│ Parsing task status            │ Regex for `- [ ]`       │ Read status field       │
│ Finding ready tasks            │ Infer from order        │ Query blocked_by        │
│ Task dependencies              │ Implicit                │ Explicit DAG            │
│ Concurrent edits               │ Merge conflicts         │ Reduced (separate files)│
│ Requirement structure          │ Parse markdown headers  │ Read JSON array         │
│ Scenario format                │ Parse Given/When/Then   │ Read object fields      │
│ Cross-spec queries             │ Grep across files       │ JSON queries            │
│ Validation                     │ Pattern matching        │ Schema validation       │
└────────────────────────────────┴─────────────────────────┴─────────────────────────┘
```

### For Humans

- **Prose stays readable**: `proposal.md` and `design.md` unchanged
- **Rich formatting preserved**: Lists, tables, links, diagrams all work
- **Easy manual editing**: Edit markdown files directly
- **Git diffs for prose**: Readable diffs for documentation changes
- **GitHub/GitLab rendering**: Proposal and design render beautifully in web UI

### For Correctness

- **Explicit relationships**: Dependencies are data, not inference
- **No truncation**: Prose content stays in markdown (unlimited length)
- **Clear separation**: Structured vs narrative content in appropriate formats

## Token Cost Analysis

```
┌─────────────────────┬──────────────────────────────────────────────────────────┬─────────┐
│ Content Type        │ Format                                                   │ Tokens  │
├─────────────────────┼──────────────────────────────────────────────────────────┼─────────┤
│ Task list (4 tasks) │ Markdown: - [ ] 1.1 Add auth\n- [ ] 1.2 Add tests\n...   │ 200-250 │
│                     │ JSON: {"tasks":[{"id":"tk-0001","title":"Add auth"...}]} │ 150-180 │
├─────────────────────┼──────────────────────────────────────────────────────────┼─────────┤
│ Requirement + 2 scn │ Markdown: ### Requirement: Login\n#### Scenario: ...     │ 150-200 │
│                     │ JSON: {"id":"rq-1111","title":"Login","scenarios":[...]} │ 120-150 │
├─────────────────────┼──────────────────────────────────────────────────────────┼─────────┤
│ Proposal prose      │ Markdown: ## Why\n\nWe need 2FA because... (500 words)   │ ~600    │
│                     │ (unchanged - stays as markdown)                          │ ~600    │
└─────────────────────┴──────────────────────────────────────────────────────────┴─────────┘
```

Structured content: **20-30% token reduction**
Prose content: **No change** (stays as markdown)

## Risks and Mitigations

```
┌─────────────────────────────────┬────────────────────────────────────────────────┐
│ Risk                            │ Mitigation                                     │
├─────────────────────────────────┼────────────────────────────────────────────────┤
│ JSON merge conflicts            │ Separate files per change reduce overlap;      │
│                                 │ hash-based IDs prevent create collisions       │
├─────────────────────────────────┼────────────────────────────────────────────────┤
│ Human editing friction          │ CLI commands for common operations;            │
│                                 │ prose stays in editable markdown               │
├─────────────────────────────────┼────────────────────────────────────────────────┤
│ Git diff readability            │ JSON diffs less pretty but structured;         │
│                                 │ prose diffs unchanged (still markdown)         │
├─────────────────────────────────┼────────────────────────────────────────────────┤
│ ID readability                  │ CLI supports name lookup; IDs shown with titles│
└─────────────────────────────────┴────────────────────────────────────────────────┘
```

## What This System Provides

1. **Spec-driven development**: Define requirements and scenarios before implementation
2. **Change proposals**: Formal process for proposing, reviewing, and implementing changes
3. **Task tracking with dependencies**: Explicit DAG structure, "ready" task queries
4. **Archive workflow**: Completed changes archived with deltas applied to living specs
5. **Multi-agent safety**: Hash-based IDs prevent collisions
6. **Human-readable documentation**: Prose stays in markdown

## References

- [Beads: A memory upgrade for your coding agent](https://github.com/steveyegge/beads) — State-file pattern, hash-based IDs
- [OpenSpec](https://github.com/openspec-dev/openspec) — Spec-driven development workflow
- [JSON Lines specification](https://jsonlines.org/) — Format reference
