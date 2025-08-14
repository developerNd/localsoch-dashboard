#!/bin/bash
set -e

echo "🚀 Building LocalSoch Dashboard for production..."

# Set production environment variables
export NODE_ENV=production
export VITE_API_URL=https://api.localsoch.com
export VITE_APP_NAME="LocalSoch Dashboard"
export VITE_APP_VERSION="1.0.0"

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building frontend..."
npm run build:frontend

echo "✅ Production build completed!"
echo "📁 Build files are in: dist/public/"
echo ""
echo "🌐 API URL: https://api.localsoch.com"
echo "📱 Dashboard URL: https://dashboard.localsoch.com"
echo ""
echo "Next steps:"
echo "1. Deploy to VPS:"
echo "   ssh root@your-vps-ip '/var/www/localsoch-dashboard/deploy.sh'"
echo ""
echo "2. Or push to GitHub for automated deployment:"
echo "   git add ."
echo "   git commit -m 'Production build'"
echo "   git push origin main" 