@echo off
REM MCP Server Startup Script for Windows
REM Makes it easy to start the WordPress MCP Meta Generator server

echo 🚀 Starting WordPress MCP Meta Generator Server...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    echo.
)

REM Check if dist exists, if not build
if not exist "dist" (
    echo 🔨 Building project...
    call npm run build
    echo.
)

REM Start the server
echo ✅ Starting HTTP server on port 3000...
echo 📝 Server will be available at: http://localhost:3000
echo 🔗 WordPress plugin should connect to: http://localhost:3000/generate-meta
echo.
echo Press Ctrl+C to stop the server
echo -----------------------------------
echo.

call npm start
