import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { normalizeStrapiResponse, type StrapiResponse, type StrapiEntity } from "./strapi-adapter";
import { getApiUrl } from './config';

// Strapi API Configuration
const STRAPI_API_URL = getApiUrl(''); // Use config instead of hardcoded URL
const STRAPI_API_TOKEN = "e84e26b9a4c2d8f27bde949afc61d52117e19563be11d5d9ebc8598313d72d1b49d230e28458cfcee1bccd7702ca542a929706c35cde1a62b8f0ab6f185ae74c9ce64c0d8782c15bf4186c29f4fc5c7fdd4cfdd00938a59a636a32cb243b9ca7c94242438ff5fcd2fadbf40a093ea593e96808af49ad97cbeaed977e319614b5";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

const API_URL = getApiUrl('');

export async function apiRequest(method: string, url: string, body?: any, customHeaders?: Record<string, string> | null) {
  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(customHeaders || {}),
  };
  
  // Set Content-Type for JSON requests, but not for FormData
  if (customHeaders === null) {
    // Don't set Content-Type for FormData (browser will set it with boundary)
  } else if (customHeaders && customHeaders['Content-Type']) {
    // Use provided Content-Type
  } else {
    // Set default Content-Type for JSON requests
    headers['Content-Type'] = 'application/json';
  }
  
          console.log('🔍 API Request:', method, `${API_URL}${url}`);
        console.log('🔍 API Headers:', headers);
        console.log('🔍 API Body:', body);
  
  const res = await fetch(`${API_URL}${url}`, {
    method,
    headers,
    ...(body ? { 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    } : {}),
  });
  
  console.log('🔍 API Response status:', res.status);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.log('🔍 API Error response:', errorText);
    throw new Error(`${res.status}: ${errorText}`);
  }
  
  return res;
}

// Convert local API endpoints to Strapi backend
function convertToStrapiUrl(url: string): string {
  const baseUrl = STRAPI_API_URL;
  
  // Products endpoints
  if (url.startsWith('/api/products')) {
    return `${baseUrl}/api/products${url.replace('/api/products', '')}`;
  }
  
  // Vendors endpoints (sellers)
  if (url.startsWith('/api/sellers')) {
    return `${baseUrl}/api/vendors${url.replace('/api/sellers', '')}`;
  }
  
  // Vendors endpoints (vendors)
  if (url.startsWith('/api/vendors')) {
    return `${baseUrl}/api/vendors${url.replace('/api/vendors', '')}`;
  }
  
  // Categories endpoints
  if (url.startsWith('/api/categories')) {
    return `${baseUrl}/api/categories${url.replace('/api/categories', '')}`;
  }
  
  // Analytics endpoints - use real Strapi backend
  if (url.startsWith('/api/analytics')) {
    return `${baseUrl}/api/analytics/dashboard-stats`;
  }
  
  // Don't mock orders - use real Strapi endpoint
  // if (url.startsWith('/api/orders')) {
  //   // Return mock orders data
  //   return 'mock://orders';
  // }
  
  if (url.startsWith('/api/admin/sellers')) {
    // Use real Strapi backend for admin sellers
    return `${baseUrl}/api/vendors${url.replace('/api/admin/sellers', '')}`;
  }
  
  if (url.startsWith('/api/notifications')) {
    // Use real Strapi backend for notifications
    return `${baseUrl}/api/notifications${url.replace('/api/notifications', '')}`;
  }
  
  // Default fallback to Strapi server
  return `${baseUrl}${url}`;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const targetUrl = convertToStrapiUrl(queryKey.join("/") as string);
    
    // Handle mock endpoints
    if (targetUrl.startsWith('mock://')) {
      return handleMockEndpoint(targetUrl);
    }
    
    const headers: Record<string, string> = {};
    
    // Use user's auth token if available, otherwise use Strapi API token
    const userToken = localStorage.getItem('authToken');
    if (userToken) {
      headers["Authorization"] = `Bearer ${userToken}`;
    } else {
      headers["Authorization"] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    console.log('🔍 QueryFn - targetUrl:', targetUrl);
    console.log('🔍 QueryFn - headers:', headers);

    const res = await fetch(targetUrl, {
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    
    console.log('🔍 QueryFn - response data:', data);
    
    // Always normalize Strapi responses
    if (data.data) {
      return normalizeStrapiResponse(data as StrapiResponse<StrapiEntity>);
    }
    
    return data;
  };

// Handle mock endpoints for development
function handleMockEndpoint(url: string): any {
  switch (url) {
    // Analytics is now handled by real Strapi backend
    // case 'mock://analytics': removed
    
    case 'mock://orders':
      return [
        { id: 1, orderNumber: 'ORD-2024-001', customerId: 1, customerName: 'John Doe', amount: 45.99, status: 'delivered', createdAt: '2024-01-15T10:30:00Z' },
        { id: 2, orderNumber: 'ORD-2024-002', customerId: 2, customerName: 'Jane Smith', amount: 32.50, status: 'processing', createdAt: '2024-01-15T09:15:00Z' },
        { id: 3, orderNumber: 'ORD-2024-003', customerId: 3, customerName: 'Mike Johnson', amount: 67.25, status: 'shipped', createdAt: '2024-01-15T08:45:00Z' }
      ];
    
    case 'mock://admin-sellers':
      return [
        { id: 1, username: 'johnseller', email: 'john@example.com', firstName: 'John', lastName: 'Seller', role: 'seller', status: 'active' },
        { id: 2, username: 'sarahseller', email: 'sarah@example.com', firstName: 'Sarah', lastName: 'Seller', role: 'seller', status: 'active' }
      ];
    
    case 'mock://notifications':
      return [];
    
    default:
      return null;
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
