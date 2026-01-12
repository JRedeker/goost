#!/usr/bin/env node
/**
 * OpenSpec Coordination Script
 * Implements cross-change synchronization for the /openspec-coordinate command.
 * 
 * Commands:
 *   rebuild        - Rebuild coordination state from proposal files
 *   show           - Display current coordination state
 *   overlaps       - List files modified by multiple changes
 *   conflicts      - Detect semantic conflicts in requirements
 *   cycles         - Check for dependency cycles
 *   anchor-create  - Create a hunk anchor for a file:line
 *   anchor-verify  - Verify an anchor against current code
 *   report         - Generate full coordination dashboard
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const METADATA_DIR = path.join(process.cwd(), '.openspec');
const STATE_FILE = path.join(METADATA_DIR, 'coordination.json');
const CONFIG_FILE = path.join(METADATA_DIR, 'coordination-config.json');
const CHANGE_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

// Default configuration (can be overridden in coordination-config.json)
const DEFAULT_CONFIG = {
  lockQuota: 20,           // Max files a single change can lock
  llmTimeout: 60000,       // 60s timeout for LLM similarity checks
  maxOverlaps: 50,         // Truncate overlaps report after this
  maxConflicts: 20,        // Truncate conflicts report after this
};

/**
 * Load configuration with defaults
 */
function loadConfig() {
  const custom = readJson(CONFIG_FILE, {});
  return { ...DEFAULT_CONFIG, ...custom };
}

/**
 * Structured logging to stderr (JSON format for log aggregators)
 */
function logEvent(event, data = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...data,
  };
  console.error(JSON.stringify(entry));
}

/**
 * Ensures the .openspec metadata directory exists.
 * Creates it recursively if it doesn't exist.
 */
function ensureMetadataDir() {
  if (!fs.existsSync(METADATA_DIR)) {
    fs.mkdirSync(METADATA_DIR, { recursive: true });
  }
}

/**
 * Reads and parses a JSON file with error handling.
 * @param {string} file - Path to the JSON file
 * @param {Object} def - Default value to return if file doesn't exist or is invalid
 * @returns {Object} Parsed JSON object or default value
 */
function readJson(file, def = {}) {
  if (!fs.existsSync(file)) return def;
  try { 
    return JSON.parse(fs.readFileSync(file, 'utf8')); 
  } catch (e) { 
    logEvent('json_parse_error', { file, error: e.message });
    return def; 
  }
}

/**
 * Writes data to a JSON file atomically using write-to-temp-then-rename pattern.
 * @param {string} file - Path to the JSON file
 * @param {Object} data - Data to write
 */
function writeJson(file, data) {
  ensureMetadataDir();
  const tmpFile = `${file}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2));
  fs.renameSync(tmpFile, file);
}

function validateChangeId(id) {
  if (!CHANGE_ID_REGEX.test(id)) {
    throw new Error(`Invalid change ID: ${id}. Must match ${CHANGE_ID_REGEX}`);
  }
}

/**
 * Extract affected files from proposal.md content
 * Looks for "Affected code" section with backtick-quoted file paths
 */
function extractAffectedFiles(content) {
  const files = [];
  // Match both "**Affected code**:" and "- **Affected code**:" patterns
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

/**
 * Extract requirements from change's spec deltas
 */
function extractRequirements(id) {
  const requirements = [];
  const specsDir = path.join(process.cwd(), 'openspec', 'changes', id, 'specs');
  if (!fs.existsSync(specsDir)) return requirements;

  const caps = fs.readdirSync(specsDir).filter(f => 
    fs.statSync(path.join(specsDir, f)).isDirectory()
  );

  caps.forEach(cap => {
    const specPath = path.join(specsDir, cap, 'spec.md');
    if (fs.existsSync(specPath)) {
      const content = fs.readFileSync(specPath, 'utf8');
      const reqMatches = content.matchAll(/### Requirement: (.*)\n([\s\S]*?)(?=### Requirement:|$)/g);
      for (const match of reqMatches) {
        const title = match[1].trim();
        const body = match[2];
        // Extract identifiers from backtick-quoted strings
        const identifiers = [...body.matchAll(/`([^`]+)`/g)].map(m => m[1]);
        // Extract action verb from requirement title
        const action = title.split(' ')[0];
        requirements.push({ cap, title, identifiers, action });
      }
    }
  });
  return requirements;
}

/**
 * Process a single change directory and update coordination state.
 * Validates the change ID, reads proposal.md, extracts affected files,
 * handles quota exceeded logic, and updates state.changes, state.locks,
 * and state.requirements. Adds warnings for missing proposals or parse errors.
 * 
 * @param {string} id - The change directory name (change ID)
 * @param {string} changesDir - Path to the changes directory
 * @param {Object} config - Configuration object with lockQuota setting
 * @param {Object} state - Coordination state object to update (mutated in place)
 * @returns {void}
 */
function processChangeDirectory(id, changesDir, config, state) {
  try {
    validateChangeId(id);
    const proposalPath = path.join(changesDir, id, 'proposal.md');
    if (fs.existsSync(proposalPath)) {
      const content = fs.readFileSync(proposalPath, 'utf8');
      const files = extractAffectedFiles(content);
      const quotaExceeded = files.length > config.lockQuota;
      const activeFiles = files.slice(0, config.lockQuota);
      
      state.changes[id] = { 
        files: activeFiles, 
        totalFiles: files.length,
        quotaExceeded,
      };
      
      if (quotaExceeded) {
        state.warnings.push({
          changeId: id,
          type: 'quota_exceeded',
          message: `Change ${id} affects ${files.length} files but quota is ${config.lockQuota}`,
        });
        logEvent('quota_exceeded', { changeId: id, files: files.length, quota: config.lockQuota });
      }
      
      activeFiles.forEach(file => {
        if (!state.locks[file]) state.locks[file] = [];
        state.locks[file].push(id);
      });
      
      state.requirements[id] = extractRequirements(id);
      logEvent('change_indexed', { changeId: id, files: activeFiles.length });
    } else {
      state.warnings.push({
        changeId: id,
        type: 'missing_proposal',
        message: `Change ${id} has no proposal.md`,
      });
    }
  } catch (e) {
    state.warnings.push({
      changeId: id,
      type: 'parse_error',
      message: e.message,
    });
    logEvent('change_parse_error', { changeId: id, error: e.message });
  }
}

/**
 * Rebuild coordination state from proposal files.
 * This is the "--rebuild" mechanism for state resilience.
 * Scans all change directories, processes each one, and writes
 * the aggregated state to the coordination state file.
 * 
 * @returns {Object} The rebuilt coordination state
 */
function rebuildState() {
  const config = loadConfig();
  const state = { 
    changes: {}, 
    locks: {}, 
    requirements: {},
    config: { lockQuota: config.lockQuota },
    warnings: [],
    rebuiltAt: new Date().toISOString(),
  };
  
  const changesDir = path.join(process.cwd(), 'openspec', 'changes');
  if (!fs.existsSync(changesDir)) {
    logEvent('rebuild_complete', { changes: 0, reason: 'no_changes_dir' });
    writeJson(STATE_FILE, state);
    return state;
  }

  const changeIds = fs.readdirSync(changesDir).filter(f => {
    const p = path.join(changesDir, f);
    return fs.statSync(p).isDirectory() && !f.startsWith('.');
  });

  changeIds.forEach(id => processChangeDirectory(id, changesDir, config, state));

  logEvent('rebuild_complete', { 
    changes: Object.keys(state.changes).length,
    locks: Object.keys(state.locks).length,
    warnings: state.warnings.length,
  });
  
  writeJson(STATE_FILE, state);
  return state;
}

/**
 * Find semantic conflicts using Identifier-Action Matrix
 * Returns conflicts where different changes apply incompatible actions to same identifier
 */
function findConflicts() {
  const state = readJson(STATE_FILE);
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
        logEvent('conflict_detected', { identifier: ident, changes: Array.from(uniqueIds) });
      }
    }
  }
  
  return conflicts;
}

/**
 * Get overlapping files (files modified by multiple changes)
 */
function getOverlaps() {
  const state = readJson(STATE_FILE);
  const overlaps = [];
  for (const [file, ids] of Object.entries(state.locks || {})) {
    if (ids.length > 1) {
      overlaps.push({ file, owners: ids, count: ids.length });
    }
  }
  // Sort by count (most contentious first)
  overlaps.sort((a, b) => b.count - a.count);
  return overlaps;
}

/**
 * Create a 3-line context anchor for a file:line
 * Used for detecting task drift when code shifts
 */
function getHunkAnchor(filePath, lineNum) {
  const absPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) throw new Error(`File not found: ${filePath}`);
  
  const content = fs.readFileSync(absPath, 'utf8').split('\n');
  const target = content[lineNum - 1] || '';
  const preLines = content.slice(Math.max(0, lineNum - 4), lineNum - 1);
  const postLines = content.slice(lineNum, lineNum + 3);
  const hash = crypto.createHash('sha256').update(target.trim()).digest('hex');
  
  return { 
    filePath, 
    lineNum, 
    hash, 
    pre: preLines.join('\n'), 
    preCount: preLines.length,
    post: postLines.join('\n'), 
    postCount: postLines.length,
    target: target.trim(),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Verify an anchor against current code state
 * Returns: STABLE (unchanged), MOVED (found at new location), AMBIGUOUS (multiple matches), DRIFTED (not found), LOST (file missing)
 */
function verifyAnchor(anchor) {
  const absPath = path.resolve(process.cwd(), anchor.filePath);
  if (!fs.existsSync(absPath)) {
    return { status: 'LOST', reason: 'File missing' };
  }
  
  const content = fs.readFileSync(absPath, 'utf8').split('\n');
  const currentLine = content[anchor.lineNum - 1] || '';
  
  // Direct match at original location
  if (crypto.createHash('sha256').update(currentLine.trim()).digest('hex') === anchor.hash) {
    return { status: 'STABLE', line: anchor.lineNum };
  }
  
  // Fuzzy search within +/- 50 lines
  const searchRange = 50;
  const start = Math.max(0, anchor.lineNum - searchRange);
  const end = Math.min(content.length, anchor.lineNum + searchRange);
  const matches = [];
  
  for (let i = start; i < end; i++) {
    if (crypto.createHash('sha256').update(content[i].trim()).digest('hex') === anchor.hash) {
      // Check context matches
      const preMatch = content.slice(Math.max(0, i - anchor.preCount), i).join('\n') === anchor.pre;
      const postMatch = content.slice(i + 1, i + 1 + anchor.postCount).join('\n') === anchor.post;
      const score = (preMatch ? 1 : 0) + (postMatch ? 1 : 0);
      matches.push({ line: i + 1, score, preMatch, postMatch });
    }
  }
  
  // Filter to best matches (both context lines match)
  const perfectMatches = matches.filter(m => m.score === 2);
  if (perfectMatches.length === 1) {
    return { status: 'MOVED', line: perfectMatches[0].line, shift: perfectMatches[0].line - anchor.lineNum };
  }
  
  if (perfectMatches.length > 1) {
    return { status: 'AMBIGUOUS', lines: perfectMatches.map(m => m.line) };
  }
  
  // Fall back to partial matches
  if (matches.length === 1) {
    return { status: 'MOVED', line: matches[0].line, shift: matches[0].line - anchor.lineNum, confidence: 'partial' };
  }
  
  if (matches.length > 1) {
    return { status: 'AMBIGUOUS', lines: matches.map(m => m.line), confidence: 'partial' };
  }
  
  return { status: 'DRIFTED', reason: 'Code not found in search range' };
}

/**
 * Check for dependency cycles using DFS
 * Returns list of change IDs involved in cycles
 */
function checkCycles() {
  const state = readJson(STATE_FILE);
  const adj = {};
  const visited = new Set();
  const recStack = new Set();
  const cyclePaths = [];
  
  // Build adjacency list from "depends on" in requirement titles
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
  
  if (cyclePaths.length > 0) {
    logEvent('cycles_detected', { count: cyclePaths.length });
  }
  
  return cyclePaths;
}

/**
 * Compute blocked tasks based on file locks
 * A task is "blocked" if its change wants to modify a file locked by another change
 */
function getBlockedTasks() {
  const state = readJson(STATE_FILE);
  const blocked = [];
  
  // For each change, check if any of its files are locked by another change with higher priority
  // Priority is determined by: changes with more completed tasks have higher priority
  const changeIds = Object.keys(state.changes || {});
  
  changeIds.forEach(changeId => {
    const change = state.changes[changeId];
    change.files.forEach(file => {
      const owners = state.locks[file] || [];
      // If this file is owned by multiple changes, mark tasks as blocked
      if (owners.length > 1) {
        const otherOwners = owners.filter(o => o !== changeId);
        blocked.push({
          changeId,
          file,
          blockedBy: otherOwners,
          reason: 'Resource contention - file is locked by other changes',
        });
      }
    });
  });
  
  return blocked;
}

/**
 * Generate a dependency visualization (simple ASCII graph)
 */
function visualizeDependencies() {
  const state = readJson(STATE_FILE);
  const deps = {};
  
  // Build dependency map
  for (const [id, reqs] of Object.entries(state.requirements || {})) {
    deps[id] = [];
    reqs.forEach(req => {
      const depMatch = req.title.match(/depends on ([a-zA-Z0-9_-]+)/i);
      if (depMatch && state.changes[depMatch[1]]) {
        deps[id].push(depMatch[1]);
      }
    });
  }
  
  const lines = [];
  lines.push('DEPENDENCY GRAPH');
  lines.push('================');
  
  for (const [id, dependencies] of Object.entries(deps)) {
    if (dependencies.length === 0) {
      lines.push(`${id} (no dependencies)`);
    } else {
      lines.push(`${id}`);
      dependencies.forEach((dep, i) => {
        const isLast = i === dependencies.length - 1;
        lines.push(`  ${isLast ? '└' : '├'}── depends on: ${dep}`);
      });
    }
  }
  
  return lines.join('\n');
}

/**
 * Render the HOT FILES section showing file overlaps between changes.
 * @param {Array} overlaps - Array of overlap objects with file, owners, count
 * @param {Object} config - Configuration with maxOverlaps limit
 */
function renderHotFilesSection(overlaps, config) {
  console.log('HOT FILES (Overlaps)');
  console.log('------------------------------------------------------------');
  if (overlaps.length === 0) {
    console.log('None detected.');
    return;
  }
  const truncatedOverlaps = overlaps.slice(0, config.maxOverlaps);
  truncatedOverlaps.forEach(o => {
    console.log(`! ${o.file} : Modified by ${o.owners.join(', ')}`);
  });
  if (overlaps.length > config.maxOverlaps) {
    console.log(`\n... and ${overlaps.length - config.maxOverlaps} more overlaps.`);
    console.log(`> Total: ${overlaps.length} overlapping files. Use --filter to narrow.`);
  }
}

/**
 * Render the SEMANTIC CONFLICTS section showing identifier conflicts.
 * @param {Array} conflicts - Array of conflict objects with identifier and usage
 * @param {Object} config - Configuration with maxConflicts limit
 */
function renderConflictsSection(conflicts, config) {
  console.log('\nSEMANTIC CONFLICTS');
  console.log('------------------------------------------------------------');
  if (conflicts.length === 0) {
    console.log('None detected.');
    return;
  }
  const truncatedConflicts = conflicts.slice(0, config.maxConflicts);
  truncatedConflicts.forEach(c => {
    console.log(`? ${c.identifier} :`);
    c.usage.forEach(u => console.log(`  - ${u.id} (${u.action}): ${u.title}`));
  });
  if (conflicts.length > config.maxConflicts) {
    console.log(`\n... and ${conflicts.length - config.maxConflicts} more conflicts.`);
    console.log(`> Total: ${conflicts.length} conflicts. Use --filter to narrow.`);
  }
}

/**
 * Render the DEPENDENCIES & DRIFT section showing dependency cycles.
 * @param {Array} cycles - Array of cycle paths (each is an array of change IDs)
 */
function renderDependenciesSection(cycles) {
  console.log('\nDEPENDENCIES & DRIFT');
  console.log('------------------------------------------------------------');
  if (cycles.length > 0) {
    cycles.forEach((cycle, i) => {
      console.log(`X CYCLE ${i + 1}: ${cycle.join(' -> ')} (BLOCKING)`);
    });
  } else {
    console.log('No dependency cycles detected.');
  }
}

/**
 * Render the WARNINGS section if there are any warnings.
 * @param {Array} warnings - Array of warning objects with type and message
 */
function renderWarningsSection(warnings) {
  if (!warnings || warnings.length === 0) {
    return;
  }
  console.log('\nWARNINGS');
  console.log('------------------------------------------------------------');
  warnings.forEach(w => {
    console.log(`⚠ [${w.type}] ${w.message}`);
  });
}

/**
 * Render the SUGGESTED SEQUENCE section with recommendations.
 * @param {Array} cycles - Dependency cycles (if any)
 * @param {Array} overlaps - File overlaps between changes
 */
function renderSuggestedSequence(cycles, overlaps) {
  console.log('\nSUGGESTED SEQUENCE');
  console.log('------------------------------------------------------------');
  if (cycles.length > 0) {
    console.log('> RESOLVE DEPENDENCY CYCLES BEFORE PROCEEDING');
    console.log('> Break the cycle by removing or reordering dependencies');
  } else if (overlaps.length > 0) {
    console.log('1. Coordinate work on hot files to avoid merge conflicts.');
    console.log('2. Consider sequential implementation for overlapping changes.');
    console.log('3. Follow implicit dependencies from spec requirements.');
  } else {
    console.log('1. Changes can proceed in parallel (no overlaps detected).');
    console.log('2. Monitor for new conflicts as implementation progresses.');
  }
}

/**
 * Generate coordination report with truncation for large outputs
 */
function generateReport() {
  const config = loadConfig();
  const state = readJson(STATE_FILE);
  const conflicts = findConflicts();
  const cycles = checkCycles();
  const overlaps = getOverlaps();
  
  const changeCount = Object.keys(state.changes || {}).length;
  
  // Edge case: No changes
  if (changeCount === 0) {
    console.log('============================================================');
    console.log('                COORDINATION DASHBOARD');
    console.log('============================================================\n');
    console.log('No active changes to coordinate.\n');
    console.log('RECOMMENDATION:');
    console.log('> Run `/openspec-proposal` to create a new change\n');
    console.log('============================================================');
    return { status: 'empty', changes: 0 };
  }
  
  // Edge case: Single change
  if (changeCount === 1) {
    const id = Object.keys(state.changes)[0];
    const change = state.changes[id];
    console.log('============================================================');
    console.log('                COORDINATION DASHBOARD');
    console.log('============================================================\n');
    console.log('Only one active change found - coordination not needed.\n');
    console.log(`ACTIVE CHANGE: ${id}`);
    console.log(`  Files affected: ${change.files.length}`);
    if (change.quotaExceeded) {
      console.log(`  ⚠ Quota exceeded (${change.totalFiles} files, limit ${config.lockQuota})`);
    }
    console.log('\nRECOMMENDATION:');
    console.log('> Check back when multiple changes are active\n');
    console.log('============================================================');
    return { status: 'single', changes: 1 };
  }
  
  // Normal report with multiple changes
  console.log('============================================================');
  console.log('                COORDINATION DASHBOARD');
  console.log('============================================================\n');
  
  renderHotFilesSection(overlaps, config);
  renderConflictsSection(conflicts, config);
  renderDependenciesSection(cycles);
  renderWarningsSection(state.warnings);
  renderSuggestedSequence(cycles, overlaps);
  
  console.log('\n============================================================');
  
  return {
    status: 'ok',
    changes: changeCount,
    overlaps: overlaps.length,
    conflicts: conflicts.length,
    cycles: cycles.length,
  };
}

// CLI entry point
const command = process.argv[2];
const args = process.argv.slice(3);

try {
  switch (command) {
    case 'rebuild':
      const rebuilt = rebuildState();
      console.log(JSON.stringify({ 
        success: true, 
        changes: Object.keys(rebuilt.changes).length,
        warnings: rebuilt.warnings.length,
      }));
      break;
      
    case 'show':
      console.log(JSON.stringify(readJson(STATE_FILE), null, 2));
      break;
      
    case 'overlaps':
      console.log(JSON.stringify(getOverlaps(), null, 2));
      break;
      
    case 'conflicts':
      console.log(JSON.stringify(findConflicts(), null, 2));
      break;
      
    case 'cycles':
      console.log(JSON.stringify(checkCycles(), null, 2));
      break;
      
    case 'anchor-create':
      if (args.length < 2) {
        console.error('Usage: coordination.js anchor-create <file> <line>');
        process.exit(1);
      }
      console.log(JSON.stringify(getHunkAnchor(args[0], parseInt(args[1])), null, 2));
      break;
      
    case 'anchor-verify':
      if (args.length < 1) {
        console.error('Usage: coordination.js anchor-verify <anchor-json>');
        process.exit(1);
      }
      console.log(JSON.stringify(verifyAnchor(JSON.parse(args[0])), null, 2));
      break;
      
    case 'report':
      generateReport();
      break;
      
    case 'blocked':
      console.log(JSON.stringify(getBlockedTasks(), null, 2));
      break;
      
    case 'deps':
    case 'dependencies':
      console.log(visualizeDependencies());
      break;
      
    case 'help':
    case '--help':
    case '-h':
      console.log(`OpenSpec Coordination Script

Commands:
  rebuild        Rebuild coordination state from proposal files
  show           Display current coordination state as JSON
  overlaps       List files modified by multiple changes
  conflicts      Detect semantic conflicts in requirements
  cycles         Check for dependency cycles (DAG validation)
  blocked        Show tasks blocked by resource contention
  deps           Visualize change dependencies as ASCII graph
  anchor-create  Create a hunk anchor: anchor-create <file> <line>
  anchor-verify  Verify an anchor: anchor-verify '<json>'
  report         Generate full coordination dashboard
  help           Show this help message

Configuration:
  Edit .openspec/coordination-config.json to customize:
  - lockQuota: Max files per change (default: 20)
  - llmTimeout: Timeout for LLM checks in ms (default: 60000)
  - maxOverlaps: Max overlaps in report (default: 50)
  - maxConflicts: Max conflicts in report (default: 20)
`);
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "coordination.js help" for usage.');
      process.exit(1);
  }
} catch (e) {
  logEvent('command_error', { command, error: e.message });
  console.error(`Error: ${e.message}`);
  process.exit(1);
}
