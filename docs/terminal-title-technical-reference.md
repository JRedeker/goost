# Terminal Title Update Technical Reference

This document explains how Goost updates Windows Terminal tab titles when running inside tmux in WSL2.

## The Problem

OpenCode plugins run in a context where:
1. **stdout is piped** - OpenCode captures tool output, so `process.stdout.write()` doesn't reach the terminal
2. **`/dev/tty` is inaccessible** - The plugin process doesn't have a controlling terminal
3. **tmux manages escape sequences** - Sequences need to be sent to the right place
4. **Windows Terminal needs direct writes** - tmux's title forwarding is unreliable

## The Solution

We use a multi-strategy approach to update the Windows Terminal tab title:

### Strategy 1: Write to Client TTY (Primary)

The most reliable method for Windows Terminal. Write directly to the tmux client's TTY, which is the outer terminal that Windows Terminal connects to:

```typescript
// Get the client TTY (outer terminal connection)
const clientTty = execSync("tmux display-message -p '#{client_tty}'").toString().trim()
// Returns: /dev/pts/12 (or similar)

// Write OSC sequence directly to it
const sequence = `\x1b]0;${title}\x07`
fs.writeFileSync(clientTty, sequence)  // MUST use writeFileSync, not openSync/writeSync!
```

This bypasses tmux's title handling entirely and writes directly to Windows Terminal.

### Strategy 2: Write to Pane TTY (Backup)

Write to the pane's TTY to set tmux's `pane_title` variable:

```typescript
const paneTty = execSync("tmux display-message -p '#{pane_tty}'").toString().trim()
// Returns: /dev/pts/6 (or similar)

const sequence = `\x1b]0;${title}\x07`
fs.writeFileSync(paneTty, sequence)
```

This sets `pane_title`, which tmux can forward via `set-titles-string`.

### Strategy 3: tmux rename-window (Status Bar)

Update the tmux status bar window name:

```typescript
execSync(`tmux rename-window "${title}"`)
```

This only affects the tmux status bar, not Windows Terminal tab.

## Critical: Use writeFileSync, Not openSync/writeSync

**This is essential for Windows Terminal compatibility.**

```typescript
// WORKS - Windows Terminal tab updates
fs.writeFileSync(clientTty, sequence)

// DOES NOT WORK - sequence sent but Windows Terminal ignores it
const fd = fs.openSync(clientTty, "w")
fs.writeSync(fd, sequence)
fs.closeSync(fd)
```

The low-level open/write/close pattern appears to work (no errors) but Windows Terminal doesn't receive or process the sequence. The atomic `writeFileSync` does work.

## Client TTY vs Pane TTY

| TTY Type | tmux Variable | What It Connects To |
|----------|---------------|---------------------|
| Client TTY | `#{client_tty}` | Outer terminal (Windows Terminal) |
| Pane TTY | `#{pane_tty}` | tmux pane (internal) |

Writing to **client TTY** sends directly to Windows Terminal, bypassing tmux.
Writing to **pane TTY** sets tmux's `pane_title` variable, which tmux may forward.

For reliable Windows Terminal tab updates, use **client TTY**.

## Required tmux Configuration

These settings should be in `~/.tmux.conf`:

```bash
# Forward pane titles to outer terminal (backup method)
set -g set-titles on
set -g set-titles-string '#{pane_title}'

# Allow passthrough sequences
set -g allow-passthrough on

# No ESC key delay (helps with Ctrl+C)
set -g escape-time 0
```

## What Doesn't Work

| Approach | Why It Fails |
|----------|--------------|
| `process.stdout.write(osc)` | Stdout piped by OpenCode TUI |
| `fs.writeSync("/dev/tty", osc)` | No controlling TTY in plugin context |
| `fs.openSync()`/`writeSync()`/`closeSync()` to TTY | Windows Terminal ignores the sequence |
| `tmux rename-window` alone | Only updates tmux status bar, not Windows Terminal tab |
| DCS passthrough to pane TTY | Bypasses tmux, doesn't reliably reach WT |
| Relying on tmux's `set-titles` forwarding | Unreliable for Windows Terminal |

## OpenCode Plugin Configuration

OpenCode requires plugins to be specified as `.ts` files, not directories. Use a symlink:

```bash
# Create symlink in opencode plugin directory
ln -sf /path/to/goost/plugin/index.ts ~/.config/opencode/plugin/goost-status.ts
```

Then in `~/.config/opencode/opencode.json`:
```json
{
  "plugin": [
    "/home/user/.config/opencode/plugin/goost-status.ts"
  ]
}
```

## Testing

### Test from Bash (should always work)
```bash
CLIENT_TTY=$(tmux display-message -p '#{client_tty}')
echo -ne '\033]0;Test Title\007' > "$CLIENT_TTY"
# Windows Terminal tab should update immediately
```

### Test from Node.js
```javascript
const fs = require('fs');
const { execSync } = require('child_process');

const clientTty = execSync("tmux display-message -p '#{client_tty}'", { encoding: 'utf8' }).trim();
fs.writeFileSync(clientTty, '\x1b]0;Node Test\x07');
// Windows Terminal tab should update
```

### Verify Plugin is Loading
```bash
rm -f /tmp/goost-debug.log
opencode run "test"
cat /tmp/goost-debug.log | head -10
# Should show "GOOST TERMINAL MODULE LOADED" and title updates
```

## Implementation

See `plugin/terminal.ts`:
- `getTmuxClientTty()` - Gets the client TTY path (outer terminal)
- `getTmuxPaneTty()` - Gets the pane TTY path (for `pane_title`)
- `setTitleViaClientTty()` - Primary: writes directly to Windows Terminal
- `setTitleViaPaneTty()` - Backup: sets tmux's `pane_title`
- `setTitleViaTmuxRename()` - Updates tmux status bar

## Debugging

Enable debug logging:
```bash
export GOOST_DEBUG=1
opencode
```

Check debug log:
```bash
cat /tmp/goost-debug.log
```

The log shows each title update attempt and whether it succeeded:
```
setTitle: "🚀 Working goost"
isTmux=true
getTmuxClientTty: /dev/pts/12
setTitleViaClientTty: SUCCESS - "🚀 Working goost" via /dev/pts/12
getTmuxPaneTty: /dev/pts/4
setTitleViaPaneTty: SUCCESS - "🚀 Working goost" via /dev/pts/4
setTitleViaTmuxRename: SUCCESS - "🚀 Working goost"
setTitle: clientTty=true, paneTty=true, tmuxRename=true
```
