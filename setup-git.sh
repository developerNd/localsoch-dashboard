#!/bin/bash
set -e

echo "🚀 Setting up LocalSoch Dashboard for Git deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to get user input
get_input() {
    local prompt="$1"
    local default="$2"
    local input
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        echo "${input:-$default}"
    else
        read -p "$prompt: " input
        echo "$input"
    fi
}

echo -e "${BLUE}Step 1: Git Repository Setup${NC}"

# Check if Git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing Git repository..."
    git init
else
    echo "Git repository already exists."
fi

# Get GitHub repository URL
GITHUB_URL=$(get_input "Enter your GitHub repository URL" "https://github.com/your-username/localsoch-dashboard.git")

# Add remote if not exists
if ! git remote get-url origin > /dev/null 2>&1; then
    git remote add origin "$GITHUB_URL"
    echo "Added remote origin: $GITHUB_URL"
else
    echo "Remote origin already exists."
fi

echo -e "${BLUE}Step 2: Build Application${NC}"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build application
echo "Building application..."
npm run build:frontend

echo -e "${BLUE}Step 3: Git Operations${NC}"

# Add all files
echo "Adding files to Git..."
git add .

# Get commit message
COMMIT_MSG=$(get_input "Enter commit message" "Initial commit: LocalSoch Dashboard")

# Commit
echo "Committing changes..."
git commit -m "$COMMIT_MSG"

echo -e "${BLUE}Step 4: Push to GitHub${NC}"

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main

echo -e "${GREEN}✅ Git setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Set up your VPS following the GIT_DEPLOYMENT_GUIDE.md"
echo "2. Configure GitHub Actions secrets (optional):"
echo "   - VPS_HOST: Your VPS IP address"
echo "   - VPS_USERNAME: root (or your VPS username)"
echo "   - VPS_SSH_KEY: Your private SSH key"
echo ""
echo "3. For manual deployment:"
echo "   ssh root@your-vps-ip '/var/www/localsoch-dashboard/deploy.sh'"
echo ""
echo "4. For automated deployment:"
echo "   Just push to main branch and GitHub Actions will handle it!" 