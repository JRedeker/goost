# Goost Installation & Update Guide

This guide is for AI agents helping users install or update Goost. Follow these steps when a user asks to "install goost", "update goost", or "fix goost setup".

## Quick Start (Recommended)

The easiest way to install or update is to run the automated script:

```bash
# Clone if not already present
if [ ! -d ~/dev/oc-plugins/goost ]; then
  mkdir -p ~/dev/oc-plugins
  git clone https://github.com/JRedeker/goost.git ~/dev/oc-plugins/goost
fi

# Run the install/update script
~/dev/oc-plugins/goost/install.sh
```

This script handles:
- Git updates (pulling latest changes)
- Dependency installation (`npm install`)
- Plugin build verification
- Configuration updates (`opencode.json`)
- `tmux` configuration for tab titles

---

## Manual Installation Steps

If the user prefers manual steps or the script fails:

### Step 1: Locate Goost

First, determine where Goost is located:

```bash
# Check if we're already in the Goost directory
[ -f goost_instructions.md ] && echo "IN_GOOST_DIR: $(pwd)" || echo "NOT_IN_GOOST_DIR"

# Common locations to check
ls -d ~/dev/oc-plugins/goost 2>/dev/null && echo "FOUND: ~/dev/oc-plugins/goost"
ls -d ~/goost 2>/dev/null && echo "FOUND: ~/goost"
ls -d ~/.local/share/goost 2>/dev/null && echo "FOUND: ~/.local/share/goost"
```

If Goost is not found, clone it:

```bash
git clone https://github.com/JRedeker/goost.git ~/dev/oc-plugins/goost
```

Store the **absolute path** (not using `~`) as `GOOST_PATH` for subsequent steps.

### Step 2: Install/Update Plugin Dependencies

```bash
cd $GOOST_PATH

# Pull latest changes if updating
git pull

cd plugin

# Use bun if available, otherwise npm
if command -v bun &> /dev/null; then
    bun install
    bun run check
elif command -v npm &> /dev/null; then
    npm install
    npm run check
else
    echo "ERROR: Neither bun nor npm found. Install Node.js 18+ or Bun first."
    exit 1
fi
```

### Step 3: Configure opencode.json

The critical step is updating `~/.config/opencode/opencode.json` with two entries:

1. **instructions**: Path to `goost_instructions.md`
2. **plugin** (or plugins): Path to the `plugin` directory

**If no opencode.json exists**, create it:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": ["/absolute/path/to/goost/goost_instructions.md"],
  "plugin": ["/absolute/path/to/goost/plugin"]
}
```

**If opencode.json already exists**, merge the Goost entries:

1. Read the existing file
2. Add the goost_instructions.md path to the `instructions` array (create if missing)
3. Add the plugin path to the `plugin` array (create if missing)
4. Preserve all other existing configuration

**Important:**
- Use **absolute paths** (e.g., `/home/user/dev/goost`, not `~/dev/goost`)
- Check for duplicates before adding (grep for "goost" in the file)

### Step 4: Install Slash Commands

Copy slash commands to make them globally available:

```bash
mkdir -p ~/.config/opencode/command
cp $GOOST_PATH/.opencode/command/*.md ~/.config/opencode/command/
```

This installs:
- `/contract` - Interactive contract creation
- `/contract-quick` - Quick contract from description
- `/openspec-proposal` - Create change proposals
- `/openspec-clarify` - Socratic questions for requirements (use after proposal)
- `/openspec-research` - Validate architecture via Context7/web (use before prep)
- `/openspec-prep` - Fill gaps in acceptance criteria
- `/openspec-apply` - Implement under contract
- `/openspec-review` - Post-implementation code review
- `/openspec-harden` - Production-readiness analysis
- `/openspec-status` - Project state overview
- `/openspec-roadmap` - Progress dashboard
- `/openspec-audit` - Drift detection
- `/openspec-archive` - Archive completed changes

### Step 5: Install Rules

```bash
mkdir -p ~/.config/opencode/rules
cp $GOOST_PATH/.opencode/rules/*.md ~/.config/opencode/rules/
```

### Step 6: tmux Configuration

For Goost's status indicators (tab titles) to work inside tmux, you need two settings:

1. **allow-passthrough**: Lets OSC escape sequences reach your terminal (for tab colors/titles)
2. **escape-time 0**: Passes ESC key immediately (fixes delay when interrupting commands with Ctrl+C)

Check if user is in tmux:

```bash
[ -n "$TMUX" ] && echo "TMUX_DETECTED" || echo "NOT_IN_TMUX"
```

If in tmux, check current config:

```bash
grep -q "allow-passthrough" ~/.tmux.conf 2>/dev/null && echo "PASSTHROUGH_CONFIGURED" || echo "PASSTHROUGH_MISSING"
grep -q "escape-time" ~/.tmux.conf 2>/dev/null && echo "ESCAPE_TIME_CONFIGURED" || echo "ESCAPE_TIME_MISSING"
```

Add missing settings:

```bash
# If ~/.tmux.conf doesn't exist or is missing settings, add them:
cat >> ~/.tmux.conf << 'EOF'

# Goost plugin support - allow escape sequences to pass through to terminal
set -g allow-passthrough on

# Pass ESC key through immediately without delay (helps with interrupting commands)
set -g escape-time 0
EOF

tmux source-file ~/.tmux.conf  # Reload config
```

#### Recommended: Shell Function for tmux + OpenCode

Add these functions to your `~/.zshrc` or `~/.bashrc` for seamless tmux integration:

```bash
# Wrap opencode in tmux for crash isolation (prevents cascade failures)
oc() {
  local session_name="oc-$(date +%s)-$$"

  if command -v tmux &>/dev/null; then
    tmux new-session -d -s "$session_name" opencode "$@"
    tmux attach-session -t "$session_name"
  else
    echo "tmux not installed - running opencode directly (no isolation)"
    command opencode "$@"
  fi
}

# List all opencode tmux sessions
oc-list() {
  tmux ls 2>/dev/null | grep "^oc-" || echo "No opencode sessions"
}

# Kill all opencode tmux sessions
oc-killall() {
  tmux ls 2>/dev/null | grep "^oc-" | cut -d: -f1 | xargs -r -n1 tmux kill-session -t
  echo "All opencode sessions terminated"
}
```

Then reload your shell: `source ~/.zshrc`

**Usage:**
```bash
oc              # Launch opencode in isolated tmux session
oc -d /path     # Launch with arguments
oc-list         # Show running opencode sessions
oc-killall      # Terminate all opencode sessions
```

**Why use tmux isolation?**
- Crash isolation: If opencode crashes, it doesn't take down your terminal
- Session persistence: Detach with `Ctrl+B D`, reattach later
- Tab titles: Goost status indicators work properly
- ESC handling: With `escape-time 0`, interrupts work immediately

The tab title will update to show contract status:
```
🚀 projectname: Working [2/5]
🌕 projectname: Agent
🌍 projectname: Ready
🎤 projectname: >>> APPROVAL NEEDED <<<
```

#### Alternative: Manual tmux

If you prefer manual control:

```bash
# Start a new tmux session named "opencode"
tmux new-session -s opencode

# Or attach to existing session
tmux attach -t opencode

# Inside tmux, run opencode
opencode
```

**Why escape-time 0 matters:**

Without this setting, tmux waits ~500ms after ESC to see if it's part of an escape sequence. This causes noticeable delay when:
- Pressing ESC in vim mode
- Using Ctrl+C to interrupt running commands
- Any operation that involves the ESC key

With `escape-time 0`, ESC is passed through immediately.

### Step 7: Verify Installation

Run these checks:

```bash
# Check plugin loads
cd $GOOST_PATH/plugin && node -e "require('./index.js')" 2>/dev/null && echo "PLUGIN: OK" || echo "PLUGIN: FAILED"

# Check instructions file
[ -f $GOOST_PATH/goost_instructions.md ] && echo "INSTRUCTIONS: OK" || echo "INSTRUCTIONS: MISSING"

# Check opencode.json has goost
grep -q "goost" ~/.config/opencode/opencode.json 2>/dev/null && echo "CONFIG: OK" || echo "CONFIG: MISSING"
```

## Updating Goost

To update an existing installation:

1.  **Run the install script**: `~/dev/oc-plugins/goost/install.sh`
    *   It automatically detects the git repo and pulls changes.
    *   It updates dependencies and checks the build.
    *   It ensures config and commands are up to date.

2.  **Restart OpenCode**: Updates only take effect after a restart.

## Terminal Compatibility Notes

Inform the user about their terminal's capabilities:

| Terminal | Tab Titles | Notes |
|----------|------------|-------|
| Windows Terminal | Full | Best experience |
| iTerm2 | Full | Works well |
| Ghostty | Full | Works well |
| tmux | Full* | *Requires `allow-passthrough on` and `escape-time 0` |

**Note**: Tab colors have been disabled due to inconsistency across environments. We rely on emojis (🚀, 🌕, 🌍) for status indication.

## Troubleshooting

### "Commands not found"
- Verify commands were copied to `~/.config/opencode/command/`
- Check OpenCode was restarted after installation

### "Tab titles not updating"
- For tmux: verify `allow-passthrough on` is in `~/.tmux.conf`
- Run `GOOST_DEBUG=1 opencode` to see plugin output

### "ESC key has noticeable delay in tmux"
- Add `set -g escape-time 0` to `~/.tmux.conf`
- Reload: `tmux source-file ~/.tmux.conf`
- This fixes delays when interrupting commands or using vim keybindings

### "Plugin not loading"
- Verify absolute path in opencode.json is correct
- Check `npm install` completed without errors
- Run `cd plugin && npm run check` to verify no TypeScript errors
