#!/bin/bash

# Community Card Balance Checker - Launch Script
# This script starts a local web server for testing the web app

echo "🚀 Starting Community Card Balance Checker Web App..."
echo ""
echo "Environment: Development"
echo "Firebase Project: community-card-dev"
echo ""
echo "The app will be available at: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "Using Python 3..."
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "Using Python..."
    python -m http.server 8000
else
    echo "❌ Error: Python not found"
    echo "Please install Python to run the local server"
    echo ""
    echo "Alternative: Use any other web server to serve the web_app directory"
    echo "Examples:"
    echo "  - Node.js: npx serve ."
    echo "  - PHP: php -S localhost:8000"
    echo "  - Live Server extension in VS Code"
    exit 1
fi