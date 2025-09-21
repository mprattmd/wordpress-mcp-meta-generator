# WordPress MCP Meta Generator

An MCP (Model Context Protocol) server for generating SEO-optimized meta descriptions for WordPress posts using AI.

## 🚀 Quick Start

### Easiest Way to Start the Server

**On Mac/Linux:**
```bash
./start-server.sh
```

**On Windows:**
```bash
start-server.bat
```

**Or using npm:**
```bash
npm run quick-start
```

The script will automatically:
- Install dependencies if needed
- Build the project if needed
- Start the server on port 3000

### Alternative npm Commands

```bash
# Build and start (recommended)
npm run serve

# Just start (if already built)
npm start

# Development mode with auto-reload
npm run dev

# Build only
npm run build
```

## 📝 Server Details

- **Server URL:** `http://localhost:3000`
- **Meta Generation Endpoint:** `http://localhost:3000/generate-meta`
- **Health Check:** `http://localhost:3000/health`

## 🔌 WordPress Plugin Connection

Configure your WordPress plugin to connect to:
```
http://localhost:3000/generate-meta
```

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/mprattmd/wordpress-mcp-meta-generator.git

# Navigate to directory
cd wordpress-mcp-meta-generator

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## 🛠️ Development

```bash
# Watch mode with auto-reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Clean build directory
npm run clean
```

## 📂 Project Structure

```
├── src/                    # TypeScript source files
│   ├── index.ts           # MCP server entry point
│   └── http-server.ts     # HTTP server for WordPress plugin
├── dist/                   # Compiled JavaScript (generated)
├── wordpress-plugin/       # WordPress plugin files
│   ├── mcp-meta-generator.php
│   └── README.md
├── start-server.sh        # Easy startup script (Mac/Linux)
├── start-server.bat       # Easy startup script (Windows)
└── package.json           # Dependencies and scripts
```

## 🔧 Configuration

The server runs on port 3000 by default. To change this, modify the `PORT` constant in `src/http-server.ts`.

## 📄 License

MIT License - see LICENSE file for details.
