# Upgrade to MCP Meta Generator v2.0

## What's New in v2.0

🎉 **Image Alt Text Generation** - AI-powered alt text for better SEO and accessibility!

## Quick Upgrade Guide

### Step 1: Update Your MCP Server

```bash
# In your Codespace or server
git checkout feature/image-alt-text
git pull origin feature/image-alt-text

# Replace the server file
cp src/index-alt-text.ts src/index.ts

# Rebuild and restart
npm run build
pkill -f node
nohup npm start > mcp-server.log 2>&1 &
```

### Step 2: Update WordPress Plugin

**Option A: Via FTP/File Manager**
1. Download the updated plugin from: `wordpress-plugin/mcp-meta-generator-v2.php`
2. Rename it to `mcp-meta-generator.php`
3. Upload to your WordPress plugins directory
4. Overwrite the existing file

**Option B: Via SSH/Terminal**
```bash
# Download the new version
wget https://raw.githubusercontent.com/mprattmd/wordpress-mcp-meta-generator/feature/image-alt-text/wordpress-plugin/mcp-meta-generator-v2.php

# Replace the old file
mv mcp-meta-generator-v2.php /path/to/wp-content/plugins/mcp-meta-generator.php
```

### Step 3: Test the New Features

1. Edit any post or page in WordPress
2. Look for **two** meta boxes in the sidebar:
   - "MCP Meta Description Generator" (existing)
   - "AI Image Alt Text Generator" (NEW!)
3. Click "Analyze Images" to scan images
4. Click "Generate" on any image to create alt text

## New Capabilities

### Image Alt Text Tools
- **Analyze Images** - Scan posts for missing or poor alt text
- **Generate Alt Text** - Create SEO-friendly descriptions
- **Batch Processing** - Handle multiple images at once
- **Context-Aware** - Uses page title and content for better results

### API Endpoints (for advanced users)

The MCP server now supports:
- `generate_image_alt_text` - Single image alt text
- `batch_generate_image_alt_text` - Multiple images
- `analyze_images_in_content` - Audit existing images

## Troubleshooting

**Plugin not showing new features?**
- Clear WordPress cache
- Deactivate and reactivate the plugin
- Check file permissions (should be 644)

**Server not responding?**
- Verify server is running: `ps aux | grep node`
- Check logs: `tail -f mcp-server.log`
- Test connection in WordPress settings

**Image analysis failing?**
- Ensure server URL is correct in settings
- Verify API key is configured
- Check that images are in post content

## Need Help?

Open an issue at: https://github.com/mprattmd/wordpress-mcp-meta-generator/issues
