# WordPress MCP Meta Generator - Deployment Guide

## 🚀 How to Deploy with API Key Authentication

### Step 1: Deploy the MCP Server in GitHub Codespaces

1. **Pull the latest changes:**
```bash
git pull origin main
```

2. **Install dependencies:**
```bash
npm install
```

3. **Build the TypeScript:**
```bash
npm run build
```

4. **Start the server:**
```bash
npm start
```

5. **Copy the API Key** - When the server starts, you'll see:
```
🔑 API Key for WordPress plugin: [YOUR-API-KEY-HERE]
   Save this key in your WordPress plugin settings!
```
**IMPORTANT:** Copy this API key immediately!

6. **Make port 3000 public:**
   - Go to the **PORTS** tab in Codespaces
   - Find port `3000`
   - Right-click → **Port Visibility** → **Public**
   - Copy the forwarded URL (e.g., `https://yourcodespace-3000.app.github.dev`)

### Step 2: Configure WordPress Plugin

1. **Download the plugin** from the `wordpress-plugin` directory
2. **Install in WordPress:**
   - Go to WordPress Admin → Plugins → Add New → Upload Plugin
   - Upload the `wordpress-plugin` folder as a ZIP
   - Activate the plugin

3. **Configure Settings:**
   - Go to Settings → MCP Meta Generator
   - **Server URL:** Enter your Codespaces URL (e.g., `https://yourcodespace-3000.app.github.dev`)
   - **API Key:** Paste the API key from Step 1.5
   - Click "Test Connection" to verify
   - Save Changes

### Step 3: Use the Plugin

1. Edit any post or page
2. Look for the "MCP Meta Description Generator" box in the sidebar
3. Click "Analyze Content" or "Generate Meta Description"
4. Click "Apply to Yoast" to update your Yoast SEO meta description

## 🔐 Security Features

- **API Key Authentication:** Only requests with the correct API key are accepted
- **CORS Enabled:** Works from any WordPress site
- **No Database:** All processing happens in memory

## 🔧 Using a Custom API Key

To use your own API key instead of the auto-generated one:

```bash
export MCP_API_KEY="your-custom-key-here"
npm start
```

## 🐛 Troubleshooting

### 401 Unauthorized Error
- Make sure you've entered the API key in WordPress settings
- Verify the API key matches exactly (no extra spaces)
- Check that port 3000 is set to "Public" in Codespaces

### Connection Failed
- Verify the server URL includes `https://`
- Make sure port 3000 is public in Codespaces
- Check the server is running in Codespaces terminal

### Server Logs
The server logs all requests. Check the Codespaces terminal to see:
- Authentication attempts
- Request details
- Any errors

## 📝 API Key Storage

The API key is:
- Stored securely in WordPress options table
- Never exposed in frontend code
- Sent only in HTTP headers (X-API-Key)

## 🔄 Redeploying

If you need to redeploy:
```bash
git pull origin main
npm run build
npm start
```

The server will generate a NEW API key. You'll need to update WordPress settings with the new key.

## 🌐 Alternative Deployment Options

### Railway
1. Connect GitHub repo to Railway
2. Set environment variable: `MCP_API_KEY=your-key`
3. Deploy
4. Copy the Railway URL to WordPress settings

### Vercel
1. Import GitHub repo to Vercel
2. Add environment variable: `MCP_API_KEY=your-key`
3. Deploy
4. Copy the Vercel URL to WordPress settings