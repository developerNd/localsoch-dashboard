import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toStrapiFormat, normalizeProduct, normalizeVendor, normalizeOrder, normalizeCategory } from '@/lib/strapi-adapter';
import { getApiUrl } from '@/lib/config';

const API_URL = getApiUrl('');

// Products API hooks
export function useProducts() {
  return useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/products?populate=*');
      const data = await response.json();
      
      // Handle both Strapi format { data: [...], meta: {...} } and direct array format
      const products = data.data || data;
      
      if (Array.isArray(products)) {
        const normalizedProducts = products.map((product: any) => normalizeProduct(product));
        return normalizedProducts;
      } else {
        console.error('Unexpected products data format:', data);
        return [];
      }
    },
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['/api/products', id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/products/${id}?populate=*`);
      const data = await response.json();
      
      // Handle both Strapi format { data: {...} } and direct object format
      const product = data.data || data;
      return normalizeProduct(product);
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productData: any) => {
      // Check if we have file uploads
      const hasFiles = productData.image || (productData.images && productData.images.length > 0);
      
      let requestData;
      let headers = {};
      
      if (hasFiles) {
        // First, upload the file(s) to Strapi
        const uploadPromises = [];
        
        if (productData.image) {
          const imageFormData = new FormData();
          imageFormData.append('files', productData.image);
          
          const uploadResponse = await fetch(getApiUrl('/api/upload'), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: imageFormData,
          });
          
          if (!uploadResponse.ok) {
            throw new Error(`File upload failed: ${uploadResponse.statusText}`);
          }
          
          const uploadResult = await uploadResponse.json();
          uploadPromises.push(Promise.resolve(uploadResult[0])); // Single file upload returns array
        }
        
        if (productData.images && productData.images.length > 0) {
          const imagesFormData = new FormData();
          productData.images.forEach((file: File) => {
            imagesFormData.append('files', file);
          });
          
          const uploadResponse = await fetch(getApiUrl('/api/upload'), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: imagesFormData,
          });
          
          if (!uploadResponse.ok) {
            throw new Error(`Files upload failed: ${uploadResponse.statusText}`);
          }
          
          const uploadResult = await uploadResponse.json();
          uploadPromises.push(...uploadResult);
        }
        
        const uploadedFiles = await Promise.all(uploadPromises);
        
        // Now create the product with the uploaded file IDs
        const productDataWithFiles: any = {
          name: productData.name,
          description: productData.description,
          mrp: productData.mrp,
          price: productData.price,
          discount: productData.discount,
          stock: productData.stock,
          image: uploadedFiles[0]?.id, // Use first uploaded file as main image
          images: uploadedFiles.map(file => file.id), // Use all uploaded files as images array
        };
        
        // Add category if present
        if (productData.category) {
          productDataWithFiles.category = productData.category.id;
        }
        
        const strapiData = toStrapiFormat(productDataWithFiles);
        requestData = strapiData;
        headers = { 'Content-Type': 'application/json' };
      } else {
        // Use JSON for non-file uploads
        const strapiData = toStrapiFormat(productData);
        requestData = strapiData;
        headers = { 'Content-Type': 'application/json' };
      }
      
      const response = await apiRequest('POST', '/api/products', requestData, headers);
      const result = await response.json();
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const strapiData = toStrapiFormat(data);
      const response = await apiRequest('PUT', `/api/products/${id}`, strapiData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });
}

export function useToggleProductActive() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest('PUT', `/api/products/${id}/toggle-active`, { isActive });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });
}

// Review API hooks
export function useSellerReviews(vendorId: number | undefined) {
  return useQuery({
    queryKey: ['/api/reviews/seller', vendorId],
    queryFn: async () => {
      console.log('🔍 useSellerReviews - fetching for vendorId:', vendorId, 'Type:', typeof vendorId);
      const response = await apiRequest('GET', `/api/reviews/seller/${vendorId}?populate=*`);
      const data = await response.json();
      console.log('🔍 useSellerReviews - response data:', data);
      return data.data || data;
    },
    enabled: !!vendorId && vendorId > 0,
  });
}

export function useSellerReviewStats(vendorId: number | undefined) {
  return useQuery({
    queryKey: ['/api/reviews/seller/stats', vendorId],
    queryFn: async () => {
      console.log('🔍 useSellerReviewStats - fetching for vendorId:', vendorId, 'Type:', typeof vendorId);
      const response = await apiRequest('GET', `/api/reviews/seller/${vendorId}/stats?populate=*`);
      const data = await response.json();
      console.log('🔍 useSellerReviewStats - response data:', data);
      return data.data || data;
    },
    enabled: !!vendorId && vendorId > 0,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reviewData: any) => {
      const response = await apiRequest('POST', '/api/reviews', { data: reviewData });
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate all review-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews/seller'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews/seller/stats'] });
      
      // If we have vendor ID, invalidate specific vendor queries
      if (variables.vendor) {
        queryClient.invalidateQueries({ queryKey: ['/api/reviews/seller', variables.vendor] });
        queryClient.invalidateQueries({ queryKey: ['/api/reviews/seller/stats', variables.vendor] });
      }
    },
  });
}

// Notification API hooks
export function useNotifications(userId: number | undefined) {
  return useQuery({
    queryKey: ['/api/notifications/user', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/notifications/user/${userId}?populate=*`);
      const data = await response.json();
      return data.data || data;
    },
    enabled: !!userId && userId > 0,
  });
}

export function useVendorNotifications(vendorId: number | undefined) {
  return useQuery({
    queryKey: ['/api/notifications/vendor', vendorId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/notifications/vendor/${vendorId}?populate=*`);
      const data = await response.json();
      return data.data || data;
    },
    enabled: !!vendorId && vendorId > 0,
  });
}

export function useUnreadCount(userId: number | undefined) {
  return useQuery({
    queryKey: ['/api/notifications/unread-count', userId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/notifications/user/${userId}/unread-count`);
      const data = await response.json();
      return data.data || data;
    },
    enabled: !!userId && userId > 0,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest('PUT', `/api/notifications/${notificationId}/read`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('PUT', `/api/notifications/user/${userId}/read-all`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest('DELETE', `/api/notifications/${notificationId}/delete`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });
}

export function useClearAllNotifications() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('DELETE', `/api/notifications/user/${userId}/clear-all`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });
}



export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/products/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });
}

// Admin-specific product hooks
export function useAdminProducts() {
  return useQuery({
    queryKey: ['/api/products/admin/all'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/products?admin=all&populate=*');
      const data = await response.json();
      return data.data || data;
    },
  });
}

export function useUpdateProductStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: number; status: string; reason?: string }) => {
      const response = await apiRequest('PUT', `/api/products/${id}/status`, { status, reason });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/admin/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });
}

export function useProductStats() {
  return useQuery({
    queryKey: ['/api/products/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/products?admin=stats');
      const data = await response.json();
      return data.data || data;
    },
  });
}

// Vendors/Sellers API hooks
export function useVendors() {
  return useQuery({
    queryKey: ['/api/vendors'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/vendors?populate=*');
      const data = await response.json();
      
      // Handle both Strapi format { data: [...], meta: {...} } and direct array format
      const vendors = data.data || data;
      
      if (Array.isArray(vendors)) {
        return vendors.map((vendor: any) => normalizeVendor(vendor));
      } else {
        console.error('Unexpected vendors data format:', data);
        return [];
      }
    },
  });
}

export function useVendor(id: number | undefined) {
  return useQuery({
    queryKey: ['/api/vendors', id],
    queryFn: async () => {
      console.log('🔍 useVendor - fetching vendor with ID:', id);
      const response = await apiRequest('GET', `/api/vendors/${id}?populate=*`);
      const data = await response.json();
      
      console.log('🔍 useVendor - raw data:', data);
      
      // Handle both Strapi format { data: {...} } and direct object format
      const vendor = data.data || data;
      const normalizedVendor = normalizeVendor(vendor);
      console.log('🔍 useVendor - normalized vendor:', normalizedVendor);
      return normalizedVendor;
    },
    enabled: !!id && id > 0,
    retry: (failureCount, error) => {
      // Don't retry if vendor not found (404) or permission denied (403)
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('403'))) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (vendorData: any) => {
      const strapiData = toStrapiFormat(vendorData);
      const response = await apiRequest('POST', '/api/vendors', strapiData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      console.log('🔍 useUpdateVendor called with id:', id, 'data:', data);
      console.log('🔍 Data type:', typeof data, 'is FormData:', data instanceof FormData);
      
      let requestData: any;
      let headers: any = {};
      
      // Check if data is FormData (for file uploads)
      if (data instanceof FormData) {
        requestData = data;
        console.log('🔍 Using FormData, not setting Content-Type');
        // Don't set Content-Type for FormData, let browser set it with boundary
        // Pass null to prevent apiRequest from setting Content-Type
        headers = null;
      } else {
        // Regular JSON data - wrap in data property for Strapi
        requestData = { data };
        headers = { 'Content-Type': 'application/json' };
        console.log('🔍 Using JSON, requestData:', requestData);
        console.log('🔍 Headers:', headers);
      }
      
      console.log('🔍 Final requestData:', requestData);
      const response = await apiRequest('PUT', `/api/vendors/${id}`, requestData, headers);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor'] });
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/vendors/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
    },
  });
}

// Admin-specific vendor hooks
export function useAdminVendors() {
  return useQuery({
    queryKey: ['/api/vendors/admin/all'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/vendors?admin=all&populate=*');
      const data = await response.json();
      return data.data || data;
    },
  });
}

export function useUpdateVendorStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: number; status: string; reason?: string }) => {
      const response = await apiRequest('PUT', `/api/vendors/${id}/status`, { status, reason });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/admin/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
    },
  });
}

export function useVendorStats() {
  return useQuery({
    queryKey: ['/api/vendors/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/vendors?admin=stats');
      const data = await response.json();
      return data.data || data;
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: any) => {
      // Extract id and wrap the rest in data property for Strapi
      const { id, ...updateData } = userData;
      console.log('🔍 useUpdateUser - userData:', userData);
      console.log('🔍 useUpdateUser - updateData:', updateData);
      console.log('🔍 useUpdateUser - sending:', { data: updateData });
      
      const response = await apiRequest('PUT', `/api/users/${id}`, { data: updateData });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });
}

export function useVendorButtonAnalytics(vendorId: number | undefined) {
  return useQuery({
    queryKey: ['/api/vendors/button-analytics', vendorId],
    queryFn: async () => {
      // Analytics endpoint is now public, no authentication required
      const response = await fetch(`${API_URL}/api/vendors/${vendorId}?analytics=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || data;
    },
    enabled: !!vendorId && vendorId > 0,
  });
}

export function useVendorButtonClickLogs(vendorId: number | undefined, page = 1, pageSize = 25) {
  return useQuery({
    queryKey: ['/api/vendors/button-click-logs', vendorId, page, pageSize],
    queryFn: async () => {
      // Get auth token for authenticated request
      const token = localStorage.getItem('authToken');
      
      // Fetch real data from the database with authentication
      const response = await fetch(`${API_URL}/api/vendors/${vendorId}/button-click-logs?page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch button click logs: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    },
    enabled: !!vendorId && vendorId > 0,
  });
}

// Orders API hooks
export function useOrders() {
  return useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/orders?populate=*');
      const data = await response.json();
      
      // Handle both Strapi format { data: [...], meta: {...} } and direct array format
      const orders = data.data || data;
      
      if (Array.isArray(orders)) {
        const normalizedOrders = orders.map((order: any) => normalizeOrder(order));
        return normalizedOrders;
      } else {
        console.error('Unexpected orders data format:', data);
        return [];
      }
    },
  });
}

export function useSellerOrders(vendorId: number | undefined) {
  return useQuery({
    queryKey: ['/api/orders/seller', vendorId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/orders?filters[vendor][id][$eq]=${vendorId}&populate=*`);
      const data = await response.json();
      
      // Handle both Strapi format { data: [...], meta: {...} } and direct array format
      const orders = data.data || data;
      
      if (Array.isArray(orders)) {
        const normalizedOrders = orders.map((order: any) => normalizeOrder(order));
        return normalizedOrders;
      } else {
        console.error('Unexpected orders data format:', data);
        return [];
      }
    },
    enabled: !!vendorId && vendorId > 0,
  });
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: ['/api/orders', id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/orders/${id}?populate=*`);
      const data = await response.json();
      
      // Handle both Strapi format { data: {...} } and direct object format
      const order = data.data || data;
      return normalizeOrder(order);
    },
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: number; status: string; reason?: string }) => {
      const response = await apiRequest('PUT', `/api/orders/${id}/status`, { status, reason });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/seller'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });
}

// Admin-specific order hooks
export function useAdminOrders() {
  return useQuery({
    queryKey: ['/api/orders/admin/all'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/orders?admin=all&populate=*');
      const data = await response.json();
      return data.data || data;
    },
  });
}

export function useUpdateOrderStatusByAdmin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const response = await apiRequest('PUT', `/api/orders/${id}/status/admin`, { status, notes });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/admin/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: ['/api/orders/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/orders?admin=stats');
      const data = await response.json();
      return data.data || data;
    },
  });
}

// Categories API hooks
export function useCategories() {
  return useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/categories?populate=*');
      const data = await response.json();
      
      // Handle both Strapi format { data: [...], meta: {...} } and direct array format
      const categories = data.data || data;
      
      if (Array.isArray(categories)) {
        return categories.map((category: any) => normalizeCategory(category));
      } else {
        console.error('Unexpected categories data format:', data);
        return [];
      }
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (categoryData: any) => {
      const strapiData = toStrapiFormat(categoryData);
      const response = await apiRequest('POST', '/api/categories', strapiData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
  });
}

// Analytics hooks
export function useAdminAnalytics() {
  return useQuery({
    queryKey: ['/api/analytics/admin'],
    queryFn: async () => {
      // Fetch all data and calculate analytics
      const [productsRes, vendorsRes, ordersRes] = await Promise.all([
        apiRequest('GET', '/api/products?populate=*'),
        apiRequest('GET', '/api/vendors?populate=*'),
        apiRequest('GET', '/api/orders?populate=*'),
      ]);
      
      const products = await productsRes.json();
      const vendors = await vendorsRes.json();
      const orders = await ordersRes.json();
      
      const totalRevenue = orders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.totalAmount || 0), 0);
      
      const totalOrders = orders.length;
      const totalProducts = products.length;
      const totalSellers = vendors.length;
      
      const recentOrders = orders.slice(0, 5).map((order: any) => normalizeOrder(order));
      
      const topSellers = vendors.map((vendor: any) => {
        const vendorOrders = orders.filter((order: any) => 
          order.vendor?.id === vendor.id);
        const revenue = vendorOrders.reduce((sum: number, order: any) => 
          sum + parseFloat(order.totalAmount || 0), 0);
        
        return {
          ...normalizeVendor(vendor),
          revenue,
          orderCount: vendorOrders.length,
        };
      }).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);
      
      return {
        totalRevenue,
        totalSellers,
        totalOrders,
        totalProducts,
        recentOrders,
        topSellers,
      };
    },
  });
}

export function useSellerAnalytics(sellerId: number | undefined) {
  return useQuery({
    queryKey: ['/api/analytics/seller', sellerId],
    queryFn: async () => {
      // Fetch seller-specific data
      const [productsRes, ordersRes] = await Promise.all([
        apiRequest('GET', `/api/products?filters[vendor][id][$eq]=${sellerId}&populate=*`),
        apiRequest('GET', `/api/orders?filters[vendor][id][$eq]=${sellerId}&populate=*`),
      ]);
      
      const products = await productsRes.json();
      const orders = await ordersRes.json();
      
      const totalRevenue = orders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.totalAmount || 0), 0);
      
      const totalOrders = orders.length;
      const totalProducts = products.length;
      
      const recentOrders = orders.slice(0, 5).map((order: any) => normalizeOrder(order));
      
      const topProducts = products.map((product: any) => {
        const productOrders = orders.filter((order: any) => 
          order.products?.some((p: any) => p.id === product.id));
        const revenue = productOrders.reduce((sum: number, order: any) => 
          sum + parseFloat(order.totalAmount || 0), 0);
        
        return {
          ...normalizeProduct(product),
          salesCount: productOrders.length,
          revenue,
        };
      }).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);
      
      return {
        totalRevenue,
        totalOrders,
        totalProducts,
        recentOrders,
        topProducts,
      };
    },
    enabled: !!sellerId && sellerId > 0,
    retry: (failureCount, error) => {
      // Don't retry if permission denied (403) or not found (404)
      if (error instanceof Error && (error.message.includes('403') || error.message.includes('404'))) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useSellerEarnings(vendorId: number | undefined) {
  return useQuery({
    queryKey: ['/api/earnings/seller', vendorId],
    queryFn: async () => {
      // Fetch seller-specific orders
      const response = await apiRequest('GET', `/api/orders?filters[vendor][id][$eq]=${vendorId}&populate=*`);
      const data = await response.json();
      const orders = data.data || data;
      
      if (!Array.isArray(orders)) {
        return {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          weeklyEarnings: [],
          monthlyEarnings: [],
          topProducts: [],
          recentOrders: [],
          performanceMetrics: {
            orderCompletionRate: 0,
            customerSatisfaction: 0,
            productPerformance: 0,
            revenueGrowth: 0
          }
        };
      }
      
      // Calculate total revenue and orders
      const totalRevenue = orders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.totalAmount || 0), 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Calculate weekly earnings (last 7 days)
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weeklyOrders = orders.filter((order: any) => 
        new Date(order.createdAt) >= weekAgo);
      
      const weeklyEarnings = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayOrders = weeklyOrders.filter((order: any) => {
          const orderDate = new Date(order.createdAt);
          return orderDate.toDateString() === date.toDateString();
        });
        const dayRevenue = dayOrders.reduce((sum: number, order: any) => 
          sum + parseFloat(order.totalAmount || 0), 0);
        
        weeklyEarnings.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          sales: dayRevenue
        });
      }
      
      // Calculate monthly earnings (last 30 days)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const monthlyOrders = orders.filter((order: any) => 
        new Date(order.createdAt) >= monthAgo);
      
      const monthlyEarnings = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayOrders = monthlyOrders.filter((order: any) => {
          const orderDate = new Date(order.createdAt);
          return orderDate.toDateString() === date.toDateString();
        });
        const dayRevenue = dayOrders.reduce((sum: number, order: any) => 
          sum + parseFloat(order.totalAmount || 0), 0);
        
        monthlyEarnings.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sales: dayRevenue
        });
      }
      
      // Calculate top products
      const productRevenue: { [key: string]: { revenue: number; count: number; name: string } } = {};
      orders.forEach((order: any) => {
        if (order.products && Array.isArray(order.products)) {
          order.products.forEach((product: any) => {
            const productId = product.id || product.product?.id;
            const productName = product.name || product.product?.name || 'Unknown Product';
            if (productId) {
              if (!productRevenue[productId]) {
                productRevenue[productId] = { revenue: 0, count: 0, name: productName };
              }
              productRevenue[productId].revenue += parseFloat(order.totalAmount || 0) / order.products.length;
              productRevenue[productId].count += 1;
            }
          });
        }
      });
      
      const topProducts = Object.values(productRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(product => ({
          id: product.name,
          name: product.name,
          revenue: product.revenue,
          salesCount: product.count
        }));
      
      // Calculate performance metrics
      const completedOrders = orders.filter((order: any) => 
        order.status === 'delivered' || order.status === 'completed').length;
      const orderCompletionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
      
      // Calculate revenue growth (compare current month vs previous month)
      const currentDate = new Date();
      const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      
      const currentMonthOrders = orders.filter((order: any) => 
        new Date(order.createdAt) >= currentMonthStart);
      const previousMonthOrders = orders.filter((order: any) => 
        new Date(order.createdAt) >= previousMonthStart && new Date(order.createdAt) <= previousMonthEnd);
      
      const currentMonthRevenue = currentMonthOrders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.totalAmount || 0), 0);
      const previousMonthRevenue = previousMonthOrders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.totalAmount || 0), 0);
      
      const revenueGrowth = previousMonthRevenue > 0 
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : 0;
      
      // Calculate product performance (percentage of products with sales)
      const productsWithSales = new Set();
      orders.forEach((order: any) => {
        if (order.products && Array.isArray(order.products)) {
          order.products.forEach((product: any) => {
            const productId = product.id || product.product?.id;
            if (productId) {
              productsWithSales.add(productId);
            }
          });
        }
      });
      
      // Get total products count from topProducts length or use a default
      const totalProductsCount = topProducts.length;
      const productPerformance = totalProductsCount > 0 
        ? (productsWithSales.size / totalProductsCount) * 100 
        : 0;
      
      // Calculate customer satisfaction (placeholder - would need reviews system)
      // For now, calculate based on order completion rate
      let customerSatisfaction = 4.0; // Default rating
      
      if (totalOrders > 0) {
        // Only calculate satisfaction if there are orders
        if (orderCompletionRate > 80) customerSatisfaction = 4.5;
        else if (orderCompletionRate > 60) customerSatisfaction = 4.0;
        else if (orderCompletionRate > 40) customerSatisfaction = 3.5;
        else if (orderCompletionRate > 20) customerSatisfaction = 3.0;
        else customerSatisfaction = 2.5;
      } else {
        // No orders yet - show neutral rating
        customerSatisfaction = 4.0;
      }
      
      // Recent orders (last 10)
      const recentOrders = orders
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map((order: any) => normalizeOrder(order));
      
      return {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        weeklyEarnings,
        monthlyEarnings,
        topProducts,
        recentOrders,
        performanceMetrics: {
          orderCompletionRate: Math.round(orderCompletionRate),
          customerSatisfaction: customerSatisfaction,
          productPerformance: Math.round(productPerformance),
          revenueGrowth: Math.round(revenueGrowth)
        }
      };
    },
    enabled: !!vendorId && vendorId > 0,
  });
} 