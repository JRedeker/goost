# Goost Installation Guide

This guide is for AI agents helping users install Goost. Follow these steps when a user asks to "install goost", "set up goost", or "configure goost".

## Prerequisites

- OpenCode CLI installed and working
- Node.js 18+ or Bun runtime
- Git (to clone the repository)

## Installation Steps

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

### Step 2: Install Plugin Dependencies

```bash
cd $GOOST_PATH/plugin

# Use bun if available, otherwise npm
if command -v bun &> /dev/null; then
    bun install
elif command -v npm &> /dev/null; then
    npm install
else
    echo "ERROR: Neither bun nor npm found. Install Node.js 18+ or Bun first."
    exit 1
fi
```

### Step 3: Configure opencode.json

The critical step is updating `~/.config/opencode/opencode.json` with two entries:

1. **instructions**: Path to `goost_instructions.md`
2. **plugins**: Path to the `plugin` directory

**If no opencode.json exists**, create it:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": ["/absolute/path/to/goost/goost_instructions.md"],
  "plugins": ["/absolute/path/to/goost/plugin"]
}
```

**If opencode.json already exists**, merge the Goost entries:

1. Read the existing file
2. Add the goost_instructions.md path to the `instructions` array (create if missing)
3. Add the plugin path to the `plugins` array (create if missing)
4. Preserve all other existing configuration

**Important:**
- Use **absolute paths** (e.g., `/home/user/dev/goost`, not `~/dev/goost`)
- Check for duplicates before adding (grep for "goost" in the file)

Example merge for existing config:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "theme": "opencode",
  "model": "anthropic/claude-sonnet-4-5",
  "instructions": [
    "existing-instructions.md",
    "/home/user/dev/oc-plugins/goost/goost_instructions.md"
  ],
  "plugins": [
    "/home/user/dev/oc-plugins/goost/plugin"
  ]
}
```

### Step 4: Install Slash Commands (Optional but Recommended)

Copy slash commands to make them globally available:

```bash
mkdir -p ~/.config/opencode/command
cp $GOOST_PATH/.opencode/command/*.md ~/.config/opencode/command/
```

This installs:
- `/contract` - Interactive contract creation
- `/contract-quick` - Quick contract from description
- `/openspec-*` - OpenSpec integration commands

### Step 5: Install Rules (Optional)

```bash
mkdir -p ~/.config/opencode/rules
cp $GOOST_PATH/.opencode/rules/*.md ~/.config/opencode/rules/
```

### Step 6: tmux Configuration (If Applicable)

Check if user is in tmux:

```bash
[ -n "$TMUX" ] && echo "TMUX_DETECTED" || echo "NOT_IN_TMUX"
```

If in tmux, tab colors require passthrough. Check current config:

```bash
grep -q "allow-passthrough" ~/.tmux.conf 2>/dev/null && echo "PASSTHROUGH_CONFIGURED" || echo "PASSTHROUGH_MISSING"
```

If missing, add it:

```bash
echo "set -g allow-passthrough on" >> ~/.tmux.conf
tmux source-file ~/.tmux.conf  # Reload config
```

### Step 7: Verify Installation

Run these checks:

```bash
# Check plugin loads
cd $GOOST_PATH/plugin && node -e "require('./index.js')" 2>/dev/null && echo "PLUGIN: OK" || echo "PLUGIN: FAILED"

# Check instructions file
[ -f $GOOST_PATH/goost_instructions.md ] && echo "INSTRUCTIONS: OK" || echo "INSTRUCTIONS: MISSING"

# Check opencode.json has goost
grep -q "goost" ~/.config/opencode/opencode.json 2>/dev/null && echo "CONFIG: OK" || echo "CONFIG: MISSING"

# Check commands installed
ls ~/.config/opencode/command/contract.md 2>/dev/null && echo "COMMANDS: OK" || echo "COMMANDS: NOT INSTALLED (optional)"
```

## Terminal Compatibility Notes

Inform the user about their terminal's capabilities:

| Terminal | Tab Colors | Tab Titles | Notes |
|----------|------------|------------|-------|
| Windows Terminal | Full | Full | Best experience |
| iTerm2 | No | Full | OSC 9;9 not supported |
| Ghostty | Partial | Full | May vary by version |
| Kitty | Partial | Full | May vary by config |
| Alacritty | No | Full | No tab color support |
| tmux | Full* | Full | *Requires `allow-passthrough on` |

Tab colors are visual enhancements only - core contract functionality works everywhere.

## Post-Installation

Tell the user:

1. **Restart OpenCode** (or start a new session) to load the plugin
2. **Test with `/contract`** to verify commands work
3. **Enable debug mode** if issues: `GOOST_DEBUG=1 opencode`

## Troubleshooting

### "Commands not found"
- Verify commands were copied to `~/.config/opencode/command/`
- Check OpenCode was restarted after installation

### "Tab colors not working"
- Check terminal compatibility table above
- For tmux: verify `allow-passthrough on` is in `~/.tmux.conf`
- Run `GOOST_DEBUG=1 opencode` to see plugin output

### "Plugin not loading"
- Verify absolute path in opencode.json is correct
- Check `npm install` completed without errors
- Run `cd plugin && npm run check` to verify no TypeScript errors

### "Contract status not appearing in responses"
- Verify `goost_instructions.md` path is in the `instructions` array
- Path must be absolute, not relative
- Restart OpenCode to reload instructions

## Quick Reference

After installation, available commands:

| Command | Purpose |
|---------|---------|
| `/contract` | Create formal contract with success criteria |
| `/contract-quick <task>` | Quick contract from task description |
| `/openspec-apply <id>` | Implement OpenSpec change under contract |
| `/openspec-prep <id>` | Prepare spec with missing details |
| `/openspec-review <id>` | Post-implementation code review |
| `/openspec-harden <id>` | Production-readiness analysis |
| `/openspec-audit` | Project-wide spec/code drift detection |
| `/openspec-roadmap` | Progress dashboard |

## Status Indicators

After installation, terminal tab will show:

| Icon | Color | Meaning |
|------|-------|---------|
| 🚀 | Red | Active work |
| 🌕 | Blue | Waiting for sub-agents |
| 🌍 | Green | Ready/complete |
| 🔄 | Orange | Doom loop detected |
| 🎤 | Magenta | Needs user approval |
