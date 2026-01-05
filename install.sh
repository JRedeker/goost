#!/bin/bash
# Goost Installation & Update Script
# Installs/Updates contract-based persistence for OpenCode
#
# Usage: ./install.sh
#
# For AI-assisted installation, start OpenCode in the Goost directory
# and ask: "Install Goost for me" - the agent will follow INSTALL.md

set -e

GOOST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENCODE_CONFIG_DIR="${HOME}/.config/opencode"
OPENCODE_CONFIG="${OPENCODE_CONFIG_DIR}/opencode.json"
TMUX_CONFIG="${HOME}/.tmux.conf"

echo "🚀 Installing/Updating Goost..."

# 0. Git Update (if applicable)
if [ -d "${GOOST_DIR}/.git" ]; then
    echo "⬇️  Pulling latest changes..."
    cd "${GOOST_DIR}"
    git pull --quiet || echo "⚠️  Git pull failed (local changes?)"
else
    echo "ℹ️  Not a git repository (skipping pull)"
fi

# 1. Ensure opencode config directory exists
mkdir -p "${OPENCODE_CONFIG_DIR}"

# 2. Copy slash commands to global command directory
echo "📝 Installing slash commands..."
mkdir -p "${OPENCODE_CONFIG_DIR}/command"
cp "${GOOST_DIR}/.opencode/command/"*.md "${OPENCODE_CONFIG_DIR}/command/"

# 3. Copy rules to global rules directory  
echo "📋 Installing rules..."
mkdir -p "${OPENCODE_CONFIG_DIR}/rules"
cp "${GOOST_DIR}/.opencode/rules/"*.md "${OPENCODE_CONFIG_DIR}/rules/"

# 4. Install core rules.yaml if not present or prompt to update
# This provides the P01-P23 rules referenced by /openspec-prep
if [ ! -f "${OPENCODE_CONFIG_DIR}/rules.yaml" ]; then
    echo "📜 Installing core rules.yaml..."
    cp "${GOOST_DIR}/rules.yaml" "${OPENCODE_CONFIG_DIR}/rules.yaml"
    echo "✅ Installed rules.yaml"
else
    echo "ℹ️  rules.yaml exists (skipping overwrite to preserve custom rules)"
fi

# 5. Install plugin dependencies and verify build
echo "📦 Installing plugin dependencies..."
cd "${GOOST_DIR}/plugin"

# Detect package manager
PM="npm"
if command -v bun &> /dev/null; then
    PM="bun"
fi

$PM install

echo "🔍 Verifying plugin build..."
$PM run check || { echo "❌ Plugin verification failed"; exit 1; }

cd "${GOOST_DIR}"

# 6. Automate opencode.json update using Node.js
# This safely edits the JSON without breaking structure
if [ -f "${OPENCODE_CONFIG}" ]; then
    echo "🔧 Updating opencode.json configuration..."
    
    node <<EOF
const fs = require('fs');
const configPath = '${OPENCODE_CONFIG}';
const goostDir = '${GOOST_DIR}';
const instructionsPath = \`\${goostDir}/goost_instructions.md\`;
const pluginPath = \`\${goostDir}/plugin\`;

try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    let changed = false;

    // Ensure instructions array exists
    if (!config.instructions) config.instructions = [];
    
    // Add instruction if missing
    if (!config.instructions.includes(instructionsPath)) {
        config.instructions.push(instructionsPath);
        console.log('  + Added goost_instructions.md');
        changed = true;
    }

    // Ensure plugin array exists
    if (!config.plugin && !config.plugins) config.plugin = [];
    const plugins = config.plugin || config.plugins; // handle both keys

    // Add plugin if missing
    if (!plugins.includes(pluginPath)) {
        plugins.push(pluginPath);
        console.log('  + Added Goost plugin path');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('✅ opencode.json updated successfully');
    } else {
        console.log('✅ opencode.json already up to date');
    }
} catch (e) {
    console.error('❌ Failed to update opencode.json:', e.message);
    process.exit(1);
}
EOF
else
    echo "⚠️  No opencode.json found at ${OPENCODE_CONFIG}. Creating basic config..."
    # Create basic config if missing
    cat > "${OPENCODE_CONFIG}" <<EOF
{
  "\$schema": "https://opencode.ai/config.json",
  "instructions": ["${GOOST_DIR}/goost_instructions.md"],
  "plugin": ["${GOOST_DIR}/plugin"]
}
EOF
    echo "✅ Created new opencode.json"
fi

# 7. Check/Configure tmux for tab titles
# Check for tmux usage or config existence
if [ -n "$TMUX" ] || [ -f "$TMUX_CONFIG" ]; then
    echo "🖥️  Checking tmux configuration..."
    
    if [ -f "$TMUX_CONFIG" ]; then
        if grep -q "allow-passthrough" "$TMUX_CONFIG"; then
            echo "✅ tmux configured (allow-passthrough detected)"
        else
            echo "⚠️  tmux config missing 'allow-passthrough'"
            echo "   Adding 'set -g allow-passthrough on' to $TMUX_CONFIG..."
            echo "" >> "$TMUX_CONFIG"
            echo "# Goost plugin support - allow escape sequences" >> "$TMUX_CONFIG"
            echo "set -g allow-passthrough on" >> "$TMUX_CONFIG"
            
            # Reload if inside tmux
            if [ -n "$TMUX" ]; then
                tmux source-file "$TMUX_CONFIG" && echo "✅ tmux config reloaded"
            fi
        fi
    else
        echo "ℹ️  Creating $TMUX_CONFIG with passthrough support..."
        echo "set -g allow-passthrough on" > "$TMUX_CONFIG"
    fi
fi

echo ""
echo "✅ Goost installation/update complete!"
echo ""
echo "Available commands:"
echo "  /contract          - Interactive contract creation"
echo "  /contract-quick    - Quick contract from task description"
echo "  /openspec-apply    - Implement OpenSpec change under contract"
echo "  /openspec-prep     - Pre-implementation spec validation with gap analysis"
echo "  /openspec-review   - Post-implementation code review (correctness, security)"
echo "  /openspec-harden   - Post-implementation hardening analysis"
echo "  /openspec-roadmap  - Display tiered progress dashboard"
echo "  /openspec-audit    - Project-wide audit for spec/implementation drift"
echo ""
echo "Status indicators (in terminal tab):"
echo "  🚀 Rocket  - Active work"
echo "  🌕 Moon    - Waiting for sub-agents"
echo "  🌍 Earth   - Ready for input"
echo "  🔄 Loop    - Doom loop detected"
echo "  🎤 Mic     - Needs user approval"
echo ""
echo "👉 Restart OpenCode to apply changes!"
echo ""
