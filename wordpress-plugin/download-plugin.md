# Download MCP Meta Generator v2.0 Plugin

## Quick Download Links

### Method 1: Direct Download (Recommended)

**Download the complete plugin:**

```bash
# Download as ZIP (ready for WordPress upload)
wget https://github.com/mprattmd/wordpress-mcp-meta-generator/archive/refs/heads/main.zip -O mcp-temp.zip

# Extract just the plugin files
unzip mcp-temp.zip
cd wordpress-mcp-meta-generator-main/wordpress-plugin/

# Create proper plugin structure
mkdir mcp-meta-generator
cp mcp-meta-generator.php mcp-meta-generator/
cp mcp-admin.js mcp-meta-generator/

# Create ZIP for WordPress
zip -r mcp-meta-generator.zip mcp-meta-generator/

echo "✅ Plugin ready: mcp-meta-generator.zip"
```

### Method 2: Individual Files

**Download files separately:**

```bash
# Create directory
mkdir mcp-meta-generator
cd mcp-meta-generator

# Download plugin files
wget https://raw.githubusercontent.com/mprattmd/wordpress-mcp-meta-generator/main/wordpress-plugin/mcp-meta-generator.php
wget https://raw.githubusercontent.com/mprattmd/wordpress-mcp-meta-generator/main/wordpress-plugin/mcp-admin.js

# Go back and create ZIP
cd ..
zip -r mcp-meta-generator.zip mcp-meta-generator/

echo "✅ Plugin ready: mcp-meta-generator.zip"
```

### Method 3: From Codespaces

**If you're in your Codespace:**

```bash
cd /workspaces/wordpress-mcp-meta-generator/wordpress-plugin

# Run the creation script
chmod +x create-plugin-zip.sh
./create-plugin-zip.sh

# Download the ZIP
# The file mcp-meta-generator-v2.0.0.zip is now ready
```

## Installation in WordPress

1. **Upload Plugin:**
   - Go to WordPress Admin → Plugins → Add New
   - Click "Upload Plugin"
   - Choose `mcp-meta-generator.zip`
   - Click "Install Now"

2. **Activate:**
   - Click "Activate Plugin"

3. **Configure:**
   - Go to Settings → MCP Generator
   - Enter your MCP Server URL (e.g., `https://your-codespace-3000.app.github.dev`)
   - Enter your API Key
   - Click "Test Connection" to verify
   - Save settings

4. **Use:**
   - Edit any post or page
   - Look for two new boxes in the sidebar:
     - "Meta Description Generator"
     - "Image Alt Text Generator"
   - Click buttons to generate!

## Direct File Installation (Alternative)

If you prefer to install files directly:

```bash
# SSH into your server
cd /path/to/wordpress/wp-content/plugins

# Create plugin directory
mkdir mcp-meta-generator
cd mcp-meta-generator

# Download files
wget https://raw.githubusercontent.com/mprattmd/wordpress-mcp-meta-generator/main/wordpress-plugin/mcp-meta-generator.php
wget https://raw.githubusercontent.com/mprattmd/wordpress-mcp-meta-generator/main/wordpress-plugin/mcp-admin.js

# Set permissions
chmod 644 *.php *.js
chown www-data:www-data *.php *.js  # Adjust user as needed
```

Then activate in WordPress admin.

## Verification

After installation, verify:

1. ✅ Plugin appears in Plugins list
2. ✅ Settings page accessible at Settings → MCP Generator
3. ✅ Meta boxes appear when editing posts/pages
4. ✅ Connection test passes

## Troubleshooting

**Plugin not showing?**
- Check file permissions (should be 644)
- Ensure files are in `/wp-content/plugins/mcp-meta-generator/`
- Check WordPress error logs

**JavaScript not loading?**
- Clear WordPress cache
- Disable other plugins temporarily
- Check browser console for errors

**Connection failing?**
- Verify MCP server is running
- Check server URL is correct
- Ensure API key matches server
- Test server directly: `curl https://your-server-url/`

## Support

Issues? Open a ticket: https://github.com/mprattmd/wordpress-mcp-meta-generator/issues
