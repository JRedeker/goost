# SQLite Cache Architecture

This document describes the SQLite caching layer that enables fast queries in Advance (ADV).

## Overview

```
┌─────────────────────────────────────────────────────────┐
│                    JSON Files                            │
│              (Source of Truth - Git Tracked)             │
│   specs/*.json  changes/*.json                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     │  On-demand sync
                     │  (no daemon)
                     ▼
         ┌─────────────────────┐
         │   SQLite Cache      │
         │    (.advdb/adv.db)  │
         │   - Not committed   │
         │   - Regeneratable   │
         └─────────────────────┘
```

## Why SQLite is Essential

The "specs as laws" validation feature requires cross-spec queries:

| Operation | Without SQLite | With SQLite |
|-----------|----------------|-------------|
| `change validate` | Parse ALL spec files | Single indexed query |
| Conflict detection | Load specs into memory, compare | SQL JOIN |
| `spec search` | Regex scan all files | FTS5 index query |
| `task ready` | Parse change.json, build dep graph | O(1) indexed query |

**Without SQLite, every validation would parse every spec file — O(n) scaling that defeats "specs as laws".**

## On-Demand Sync (No Daemon)

Following Beads' proven pattern: "There's no background daemon watching for changes — the check happens when you run a bd command."

```bash
# Every CLI command checks JSON freshness first:
spec list    →  if JSON newer than cache → import → query
task ready   →  if JSON newer than cache → import → query
```

**Sync rules**:
1. JSON files are authoritative (committed to git)
2. SQLite is derived (`.specdb/` in .gitignore)
3. Every read command checks: is JSON newer than SQLite?
4. If yes → auto-import before executing query (~10ms)
5. Write operations → update JSON → update SQLite atomically
6. SQLite corruption → `db rebuild` regenerates from JSON
7. No background daemon — sync happens on command invocation

## Database Schema

```sql
-- Core entities
CREATE TABLE specs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  purpose TEXT,
  version TEXT,
  updated_at TEXT,
  json_path TEXT NOT NULL
);

CREATE TABLE requirements (
  id TEXT PRIMARY KEY,
  spec_id TEXT NOT NULL REFERENCES specs(id),
  title TEXT NOT NULL,
  body TEXT,
  priority TEXT,
  tags_json TEXT,
  UNIQUE(spec_id, title)
);

CREATE TABLE scenarios (
  id TEXT PRIMARY KEY,
  requirement_id TEXT NOT NULL REFERENCES requirements(id),
  title TEXT NOT NULL,
  given_json TEXT,
  when_text TEXT,
  then_json TEXT
);

CREATE TABLE changes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT,
  created_by TEXT,
  json_path TEXT NOT NULL
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  change_id TEXT NOT NULL REFERENCES changes(id),
  title TEXT NOT NULL,
  section TEXT,
  status TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  created_at TEXT,
  started_at TEXT,
  completed_at TEXT,
  completed_by TEXT
);

CREATE TABLE deps (
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  dep_type TEXT NOT NULL,
  PRIMARY KEY (source_id, target_id, dep_type)
);

CREATE TABLE deltas (
  id TEXT PRIMARY KEY,
  change_id TEXT NOT NULL REFERENCES changes(id),
  spec_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  target_id TEXT,
  requirement_json TEXT
);

-- Performance indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_change ON tasks(change_id);
CREATE INDEX idx_deps_target ON deps(target_id);
CREATE INDEX idx_deps_type ON deps(dep_type);
CREATE INDEX idx_requirements_spec ON requirements(spec_id);
CREATE INDEX idx_deltas_change ON deltas(change_id);
```

## Full-Text Search (FTS5)

```sql
CREATE VIRTUAL TABLE requirements_fts USING fts5(
  req_id UNINDEXED,
  title,
  body,
  tokenize='porter unicode61 remove_diacritics 2',
  content='requirements',
  content_rowid='rowid'
);
```

**Configuration**:
- `porter` — Stemmer for English (e.g., "running" matches "run")
- `unicode61` — Unicode-aware tokenization
- `remove_diacritics 2` — Normalize accented characters

**Limitations** (validated via research):
- No fuzzy/typo tolerance (acceptable for spec search)
- Porter stemmer is English-only
- Consider MeiliSearch only if user-facing search needed

## Key Queries

### Ready Tasks (Unblocked Pending Tasks)

```sql
SELECT t.* FROM tasks t
WHERE t.status = 'pending'
  AND t.change_id = ?
  AND NOT EXISTS (
    SELECT 1 FROM deps d
    JOIN tasks blocker ON d.target_id = blocker.id
    WHERE d.source_id = t.id
      AND d.dep_type = 'blocked_by'
      AND blocker.status NOT IN ('done', 'cancelled')
  )
ORDER BY t.priority, t.created_at;
```

### Cross-Spec Search

```sql
SELECT r.id, r.title, r.spec_id, 
       snippet(requirements_fts, 2, '<b>', '</b>', '...', 32) as match
FROM requirements_fts
WHERE requirements_fts MATCH ?
ORDER BY rank;
```

### Conflict Detection (for Validation)

```sql
-- Find requirements that would be orphaned by a removal
SELECT s.* FROM scenarios s
WHERE s.requirement_id = ?;

-- Find deltas targeting a requirement
SELECT d.* FROM deltas d
WHERE d.target_id = ?
  AND d.change_id IN (SELECT id FROM changes WHERE status = 'active');
```

### Impact Analysis

```sql
-- Find all requirements in same spec
SELECT r.* FROM requirements r
WHERE r.spec_id = (SELECT spec_id FROM requirements WHERE id = ?);

-- Find cross-references via tags
SELECT r.* FROM requirements r
WHERE r.tags_json LIKE '%"security"%';
```

## SQLite Configuration

Recommended PRAGMAs (from Beads research):

```sql
PRAGMA journal_mode=WAL;        -- Concurrent read/write
PRAGMA busy_timeout=5000;       -- Handle contention (5s)
PRAGMA synchronous=NORMAL;      -- Balance durability/speed
```

**WAL mode benefits**:
- Readers don't block writers, writers don't block readers
- Safe for on-demand sync pattern
- Regeneratable if corrupted

## File Locations

```
project/
└── .specdb/
    └── spec.db              # SQLite database
```

**Gitignore**: `.specdb/` should be in `.gitignore` — the database is derived, not source.

## Recovery

If SQLite becomes corrupted or out of sync:

```bash
db rebuild     # Regenerates SQLite from JSON files
```

This is safe because JSON files are the source of truth.

## Performance Characteristics

| Operation | Time |
|-----------|------|
| Freshness check | <1ms |
| Full re-import (100 specs) | ~50ms |
| Ready tasks query | <1ms |
| FTS search | <5ms |
| Validation (cross-spec) | <10ms |

The ~10ms auto-import overhead is negligible compared to query benefits.
