# 🚀 Git Deployment Guide for LocalSoch Dashboard

## Overview
This guide will help you deploy your LocalSoch Dashboard using Git. We'll set up a Git repository, configure your local environment, and deploy to your VPS using Git hooks.

## Prerequisites
- GitHub account
- VPS with SSH access
- Git installed on both local machine and VPS

## Step 1: Local Setup (Before Push to GitHub)

### 1.1 Initialize Git Repository (if not already done)
```bash
cd LocalVendorHub
git init
```

### 1.2 Create .gitignore File
```bash
nano .gitignore
```

Add the following content:
```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
.next/
out/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Temporary folders
tmp/
temp/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port
```

### 1.3 Create Production Environment Template
```bash
nano .env.production.template
```

Add:
```env
VITE_API_URL=https://api.localsoch.com
VITE_APP_NAME=LocalSoch Dashboard
VITE_APP_VERSION=1.0.0
NODE_ENV=production
```

### 1.4 Update package.json Scripts
Make sure your `package.json` has these scripts:
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "build:frontend": "vite build",
    "start": "NODE_ENV=production node server.js",
    "start:prod": "NODE_ENV=production node server.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  }
}
```

### 1.5 Create Deployment Script
```bash
nano scripts/deploy.sh
```

Add:
```bash
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
```

Make it executable:
```bash
chmod +x scripts/deploy.sh
```

### 1.6 Add Files to Git
```bash
# Add all files
git add .

# Initial commit
git commit -m "Initial commit: LocalSoch Dashboard"

# Add remote repository (replace with your GitHub repo URL)
git remote add origin https://github.com/your-username/localsoch-dashboard.git

# Push to GitHub
git push -u origin main
```

## Step 2: VPS Setup (Before Deployment)

### 2.1 Connect to Your VPS
```bash
ssh root@your-vps-ip
```

### 2.2 Install Required Software
```bash
# Update system
apt update && apt upgrade -y

# Install Git
apt install git -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install nodejs -y

# Install PM2
npm install -g pm2

# Install Nginx
apt install nginx -y
```

### 2.3 Create Application Directory
```bash
mkdir -p /var/www/localsoch-dashboard
cd /var/www/localsoch-dashboard
```

### 2.4 Clone Repository
```bash
# Clone your repository
git clone https://github.com/your-username/localsoch-dashboard.git .

# Set proper permissions
chown -R www-data:www-data /var/www/localsoch-dashboard
chmod -R 755 /var/www/localsoch-dashboard
```

### 2.5 Install Dependencies and Build
```bash
# Install dependencies
npm install

# Build the application
npm run build:frontend
```

### 2.6 Create Production Environment File
```bash
nano .env.production
```

Add:
```env
VITE_API_URL=https://api.localsoch.com
VITE_APP_NAME=LocalSoch Dashboard
VITE_APP_VERSION=1.0.0
NODE_ENV=production
```

### 2.7 Create VPS Deployment Script
```bash
nano /var/www/localsoch-dashboard/deploy.sh
```

Add:
```bash
#!/bin/bash
set -e

echo "🚀 Deploying LocalSoch Dashboard..."

# Navigate to application directory
cd /var/www/localsoch-dashboard

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build:frontend

# Set proper permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data /var/www/localsoch-dashboard
chmod -R 755 /var/www/localsoch-dashboard

# Restart PM2 process (if using Node.js server)
if pm2 list | grep -q "localsoch-dashboard"; then
    echo "🔄 Restarting PM2 process..."
    pm2 restart localsoch-dashboard
else
    echo "🚀 Starting PM2 process..."
    pm2 start server.js --name "localsoch-dashboard"
    pm2 startup
    pm2 save
fi

# Reload Nginx
echo "🔄 Reloading Nginx..."
systemctl reload nginx

echo "✅ Deployment completed successfully!"
echo "🌐 Your dashboard is available at: https://dashboard.localsoch.com"
```

Make it executable:
```bash
chmod +x /var/www/localsoch-dashboard/deploy.sh
```

### 2.8 Configure Nginx
```bash
nano /etc/nginx/sites-available/localsoch-dashboard
```

Add:
```nginx
server {
    listen 80;
    server_name dashboard.localsoch.com www.dashboard.localsoch.com;
    root /var/www/localsoch-dashboard/dist/public;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy (if needed)
    location /api/ {
        proxy_pass https://api.localsoch.com;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/localsoch-dashboard /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx
```

### 2.9 Setup SSL Certificate
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d dashboard.localsoch.com -d www.dashboard.localsoch.com --non-interactive --agree-tos --email admin@localsoch.com
```

## Step 3: Deployment Workflow

### 3.1 Local Development Workflow
```bash
# 1. Make your changes
# 2. Test locally
npm run dev

# 3. Build for production
npm run build:frontend

# 4. Commit and push
git add .
git commit -m "Your commit message"
git push origin main
```

### 3.2 Deploy to VPS
```bash
# SSH to your VPS and run deployment
ssh root@your-vps-ip '/var/www/localsoch-dashboard/deploy.sh'
```

## Step 4: Automated Deployment (Optional)

### 4.1 Setup GitHub Actions (Recommended)
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build:frontend
    
    - name: Deploy to VPS
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.VPS_HOST }}
        username: ${{ secrets.VPS_USERNAME }}
        key: ${{ secrets.VPS_SSH_KEY }}
        script: |
          cd /var/www/localsoch-dashboard
          git pull origin main
          npm install
          npm run build:frontend
          chown -R www-data:www-data /var/www/localsoch-dashboard
          chmod -R 755 /var/www/localsoch-dashboard
          pm2 restart localsoch-dashboard
          systemctl reload nginx
```

### 4.2 Setup GitHub Secrets
In your GitHub repository:
1. Go to Settings → Secrets and variables → Actions
2. Add these secrets:
   - `VPS_HOST`: Your VPS IP address
   - `VPS_USERNAME`: root (or your VPS username)
   - `VPS_SSH_KEY`: Your private SSH key

## Step 5: Monitoring and Maintenance

### 5.1 Check Deployment Status
```bash
# Check PM2 status
pm2 status

# Check Nginx status
systemctl status nginx

# Check logs
pm2 logs localsoch-dashboard
tail -f /var/log/nginx/error.log
```

### 5.2 Rollback Deployment
```bash
# SSH to VPS
ssh root@your-vps-ip

# Navigate to app directory
cd /var/www/localsoch-dashboard

# Check git log
git log --oneline -5

# Rollback to previous commit
git reset --hard HEAD~1

# Rebuild and restart
npm run build:frontend
pm2 restart localsoch-dashboard
systemctl reload nginx
```

## Troubleshooting

### Common Issues:

1. **Build Failures**
   ```bash
   # Check Node.js version
   node --version
   
   # Clear npm cache
   npm cache clean --force
   
   # Delete node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Permission Issues**
   ```bash
   # Fix permissions
   chown -R www-data:www-data /var/www/localsoch-dashboard
   chmod -R 755 /var/www/localsoch-dashboard
   ```

3. **Nginx Issues**
   ```bash
   # Test configuration
   nginx -t
   
   # Check error logs
   tail -f /var/log/nginx/error.log
   ```

4. **PM2 Issues**
   ```bash
   # Check PM2 status
   pm2 status
   
   # Restart PM2
   pm2 restart all
   
   # Check logs
   pm2 logs localsoch-dashboard
   ```

## Quick Commands Reference

### Local Development
```bash
npm run dev          # Start development server
npm run build:frontend # Build for production
npm run start:prod   # Start production server locally
```

### Git Operations
```bash
git add .            # Stage all changes
git commit -m "msg"  # Commit changes
git push origin main # Push to GitHub
```

### VPS Deployment
```bash
ssh root@your-vps-ip '/var/www/localsoch-dashboard/deploy.sh'
```

### VPS Management
```bash
pm2 status           # Check PM2 status
pm2 logs localsoch-dashboard # View logs
systemctl status nginx # Check Nginx
```

Your LocalSoch Dashboard is now ready for Git-based deployment! 🎉 