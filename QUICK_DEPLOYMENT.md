# 🚀 LocalSoch Dashboard Quick Deployment Guide

## Prerequisites
- VPS with Ubuntu 20.04+
- SSH access to your VPS
- Domain name (optional but recommended)

## Option 1: Automated Deployment (Recommended)

### 1. Make the script executable
```bash
chmod +x deploy.sh
```

### 2. Run the deployment script
```bash
./deploy.sh
```

The script will:
- ✅ Build your application
- ✅ Deploy to VPS
- ✅ Configure Nginx
- ✅ Setup SSL (if domain provided)
- ✅ Create future deployment script

## Option 2: Manual Deployment

### 1. Update API Configuration
Edit `client/src/lib/queryClient.ts`:
```typescript
const STRAPI_API_URL = "https://api.localsoch.com"; // Your production API URL
```

### 2. Build the Application
```bash
npm install
npm run build:frontend
```

### 3. Deploy to VPS
```bash
# Connect to your VPS
ssh root@your-vps-ip

# Install required software
apt update && apt upgrade -y
apt install nginx -y

# Create application directory
mkdir -p /var/www/localsoch-dashboard

# Upload files (from your local machine)
scp -r dist/public/* root@your-vps-ip:/var/www/localsoch-dashboard/

# Set permissions
chown -R www-data:www-data /var/www/localsoch-dashboard
chmod -R 755 /var/www/localsoch-dashboard
```

### 4. Configure Nginx
```bash
# Create Nginx configuration
nano /etc/nginx/sites-available/localsoch-dashboard
```

Add this configuration:
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
}
```

```bash
# Enable the site
ln -s /etc/nginx/sites-available/localsoch-dashboard /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx
```

### 5. Setup SSL (Optional)
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d dashboard.localsoch.com -d www.dashboard.localsoch.com
```

## Option 3: Node.js Server Deployment

If you prefer to run a Node.js server instead of static files:

### 1. Install Node.js on VPS
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install nodejs -y
npm install -g pm2
```

### 2. Upload and Setup
```bash
# Upload entire project
scp -r LocalVendorHub/* root@your-vps-ip:/var/www/localsoch-dashboard/

# On VPS
cd /var/www/localsoch-dashboard
npm install
npm run build:frontend

# Start with PM2
pm2 start server.js --name "localsoch-dashboard"
pm2 startup
pm2 save
```

### 3. Configure Nginx for Node.js
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

## Troubleshooting

### Common Issues:

1. **404 Errors**
   - Check if files exist in `/var/www/localsoch-dashboard/`
   - Verify Nginx configuration
   - Check Nginx error logs: `tail -f /var/log/nginx/error.log`

2. **API Connection Issues**
   - Verify your API URL is correct
   - Check if API is accessible from VPS
   - Test with: `curl https://api.localsoch.com/api/products`

3. **Permission Errors**
   - Set correct permissions: `chown -R www-data:www-data /var/www/localsoch-dashboard`
   - Check file permissions: `ls -la /var/www/localsoch-dashboard/`

4. **SSL Issues**
   - Check certificate validity: `certbot certificates`
   - Renew if needed: `certbot renew`

### Useful Commands:
```bash
# Check Nginx status
systemctl status nginx

# Check PM2 status (if using Node.js)
pm2 status

# View logs
pm2 logs localsoch-dashboard

# Restart services
systemctl restart nginx
pm2 restart all

# Check disk space
df -h

# Check memory usage
free -h
```

## Security Checklist

- [ ] Configure firewall (UFW)
- [ ] Use SSH key authentication
- [ ] Disable root login
- [ ] Regular system updates
- [ ] SSL certificate installed
- [ ] Security headers configured
- [ ] Backup strategy in place

## Performance Tips

- [ ] Enable gzip compression
- [ ] Set proper cache headers
- [ ] Optimize images
- [ ] Use CDN for static assets
- [ ] Monitor server resources

Your LocalSoch Dashboard frontend is now deployed! 🎉

Visit your application at:
- `http://your-vps-ip` (if no domain)
- `https://dashboard.localsoch.com` (if domain configured) 