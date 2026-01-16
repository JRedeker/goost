# CLI Reference

This document describes the Advance (ADV) command-line interface.

## Overview

The CLI is implemented as a Go binary (`adv`) that manages specs, changes, tasks, and the SQLite cache.

```bash
adv <command> [subcommand] [options]
```

## Commands

### spec — Specification Management

```bash
# List all capabilities
adv spec list                        
adv spec list --json                 # Machine-readable output

# View a spec
adv spec show <capability>           # Display formatted spec
adv spec show <capability> --json    # Raw JSON

# Validation
adv spec validate                    # Validate all specs
adv spec validate <capability>       # Validate specific spec

# Search
adv spec search "authentication"     # Full-text search across specs
adv spec search --tag security       # Find by tag
```

### change — Change Management

```bash
# List changes
adv change list                      # List active changes
adv change list --archived           # Include archived

# View a change
adv change show <id>                 # Display change details
adv change show <id> --json          # Raw JSON

# Lifecycle
adv change create <id>               # Scaffold new change
adv change validate <id>             # Validate against specs (laws)
adv change archive <id>              # Archive and apply deltas
```

**Validation Example**:

```
$ adv change validate add-new-feature

Checking against specs...

✓ contract-system: No conflicts
✓ slash-commands: No conflicts
⚠ tdd-enforcement: 
  - Delta modifies rq-tdd-001 (TDD Workflow)
  - Current spec requires: "Red Phase BEFORE Green Phase"
  - Your delta removes this constraint
  
  This may violate existing law. Proceed? [y/N]
```

### task — Task Management

```bash
# Query tasks
adv task list <change>               # All tasks in change
adv task ready <change>              # Unblocked pending tasks only
adv task show <task-id>              # Task details with deps

# Update status
adv task start <task-id>             # Mark in_progress
adv task done <task-id>              # Mark complete
adv task cancel <task-id>            # Mark cancelled

# Create tasks
adv task add <change> "title"        # Add task to change
adv task add <change> "title" --blocked-by tk-xxxx
adv task add <change> "title" --section "Testing"

# Manage dependencies
adv task dep add <src> blocked_by <tgt>
adv task dep add <src> related <tgt>
adv task dep add <src> discovered_from <tgt>
adv task dep remove <src> <type> <tgt>
```

**Ready Tasks Example**:

```
$ adv task ready add-feature

Ready tasks (2 of 5):

  tk-Hf7dK2mN  Implement coordination protocol
               Section: Core Implementation
               Priority: 0

  tk-Qp3xY9wL  Write unit tests
               Section: Testing  
               Priority: 1

Blocked tasks: 3
  tk-Jm4nP8qR  blocked by: tk-Hf7dK2mN
  ...
```

### docs — Documentation Generation

```bash
# Preview (during development, not committed)
adv docs preview <change>        # Render what docs would look like
adv docs preview --diff          # Show diff from current docs
adv docs preview --output ./tmp  # Write to directory for review

# Generation happens automatically at archive time:
adv change archive <id>          # Regenerates affected docs + commits
```

### db — Database Management

```bash
# Status
adv db status                    # Show sync state, JSON vs SQLite timestamps

# Recovery
adv db rebuild                   # Regenerate SQLite from JSON (if corrupted)
```

**Note**: No manual sync command is needed — every command auto-syncs if JSON is newer than the cache.

## Global Options

| Option | Description |
|--------|-------------|
| `--json` | Output machine-readable JSON |
| `--quiet` | Suppress non-essential output |
| `--verbose` | Show detailed debug information |
| `--help` | Show help for command |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Validation failed |
| 3 | Entity not found |
| 4 | Conflict detected |

## Common Workflows

### Create and Implement a Change

```bash
# 1. Create change scaffold
adv change create add-feature

# 2. Edit proposal.md and change.json (or via AI agent)

# 3. Validate before starting work
adv change validate add-feature

# 4. View ready tasks
adv task ready add-feature

# 5. Start a task
adv task start tk-Hf7dK2mN

# 6. Mark complete when done
adv task done tk-Hf7dK2mN

# 7. Repeat until all tasks done

# 8. Archive (applies deltas, generates docs)
adv change archive add-feature
```

### Search Across Specs

```bash
# Find requirements mentioning authentication
adv spec search "authentication"

# Find all security-related requirements
adv spec search --tag security

# Show a specific spec
adv spec show auth --json | jq '.requirements[] | .title'
```

### Recover from Issues

```bash
# Check sync status
adv db status

# If SQLite is corrupted or out of sync
adv db rebuild

# Validate all specs
adv spec validate
```

## Integration with Slash Commands

Slash commands are thin wrappers that call the CLI:

```markdown
<!-- .opencode/command/adv-apply.md -->
---
name: adv-apply
description: Implement an approved spec change under contract enforcement
---

1. Run `adv change show $ARGUMENTS` to load change details
2. Run `adv task ready $ARGUMENTS` to get unblocked tasks
3. Display contract from change metadata
4. Implement tasks using TDD protocol
5. Run `adv task done <id>` as tasks complete
6. Run `adv change archive $ARGUMENTS` when all tasks done
```

This separation allows:
- CLI for scripts and automation
- Slash commands for AI agent workflows
- Same underlying logic for both
