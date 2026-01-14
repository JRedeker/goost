# Design: Cleanup Execution Phase

## Context

The `/openspec-harden` command detects artifacts that should be cleaned up but doesn't enforce actual cleanup. This design addresses how to safely automate file deletion while avoiding false positives and maintaining user control.

## Goals / Non-Goals

**Goals:**
- Automatically identify temporary artifacts created during implementation/hardening
- Provide safe cleanup with user control
- Support both interactive and scripted usage
- Minimize false positives (accidentally flagging permanent files)

**Non-Goals:**
- Replacing dedicated cleanup tools (git clean, linters)
- Detecting all possible code smells (out of scope)
- Automatic deletion without user confirmation

## Decisions

### Decision 1: Dry-run-first pattern (not Y/N/S prompt)

**What:** Default behavior is preview-only; require `--execute` flag to delete.

**Why:** Research from clig.dev and industry tools (rsync, aws, git clean) shows dry-run-first is safer and more intuitive than post-hoc confirmation prompts.

**Alternatives considered:**
- Y/N/S prompt after showing files: More complex UX, not scriptable, non-standard
- Always delete with confirmation: Dangerous default
- `--dry-run` flag: Standard but requires extra flag for safe behavior

**Trade-off:** Users must type `--execute` to delete, but this prevents accidental data loss.

### Decision 2: Extension-based patterns (not prefix-based)

**What:** Detect temp files by extension (*.tmp, *.bak, *.orig) not by prefix (fix-*, migrate-*).

**Why:** Research revealed HIGH false positive risk with prefix patterns:
- `fix-permissions.sh` - legitimate permanent utility
- `migrate-database.py` - legitimate migration framework script
- Database migration files (Alembic, Rails) use similar naming but MUST be kept

**Alternatives considered:**
- Semantic filename analysis: Too complex, still error-prone
- ML-based detection: Over-engineering for this use case
- Whitelist-only: Too restrictive

**Pattern categories:**
```
# Extension-based (SAFE - industry standard)
*.tmp, *.temp, *.bak, *.backup, *.orig, *.rej, *~, *.swp

# Directory-based (SAFE)
tmp/, scratch/, _temp/, _artifacts/, _onetime/

# Explicit markers (SAFE - user intent is clear)
ONETIME-*.*, DELETE-AFTER-*.*
# ONETIME: <reason> (header comment)
# DELETE AFTER: <date or condition> (header comment)
```

### Decision 3: Git-based session tracking

**What:** Use `git status --porcelain` before/after remediation to detect files created during the session.

**Why:** 
- Simpler than custom manifest file
- Survives crashes (git state is persistent)
- Works with sub-agents without coordination
- Zero maintenance overhead

**Implementation:**
```typescript
// Before remediation sub-agents
const beforeFiles = new Set(
  execSync('git ls-files --others --exclude-standard')
    .toString().trim().split('\n')
);

// After remediation sub-agents
const afterFiles = new Set(
  execSync('git ls-files --others --exclude-standard')
    .toString().trim().split('\n')
);

// New files = session artifacts
const sessionArtifacts = [...afterFiles].filter(f => !beforeFiles.has(f));
```

**Alternatives considered:**
- Custom manifest.json: Extra state to manage, can be orphaned on crash
- File system timestamps: Unreliable across different systems
- In-memory tracking: Lost on process termination

### Decision 4: Flags follow GNU conventions

**What:** Use `--no-cleanup`, `--execute`, `--force`, `--interactive` flags.

**Why:** Follows GNU Coding Standards and matches user expectations from git, npm, docker.

| Flag | Purpose | Precedent |
|------|---------|-----------|
| `--no-cleanup` | Skip cleanup phase | git --no-edit, npm --no-save |
| `--execute` | Actually delete (vs preview) | Custom, clear intent |
| `--force` | No prompts (scripting) | git -f, rm -f |
| `--interactive` | Select individual files | git clean -i |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| False positives delete important files | Preview-only default, explicit markers required for ambiguous files |
| Git not available | Fallback to extension-only detection, warn user |
| Sub-agents create files in gitignored dirs | Include `-x` flag option to check ignored files |
| User expects automatic cleanup | Clear messaging: "Run with --execute to delete" |

## Open Questions

1. Should `--execute` be shortened to `-x`? (Conflicts with git clean -x meaning)
2. Should there be a `--cleanup-only` mode that skips analysis/remediation?

## Research Sources

- clig.dev - Command Line Interface Guidelines
- GNU Coding Standards - CLI flag conventions
- Jenkins Pipeline `cleanup` post-condition design
- Maven Build Lifecycle (post-integration-test pattern)
- GitHub gitignore templates (temp file patterns)
- git-clean documentation
