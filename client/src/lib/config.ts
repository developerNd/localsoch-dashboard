// API Configuration
export const API_CONFIG = {
    // Use production API URL
    get API_URL() {
      return 'https://api.localsoch.com';
      // return "http://192.168.150.101:1337";
      // return import.meta.env.VITE_API_URL || "http://192.168.150.101:1337";
    },
    
    // Get the appropriate image URL based on environment
    get IMAGE_URL() {
      return this.API_URL;
    },
    
    // Google Maps API Key from environment
    get GOOGLE_MAPS_API_KEY() {
      return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    }
  };
  
  // Environment check
  export const isProduction = import.meta.env.PROD;
  export const isDevelopment = import.meta.env.DEV;
  
  // GST Configuration
  export const GST_RATE = 18; // GST rate in percentage (18% for services in India)
  
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

  /**
   * Calculate GST amount with consistent rounding
   * @param subtotal - The amount before GST
   * @param gstRate - GST rate in percentage (default: GST_RATE from config)
   * @returns Rounded GST amount
   */
  export function calculateGst(subtotal: number, gstRate: number = GST_RATE): number {
    return Math.round((subtotal * gstRate) / 100);
  }

  /**
   * Calculate total amount including GST with consistent rounding
   * @param subtotal - The amount before GST
   * @param gstRate - GST rate in percentage (default: GST_RATE from config)
   * @returns Total amount including GST
   */
  export function calculateTotalWithGst(subtotal: number, gstRate: number = GST_RATE): number {
    const gstAmount = calculateGst(subtotal, gstRate);
    return subtotal + gstAmount;
  } 