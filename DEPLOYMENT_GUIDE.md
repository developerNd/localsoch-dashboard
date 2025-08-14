# 🚀 LocalSoch Dashboard Frontend Deployment Guide

## Overview
This guide will help you deploy the LocalSoch Dashboard frontend to a VPS while using your existing Strapi backend.

## Prerequisites

### 1. VPS Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 1GB (2GB recommended)
- **Storage**: 10GB+ free space
- **Domain**: Optional but recommended for SSL

### 2. Local Setup
- Node.js 18+ installed on your local machine
- Git access to your repository

## Step 1: Prepare Your Frontend for Production

### 1.1 Update API Configuration
First, update your API configuration to point to your production Strapi backend:

```bash
# Edit the API configuration file
nano LocalVendorHub/client/src/lib/queryClient.ts
```

Update the `STRAPI_API_URL` to your production backend URL:
```typescript
const STRAPI_API_URL = "https://api.localsoch.com"; // Production API
```

### 1.2 Create Environment Variables
Create a `.env.production` file in the LocalVendorHub root:

```bash
cd LocalVendorHub
nano .env.production
```

Add your production configuration:
```env
VITE_API_URL=https://api.localsoch.com
VITE_APP_NAME=LocalSoch Dashboard
VITE_APP_VERSION=1.0.0
```

### 1.3 Update Vite Configuration
Update your `vite.config.ts` for production:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false, // Disable sourcemaps for production
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
```

## Step 2: Build Your Application

### 2.1 Install Dependencies
```bash
cd LocalVendorHub
npm install
```

### 2.2 Build for Production
```bash
npm run build
```

This will create a `dist/public` folder with your production-ready files.

## Step 3: VPS Setup

### 3.1 Connect to Your VPS
```bash
ssh root@your-vps-ip
```

### 3.2 Update System
```bash
apt update && apt upgrade -y
```

### 3.3 Install Required Software
```bash
# Install Nginx
apt install nginx -y

# Install Node.js (if you want to run a Node.js server)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install nodejs -y

# Install PM2 (for process management)
npm install -g pm2
```

### 3.4 Create Application Directory
```bash
mkdir -p /var/www/localsoch-dashboard
cd /var/www/localsoch-dashboard
```

## Step 4: Deploy Your Application

### 4.1 Upload Files
You have several options:

#### Option A: Using SCP (Secure Copy)
```bash
# From your local machine
scp -r LocalVendorHub/dist/public/* root@your-vps-ip:/var/www/localsoch-dashboard/
```

#### Option B: Using Git
```bash
# On VPS
cd /var/www/localsoch-dashboard
git clone https://github.com/your-username/your-repo.git .
npm install
npm run build
```

#### Option C: Using rsync
```bash
# From your local machine
rsync -avz --delete LocalVendorHub/dist/public/ root@your-vps-ip:/var/www/localsoch-dashboard/
```

### 4.2 Set Permissions
```bash
# On VPS
chown -R www-data:www-data /var/www/localsoch-dashboard
chmod -R 755 /var/www/localsoch-dashboard
```

## Step 5: Configure Nginx

### 5.1 Create Nginx Configuration
```bash
nano /etc/nginx/sites-available/localsoch-dashboard
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name dashboard.localsoch.com www.dashboard.localsoch.com;
    root /var/www/localsoch-dashboard;
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

### 5.2 Enable the Site
```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/localsoch-dashboard /etc/nginx/sites-enabled/

# Remove default site (optional)
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx
```

## Step 6: SSL Certificate (Optional but Recommended)

### 6.1 Install Certbot
```bash
apt install certbot python3-certbot-nginx -y
```

### 6.2 Get SSL Certificate
```bash
certbot --nginx -d dashboard.localsoch.com -d www.dashboard.localsoch.com
```

### 6.3 Auto-renewal
```bash
crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 7: Alternative: Node.js Server Deployment

If you prefer to run a Node.js server instead of static files:

### 7.1 Create Production Server
Create `server.js` in your LocalVendorHub root:

```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'dist/public')));

// Handle React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 7.2 Update package.json
Add to your `package.json`:
```json
{
  "scripts": {
    "start:prod": "node server.js"
  }
}
```

### 7.3 Deploy with PM2
```bash
# On VPS
cd /var/www/localsoch-dashboard
pm2 start server.js --name "localsoch-dashboard"
pm2 startup
pm2 save
```

### 7.4 Update Nginx for Node.js
```nginx
server {
    listen 80;
    server_name dashboard.localsoch.com;

    location / {
        proxy_pass http://localhost:3000;
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

## Step 8: Monitoring and Maintenance

### 8.1 Set up Logging
```bash
# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PM2 logs (if using Node.js)
pm2 logs localsoch-dashboard
```

### 8.2 Set up Monitoring
```bash
# Install monitoring tools
apt install htop iotop -y

# Monitor system resources
htop
```

### 8.3 Backup Strategy
```bash
# Create backup script
nano /root/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backup/localsoch-dashboard_$DATE.tar.gz /var/www/localsoch-dashboard
find /backup -name "localsoch-dashboard_*.tar.gz" -mtime +7 -delete
```

## Step 9: Deployment Script

Create a deployment script for easy updates:

```bash
nano /root/deploy.sh
```

```bash
#!/bin/bash
echo "Starting deployment..."

# Pull latest changes
cd /var/www/localsoch-dashboard
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Restart services
pm2 restart localsoch-dashboard

echo "Deployment completed!"
```

Make it executable:
```bash
chmod +x /root/deploy.sh
```

## Troubleshooting

### Common Issues:

1. **404 Errors**: Check if Nginx configuration is correct and files exist
2. **API Connection Issues**: Verify your API URL (https://api.localsoch.com) is accessible
3. **Permission Errors**: Ensure proper file permissions
4. **SSL Issues**: Check certificate validity and renewal

### Useful Commands:
```bash
# Check Nginx status
systemctl status nginx

# Check PM2 status
pm2 status

# View logs
pm2 logs

# Restart services
systemctl restart nginx
pm2 restart all
```

## Security Considerations

1. **Firewall**: Configure UFW or iptables
2. **SSH**: Use key-based authentication
3. **Updates**: Regular system updates
4. **Backups**: Automated backup strategy
5. **Monitoring**: Set up alerts for downtime

## Performance Optimization

1. **CDN**: Consider using a CDN for static assets
2. **Caching**: Implement proper caching headers
3. **Compression**: Enable gzip compression
4. **Images**: Optimize images for web

Your LocalSoch Dashboard frontend is now ready for production deployment! 🎉 