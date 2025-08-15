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
      console.log('🔍 useProducts - fetching products...');
      const response = await apiRequest('GET', '/api/products?populate=*');
      const data = await response.json();
      
      console.log('🔍 useProducts - raw data:', data);
      
      // Handle both Strapi format { data: [...], meta: {...} } and direct array format
      const products = data.data || data;
      
      if (Array.isArray(products)) {
        const normalizedProducts = products.map((product: any) => normalizeProduct(product));
        console.log('🔍 useProducts - normalized products:', normalizedProducts);
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
          price: productData.price,
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
      const strapiData = toStrapiFormat(data);
      const response = await apiRequest('PUT', `/api/vendors/${id}`, strapiData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
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
      console.log('🔍 useOrders - fetching orders...');
      const response = await apiRequest('GET', '/api/orders?populate=*');
      const data = await response.json();
      
      console.log('🔍 useOrders - raw data:', data);
      
      // Handle both Strapi format { data: [...], meta: {...} } and direct array format
      const orders = data.data || data;
      
      if (Array.isArray(orders)) {
        const normalizedOrders = orders.map((order: any) => normalizeOrder(order));
        console.log('🔍 useOrders - normalized orders:', normalizedOrders);
        return normalizedOrders;
      } else {
        console.error('Unexpected orders data format:', data);
        return [];
      }
    },
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
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest('PUT', `/api/orders/${id}`, { data: { status } });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
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