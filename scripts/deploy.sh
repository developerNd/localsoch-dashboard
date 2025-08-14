#!/bin/bash
set -e

echo "🚀 Starting LocalSoch Dashboard deployment..."

# Build the application
echo "📦 Building application..."
npm install
npm run build:frontend

echo "✅ Build completed successfully!"
echo "📁 Build files are in: dist/public/"
echo ""
echo "Next steps:"
echo "1. Commit and push to GitHub:"
echo "   git add ."
echo "   git commit -m 'Build for production'"
echo "   git push origin main"
echo ""
echo "2. Deploy to VPS:"
echo "   ssh root@your-vps-ip '/var/www/localsoch-dashboard/deploy.sh'" 