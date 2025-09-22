# Running on GitHub Codespaces

## 🚀 Quick Start in Codespaces

1. **Open in Codespaces**
   - Click the green "Code" button on GitHub
   - Select "Codespaces" tab
   - Click "Create codespace on main"

2. **Wait for Setup** (automatic)
   - Codespaces will automatically install dependencies
   - This takes about 1-2 minutes

3. **Start the Server**
   ```bash
   npm run quick-start
   ```
   
   Or use the startup script:
   ```bash
   ./start-server.sh
   ```

4. **Access the Server**
   - Codespaces will automatically forward port 3000
   - Click the "Ports" tab in the bottom panel
   - Click the globe icon next to port 3000 to open
   - Or use the forwarded URL shown in the terminal

## 🔗 Connecting WordPress Plugin

Your MCP server URL in Codespaces will look like:
```
https://[codespace-name]-3000.app.github.dev/generate-meta
```

**To find your exact URL:**
1. Look in the terminal when the server starts
2. Or check the "Ports" tab and copy the forwarded address
3. Add `/generate-meta` to the end

## 🛠️ Available Commands

```bash
# Start the server (build + run)
npm run quick-start

# Development mode with auto-reload
npm run dev

# Just start (if already built)
npm start

# Run tests
npm test

# Check server health
curl http://localhost:3000/health
```

## 📝 Tips

- **Port Forwarding**: Port 3000 is automatically forwarded and public by default
- **Auto-Save**: Changes to code are automatically saved
- **Terminal**: Use the integrated terminal at the bottom
- **Stopping**: Press `Ctrl+C` in the terminal to stop the server
- **Rebuilding**: Run `npm run build` if you make changes to TypeScript files

## 🔒 Security

- By default, forwarded ports are **public** in Codespaces
- For production, make sure to add authentication to your MCP server
- You can change port visibility in the Ports tab (right-click → Port Visibility)

## 🐛 Troubleshooting

**Server won't start?**
```bash
# Clean and rebuild
npm run clean
npm install
npm run build
npm start
```

**Port already in use?**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
```

**Need to restart Codespace?**
- Go to GitHub repository → Codespaces
- Stop and restart your codespace
