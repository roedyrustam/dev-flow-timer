#!/usr/bin/env bash
# DevFlow Timer - macOS & Linux 1-Line Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/roedyrustam/dev-flow-timer/main/install.sh | bash

set -e

echo ""
echo "⚡ [DevFlow Timer] Starting automatic installation..."

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "✖ Node.js is required! Please install Node.js (>=20) from https://nodejs.org"
    exit 1
fi

# Check Git
if ! command -v git >/dev/null 2>&1; then
    echo "✖ Git is required! Please install git first."
    exit 1
fi

GEMINI_DIR="$HOME/.gemini"
PLUGINS_DIR="$GEMINI_DIR/config/plugins"
TARGET_DIR="$PLUGINS_DIR/dev-flow-timer"
REPO_URL="https://github.com/roedyrustam/dev-flow-timer.git"

mkdir -p "$PLUGINS_DIR"

if [ -d "$TARGET_DIR" ]; then
    echo "🔄 Plugin already installed. Updating to latest version..."
    git -C "$TARGET_DIR" pull origin main
else
    echo "📥 Downloading plugin from GitHub..."
    git clone "$REPO_URL" "$TARGET_DIR"
fi

chmod +x "$TARGET_DIR/bin/cli.mjs"
chmod +x "$TARGET_DIR/bin/mcp-server.mjs"

# Create global devflow symlink in ~/.gemini/antigravity/bin or ~/.local/bin
BIN_DIR="$GEMINI_DIR/antigravity/bin"
mkdir -p "$BIN_DIR"
ln -sf "$TARGET_DIR/bin/cli.mjs" "$BIN_DIR/devflow"

# Also try ~/.local/bin if it exists in PATH
if [ -d "$HOME/.local/bin" ]; then
    ln -sf "$TARGET_DIR/bin/cli.mjs" "$HOME/.local/bin/devflow"
fi

# Enable in config.json
CONFIG_FILE="$GEMINI_DIR/config/config.json"
if [ -f "$CONFIG_FILE" ]; then
    node -e '
    const fs = require("fs");
    const p = process.argv[1];
    try {
        const raw = fs.readFileSync(p, "utf8");
        const cfg = JSON.parse(raw || "{}");
        if (!cfg.plugins) cfg.plugins = {};
        if (!cfg.plugins["dev-flow-timer"]) cfg.plugins["dev-flow-timer"] = {};
        cfg.plugins["dev-flow-timer"].enabled = true;
        fs.writeFileSync(p, JSON.stringify(cfg, null, 2), "utf8");
        console.log("✔ Enabled dev-flow-timer in Antigravity config.");
    } catch (e) {}
    ' "$CONFIG_FILE"
fi

echo ""
echo "🎉 DevFlow Timer Successfully Installed!"
echo "--------------------------------------------------------"
echo "👉 Terminal CLI : Run 'devflow status' or 'devflow start 25'"
echo "👉 Sidecar UI   : Open Overview > Plugins > DevFlow Timer in Antigravity"
echo "👉 Dashboard    : Run 'devflow dashboard' to open the cockpit"
echo "--------------------------------------------------------"
echo "Please restart Antigravity to load MCP tools completely."
echo ""
