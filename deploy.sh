#!/bin/bash

# LocalSoch Dashboard Deployment Script
# This script helps deploy the frontend to a VPS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_IP=""
VPS_USER="root"
VPS_PATH="/var/www/localsoch-dashboard"
DOMAIN=""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

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

# Function to validate IP address
validate_ip() {
    local ip=$1
    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        OIFS=$IFS
        IFS='.'
        ip=($ip)
        IFS=$OIFS
        [[ ${ip[0]} -le 255 && ${ip[1]} -le 255 && ${ip[2]} -le 255 && ${ip[3]} -le 255 ]]
    else
        return 1
    fi
}

# Function to test SSH connection
test_ssh() {
    local ip=$1
    local user=$2
    ssh -o ConnectTimeout=10 -o BatchMode=yes "$user@$ip" exit 2>/dev/null
}

# Function to build the application
build_app() {
    print_status "Building application..."
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm install
    
    # Build frontend
    print_status "Building frontend..."
    npm run build:frontend
    
    print_success "Application built successfully!"
}

# Function to deploy to VPS
deploy_to_vps() {
    local ip=$1
    local user=$2
    local path=$3
    
    print_status "Deploying to VPS..."
    
    # Test SSH connection
    print_status "Testing SSH connection..."
    if ! test_ssh "$ip" "$user"; then
        print_error "Cannot connect to VPS. Please check your SSH configuration."
        exit 1
    fi
    
    # Create directory on VPS
    print_status "Creating directory on VPS..."
    ssh "$user@$ip" "mkdir -p $path"
    
    # Upload files
    print_status "Uploading files..."
    scp -r dist/public/* "$user@$ip:$path/"
    
    # Set permissions
    print_status "Setting permissions..."
    ssh "$user@$ip" "chown -R www-data:www-data $path && chmod -R 755 $path"
    
    print_success "Deployment completed!"
}

# Function to setup Nginx
setup_nginx() {
    local ip=$1
    local user=$2
    local domain=$3
    local path=$4
    
    print_status "Setting up Nginx..."
    
    # Create Nginx configuration
    local nginx_config="/etc/nginx/sites-available/localvendorhub"
    local nginx_content="
server {
    listen 80;
    server_name dashboard.localsoch.com www.dashboard.localsoch.com;
    root $path;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Security headers
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header Referrer-Policy \"no-referrer-when-downgrade\" always;
    add_header Content-Security-Policy \"default-src 'self' http: https: data: blob: 'unsafe-inline'\" always;

    # Handle React Router
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }
}"
    
    # Upload Nginx configuration
    echo "$nginx_content" | ssh "$user@$ip" "cat > /tmp/nginx_config"
    ssh "$user@$ip" "sudo mv /tmp/nginx_config $nginx_config"
    
    # Enable site
    ssh "$user@$ip" "sudo ln -sf $nginx_config /etc/nginx/sites-enabled/ && sudo rm -f /etc/nginx/sites-enabled/default"
    
    # Test and restart Nginx
    ssh "$user@$ip" "sudo nginx -t && sudo systemctl restart nginx"
    
    print_success "Nginx configured successfully!"
}

# Function to setup SSL
setup_ssl() {
    local ip=$1
    local user=$2
    local domain=$3
    
    print_status "Setting up SSL certificate..."
    
    # Install Certbot if not installed
    ssh "$user@$ip" "sudo apt update && sudo apt install -y certbot python3-certbot-nginx"
    
    # Get SSL certificate
    ssh "$user@$ip" "sudo certbot --nginx -d dashboard.localsoch.com -d www.dashboard.localsoch.com --non-interactive --agree-tos --email admin@localsoch.com"
    
    print_success "SSL certificate installed successfully!"
}

# Function to create deployment script on VPS
create_vps_deploy_script() {
    local ip=$1
    local user=$2
    local path=$3
    
    print_status "Creating deployment script on VPS..."
    
    local deploy_script="
#!/bin/bash
cd $path
git pull origin main
npm install
npm run build:frontend
sudo systemctl reload nginx
echo \"Deployment completed!\"
"
    
    echo "$deploy_script" | ssh "$user@$ip" "cat > /root/deploy.sh && chmod +x /root/deploy.sh"
    
    print_success "Deployment script created on VPS!"
}

    # Main deployment function
main_deploy() {
    echo "🚀 LocalSoch Dashboard Deployment Script"
    echo "========================================"
    
    # Get VPS details
    VPS_IP=$(get_input "Enter VPS IP address" "$VPS_IP")
    if ! validate_ip "$VPS_IP"; then
        print_error "Invalid IP address: $VPS_IP"
        exit 1
    fi
    
    VPS_USER=$(get_input "Enter VPS username" "$VPS_USER")
    DOMAIN=$(get_input "Enter domain name (optional)" "$DOMAIN")
    
    # Build application
    build_app
    
    # Deploy to VPS
    deploy_to_vps "$VPS_IP" "$VPS_USER" "$VPS_PATH"
    
    # Setup Nginx
    if [ -n "$DOMAIN" ]; then
        setup_nginx "$VPS_IP" "$VPS_USER" "$DOMAIN" "$VPS_PATH"
        
        # Ask about SSL
        if get_input "Do you want to setup SSL certificate? (y/n)" "y" | grep -qi "y"; then
            setup_ssl "$VPS_IP" "$VPS_USER" "$DOMAIN"
        fi
    else
        print_warning "No domain provided. Skipping Nginx setup."
        print_status "You can manually configure Nginx later."
    fi
    
    # Create deployment script
    create_vps_deploy_script "$VPS_IP" "$VPS_USER" "$VPS_PATH"
    
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Visit your application at: http://$VPS_IP"
    echo "2. Or visit: https://dashboard.localsoch.com"
    echo "3. For future deployments, run: ssh $VPS_USER@$VPS_IP '/root/deploy.sh'"
}

# Function to show help
show_help() {
    echo "LocalSoch Dashboard Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -b, --build    Only build the application"
    echo "  -d, --deploy   Deploy to VPS"
    echo ""
    echo "Examples:"
    echo "  $0              # Full deployment"
    echo "  $0 --build      # Only build"
    echo "  $0 --deploy     # Only deploy (assumes build is done)"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -b|--build)
        build_app
        exit 0
        ;;
    -d|--deploy)
        main_deploy
        exit 0
        ;;
    "")
        main_deploy
        exit 0
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac 