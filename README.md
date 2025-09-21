# WordPress MCP Meta Description Generator

🚀 **QUICK START - WORKING METHOD**

## Deploy in GitHub Codespaces

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies
npm install

# 3. Start the server (no build needed!)
npx tsx src/http-server.ts
```

**Copy the API key** shown when the server starts!

## Configure WordPress Plugin

1. Download the plugin from the `wordpress-plugin` folder
2. Install in WordPress (Plugins → Add New → Upload Plugin)
3. Go to Settings → MCP Meta Generator
4. Enter:
   - **Server URL**: Your Codespaces URL (e.g., `https://yourcodespace-3000.app.github.dev`)
   - **API Key**: The key shown when server started
5. Click "Test Connection"
6. Save!

## Port Configuration

Make sure port 3000 is **PUBLIC** in Codespaces:
1. Go to PORTS tab
2. Right-click port 3000
3. Select "Port Visibility" → "Public"

## Features

✅ API Key Authentication - Secure access
✅ SEO-Optimized Meta Descriptions
✅ Content Analysis
✅ Multiple Writing Tones (Professional, Casual, Technical, Marketing)
✅ Yoast SEO Integration
✅ Batch Processing

## Troubleshooting

### Server won't start
```bash
# Use the direct run method
npx tsx src/http-server.ts
```

### 401 Unauthorized
- Verify API key is entered correctly in WordPress
- Check port 3000 is set to "Public"

### Connection Failed
- Ensure URL includes `https://`
- Verify server is running in Codespaces

## Development

For development with auto-reload:
```bash
npm run dev
```

## Architecture

- **MCP Server**: TypeScript/Express HTTP API
- **WordPress Plugin**: PHP with Ajax integration
- **Authentication**: API Key (X-API-Key header)
- **AI Generation**: Content analysis and meta description generation

## License

MIT