# Go CLI Implementation Plan

This document outlines the implementation plan for the `adv` CLI binary.

## Overview

The CLI is the core data management layer for Advance (ADV), handling all structured operations:
- JSON file read/write with schema validation
- SQLite cache management
- Cross-spec validation ("specs as laws")
- Task dependency resolution
- Documentation generation

## Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Language | Go 1.22+ | Single binary, fast startup, excellent SQLite support |
| CLI Framework | [cobra](https://github.com/spf13/cobra) | Industry standard (gh, kubectl, docker) |
| Configuration | [viper](https://github.com/spf13/viper) | Cobra companion, env/file/flag unification |
| SQLite | [modernc.org/sqlite](https://pkg.go.dev/modernc.org/sqlite) | Pure Go (no CGO), cross-compile friendly |
| JSON Schema | [santhosh-tekuri/jsonschema](https://github.com/santhosh-tekuri/jsonschema) | Fast, spec-compliant validation |
| ID Generation | [matoous/go-nanoid](https://github.com/matoous/go-nanoid) | NanoID implementation |
| Testing | stdlib + [testify](https://github.com/stretchr/testify) | Assertions, mocking |

## Project Structure

```
cli/
├── cmd/                           # Command definitions
│   ├── root.go                    # Root command, global flags
│   ├── init.go                    # adv init
│   ├── spec/                      # spec subcommands
│   │   ├── spec.go                # Parent command
│   │   ├── list.go                # spec list
│   │   ├── show.go                # spec show
│   │   ├── validate.go            # spec validate
│   │   └── search.go              # spec search
│   ├── change/                    # change subcommands
│   │   ├── change.go              # Parent command
│   │   ├── new.go                 # change new
│   │   ├── list.go                # change list
│   │   ├── show.go                # change show
│   │   ├── validate.go            # change validate
│   │   └── archive.go             # change archive
│   ├── task/                      # task subcommands
│   │   ├── task.go                # Parent command
│   │   ├── list.go                # task list
│   │   ├── ready.go               # task ready
│   │   ├── show.go                # task show
│   │   ├── update.go              # task start/done/cancel
│   │   ├── add.go                 # task add
│   │   └── dep.go                 # task dep add/remove
│   ├── docs/                      # docs subcommands
│   │   ├── docs.go                # Parent command
│   │   ├── preview.go             # docs preview
│   │   └── generate.go            # docs generate
│   ├── db/                        # db subcommands
│   │   ├── db.go                  # Parent command
│   │   ├── status.go              # db status
│   │   └── rebuild.go             # db rebuild
│   ├── migrate/                   # migrate subcommands
│   │   └── from_openspec.go       # migrate from-openspec
│   ├── search.go                  # adv search (shortcut)
│   └── status.go                  # adv status (shortcut)
├── internal/                      # Internal packages
│   ├── config/                    # Configuration management
│   │   └── config.go              # Project config, paths
│   ├── schema/                    # JSON schemas and validation
│   │   ├── schemas.go             # Embedded schemas
│   │   ├── spec.go                # Spec schema types
│   │   ├── change.go              # Change schema types
│   │   └── validate.go            # Schema validation
│   ├── store/                     # Data persistence
│   │   ├── store.go               # Store interface
│   │   ├── json.go                # JSON file operations
│   │   └── sqlite.go              # SQLite operations
│   ├── cache/                     # SQLite cache
│   │   ├── cache.go               # Cache interface
│   │   ├── sync.go                # JSON → SQLite sync
│   │   ├── queries.go             # Query implementations
│   │   └── migrations/            # Schema migrations
│   │       └── 001_init.sql       # Initial schema
│   ├── validator/                 # "Specs as Laws" validation
│   │   ├── validator.go           # Validation interface
│   │   ├── conflicts.go           # Conflict detection
│   │   └── completeness.go        # Completeness checks
│   ├── docs/                      # Documentation generation
│   │   ├── generator.go           # Doc generator
│   │   └── templates/             # Markdown templates
│   │       ├── spec.md.tmpl       # Spec template
│   │       └── index.md.tmpl      # Index template
│   ├── id/                        # ID generation
│   │   └── nanoid.go              # NanoID wrapper
│   └── output/                    # Output formatting
│       ├── output.go              # Output interface
│       ├── json.go                # JSON output
│       └── table.go               # Table output
├── schemas/                       # JSON schema files (embedded)
│   ├── spec.schema.json           # Spec schema
│   ├── change.schema.json         # Change schema
│   └── project.schema.json        # Project config schema
├── testdata/                      # Test fixtures
│   ├── valid/                     # Valid test cases
│   └── invalid/                   # Invalid test cases
├── go.mod
├── go.sum
├── main.go                        # Entry point
└── Makefile                       # Build automation
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Basic CLI structure with spec management

```go
// cmd/root.go
var rootCmd = &cobra.Command{
    Use:   "adv",
    Short: "Advance - Spec-driven development system",
}

func Execute() error {
    return rootCmd.Execute()
}

func init() {
    rootCmd.PersistentFlags().BoolP("json", "j", false, "Output as JSON")
    rootCmd.PersistentFlags().BoolP("quiet", "q", false, "Suppress non-essential output")
    rootCmd.PersistentFlags().BoolP("verbose", "v", false, "Verbose output")
}
```

**Tasks**:
- [ ] Project scaffold with cobra/viper
- [ ] `adv init` — create directory structure
- [ ] `adv spec list` — list capabilities (from JSON files)
- [ ] `adv spec show <cap>` — display spec
- [ ] JSON schema embedding and validation
- [ ] Unit tests for schema validation

**Deliverable**: Can initialize project and list/show specs from JSON files.

### Phase 2: SQLite Cache (Week 3-4)

**Goal**: SQLite cache with auto-sync

```go
// internal/cache/cache.go
type Cache interface {
    Sync() error                           // Sync JSON → SQLite
    NeedsSync() bool                       // Check if sync needed
    Requirements() ([]Requirement, error)  // Query requirements
    Search(query string) ([]SearchResult, error)
}
```

**Tasks**:
- [ ] SQLite schema (requirements, scenarios, changes, tasks, dependencies)
- [ ] JSON → SQLite sync logic
- [ ] `db status` — show sync state
- [ ] `db rebuild` — regenerate from JSON
- [ ] `spec search` — FTS5 search
- [ ] Auto-sync on every command (if JSON newer)

**Deliverable**: Specs queryable via SQLite, auto-synced from JSON.

### Phase 3: Change Management (Week 5-6)

**Goal**: Full change lifecycle

```go
// internal/schema/change.go
type Change struct {
    ID          string    `json:"id"`
    Summary     string    `json:"summary"`
    Status      string    `json:"status"` // draft, pending, implementing, implemented, archived
    CreatedAt   time.Time `json:"created_at"`
    Tasks       []Task    `json:"tasks"`
    Deltas      []Delta   `json:"deltas"`
    Acceptance  []string  `json:"acceptance"`
}
```

**Tasks**:
- [ ] `change new <description>` — scaffold change
- [ ] `change list` — list active changes
- [ ] `change show <id>` — display change details
- [ ] ID generation (NanoID with prefix)
- [ ] Change status transitions
- [ ] Proposal.md auto-generation

**Deliverable**: Can create and manage changes with JSON storage.

### Phase 4: Task Management (Week 7-8)

**Goal**: Task CRUD with dependency resolution

```go
// internal/cache/queries.go
func (c *SQLiteCache) ReadyTasks(changeID string) ([]Task, error) {
    // SELECT tasks WHERE:
    // - change_id = changeID
    // - status = 'pending'
    // - no incomplete blocking tasks
}
```

**Tasks**:
- [ ] `task list <change>` — all tasks
- [ ] `task ready <change>` — unblocked tasks only
- [ ] `task show <id>` — task with deps
- [ ] `task start/done/cancel <id>` — status updates
- [ ] `task add <change> <title>` — create task
- [ ] `task dep add/remove` — manage dependencies
- [ ] Dependency resolution algorithm
- [ ] Update JSON and SQLite atomically

**Deliverable**: Full task management with dependency-aware queries.

### Phase 5: Validation (Week 9-10)

**Goal**: "Specs as Laws" enforcement

```go
// internal/validator/validator.go
type ValidationResult struct {
    Errors   []ValidationError
    Warnings []ValidationWarning
    Passed   bool
}

func (v *Validator) ValidateChange(change *Change, specs []*Spec) *ValidationResult {
    // Check deltas against existing requirements
    // Detect conflicts, missing scenarios, etc.
}
```

**Tasks**:
- [ ] `spec validate` — validate all specs
- [ ] `change validate <id>` — validate against specs
- [ ] Conflict detection (contradicting requirements)
- [ ] Completeness checks (scenarios, acceptance)
- [ ] Warning vs error classification
- [ ] User-friendly validation output

**Deliverable**: Changes validated against existing specs before archive.

### Phase 6: Archive & Docs (Week 11-12)

**Goal**: Archive workflow with doc generation

```go
// internal/docs/generator.go
type Generator struct {
    TemplateFS embed.FS
}

func (g *Generator) GenerateSpec(spec *Spec) (string, error) {
    // Render spec.md.tmpl with spec data
}
```

**Tasks**:
- [ ] `change archive <id>` — full archive workflow
- [ ] Delta → Requirement promotion
- [ ] `docs preview` — render without commit
- [ ] `docs generate` — render and write
- [ ] Markdown templates (spec, index)
- [ ] Archive directory structure

**Deliverable**: Complete archive workflow with generated docs.

### Phase 7: Migration & Polish (Week 13-14)

**Goal**: Migration tool, edge cases, performance

**Tasks**:
- [ ] `migrate from-openspec` — convert v1 to v2
- [ ] Markdown spec → JSON converter
- [ ] Edge case handling
- [ ] Performance optimization
- [ ] Error messages review
- [ ] Shell completions

**Deliverable**: Production-ready CLI with migration support.

## Key Algorithms

### Dependency Resolution (Kahn's Algorithm)

```go
// internal/cache/queries.go
func topologicalSort(tasks []Task, deps []Dependency) ([]Task, error) {
    // 1. Build adjacency list and in-degree map
    inDegree := make(map[string]int)
    graph := make(map[string][]string)
    
    for _, t := range tasks {
        inDegree[t.ID] = 0
    }
    
    for _, d := range deps {
        if d.Type == "blocked_by" {
            graph[d.TargetID] = append(graph[d.TargetID], d.SourceID)
            inDegree[d.SourceID]++
        }
    }
    
    // 2. Process zero in-degree nodes
    var queue []string
    for id, deg := range inDegree {
        if deg == 0 {
            queue = append(queue, id)
        }
    }
    
    // 3. BFS to get sorted order
    var sorted []Task
    for len(queue) > 0 {
        id := queue[0]
        queue = queue[1:]
        // ... add to sorted, reduce in-degrees
    }
    
    return sorted, nil
}
```

### Conflict Detection

```go
// internal/validator/conflicts.go
func detectConflicts(delta Delta, specs []*Spec) []Conflict {
    var conflicts []Conflict
    
    for _, spec := range specs {
        for _, req := range spec.Requirements {
            // Check if delta contradicts requirement
            if contradicts(delta, req) {
                conflicts = append(conflicts, Conflict{
                    Delta:       delta,
                    Requirement: req,
                    Severity:    "error",
                    Message:     fmt.Sprintf("Delta '%s' contradicts requirement '%s'", delta.ID, req.ID),
                })
            }
            
            // Check if delta modifies existing requirement
            if modifies(delta, req) {
                conflicts = append(conflicts, Conflict{
                    Delta:       delta,
                    Requirement: req,
                    Severity:    "warning",
                    Message:     fmt.Sprintf("Delta '%s' modifies existing requirement '%s'", delta.ID, req.ID),
                })
            }
        }
    }
    
    return conflicts
}
```

### Auto-Sync Logic

```go
// internal/cache/sync.go
func (c *SQLiteCache) NeedsSync() bool {
    // Get SQLite last sync timestamp
    var lastSync time.Time
    c.db.QueryRow("SELECT value FROM meta WHERE key = 'last_sync'").Scan(&lastSync)
    
    // Walk JSON files, check mtimes
    needsSync := false
    filepath.WalkDir(c.projectPath, func(path string, d fs.DirEntry, err error) error {
        if strings.HasSuffix(path, ".json") {
            info, _ := d.Info()
            if info.ModTime().After(lastSync) {
                needsSync = true
                return filepath.SkipAll
            }
        }
        return nil
    })
    
    return needsSync
}
```

## Testing Strategy

### Unit Tests

```go
// internal/schema/validate_test.go
func TestSpecValidation(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        wantErr bool
    }{
        {"valid spec", "testdata/valid/spec.json", false},
        {"missing id", "testdata/invalid/no_id.json", true},
        {"invalid status", "testdata/invalid/bad_status.json", true},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            data, _ := os.ReadFile(tt.input)
            err := ValidateSpec(data)
            if (err != nil) != tt.wantErr {
                t.Errorf("ValidateSpec() error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

### Integration Tests

```go
// cmd/change/archive_test.go
func TestArchiveWorkflow(t *testing.T) {
    // Setup: create temp project, init, create change
    tmpDir := t.TempDir()
    runCmd(t, tmpDir, "adv", "init")
    runCmd(t, tmpDir, "adv", "change", "new", "test-feature")
    
    // Add tasks and complete them
    runCmd(t, tmpDir, "adv", "task", "add", "test-feature", "Task 1")
    runCmd(t, tmpDir, "adv", "task", "done", "tk-xxxxx")
    
    // Archive
    out := runCmd(t, tmpDir, "adv", "change", "archive", "test-feature")
    
    // Verify
    assert.Contains(t, out, "archived successfully")
    assert.DirExists(t, filepath.Join(tmpDir, "archive"))
}
```

## Build & Distribution

```makefile
# Makefile
VERSION := $(shell git describe --tags --always)
LDFLAGS := -ldflags "-X main.version=$(VERSION)"

.PHONY: build test install clean

build:
	go build $(LDFLAGS) -o bin/adv .

test:
	go test -v ./...

install:
	go install $(LDFLAGS) .

# Cross-compile for releases
release:
	GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o dist/adv-linux-amd64 .
	GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o dist/adv-darwin-amd64 .
	GOOS=darwin GOARCH=arm64 go build $(LDFLAGS) -o dist/adv-darwin-arm64 .
	GOOS=windows GOARCH=amd64 go build $(LDFLAGS) -o dist/adv-windows-amd64.exe .

clean:
	rm -rf bin/ dist/
```

## Error Handling

```go
// internal/errors/errors.go
type AdvError struct {
    Code    int
    Message string
    Cause   error
}

const (
    ErrNotFound    = 3
    ErrValidation  = 2
    ErrConflict    = 4
)

func NotFound(entity, id string) *AdvError {
    return &AdvError{
        Code:    ErrNotFound,
        Message: fmt.Sprintf("%s '%s' not found", entity, id),
    }
}
```

## Configuration

```go
// internal/config/config.go
type Config struct {
    ProjectPath string
    SpecsDir    string // default: "specs"
    ChangesDir  string // default: "changes"
    ArchiveDir  string // default: "archive"
    DocsDir     string // default: "docs/specs"
    CacheDir    string // default: ".advdb"
}

func Load() (*Config, error) {
    // 1. Find project root (look for project.json)
    // 2. Load project.json for overrides
    // 3. Apply defaults
}
```

## Open Questions for Implementation

1. **CGO vs Pure Go SQLite**: Using `modernc.org/sqlite` (pure Go) for easier cross-compilation, but `go-sqlite3` is faster. Profile and decide.

2. **Schema Versioning**: How to handle schema migrations when CLI is updated?
   - Proposal: Store schema version in SQLite, run migrations on `db rebuild`

3. **Conflict Detection Sophistication**: Start with string matching? Add LLM-assisted analysis later?
   - Proposal: ADV 1.0 uses string/keyword matching, ADV 1.1 adds optional LLM integration

4. **Concurrency**: Multiple agents might update the same change. How to handle?
   - Proposal: SQLite WAL mode + file locking on JSON writes

## Next Steps

1. **Create `cli/` directory** with basic structure
2. **Implement Phase 1** (foundation + spec management)
3. **Write schema files** (spec.schema.json, change.schema.json)
4. **Set up CI** (go test, golangci-lint)
5. **Create test fixtures** for validation

## Timeline Summary

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| 1. Foundation | 2 weeks | Init + spec list/show |
| 2. SQLite Cache | 2 weeks | Auto-sync + search |
| 3. Change Mgmt | 2 weeks | Change CRUD |
| 4. Task Mgmt | 2 weeks | Task CRUD + deps |
| 5. Validation | 2 weeks | Specs as laws |
| 6. Archive & Docs | 2 weeks | Full workflow |
| 7. Migration | 2 weeks | OpenSpec → ADV migration |

**Total**: ~14 weeks to production-ready CLI
