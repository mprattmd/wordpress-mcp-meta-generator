#!/bin/bash

# MCP Meta Generator v2.0 Installation Script
# This script helps you upgrade to the image alt text version

echo "🚀 MCP Meta Generator v2.0 Installer"
echo "====================================="
echo ""

# Check if WordPress path is provided
if [ -z "$1" ]; then
    echo "Usage: ./install-v2.sh /path/to/wordpress"
    echo "Example: ./install-v2.sh /var/www/html"
    exit 1
fi

WP_PATH="$1"
PLUGIN_DIR="$WP_PATH/wp-content/plugins"

# Verify WordPress directory exists
if [ ! -d "$WP_PATH" ]; then
    echo "❌ Error: WordPress directory not found at $WP_PATH"
    exit 1
fi

if [ ! -d "$PLUGIN_DIR" ]; then
    echo "❌ Error: Plugins directory not found at $PLUGIN_DIR"
    exit 1
fi

echo "📁 WordPress found at: $WP_PATH"
echo ""

# Backup existing plugin
if [ -f "$PLUGIN_DIR/mcp-meta-generator.php" ]; then
    echo "📦 Backing up existing plugin..."
    cp "$PLUGIN_DIR/mcp-meta-generator.php" "$PLUGIN_DIR/mcp-meta-generator.php.backup-$(date +%Y%m%d-%H%M%S)"
    echo "✅ Backup created"
fi

# Download new version from GitHub
echo "📥 Downloading v2.0..."
wget -q https://raw.githubusercontent.com/mprattmd/wordpress-mcp-meta-generator/feature/image-alt-text/wordpress-plugin/mcp-meta-generator-v2.php -O /tmp/mcp-meta-generator-v2.php

if [ $? -eq 0 ]; then
    echo "✅ Download complete"
    
    # Install new version
    echo "📝 Installing new version..."
    cp /tmp/mcp-meta-generator-v2.php "$PLUGIN_DIR/mcp-meta-generator.php"
    
    # Set permissions
    chmod 644 "$PLUGIN_DIR/mcp-meta-generator.php"
    
    echo "✅ Installation complete!"
    echo ""
    echo "🎉 MCP Meta Generator v2.0 is now installed!"
    echo ""
    echo "Next steps:"
    echo "1. Go to WordPress admin"
    echo "2. Refresh the plugins page"
    echo "3. Edit any post to see the new Image Alt Text Generator box"
    echo ""
    echo "Don't forget to update your MCP server to support image alt text!"
    echo "See UPGRADE-TO-V2.md for server update instructions."
else
    echo "❌ Download failed. Please check your internet connection."
    exit 1
fi
