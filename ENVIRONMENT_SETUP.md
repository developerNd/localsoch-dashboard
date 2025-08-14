# 🌍 Environment Setup Guide for LocalSoch Dashboard

## Overview
This guide explains how to set up environment variables for the LocalSoch Dashboard application.

## Quick Setup

### 1. Run the Setup Script
```bash
npm run setup:env
```

This will create the necessary environment files for you.

### 2. Manual Setup (Alternative)

If you prefer to set up manually:

#### Create Development Environment
```bash
cp env.development.example .env.development
```

#### Create Production Environment
```bash
cp env.production.example .env.production
```

## Environment Variables

### Development (.env.development)
```env
VITE_API_URL=http://localhost:1337
VITE_APP_NAME=LocalSoch Dashboard
VITE_APP_VERSION=1.0.0
NODE_ENV=development
```

### Production (.env.production)
```env
VITE_API_URL=https://api.localsoch.com
VITE_APP_NAME=LocalSoch Dashboard
VITE_APP_VERSION=1.0.0
NODE_ENV=production
```

## Variable Descriptions

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:1337` (dev) / `https://api.localsoch.com` (prod) |
| `VITE_APP_NAME` | Application name | `LocalSoch Dashboard` |
| `VITE_APP_VERSION` | Application version | `1.0.0` |
| `NODE_ENV` | Node.js environment | `development` / `production` |

## Build Commands

### Development Build
```bash
npm run build:dev
```
Uses `.env.development` file

### Production Build
```bash
npm run build:prod
```
Uses `.env.production` file

### Frontend Only Build
```bash
npm run build:frontend
```
Uses current environment variables

## How It Works

### 1. Environment Detection
The application automatically detects the environment:
- **Development**: Uses `http://localhost:1337` for API calls
- **Production**: Uses `https://api.localsoch.com` for API calls

### 2. Configuration File
The `client/src/lib/config.ts` file reads environment variables:
```typescript
export const API_CONFIG = {
  get API_URL() {
    return import.meta.env.VITE_API_URL || 'https://api.localsoch.com';
  }
};
```

### 3. Vite Integration
Vite automatically loads environment files:
- `.env.development` for development builds
- `.env.production` for production builds
- `.env.local` for local overrides (gitignored)

## Troubleshooting

### Environment Variables Not Loading
1. **Check file names**: Ensure files are named correctly (`.env.development`, `.env.production`)
2. **Check location**: Environment files must be in the project root
3. **Restart dev server**: Restart after creating environment files
4. **Check Vite config**: Ensure Vite is configured to load environment files

### API URL Issues
1. **Verify API URL**: Check if the API URL is correct and accessible
2. **Check environment**: Ensure you're using the right environment file
3. **Clear cache**: Clear browser cache and restart dev server

### Build Issues
1. **Check environment**: Ensure environment variables are set before building
2. **Verify syntax**: Check for syntax errors in environment files
3. **Check permissions**: Ensure environment files are readable

## Security Notes

### ✅ Safe to Commit
- `env.development.example`
- `env.production.example`
- `ENVIRONMENT_SETUP.md`

### ❌ Never Commit
- `.env.development`
- `.env.production`
- `.env.local`
- Any file containing secrets or API keys

## Deployment

### VPS Deployment
When deploying to VPS, ensure the production environment file is created:
```bash
# On VPS
cd /var/www/localsoch-dashboard
cp env.production.example .env.production
# Edit .env.production with correct values
```

### Docker Deployment
For Docker deployments, pass environment variables:
```bash
docker run -e VITE_API_URL=https://api.localsoch.com your-app
```

## Best Practices

1. **Use templates**: Always use `.example` files as templates
2. **Document changes**: Update this guide when adding new variables
3. **Validate values**: Ensure environment variables have correct values
4. **Test both environments**: Test both development and production builds
5. **Backup configurations**: Keep backups of your environment configurations

## Support

If you encounter issues with environment setup:
1. Check this guide first
2. Run `npm run setup:env` to verify setup
3. Check the troubleshooting section
4. Review the configuration files 