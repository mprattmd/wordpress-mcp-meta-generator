# 🚀 Codespaces Deployment Guide

## Quick Start

### 1. Open in Codespaces
1. Go to your GitHub repository: https://github.com/mprattmd/wordpress-mcp-meta-generator
2. Click the green **"Code"** button
3. Select **"Codespaces"** tab
4. Click **"Create codespace on main"** (or open existing)

### 2. Start the MCP Server

```bash
# Install dependencies (if needed)
npm install

# Start the server
npx tsx src/http-server.ts
```

The server will start and display:
```
🔑 API Key for WordPress plugin: [YOUR-API-KEY-HERE]
   Save this key in your WordPress plugin settings!

🌐 WordPress MCP HTTP API running on port 3000
```

**IMPORTANT:** Copy the API key shown - you'll need it in WordPress!

### 3. Make Port Public

1. In Codespaces, go to the **PORTS** tab (bottom panel)
2. Find port **3000**
3. Right-click → **Port Visibility** → **Public**
4. Copy the **Forwarded Address** (looks like: `https://yourname-wordpress-mcp-xxxxx-3000.app.github.dev`)

### 4. Install WordPress Plugin

1. Download the `wordpress-plugin` folder from this repo
2. Zip the folder
3. In WordPress: **Plugins** → **Add New** → **Upload Plugin**
4. Upload the zip and **Activate**

### 5. Configure Plugin in WordPress

1. Go to **Settings** → **MCP Generator**
2. **Server URL:** Paste the Codespaces forwarded address from step 3
3. **API Key:** Paste the API key from step 2
4. Click **Test Connection** - should see ✅
5. Click **Save Changes**

### 6. Use It!

Edit any post or page and look for the **"Meta Description Generator"** box in the sidebar.

## Troubleshooting

### "unknown tool: test" Error
✅ **FIXED!** The latest version now uses the correct health check endpoint.

Make sure you have:
1. Updated plugin from the latest version in this repo
2. Restarted the MCP server in Codespaces
3. Configured the correct server URL and API key

### Connection Issues

**401 Unauthorized:**
- API key in WordPress doesn't match server
- Make sure you copied the key from the server startup message

**Connection Failed:**
- Server must be running (`npx tsx src/http-server.ts`)
- Port 3000 must be **Public** in Codespaces
- Server URL must be the Codespaces forwarded address

**Port Already in Use:**
```bash
# Kill any existing process on port 3000
lsof -ti:3000 | xargs kill -9
# Then restart
npx tsx src/http-server.ts
```

### Server Logs

Check the terminal where the server is running - all requests are logged there for debugging.

## Notes

- **New API Key:** A new API key is generated each time you restart the server
- **Update WordPress:** Remember to update the API key in WordPress settings after restart
- **Keep Alive:** Codespaces goes to sleep after inactivity - just restart the server when needed
- **Development Mode:** Run `npm run dev` for auto-reload during development

## Available Tools

The MCP server provides these tools:
- `generate_meta_description` - Generate SEO meta descriptions
- `analyze_content` - Analyze post content
- `batch_generate` - Generate meta for multiple posts

---

Need help? Check the [README.md](README.md) or open an issue!
