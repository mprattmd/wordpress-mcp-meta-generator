#!/bin/bash

echo "🚀 Deploying WordPress MCP Meta Generator..."
echo ""

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "🎉 Ready to start the server!"
    echo ""
    echo "To start the server, run:"
    echo "  npm start"
    echo ""
    echo "The API key will be displayed when the server starts."
    echo "Make sure to:"
    echo "  1. Copy the API key"
    echo "  2. Set port 3000 to 'Public' in the PORTS tab"
    echo "  3. Enter both the URL and API key in WordPress settings"
else
    echo ""
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi