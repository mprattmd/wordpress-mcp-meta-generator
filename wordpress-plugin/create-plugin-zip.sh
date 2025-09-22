#!/bin/bash

# WordPress Plugin ZIP Creator for MCP Meta Generator v2.0

echo "📦 Creating WordPress Plugin ZIP..."
echo "==================================="

# Create temp directory
TEMP_DIR="mcp-meta-generator"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Copy plugin files
echo "📋 Copying plugin files..."
cp mcp-meta-generator.php $TEMP_DIR/
cp mcp-admin.js $TEMP_DIR/

# Copy assets if they exist
if [ -d "assets" ]; then
    cp -r assets $TEMP_DIR/
fi

# Create README for the plugin
cat > $TEMP_DIR/README.txt << 'EOF'
=== MCP Meta & Image Alt Text Generator ===
Contributors: mprattmd
Tags: seo, meta description, alt text, ai, yoast
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 2.0.0
License: GPLv2 or later

== Description ==

AI-powered meta descriptions and image alt text generation for WordPress.

**Features:**

* Generate SEO-optimized meta descriptions
* Create accessibility-focused image alt text
* Analyze content for keywords
* Integrate with Yoast SEO
* Batch processing for multiple posts
* Context-aware generation

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/mcp-meta-generator`
2. Activate the plugin through the 'Plugins' menu
3. Configure your MCP server URL and API key in Settings > MCP Generator
4. Start generating meta descriptions and alt text!

== Changelog ==

= 2.0.0 =
* Added image alt text generation
* Added image analysis and auditing
* Improved meta description quality
* Better Yoast SEO integration

= 1.0.0 =
* Initial release
EOF

echo "✅ Files copied"

# Create ZIP
echo "🗜️  Creating ZIP file..."
zip -r mcp-meta-generator-v2.0.0.zip $TEMP_DIR/

if [ $? -eq 0 ]; then
    echo "✅ ZIP created successfully: mcp-meta-generator-v2.0.0.zip"
    
    # Show file size
    SIZE=$(ls -lh mcp-meta-generator-v2.0.0.zip | awk '{print $5}')
    echo "📊 File size: $SIZE"
    
    # Cleanup
    rm -rf $TEMP_DIR
    
    echo ""
    echo "✨ Done! Your plugin is ready to install."
    echo ""
    echo "To install in WordPress:"
    echo "1. Go to Plugins > Add New > Upload Plugin"
    echo "2. Choose mcp-meta-generator-v2.0.0.zip"
    echo "3. Click Install Now"
    echo "4. Activate the plugin"
    echo "5. Configure in Settings > MCP Generator"
else
    echo "❌ Error creating ZIP file"
    exit 1
fi
