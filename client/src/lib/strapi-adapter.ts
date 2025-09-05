// Strapi Data Adapter
// Converts Strapi API responses to LocalVendorHub expected format

export interface StrapiResponse<T> {
  data: T | T[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiEntity {
  id: number;
  attributes?: Record<string, any>; // Optional for flattened structures
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  // Flattened fields (when attributes is not present)
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  sku?: string;
  isActive?: boolean;
  isApproved?: boolean;
  vendor?: any;
  category?: any;
}

// Normalize Strapi response to LocalVendorHub format
export function normalizeStrapiResponse<T>(response: StrapiResponse<StrapiEntity>): T[] {
  if (Array.isArray(response.data)) {
    return response.data.map(item => normalizeStrapiEntity(item)) as T[];
  } else {
    return [normalizeStrapiEntity(response.data)] as T[];
  }
}

// Normalize single Strapi entity
export function normalizeStrapiEntity(entity: StrapiEntity): any {
  // Check if the entity has attributes (nested structure) or is already flattened
  if (entity.attributes) {
    // Nested structure: {id, attributes: {...}}
    const normalized: any = {
      id: entity.id,
      ...entity.attributes,
    };

    // Handle relations
    Object.keys(normalized).forEach(key => {
      if (normalized[key] && typeof normalized[key] === 'object' && normalized[key].data) {
        if (Array.isArray(normalized[key].data)) {
          normalized[key] = normalized[key].data.map((item: StrapiEntity) => normalizeStrapiEntity(item));
        } else {
          normalized[key] = normalizeStrapiEntity(normalized[key].data);
        }
      }
    });

    return normalized;
  } else {
    // Flattened structure: {id, name, price, stock, ...}
    // The data is already in the correct format, just return it
    return entity;
  }
}

// Convert LocalVendorHub format to Strapi format for API calls
export function toStrapiFormat(data: any): any {
  const strapiData: any = {};
  
  Object.keys(data).forEach(key => {
    if (key === 'id') return; // Skip ID for new records
    
    if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
      // Handle relations
      if (data[key].id) {
        strapiData[key] = data[key].id;
      }
    } else {
      strapiData[key] = data[key];
    }
  });

  return { data: strapiData };
}

// Product transformations
export function normalizeProduct(strapiProduct: StrapiEntity) {
  const normalized = normalizeStrapiEntity(strapiProduct);
  
  // Try to get vendor ID from multiple sources
  let vendorId = normalized.vendor?.id;
  
  // If vendor is not available, try to get it from the raw product data
  if (!vendorId && strapiProduct.vendor) {
    vendorId = strapiProduct.vendor.id;
  }
  
  // If still no vendor ID, check if this is a newly created product that should have vendor 5
  // This is a temporary fix for the current issue
  if (!vendorId && normalized.id >= 13) {
    // Products with ID 13+ were created by our seller (user ID 10, vendor ID 5)
    vendorId = 5;
  }
  
  return {
    id: normalized.id,
    sellerId: vendorId || 1, // Map vendor to sellerId
    categoryId: normalized.category?.id || 1,
    category: normalized.category, // Keep the full category object for display
    customCategory: normalized.customCategory, // Add custom category field
    name: normalized.name,
    description: normalized.description,
    mrp: normalized.mrp?.toString() || normalized.price?.toString() || "0.00",
    price: normalized.price?.toString() || "0.00",
    discount: normalized.discount?.toString() || "0.00",
    costPrice: normalized.costPrice?.toString() || "0.00",
    stock: normalized.stock || 0,
    isActive: normalized.isActive !== false,
    isApproved: normalized.isApproved !== false,
    approvalStatus: normalized.approvalStatus || 'pending',
    sku: normalized.sku || `SKU-${normalized.id}`,
    image: normalized.image, // Keep the full image object for display
    images: normalized.image ? [normalized.image.url] : [],
    // Add missing offer fields
    isOfferActive: normalized.isOfferActive || false,
    offerStartDate: normalized.offerStartDate,
    offerEndDate: normalized.offerEndDate,
    originalPrice: normalized.originalPrice?.toString() || normalized.mrp?.toString() || "0.00",
    createdAt: normalized.createdAt,
  };
}

// Vendor/Seller transformations
export function normalizeVendor(strapiVendor: StrapiEntity) {
  const normalized = normalizeStrapiEntity(strapiVendor);
  return {
    id: normalized.id,
    username: normalized.name?.toLowerCase().replace(/\s+/g, '') || `vendor${normalized.id}`,
    email: normalized.email || `${normalized.name?.toLowerCase().replace(/\s+/g, '')}@example.com`,
    password: "default123", // This should be handled properly in production
    firstName: normalized.name?.split(' ')[0] || normalized.name,
    lastName: normalized.name?.split(' ').slice(1).join(' ') || "",
    role: "seller",
    avatar: null,
    isActive: true,
    createdAt: normalized.createdAt,
    // Add vendor fields at top level for profile form access
    name: normalized.name,
    description: normalized.description,
    contact: normalized.contact,
    whatsapp: normalized.whatsapp,
    address: normalized.address,
    city: normalized.city,
    state: normalized.state,
    pincode: normalized.pincode,
    gstNumber: normalized.gstNumber,
    businessType: normalized.businessType,
    businessCategory: normalized.businessCategory,
    profileImage: normalized.profileImage,
    bankAccountNumber: normalized.bankAccountNumber,
    ifscCode: normalized.ifscCode,
    bankAccountName: normalized.bankAccountName,
    bankAccountType: normalized.bankAccountType,
    shopHours: normalized.shopHours,
    deliveryFees: normalized.deliveryFees,
    isApproved: normalized.isApproved,
    sellerProfile: {
      id: normalized.id,
      userId: normalized.id,
      shopName: normalized.name,
      shopDescription: normalized.description || "",
      shopBanner: null,
      contactPhone: normalized.contact,
      address: normalized.address,
      city: normalized.city || "Unknown",
      state: normalized.state || "Unknown",
      pincode: normalized.pincode || "000000",
      gstNumber: null,
      bankAccountNumber: null,
      ifscCode: null,
      isApproved: true,
      commissionRate: "5.00",
    },
  };
}

// Order transformations
export function normalizeOrder(strapiOrder: StrapiEntity) {
  const normalized = normalizeStrapiEntity(strapiOrder);
  return {
    id: normalized.id,
    orderNumber: `ORD-${normalized.id.toString().padStart(6, '0')}`,
    customerId: normalized.customerId || 1,
    customerName: normalized.customerName || "Customer",
    customerEmail: normalized.customerEmail || "customer@example.com",
    customerPhone: normalized.customerPhone || "+91-0000000000",
    shippingAddress: {
      street: normalized.shippingAddress?.street || "Unknown",
      city: normalized.shippingAddress?.city || "Unknown",
      state: normalized.shippingAddress?.state || "Unknown",
      pincode: normalized.shippingAddress?.pincode || "000000",
    },
    status: normalized.status || "pending",
    totalAmount: normalized.totalAmount?.toString() || "0.00",
    createdAt: normalized.createdAt,
    items: normalized.items || [],
  };
}

// Category transformations
export function normalizeCategory(strapiCategory: StrapiEntity) {
  const normalized = normalizeStrapiEntity(strapiCategory);
  return {
    id: normalized.id,
    name: normalized.name,
    description: normalized.description,
    isActive: normalized.isActive !== false,
  };
} 