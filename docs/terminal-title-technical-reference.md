# Terminal Title Update Technical Reference

This document explains how Goost updates Windows Terminal tab titles when running inside tmux in WSL.

## The Problem

OpenCode plugins run in a context where:
1. **stdout is piped** - OpenCode captures tool output, so `process.stdout.write()` doesn't reach the terminal
2. **`/dev/tty` is inaccessible** - The plugin process doesn't have a controlling terminal
3. **tmux manages escape sequences** - Sequences need to be sent to the right place

## The Solution

We use a two-part approach to update both tmux's internal state and the outer terminal:

### 1. Get the Pane's Actual TTY

```typescript
const result = execSync("tmux display-message -p '#{pane_tty}'")
// Returns: /dev/pts/6 (or similar)
```

This gives us the actual pseudo-terminal device that tmux is using for this pane.

### 2. Send OSC Sequence to Pane TTY

Write a simple OSC 0 sequence directly to the pane's TTY:

```typescript
const sequence = `\x1b]0;${title}\x07`
const fd = fs.openSync("/dev/pts/6", "w")
fs.writeSync(fd, sequence)
fs.closeSync(fd)
```

This sets the `pane_title` variable in tmux.

### 3. tmux Forwards to Outer Terminal

With the proper configuration, tmux automatically forwards the `pane_title` to the outer terminal:

```bash
set -g set-titles on
set -g set-titles-string '#{pane_title}'
```

## Why Simple OSC (Not DCS Passthrough)

There are two ways to send escape sequences in tmux:

| Method | Format | What It Does |
|--------|--------|--------------|
| Simple OSC | `\x1b]0;TITLE\x07` | Sets tmux's `pane_title` variable |
| DCS Passthrough | `\x1bPtmux;\x1b\x1b]0;TITLE\x07\x1b\\` | Bypasses tmux, sends directly to outer terminal |

**We use simple OSC** because:
1. It sets the `pane_title` tmux variable
2. tmux then forwards this to the outer terminal via `set-titles-string`
3. The title persists correctly and works with tmux's title management

DCS passthrough is designed for cases where you want to bypass tmux entirely (like querying terminal capabilities). For setting titles that tmux should know about, simple OSC is correct.

## Required tmux Configuration

These settings must be in `~/.tmux.conf`:

```bash
# Forward pane titles to outer terminal
set -g set-titles on
set -g set-titles-string '#{pane_title}'

# Allow passthrough sequences (for other uses)
set -g allow-passthrough on

# No ESC key delay (helps with Ctrl+C)
set -g escape-time 0
```

## What Doesn't Work

| Approach | Why It Fails |
|----------|--------------|
| `process.stdout.write(osc)` | Stdout piped by OpenCode TUI |
| `fs.writeSync("/dev/tty", osc)` | No controlling TTY in plugin context |
| `tmux rename-window` alone | Only updates tmux status bar, not Windows Terminal tab |
| DCS passthrough to pane TTY | Bypasses tmux, doesn't set `pane_title` variable |

## Escape Sequence Reference

| Sequence | Purpose |
|----------|---------|
| `\x1b]0;TITLE\x07` | OSC 0 - Set window/icon title |
| `\x1b]2;TITLE\x07` | OSC 2 - Set window title only |
| `\x1bPtmux;...\x1b\\` | DCS passthrough (bypasses tmux) |

## Testing

To manually test title updates:

```bash
# Get pane TTY
PANE_TTY=$(tmux display-message -p '#{pane_tty}')

# Send simple OSC title sequence
printf '\033]0;Test Title\007' > "$PANE_TTY"

# Verify pane_title was set
tmux display-message -p '#{pane_title}'
# Should output: Test Title
```

The Windows Terminal tab should update immediately if `set-titles` is configured.

## Implementation

See `plugin/terminal.ts`:
- `getTmuxPaneTty()` - Gets the pane TTY path via `tmux display-message`
- `setTitleViaPaneTty()` - Sends simple OSC sequence to pane TTY (sets `pane_title`)
- `setTitleViaTmuxRename()` - Updates tmux status bar window name (secondary)
