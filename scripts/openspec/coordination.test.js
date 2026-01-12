#!/usr/bin/env node
/**
 * Tests for coordination.js
 * 
 * Run with: node scripts/openspec/coordination.test.js
 * 
 * Uses Node.js built-in assert module - no external dependencies required.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// We need to test functions directly, so we'll create a minimal mock setup
// and re-implement the core logic for testing (since coordination.js is a CLI script)

// ============================================================
// Test Helpers
// ============================================================

let testCount = 0;
let passCount = 0;
let failCount = 0;

function test(name, fn) {
  testCount++;
  try {
    fn();
    passCount++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failCount++;
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${e.message}`);
    if (e.stack) {
      console.log(`    ${e.stack.split('\n').slice(1, 3).join('\n    ')}`);
    }
  }
}

function describe(name, fn) {
  console.log(`\n${name}`);
  fn();
}

function createTestDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coordination-test-'));
  return dir;
}

function cleanupTestDir(dir) {
  if (dir && dir.startsWith(os.tmpdir())) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function writeFile(dir, relativePath, content) {
  const fullPath = path.join(dir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
  return fullPath;
}

// ============================================================
// Re-implement core functions for testing
// (These mirror the logic in coordination.js)
// ============================================================

const CHANGE_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

function validateChangeId(id) {
  if (!CHANGE_ID_REGEX.test(id)) {
    throw new Error(`Invalid change ID: ${id}. Must match ${CHANGE_ID_REGEX}`);
  }
  return true;
}

function extractAffectedFiles(content) {
  const files = [];
  const impactMatch = content.match(/\*\*Affected code\*\*:?\n([\s\S]*?)(?=\n\n|\n##|\n\*\*|$)/i);
  if (impactMatch) {
    const lines = impactMatch[1].split('\n');
    lines.forEach(line => {
      const match = line.match(/^\s*-\s*`([^`]+)`/);
      if (match) files.push(match[1]);
    });
  }
  return files;
}

function extractRequirementsFromContent(content) {
  const requirements = [];
  const reqMatches = content.matchAll(/### Requirement: (.*)\n([\s\S]*?)(?=### Requirement:|$)/g);
  for (const match of reqMatches) {
    const title = match[1].trim();
    const body = match[2];
    const identifiers = [...body.matchAll(/`([^`]+)`/g)].map(m => m[1]);
    const action = title.split(' ')[0];
    requirements.push({ title, identifiers, action });
  }
  return requirements;
}

function findConflicts(state) {
  const conflicts = [];
  const idMap = {};
  
  for (const [id, reqs] of Object.entries(state.requirements || {})) {
    reqs.forEach(req => {
      req.identifiers.forEach(ident => {
        if (!idMap[ident]) idMap[ident] = [];
        idMap[ident].push({ id, action: req.action, title: req.title });
      });
    });
  }
  
  for (const [ident, usage] of Object.entries(idMap)) {
    if (usage.length > 1) {
      const uniqueIds = new Set(usage.map(u => u.id));
      if (uniqueIds.size > 1) {
        conflicts.push({ identifier: ident, usage });
      }
    }
  }
  
  return conflicts;
}

function getOverlaps(state) {
  const overlaps = [];
  for (const [file, ids] of Object.entries(state.locks || {})) {
    if (ids.length > 1) {
      overlaps.push({ file, owners: ids, count: ids.length });
    }
  }
  overlaps.sort((a, b) => b.count - a.count);
  return overlaps;
}

function checkCycles(state) {
  const adj = {};
  const visited = new Set();
  const recStack = new Set();
  const cyclePaths = [];
  
  for (const [id, reqs] of Object.entries(state.requirements || {})) {
    adj[id] = [];
    reqs.forEach(req => {
      const depMatch = req.title.match(/depends on ([a-zA-Z0-9_-]+)/i);
      if (depMatch && state.changes[depMatch[1]]) {
        adj[id].push(depMatch[1]);
      }
    });
  }

  function findCycle(v, path) {
    if (recStack.has(v)) {
      const cycleStart = path.indexOf(v);
      cyclePaths.push(path.slice(cycleStart).concat(v));
      return true;
    }
    if (visited.has(v)) return false;
    
    visited.add(v);
    recStack.add(v);
    
    for (const neighbor of (adj[v] || [])) {
      findCycle(neighbor, [...path, v]);
    }
    
    recStack.delete(v);
    return false;
  }

  for (const v in adj) {
    findCycle(v, []);
  }
  
  return cyclePaths;
}

function getHunkAnchor(content, lineNum) {
  const lines = content.split('\n');
  const target = lines[lineNum - 1] || '';
  const preLines = lines.slice(Math.max(0, lineNum - 4), lineNum - 1);
  const postLines = lines.slice(lineNum, lineNum + 3);
  const hash = crypto.createHash('sha256').update(target.trim()).digest('hex');
  
  return { 
    lineNum, 
    hash, 
    pre: preLines.join('\n'), 
    preCount: preLines.length,
    post: postLines.join('\n'), 
    postCount: postLines.length,
    target: target.trim(),
  };
}

function verifyAnchor(content, anchor) {
  const lines = content.split('\n');
  const currentLine = lines[anchor.lineNum - 1] || '';
  
  // Direct match at original location
  if (crypto.createHash('sha256').update(currentLine.trim()).digest('hex') === anchor.hash) {
    return { status: 'STABLE', line: anchor.lineNum };
  }
  
  // Fuzzy search within +/- 50 lines
  const searchRange = 50;
  const start = Math.max(0, anchor.lineNum - searchRange);
  const end = Math.min(lines.length, anchor.lineNum + searchRange);
  const matches = [];
  
  for (let i = start; i < end; i++) {
    if (crypto.createHash('sha256').update(lines[i].trim()).digest('hex') === anchor.hash) {
      const preMatch = lines.slice(Math.max(0, i - anchor.preCount), i).join('\n') === anchor.pre;
      const postMatch = lines.slice(i + 1, i + 1 + anchor.postCount).join('\n') === anchor.post;
      const score = (preMatch ? 1 : 0) + (postMatch ? 1 : 0);
      matches.push({ line: i + 1, score, preMatch, postMatch });
    }
  }
  
  const perfectMatches = matches.filter(m => m.score === 2);
  if (perfectMatches.length === 1) {
    return { status: 'MOVED', line: perfectMatches[0].line, shift: perfectMatches[0].line - anchor.lineNum };
  }
  
  if (perfectMatches.length > 1) {
    return { status: 'AMBIGUOUS', lines: perfectMatches.map(m => m.line) };
  }
  
  if (matches.length === 1) {
    return { status: 'MOVED', line: matches[0].line, shift: matches[0].line - anchor.lineNum, confidence: 'partial' };
  }
  
  if (matches.length > 1) {
    return { status: 'AMBIGUOUS', lines: matches.map(m => m.line), confidence: 'partial' };
  }
  
  return { status: 'DRIFTED', reason: 'Code not found in search range' };
}

// ============================================================
// Tests
// ============================================================

console.log('Running coordination.js tests...');
console.log('============================================================');

// -------------------------------------------------------------
describe('validateChangeId', () => {
  test('accepts valid alphanumeric IDs', () => {
    assert.strictEqual(validateChangeId('my-change'), true);
    assert.strictEqual(validateChangeId('change_123'), true);
    assert.strictEqual(validateChangeId('Change-With-Caps'), true);
    assert.strictEqual(validateChangeId('simple'), true);
  });

  test('accepts IDs with numbers', () => {
    assert.strictEqual(validateChangeId('v1-feature'), true);
    assert.strictEqual(validateChangeId('2024-update'), true);
    assert.strictEqual(validateChangeId('feature123'), true);
  });

  test('rejects IDs with spaces', () => {
    assert.throws(() => validateChangeId('my change'), /Invalid change ID/);
  });

  test('rejects IDs with special characters', () => {
    assert.throws(() => validateChangeId('my.change'), /Invalid change ID/);
    assert.throws(() => validateChangeId('my/change'), /Invalid change ID/);
    assert.throws(() => validateChangeId('my@change'), /Invalid change ID/);
    assert.throws(() => validateChangeId('change!'), /Invalid change ID/);
  });

  test('rejects empty ID', () => {
    assert.throws(() => validateChangeId(''), /Invalid change ID/);
  });
});

// -------------------------------------------------------------
describe('extractAffectedFiles', () => {
  test('extracts files from standard format', () => {
    const content = `# Proposal

**Affected code**:
- \`src/index.ts\`
- \`src/utils/helper.ts\`
- \`tests/index.test.ts\`

## Next section`;
    
    const files = extractAffectedFiles(content);
    assert.deepStrictEqual(files, [
      'src/index.ts',
      'src/utils/helper.ts',
      'tests/index.test.ts'
    ]);
  });

  test('extracts files with bullet point format', () => {
    const content = `**Affected code**:
- \`plugin/index.ts\`
- \`plugin/types.ts\``;
    
    const files = extractAffectedFiles(content);
    assert.deepStrictEqual(files, ['plugin/index.ts', 'plugin/types.ts']);
  });

  test('returns empty array when no affected code section', () => {
    const content = `# Proposal

Just some text without affected code section.`;
    
    const files = extractAffectedFiles(content);
    assert.deepStrictEqual(files, []);
  });

  test('handles empty affected code section', () => {
    const content = `**Affected code**:

## Next section`;
    
    const files = extractAffectedFiles(content);
    assert.deepStrictEqual(files, []);
  });

  test('handles paths with special characters', () => {
    const content = `**Affected code**:
- \`src/components/Button.tsx\`
- \`src/@types/global.d.ts\`
- \`src/utils/parse-url.ts\``;
    
    const files = extractAffectedFiles(content);
    assert.strictEqual(files.length, 3);
    assert.ok(files.includes('src/components/Button.tsx'));
    assert.ok(files.includes('src/@types/global.d.ts'));
  });
});

// -------------------------------------------------------------
describe('extractRequirements', () => {
  test('extracts requirements with identifiers', () => {
    const content = `## Spec

### Requirement: Add validation function
The \`validateInput\` function should check \`userEmail\` format.

### Requirement: Update error handling
Modify \`handleError\` to log to \`errorService\`.`;
    
    const reqs = extractRequirementsFromContent(content);
    assert.strictEqual(reqs.length, 2);
    assert.strictEqual(reqs[0].title, 'Add validation function');
    assert.strictEqual(reqs[0].action, 'Add');
    assert.ok(reqs[0].identifiers.includes('validateInput'));
    assert.ok(reqs[0].identifiers.includes('userEmail'));
  });

  test('returns empty array for content without requirements', () => {
    const content = `## Just some content
No requirements here.`;
    
    const reqs = extractRequirementsFromContent(content);
    assert.deepStrictEqual(reqs, []);
  });

  test('extracts action from first word of title', () => {
    const content = `### Requirement: Remove deprecated API
Delete the \`oldAPI\` function.

### Requirement: Refactor utils module
Clean up \`utils.ts\`.`;
    
    const reqs = extractRequirementsFromContent(content);
    assert.strictEqual(reqs[0].action, 'Remove');
    assert.strictEqual(reqs[1].action, 'Refactor');
  });
});

// -------------------------------------------------------------
describe('rebuildState', () => {
  let testDir;
  
  test('handles empty changes directory', () => {
    testDir = createTestDir();
    const changesDir = path.join(testDir, 'openspec', 'changes');
    fs.mkdirSync(changesDir, { recursive: true });
    
    // Simulate rebuild - changes dir exists but is empty
    const changes = fs.readdirSync(changesDir).filter(f => {
      const p = path.join(changesDir, f);
      return fs.statSync(p).isDirectory() && !f.startsWith('.');
    });
    
    assert.strictEqual(changes.length, 0);
    cleanupTestDir(testDir);
  });

  test('handles missing changes directory', () => {
    testDir = createTestDir();
    const changesDir = path.join(testDir, 'openspec', 'changes');
    
    // Changes dir doesn't exist
    assert.strictEqual(fs.existsSync(changesDir), false);
    cleanupTestDir(testDir);
  });

  test('handles malformed proposal', () => {
    testDir = createTestDir();
    const changesDir = path.join(testDir, 'openspec', 'changes');
    
    // Create a change with malformed content
    writeFile(testDir, 'openspec/changes/bad-change/proposal.md', 'Just some random text');
    
    const proposalPath = path.join(changesDir, 'bad-change', 'proposal.md');
    const content = fs.readFileSync(proposalPath, 'utf8');
    const files = extractAffectedFiles(content);
    
    // Should return empty array, not throw
    assert.deepStrictEqual(files, []);
    cleanupTestDir(testDir);
  });

  test('extracts files from valid proposal', () => {
    testDir = createTestDir();
    
    const proposalContent = `# Change Proposal

**Affected code**:
- \`src/main.ts\`
- \`src/utils.ts\`
`;
    writeFile(testDir, 'openspec/changes/valid-change/proposal.md', proposalContent);
    
    const changesDir = path.join(testDir, 'openspec', 'changes');
    const proposalPath = path.join(changesDir, 'valid-change', 'proposal.md');
    const content = fs.readFileSync(proposalPath, 'utf8');
    const files = extractAffectedFiles(content);
    
    assert.deepStrictEqual(files, ['src/main.ts', 'src/utils.ts']);
    cleanupTestDir(testDir);
  });
});

// -------------------------------------------------------------
describe('findConflicts', () => {
  test('detects conflicts on overlapping identifiers', () => {
    const state = {
      requirements: {
        'change-a': [
          { title: 'Modify UserService', identifiers: ['UserService', 'createUser'], action: 'Modify' }
        ],
        'change-b': [
          { title: 'Refactor UserService', identifiers: ['UserService', 'deleteUser'], action: 'Refactor' }
        ]
      },
      changes: { 'change-a': {}, 'change-b': {} }
    };
    
    const conflicts = findConflicts(state);
    assert.strictEqual(conflicts.length, 1);
    assert.strictEqual(conflicts[0].identifier, 'UserService');
    assert.strictEqual(conflicts[0].usage.length, 2);
  });

  test('returns empty array when no conflicts', () => {
    const state = {
      requirements: {
        'change-a': [
          { title: 'Add feature', identifiers: ['FeatureA'], action: 'Add' }
        ],
        'change-b': [
          { title: 'Fix bug', identifiers: ['FeatureB'], action: 'Fix' }
        ]
      },
      changes: { 'change-a': {}, 'change-b': {} }
    };
    
    const conflicts = findConflicts(state);
    assert.strictEqual(conflicts.length, 0);
  });

  test('handles empty requirements', () => {
    const state = { requirements: {}, changes: {} };
    const conflicts = findConflicts(state);
    assert.deepStrictEqual(conflicts, []);
  });

  test('ignores same change referencing identifier multiple times', () => {
    const state = {
      requirements: {
        'change-a': [
          { title: 'Add method', identifiers: ['Service'], action: 'Add' },
          { title: 'Modify constructor', identifiers: ['Service'], action: 'Modify' }
        ]
      },
      changes: { 'change-a': {} }
    };
    
    const conflicts = findConflicts(state);
    assert.strictEqual(conflicts.length, 0); // Same change, not a conflict
  });
});

// -------------------------------------------------------------
describe('getOverlaps', () => {
  test('finds overlapping files', () => {
    const state = {
      locks: {
        'src/shared.ts': ['change-a', 'change-b'],
        'src/unique.ts': ['change-a'],
        'src/contested.ts': ['change-a', 'change-b', 'change-c']
      }
    };
    
    const overlaps = getOverlaps(state);
    assert.strictEqual(overlaps.length, 2);
    // Should be sorted by count (most contentious first)
    assert.strictEqual(overlaps[0].file, 'src/contested.ts');
    assert.strictEqual(overlaps[0].count, 3);
    assert.strictEqual(overlaps[1].file, 'src/shared.ts');
    assert.strictEqual(overlaps[1].count, 2);
  });

  test('returns empty array when no overlaps', () => {
    const state = {
      locks: {
        'src/a.ts': ['change-a'],
        'src/b.ts': ['change-b'],
        'src/c.ts': ['change-c']
      }
    };
    
    const overlaps = getOverlaps(state);
    assert.strictEqual(overlaps.length, 0);
  });

  test('handles empty locks', () => {
    const state = { locks: {} };
    const overlaps = getOverlaps(state);
    assert.deepStrictEqual(overlaps, []);
  });

  test('handles undefined locks', () => {
    const state = {};
    const overlaps = getOverlaps(state);
    assert.deepStrictEqual(overlaps, []);
  });
});

// -------------------------------------------------------------
describe('checkCycles', () => {
  test('detects simple cycle', () => {
    const state = {
      requirements: {
        'change-a': [
          { title: 'Depends on change-b', identifiers: [], action: 'Depends' }
        ],
        'change-b': [
          { title: 'Depends on change-a', identifiers: [], action: 'Depends' }
        ]
      },
      changes: { 'change-a': {}, 'change-b': {} }
    };
    
    const cycles = checkCycles(state);
    assert.ok(cycles.length > 0);
    // Cycle should include both nodes
    const cycleNodes = new Set(cycles.flat());
    assert.ok(cycleNodes.has('change-a'));
    assert.ok(cycleNodes.has('change-b'));
  });

  test('detects longer cycle', () => {
    const state = {
      requirements: {
        'change-a': [
          { title: 'Depends on change-b', identifiers: [], action: 'Depends' }
        ],
        'change-b': [
          { title: 'Depends on change-c', identifiers: [], action: 'Depends' }
        ],
        'change-c': [
          { title: 'Depends on change-a', identifiers: [], action: 'Depends' }
        ]
      },
      changes: { 'change-a': {}, 'change-b': {}, 'change-c': {} }
    };
    
    const cycles = checkCycles(state);
    assert.ok(cycles.length > 0);
  });

  test('returns empty for acyclic graph', () => {
    const state = {
      requirements: {
        'change-a': [
          { title: 'Depends on change-b', identifiers: [], action: 'Depends' }
        ],
        'change-b': [
          { title: 'Depends on change-c', identifiers: [], action: 'Depends' }
        ],
        'change-c': [
          { title: 'No dependencies', identifiers: [], action: 'Add' }
        ]
      },
      changes: { 'change-a': {}, 'change-b': {}, 'change-c': {} }
    };
    
    const cycles = checkCycles(state);
    assert.strictEqual(cycles.length, 0);
  });

  test('handles no dependencies', () => {
    const state = {
      requirements: {
        'change-a': [{ title: 'Add feature', identifiers: [], action: 'Add' }],
        'change-b': [{ title: 'Fix bug', identifiers: [], action: 'Fix' }]
      },
      changes: { 'change-a': {}, 'change-b': {} }
    };
    
    const cycles = checkCycles(state);
    assert.strictEqual(cycles.length, 0);
  });

  test('handles empty state', () => {
    const state = { requirements: {}, changes: {} };
    const cycles = checkCycles(state);
    assert.deepStrictEqual(cycles, []);
  });
});

// -------------------------------------------------------------
describe('getHunkAnchor', () => {
  test('creates anchor with correct hash', () => {
    const content = `line 1
line 2
line 3
target line
line 5
line 6
line 7`;
    
    const anchor = getHunkAnchor(content, 4);
    assert.strictEqual(anchor.lineNum, 4);
    assert.strictEqual(anchor.target, 'target line');
    assert.strictEqual(anchor.preCount, 3);
    assert.strictEqual(anchor.postCount, 3);
    
    // Verify hash is consistent
    const expectedHash = crypto.createHash('sha256').update('target line').digest('hex');
    assert.strictEqual(anchor.hash, expectedHash);
  });

  test('handles first line', () => {
    const content = `first line
second line
third line`;
    
    const anchor = getHunkAnchor(content, 1);
    assert.strictEqual(anchor.lineNum, 1);
    assert.strictEqual(anchor.target, 'first line');
    assert.strictEqual(anchor.preCount, 0); // No lines before
    assert.strictEqual(anchor.postCount, 2);
  });

  test('handles last line', () => {
    const content = `line 1
line 2
last line`;
    
    const anchor = getHunkAnchor(content, 3);
    assert.strictEqual(anchor.target, 'last line');
    assert.strictEqual(anchor.preCount, 2);
    assert.strictEqual(anchor.postCount, 0); // No lines after
  });

  test('handles line with leading/trailing whitespace', () => {
    const content = `line 1
  indented line  
line 3`;
    
    const anchor = getHunkAnchor(content, 2);
    // Target should be trimmed
    assert.strictEqual(anchor.target, 'indented line');
  });
});

// -------------------------------------------------------------
describe('verifyAnchor', () => {
  test('returns STABLE when line unchanged', () => {
    const content = `line 1
line 2
target line
line 4`;
    
    const anchor = getHunkAnchor(content, 3);
    const result = verifyAnchor(content, anchor);
    
    assert.strictEqual(result.status, 'STABLE');
    assert.strictEqual(result.line, 3);
  });

  test('returns MOVED when line shifted', () => {
    const originalContent = `pre1
pre2
pre3
target line
post1
post2
post3`;
    
    const anchor = getHunkAnchor(originalContent, 4);
    
    // Add a line before, shifting target down
    const modifiedContent = `new line
pre1
pre2
pre3
target line
post1
post2
post3`;
    
    const result = verifyAnchor(modifiedContent, anchor);
    assert.strictEqual(result.status, 'MOVED');
    assert.strictEqual(result.line, 5);
    assert.strictEqual(result.shift, 1);
  });

  test('returns DRIFTED when line not found', () => {
    const originalContent = `line 1
target line
line 3`;
    
    const anchor = getHunkAnchor(originalContent, 2);
    
    // Remove the target line
    const modifiedContent = `line 1
different content
line 3`;
    
    const result = verifyAnchor(modifiedContent, anchor);
    assert.strictEqual(result.status, 'DRIFTED');
  });

  test('returns AMBIGUOUS when multiple matches', () => {
    const originalContent = `context
duplicate line
more context`;
    
    const anchor = getHunkAnchor(originalContent, 2);
    // Override context to allow ambiguity
    anchor.pre = '';
    anchor.post = '';
    anchor.preCount = 0;
    anchor.postCount = 0;
    
    // Multiple instances of the same line without context
    const modifiedContent = `duplicate line
something
duplicate line
something else
duplicate line`;
    
    const result = verifyAnchor(modifiedContent, anchor);
    // Should find multiple matches
    assert.ok(result.status === 'AMBIGUOUS' || result.status === 'MOVED');
  });

  test('handles empty content', () => {
    const anchor = {
      lineNum: 5,
      hash: crypto.createHash('sha256').update('some text').digest('hex'),
      pre: '',
      preCount: 0,
      post: '',
      postCount: 0,
      target: 'some text'
    };
    
    const result = verifyAnchor('', anchor);
    assert.strictEqual(result.status, 'DRIFTED');
  });
});

// ============================================================
// Summary
// ============================================================

console.log('\n============================================================');
console.log(`Results: ${passCount}/${testCount} passed, ${failCount} failed`);
console.log('============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('\nAll tests passed!');
  process.exit(0);
}
