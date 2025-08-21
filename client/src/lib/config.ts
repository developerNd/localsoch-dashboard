// API Configuration
export const API_CONFIG = {
    // Use production API URL
    get API_URL() {
    //   return 'https://api.localsoch.com';
      return "http://localhost:1337";
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
    BUSINESS_CATEGORIES: '/api/business-categories',
    UPLOAD: '/api/upload',
    SUBSCRIPTION: {
      PLANS: '/api/subscription-plans?filters[isActive][$eq]=true&sort[0]=sortOrder:asc',
      POPULAR_PLANS: '/api/subscription-plans?filters[isActive][$eq]=true&filters[isPopular][$eq]=true&sort[0]=sortOrder:asc',
      CREATE: '/api/subscriptions/create-with-payment',
      ACTIVATE: '/api/subscriptions',
      CANCEL: '/api/subscriptions',
      CURRENT: '/api/subscriptions/vendor',
      HISTORY: '/api/subscriptions/vendor',
    },
    PAYMENT: {
      CREATE_ORDER: '/api/payment/create-order',
      VERIFY: '/api/payment/verify',
    },
    NOTIFICATIONS: {
      UNREAD_COUNT: '/api/notifications/user',
    },
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