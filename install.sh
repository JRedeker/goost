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

# 4. Install core rules.yaml if not present
# This provides the P01-P23 rules referenced by /openspec-prep
if [ ! -f "${OPENCODE_CONFIG_DIR}/rules.yaml" ]; then
    echo "📜 Installing core rules.yaml..."
    cp "${GOOST_DIR}/rules.yaml" "${OPENCODE_CONFIG_DIR}/rules.yaml"
    echo "✅ Installed rules.yaml to ${OPENCODE_CONFIG_DIR}/rules.yaml"
else
    echo "ℹ️  rules.yaml already exists at ${OPENCODE_CONFIG_DIR}/rules.yaml (skipped)"
fi

# 5. Install plugin dependencies
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

# 6. Check if opencode.json exists and update it
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
        echo "    \"${GOOST_DIR}/goost_instructions.md\""
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
