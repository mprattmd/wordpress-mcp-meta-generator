# 🚀 Quick Start Guide

## For GitHub Codespaces (Recommended)

### 1. Start the Server
```bash
npx tsx src/http-server.ts
```

### 2. Copy Your API Key
When the server starts, you'll see:
```
🔑 API Key for WordPress plugin: [COPY-THIS-KEY]
```
**Save this key!** You'll need it in WordPress.

### 3. Make Port Public
- Go to **PORTS** tab in Codespaces
- Right-click port **3000**
- Select **Port Visibility** → **Public**
- Copy the forwarded URL (e.g., `https://yourcodespace-3000.app.github.dev`)

### 4. Install WordPress Plugin
1. Download `wordpress-plugin` folder
2. Zip it up
3. In WordPress: Plugins → Add New → Upload Plugin
4. Activate

### 5. Configure Plugin
- Go to: **Settings** → **MCP Meta Generator**
- **Server URL**: Paste Codespaces URL
- **API Key**: Paste the key from step 2
- Click **Test Connection** (should see ✅)
- **Save Changes**

### 6. Use It!
- Edit any post/page
- Look for **"MCP Meta Description Generator"** box in sidebar
- Click **"Generate Meta Description"**
- Click **"Apply to Yoast"**
- Done! 🎉

## Restarting the Server

If Codespaces goes to sleep or you need to restart:
```bash
# Just run this again
npx tsx src/http-server.ts
```

**Note**: A new API key will be generated each time you restart. Update WordPress settings with the new key.

## Troubleshooting

### "401 Unauthorized"
- Check API key in WordPress matches server
- Verify port 3000 is "Public"

### "Connection Failed" 
- Server must be running (`npx tsx src/http-server.ts`)
- Check Codespaces URL is correct
- Ensure port 3000 is public

### Server Logs
All requests are logged in the terminal where the server is running. Check there for debugging.

## That's It!

You're all set. The server will:
- Generate SEO-optimized meta descriptions
- Analyze your content
- Support multiple writing tones
- Work seamlessly with Yoast SEO

Need help? Check the full [README.md](README.md) or [DEPLOYMENT.md](DEPLOYMENT.md)