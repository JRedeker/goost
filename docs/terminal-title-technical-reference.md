# Terminal Title Update Technical Reference

This document explains how Goost updates Windows Terminal tab titles when running inside tmux in WSL.

## The Problem

OpenCode plugins run in a context where:
1. **stdout is piped** - OpenCode captures tool output, so `process.stdout.write()` doesn't reach the terminal
2. **`/dev/tty` is inaccessible** - The plugin process doesn't have a controlling terminal
3. **tmux intercepts escape sequences** - Standard OSC sequences are consumed by tmux, not passed to Windows Terminal

## The Solution

We use a three-part approach:

### 1. Get the Pane's Actual TTY

```typescript
const result = execSync("tmux display-message -p '#{pane_tty}'")
// Returns: /dev/pts/6 (or similar)
```

This gives us the actual pseudo-terminal device that tmux is using.

### 2. Use DCS Passthrough

tmux requires escape sequences to be wrapped in DCS (Device Control String) passthrough format:

```
\x1bPtmux;\x1b<escaped_sequence>\x1b\\
```

Where `<escaped_sequence>` has all ESC (`\x1b`) characters doubled.

For OSC 0 (set title):
- Original: `\x1b]0;TITLE\x07`
- Passthrough: `\x1bPtmux;\x1b\x1b]0;TITLE\x07\x1b\\`

### 3. Write Directly to Pane TTY

```typescript
const sequence = `\x1bPtmux;\x1b\x1b]0;${title}\x07\x1b\\`
const fd = fs.openSync("/dev/pts/6", "w")
fs.writeSync(fd, sequence)
fs.closeSync(fd)
```

This bypasses both OpenCode's stdout capture and tmux's sequence interception.

## Required tmux Configuration

These settings must be in `~/.tmux.conf`:

```bash
# Allow escape sequences to pass through to outer terminal
set -g allow-passthrough on

# Propagate pane title to terminal
set -g set-titles on
set -g set-titles-string '#{pane_title}'

# No ESC key delay (helps with Ctrl+C)
set -g escape-time 0
```

## What Doesn't Work

| Approach | Why It Fails |
|----------|--------------|
| `process.stdout.write(osc)` | Stdout piped by OpenCode TUI |
| `fs.writeSync("/dev/tty", osc)` | No controlling TTY in plugin context |
| `tmux rename-window` alone | Only updates tmux status bar, not Windows Terminal |
| OSC without DCS passthrough | tmux intercepts and doesn't forward |

## Escape Sequence Reference

| Sequence | Purpose |
|----------|---------|
| `\x1b]0;TITLE\x07` | OSC 0 - Set window title |
| `\x1bPtmux;...\x1b\\` | DCS passthrough wrapper for tmux |
| `\x1b\x1b` | Escaped ESC inside passthrough |

## Testing

To manually test title updates:

```bash
# Get pane TTY
PANE_TTY=$(tmux display-message -p '#{pane_tty}')

# Send title with DCS passthrough
printf '\033Ptmux;\033\033]0;Test Title\007\033\\' > "$PANE_TTY"
```

The Windows Terminal tab should update immediately.

## Implementation

See `plugin/terminal.ts`:
- `getTmuxPaneTty()` - Gets the pane TTY path
- `setTitleViaPaneTty()` - Sends DCS passthrough to pane TTY
- `setTitleViaTmuxRename()` - Updates tmux status bar (secondary)
