# MCP Meta Generator WordPress Plugin

> **✅ This is the cleaned up, working version!**

A reliable WordPress plugin that connects to an MCP (Model Context Protocol) server to generate AI-powered meta descriptions for your content.

## Features

- 🤖 **AI-Powered Generation**: Uses MCP server for intelligent meta description creation
- 📋 **Manual Copy/Paste**: Reliable workflow that always works (no auto-fill issues)
- 🎯 **Multiple Tones**: Professional, Casual, Technical, Marketing
- 📊 **Content Analysis**: Get insights about your content before generating
- ✅ **Connection Monitoring**: Real-time status of your MCP server connection
- 📏 **Character Counter**: Ensures optimal meta description length (155 chars)
- 🔒 **Secure**: Proper nonce verification and input sanitization

## Installation

1. Upload the `mcp-meta-generator.php` file to your `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to Settings > MCP Meta Generator to configure your server URL
4. Start generating meta descriptions in your post/page editor!

## Configuration

1. **MCP Server URL**: Enter the URL of your MCP server endpoint
2. **Default Tone**: Choose the default tone for generated descriptions

## Usage

1. When editing posts or pages, look for the "🤖 MCP Meta Generator" box in the sidebar
2. Click "Analyze Content" to get insights about your content
3. Select your preferred tone
4. Click "Generate Description" to create an AI-powered meta description
5. Copy the generated description and paste it into Yoast's meta description field

## Why This Version Works

This plugin uses a manual copy/paste workflow instead of trying to automatically fill Yoast fields. This approach is:

- ✅ **More Reliable**: No dependency on Yoast's DOM structure
- ✅ **Conflict-Free**: No JavaScript conflicts with other plugins
- ✅ **Future-Proof**: Works regardless of Yoast updates
- ✅ **User-Controlled**: You decide when and how to apply the generated content

## Requirements

- WordPress 5.0+
- PHP 7.4+
- Active MCP server endpoint
- Yoast SEO plugin (recommended)

## Changelog

### Version 1.2.0 (Current)
- ✅ Cleaned up codebase, removed problematic auto-fill functionality
- ✅ Enhanced UI with better visual feedback
- ✅ Improved error handling and user messages
- ✅ Added comprehensive documentation
- ✅ Reliable copy/paste workflow

### Version 1.1.0 (Previous)
- ❌ Had Yoast auto-fill issues
- ❌ Complex DOM manipulation
- ❌ JavaScript conflicts

## Support

For issues or questions:
1. Check the plugin settings page for configuration help
2. Verify your MCP server is running and accessible
3. Check browser console for any JavaScript errors
4. Review WordPress debug logs if issues persist

## License

MIT License - see LICENSE file for details.