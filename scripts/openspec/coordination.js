const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const METADATA_DIR = path.join(process.cwd(), '.openspec');
const STATE_FILE = path.join(METADATA_DIR, 'coordination.json');
const ANCHOR_FILE = path.join(METADATA_DIR, 'anchors.json');
const CHANGE_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const LOCK_QUOTA = 20;

function ensureMetadataDir() {
  if (!fs.existsSync(METADATA_DIR)) {
    fs.mkdirSync(METADATA_DIR, { recursive: true });
  }
}

function readJson(file, def = {}) {
  if (!fs.existsSync(file)) return def;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return def; }
}

function writeJson(file, data) {
  ensureMetadataDir();
  const tmpFile = `${file}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2));
  fs.renameSync(tmpFile, STATE_FILE);
}

function validateChangeId(id) {
  if (!CHANGE_ID_REGEX.test(id)) {
    throw new Error(`Invalid change ID: ${id}`);
  }
}

function extractAffectedFiles(content) {
  const files = [];
  const impactMatch = content.match(/Affected code\*\*:\n([\s\S]*?)(?=\n\n|\n#|$)/i);
  if (impactMatch) {
    const lines = impactMatch[1].split('\n');
    lines.forEach(line => {
      const match = line.match(/^\s*-\s*`([^`]+)`/);
      if (match) files.push(match[1]);
    });
  }
  return files;
}

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
        const title = match[1];
        const body = match[2];
        const identifiers = [...body.matchAll(/`([^`]+)`/g)].map(m => m[1]);
        const action = title.split(' ')[0];
        requirements.push({ cap, title, identifiers, action });
      }
    }
  });
  return requirements;
}

function rebuildState() {
  const state = { changes: {}, locks: {}, requirements: {} };
  const changesDir = path.join(process.cwd(), 'openspec', 'changes');
  if (!fs.existsSync(changesDir)) return state;

  const changes = fs.readdirSync(changesDir).filter(f => 
    fs.statSync(path.join(changesDir, f)).isDirectory()
  );

  changes.forEach(id => {
    try {
      validateChangeId(id);
      const proposalPath = path.join(changesDir, id, 'proposal.md');
      if (fs.existsSync(proposalPath)) {
        const content = fs.readFileSync(proposalPath, 'utf8');
        const files = extractAffectedFiles(content);
        const activeFiles = files.slice(0, LOCK_QUOTA);
        state.changes[id] = { files: activeFiles, truncated: files.length > LOCK_QUOTA };
        activeFiles.forEach(file => {
          if (!state.locks[file]) state.locks[file] = [];
          state.locks[file].push(id);
        });
        state.requirements[id] = extractRequirements(id);
      }
    } catch (e) {}
  });

  writeJson(STATE_FILE, state);
  return state;
}

function findConflicts() {
  const state = readJson(STATE_FILE);
  const conflicts = [];
  const idMap = {};
  for (const [id, reqs] of Object.entries(state.requirements)) {
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
      if (uniqueIds.size > 1) conflicts.push({ identifier: ident, usage });
    }
  }
  return conflicts;
}

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
    target: target.trim() 
  };
}

function verifyAnchor(anchor) {
  const absPath = path.resolve(process.cwd(), anchor.filePath);
  if (!fs.existsSync(absPath)) return { status: 'LOST', reason: 'File missing' };
  const content = fs.readFileSync(absPath, 'utf8').split('\n');
  const currentLine = content[anchor.lineNum - 1] || '';
  if (crypto.createHash('sha256').update(currentLine.trim()).digest('hex') === anchor.hash) {
    return { status: 'STABLE', line: anchor.lineNum };
  }
  const searchRange = 50;
  const start = Math.max(0, anchor.lineNum - searchRange);
  const end = Math.min(content.length, anchor.lineNum + searchRange);
  const matches = [];
  for (let i = start; i < end; i++) {
    if (crypto.createHash('sha256').update(content[i].trim()).digest('hex') === anchor.hash) {
      const preMatch = content.slice(Math.max(0, i - anchor.preCount), i).join('\n') === anchor.pre;
      const postMatch = content.slice(i + 1, i + 1 + anchor.postCount).join('\n') === anchor.post;
      if (preMatch && postMatch) matches.push(i + 1);
    }
  }
  if (matches.length === 1) return { status: 'MOVED', line: matches[0] };
  if (matches.length > 1) return { status: 'AMBIGUOUS', lines: matches };
  return { status: 'DRIFTED' };
}

function checkCycles() {
  const state = readJson(STATE_FILE);
  const adj = {};
  const visited = new Set();
  const recStack = new Set();
  
  for (const [id, reqs] of Object.entries(state.requirements)) {
    adj[id] = [];
    reqs.forEach(req => {
      const depMatch = req.title.match(/depends on ([a-zA-Z0-9_-]+)/i);
      if (depMatch && state.changes[depMatch[1]]) {
        adj[id].push(depMatch[1]);
      }
    });
  }

  function isCyclic(v) {
    if (recStack.has(v)) return true;
    if (visited.has(v)) return false;
    visited.add(v);
    recStack.add(v);
    for (const neighbor of (adj[v] || [])) {
      if (isCyclic(neighbor)) return true;
    }
    recStack.delete(v);
    return false;
  }

  const cycles = [];
  for (const v in adj) {
    if (isCyclic(v)) cycles.push(v);
  }
  return cycles;
}

const command = process.argv[2];
const args = process.argv.slice(3);

try {
  switch (command) {
    case 'rebuild':
      rebuildState();
      break;
    case 'show':
      console.log(JSON.stringify(readJson(STATE_FILE), null, 2));
      break;
    case 'overlaps': {
      const state = readJson(STATE_FILE);
      const overlaps = [];
      for (const [file, ids] of Object.entries(state.locks)) {
        if (ids.length > 1) overlaps.push({ file, owners: ids });
      }
      console.log(JSON.stringify(overlaps, null, 2));
      break;
    }
    case 'conflicts':
      console.log(JSON.stringify(findConflicts(), null, 2));
      break;
    case 'cycles':
      console.log(JSON.stringify(checkCycles(), null, 2));
      break;
    case 'anchor-create':
      console.log(JSON.stringify(getHunkAnchor(args[0], parseInt(args[1])), null, 2));
      break;
    case 'anchor-verify':
      console.log(JSON.stringify(verifyAnchor(JSON.parse(args[0])), null, 2));
      break;
    case 'report': {
      const state = readJson(STATE_FILE);
      const conflicts = findConflicts();
      const cycles = checkCycles();
      const overlaps = [];
      for (const [file, ids] of Object.entries(state.locks)) {
        if (ids.length > 1) overlaps.push({ file, owners: ids });
      }
      
      console.log('============================================================');
      console.log('                COORDINATION DASHBOARD');
      console.log('============================================================\n');
      
      console.log('HOT FILES (Overlaps)');
      console.log('------------------------------------------------------------');
      if (overlaps.length === 0) console.log('None detected.');
      overlaps.forEach(o => console.log(`! ${o.file} : Modified by ${o.owners.join(', ')}`));
      
      console.log('\nSEMANTIC CONFLICTS');
      console.log('------------------------------------------------------------');
      if (conflicts.length === 0) console.log('None detected.');
      conflicts.forEach(c => {
        console.log(`? ${c.identifier} :`);
        c.usage.forEach(u => console.log(`  - ${u.id} (${u.action}): ${u.title}`));
      });
      
      console.log('\nDEPENDENCIES & DRIFT');
      console.log('------------------------------------------------------------');
      if (cycles.length > 0) {
        console.log(`X CYCLE DETECTED: ${cycles.join(' -> ')} -> ${cycles[0]} (BLOCKING)`);
      } else {
        console.log('No dependency cycles.');
      }
      
      console.log('\nSUGGESTED SEQUENCE');
      console.log('------------------------------------------------------------');
      if (cycles.length > 0) {
        console.log('> RESOLVE CYCLES BEFORE PROCEEDING');
      } else {
        console.log('1. All agents: check overlaps before editing hot files.');
        console.log('2. Follow implicit dependencies from spec requirements.');
      }
      console.log('\n============================================================');
      break;
    }
    default:
      process.exit(1);
  }
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
