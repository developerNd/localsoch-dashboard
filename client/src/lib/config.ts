// API Configuration
export const API_CONFIG = {
  // Always use production API URL
  get API_URL() {
    // Force production URL regardless of environment
    return 'https://api.localsoch.com';
  },
  
  // Get the appropriate image URL based on environment
  get IMAGE_URL() {
    return this.API_URL;
  }
};

// Environment check
export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/local',
    REGISTER: '/api/auth/local/register',
    ME: '/api/users/me',
  },
  VENDORS: '/api/vendors',
  PRODUCTS: '/api/products',
  ORDERS: '/api/orders',
  CATEGORIES: '/api/categories',
  BANNERS: '/api/banners',
  FEATURED_PRODUCTS: '/api/featured-products',
  UPLOAD: '/api/upload',
};

// Helper function to get full API URL
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.API_URL}${endpoint}`;
}

// Helper function to get full image URL
export function getImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_CONFIG.IMAGE_URL}${imagePath}`;
} 