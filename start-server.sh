#!/bin/bash

# MCP Server Startup Script
# Makes it easy to start the WordPress MCP Meta Generator server

echo "🚀 Starting WordPress MCP Meta Generator Server..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if dist exists, if not build
if [ ! -d "dist" ]; then
    echo "🔨 Building project..."
    npm run build
    echo ""
fi

# Start the server
echo "✅ Starting HTTP server on port 3000..."
echo "📝 Server will be available at: http://localhost:3000"
echo "🔗 WordPress plugin should connect to: http://localhost:3000/generate-meta"
echo ""
echo "Press Ctrl+C to stop the server"
echo "-----------------------------------"
echo ""

npm start
