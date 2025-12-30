#!/bin/bash
# Goost Installation Script
# Installs contract-based persistence for OpenCode

set -e

GOOST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENCODE_CONFIG_DIR="${HOME}/.config/opencode"
OPENCODE_CONFIG="${OPENCODE_CONFIG_DIR}/opencode.json"

echo "🚀 Installing Goost..."

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

# 4. Install plugin dependencies
echo "📦 Installing plugin dependencies..."
cd "${GOOST_DIR}/plugin"
if command -v bun &> /dev/null; then
    bun install
elif command -v npm &> /dev/null; then
    npm install
else
    echo "⚠️  Neither bun nor npm found. Please install dependencies manually."
fi
cd "${GOOST_DIR}"

# 5. Check if opencode.json exists and update it
if [ -f "${OPENCODE_CONFIG}" ]; then
    echo "🔧 Updating opencode.json..."
    
    # Check if goost plugin is already registered
    if grep -q "goost" "${OPENCODE_CONFIG}"; then
        echo "✅ Goost plugin already registered"
    else
        echo ""
        echo "⚠️  Please add Goost to your opencode.json manually:"
        echo ""
        echo "  In the 'plugin' array, add:"
        echo "    \"${GOOST_DIR}/plugin\""
        echo ""
        echo "  In the 'instructions' array, add:"
        echo "    \"${OPENCODE_CONFIG_DIR}/rules/contract-enforcer.md\","
        echo "    \"${OPENCODE_CONFIG_DIR}/rules/status-indicator.md\""
        echo ""
    fi
else
    echo ""
    echo "⚠️  No opencode.json found at ${OPENCODE_CONFIG}"
    echo "    Create one or add Goost to your existing config."
    echo ""
fi

echo ""
echo "✅ Goost installation complete!"
echo ""
echo "Available commands:"
echo "  /contract       - Interactive contract creation"
echo "  /contract-quick - Quick contract from task description"
echo ""
echo "Status indicators (in terminal tab):"
echo "  🌕 Moon   - Waiting for sub-agents"
echo "  🚀 Rocket - Active work"
echo "  🌍 Earth  - Ready for input"
echo ""
