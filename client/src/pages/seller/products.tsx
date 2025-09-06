import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useProducts, useCategories, useCreateProduct, useUpdateProduct, useDeleteProduct, useUpdateProductStatus, useToggleProductActive } from '@/hooks/use-api';
import { z } from 'zod';
import { getImageUrl, API_CONFIG } from '@/lib/config';


// Product form schema
const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  mrp: z.string().min(1, "MRP is required"),
  price: z.string().min(1, "Selling price is required"),
  discount: z.string().optional(),
  stock: z.number().min(0, "Stock must be 0 or greater"),
  categoryId: z.number().optional(),
  customCategory: z.string().optional(),
  image: z.any().optional(), // For single image upload
  offerStartDate: z.string().optional(),
  offerEndDate: z.string().optional(),
  isOfferActive: z.boolean().default(false),
}).refine((data) => {
  // If categoryId is -1 (Other), customCategory is required
  if (data.categoryId === -1) {
    return data.customCategory && data.customCategory.trim().length > 0;
  }
  return true;
}, {
  message: "Custom category name is required when selecting 'Other'",
  path: ["customCategory"],
});

type ProductFormData = z.infer<typeof productFormSchema>;



// Helper function to normalize Strapi product data
const normalizeProduct = (product: any) => {
  const price = product.attributes?.price || product.price || 0;
  const mrp = product.attributes?.mrp || product.mrp || price; // Default MRP to price if not set
  const discount = product.attributes?.discount || product.discount || 0;
  
  return {
    id: product.id,
    name: product.attributes?.name || product.name,
    description: product.attributes?.description || product.description,
    mrp: mrp,
    price: price,
    discount: discount,
    stock: product.attributes?.stock || product.stock,
    isActive: product.attributes?.isActive !== false,
    isApproved: product.attributes?.isApproved !== false,
    approvalStatus: product.attributes?.approvalStatus || 'pending',
    image: product.attributes?.image?.data?.attributes?.url || product.image?.data?.attributes?.url,
    category: product.attributes?.category?.data?.attributes?.name || product.category?.data?.attributes?.name,
    vendor: product.attributes?.vendor?.data?.attributes?.name || product.vendor?.data?.attributes?.name,
    vendorId: product.attributes?.vendor?.data?.id || product.vendor?.data?.id || product.vendorId,
    createdAt: product.attributes?.createdAt || product.createdAt,
    updatedAt: product.attributes?.updatedAt || product.updatedAt,
    // Offer fields
    offerStartDate: product.attributes?.offerStartDate || product.offerStartDate,
    offerEndDate: product.attributes?.offerEndDate || product.offerEndDate,
    isOfferActive: product.attributes?.isOfferActive || product.isOfferActive || false,
    originalPrice: product.attributes?.originalPrice || product.originalPrice,
  };
};

export default function SellerProducts() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteProduct, setDeleteProduct] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [calculatedDiscount, setCalculatedDiscount] = useState<string>('');
  const [showOfferFields, setShowOfferFields] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isLoading: userLoading } = useAuth();

  // Helper function to get role name safely
  const getRoleName = (role: any) => {
    if (typeof role === 'string') return role;
    if (role?.name) return role.name;
    return 'Unknown';
  };

  // Helper function to check if user is seller
  const isSeller = (user: any) => {
    const roleName = getRoleName(user?.role);
    return roleName === 'seller';
  };

  // Helper function to get vendor ID with fallback
  const getVendorId = (user: any) => {
    // Only use the vendorId from the database, no hardcoded mapping
    return user?.vendorId;
  };

  // Function to clean expired offers
  const cleanExpiredOffers = async () => {
    try {
      const response = await fetch('/api/products/offers/check-expired', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clean expired offers');
      }

      const result = await response.json();
      
      toast({
        title: "Expired Offers Cleaned",
        description: `Updated ${result.data.updatedCount} products with expired offers`,
      });

      // Refresh the products list
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.error('Error cleaning expired offers:', error);
      toast({
        title: "Error",
        description: "Failed to clean expired offers. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper function to safely access product data (handles both Strapi and normalized formats)
  const getProductData = (product: any, field: string) => {
    // Try Strapi format first (with attributes wrapper)
    if (product.attributes && product.attributes[field] !== undefined) {
      return product.attributes[field];
    }
    
    // Try direct field access (flattened response)
    if (product[field] !== undefined) {
      return product[field];
    }
    
    // Handle missing MRP and discount for old products
    if (field === 'mrp') {
      return product.attributes?.price || product.price || 0;
    }
    if (field === 'discount') {
      return product.attributes?.discount || product.discount || 0;
    }
    
    // Return undefined if field not found
    return undefined;
  };

  // Helper function to safely access nested product data
  const getProductNestedData = (product: any, path: string[]) => {
    // Try Strapi format first
    let current = product;
    for (const key of path) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    return current;
  };

  // Helper function to get category name from product
  const getCategoryName = (product: any) => {
    // First check for custom category
    const customCategory = getProductData(product, 'customCategory');
    
    if (customCategory) {
      return customCategory;
    }
    
    // Try multiple paths for category name from relation
    const categoryName = getProductNestedData(product, ['category', 'data', 'attributes', 'name']) ||
           getProductNestedData(product, ['category', 'name']) ||
           getProductNestedData(product, ['category', 'attributes', 'name']) ||
           'Uncategorized';
    
    return categoryName;
  };

  // Helper function to get image path from product
  const getProductImagePath = (product: any) => {
    // Try multiple paths for image URL
    return getProductNestedData(product, ['image', 'data', 'attributes', 'url']) ||
           getProductNestedData(product, ['image', 'url']) ||
           getProductNestedData(product, ['image', 'attributes', 'url']) ||
           null;
  };

  // Helper function to get status display info
  const getStatusInfo = (product: any) => {
    const approvalStatus = getProductData(product, 'approvalStatus') || 'pending';
    const isActive = getProductData(product, 'isActive') !== false;
    
    if (approvalStatus === 'rejected') {
      return {
        text: 'Rejected',
        variant: 'destructive' as const,
        color: 'text-red-600',
        bgColor: 'bg-red-100'
      };
    }
    
    if (approvalStatus === 'pending') {
      return {
        text: 'Pending Approval',
        variant: 'secondary' as const,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100'
      };
    }
    
    if (approvalStatus === 'approved') {
      if (isActive) {
        return {
          text: 'Active',
          variant: 'default' as const,
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        };
      } else {
        return {
          text: 'Inactive',
          variant: 'outline' as const,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        };
      }
    }
    
    return {
      text: 'Unknown',
      variant: 'outline' as const,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    };
  };

  // Fetch all products and filter by seller
  const { data: allProducts, isLoading, error } = useProducts();
  
  // Filter products for the current seller
  // Use only the vendorId from the user object (no fallback)
  const effectiveVendorId = user?.vendorId;
  
  const products = Array.isArray(allProducts) ? allProducts.filter((product: any) => {
    // Check multiple possible vendor ID fields
    const productVendorId = product.vendor?.id || product.vendorId || product.sellerId;
    
    return productVendorId === effectiveVendorId;
  }) : [];
  
  // Set current image URL when editing product changes
  useEffect(() => {
    if (editingProduct) {
      const imagePath = getProductImagePath(editingProduct);
      setCurrentImageUrl(imagePath ? getImageUrl(imagePath) : null);
    } else {
      setCurrentImageUrl(null);
    }
  }, [editingProduct]);



  // Filter and search products
  const filteredProducts = products.filter((product: any) => {
    // Status filter
    const approvalStatus = getProductData(product, 'approvalStatus') || 'pending';
    const isActive = getProductData(product, 'isActive') !== false;
    
    if (statusFilter === 'pending') return approvalStatus === 'pending';
    if (statusFilter === 'approved') return approvalStatus === 'approved';
    if (statusFilter === 'rejected') return approvalStatus === 'rejected';
    if (statusFilter === 'active') return approvalStatus === 'approved' && isActive;
    if (statusFilter === 'inactive') return approvalStatus === 'approved' && !isActive;
    
    // Stock filter
    const stock = getProductData(product, 'stock') || 0;
    if (stockFilter === 'low') return stock <= 5;
    if (stockFilter === 'out') return stock === 0;
    if (stockFilter === 'normal') return stock > 5;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = getProductData(product, 'name') || '';
      const description = getProductData(product, 'description') || '';
      const categoryName = getCategoryName(product);
      
      return (
        name.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query) ||
        categoryName.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Fetch categories for the form
  const { data: categories } = useCategories();



  // Function to calculate discount
  const calculateDiscount = (mrp: string, sellingPrice: string) => {
    const mrpValue = parseFloat(mrp) || 0;
    const sellingPriceValue = parseFloat(sellingPrice) || 0;
    
    if (mrpValue > 0 && sellingPriceValue > 0 && mrpValue >= sellingPriceValue) {
      const discount = ((mrpValue - sellingPriceValue) / mrpValue) * 100;
      return discount.toFixed(2);
    }
    return '0.00';
  };

  const form = useForm<ProductFormData>({
    // Temporarily disable validation to debug form submission
    // resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      mrp: '',
      price: '',
      discount: '',
      stock: 0,
      categoryId: undefined,
      image: undefined,
      customCategory: '',
      offerStartDate: '',
      offerEndDate: '',
      isOfferActive: false,
    },
  });

  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const updateProductStatusMutation = useUpdateProductStatus();
  const toggleProductActiveMutation = useToggleProductActive();

  // Define columns for DataTable
  const columns = [
    {
      key: 'product',
      header: 'Product',
      width: '300px',
      render: (value: any, product: any) => (
        <div className="flex items-center space-x-3">
          {getProductImagePath(product) ? (
            <img 
              src={getImageUrl(getProductImagePath(product))} 
              alt={getProductData(product, 'name')}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
              <i className="fas fa-image text-gray-400"></i>
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{getProductData(product, 'name')}</p>
            <p className="text-sm text-gray-500">{(getProductData(product, 'description') || '').slice(0, 50)}...</p>
          </div>
        </div>
      )
    },
    {
      key: 'mrp',
      header: 'MRP',
      width: '100px',
      sortable: true,
      render: (value: any, product: any) => (
        <div>₹{parseFloat(getProductData(product, 'mrp') || getProductData(product, 'price') || 0).toLocaleString()}</div>
      )
    },
    {
      key: 'price',
      header: 'Selling Price',
      width: '120px',
      sortable: true,
      render: (value: any, product: any) => {
        const isOfferActive = getProductData(product, 'isOfferActive');
        const offerEndDate = getProductData(product, 'offerEndDate');
        const originalPrice = getProductData(product, 'originalPrice');
        const mrp = getProductData(product, 'mrp');
        
        // Check if offer has expired
        let displayPrice = getProductData(product, 'price') || 0;
        let isExpired = false;
        
        if (isOfferActive && offerEndDate) {
          const endDate = new Date(offerEndDate);
          const now = new Date();
          isExpired = endDate < now;
          
          // If expired, show original price (MRP)
          if (isExpired) {
            displayPrice = originalPrice || mrp || displayPrice;
          }
        }
        
        return (
          <div className={isExpired ? 'text-red-600 font-medium' : ''}>
            ₹{parseFloat(displayPrice).toLocaleString()}
            {isExpired && (
              <div className="text-xs text-red-500 mt-1">
                (Offer expired)
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'discount',
      header: 'Discount',
      width: '100px',
      sortable: true,
      render: (value: any, product: any) => {
        const isOfferActive = getProductData(product, 'isOfferActive');
        const offerEndDate = getProductData(product, 'offerEndDate');
        
        // Check if offer has expired
        let displayDiscount = parseFloat(getProductData(product, 'discount') || '0');
        let isExpired = false;
        
        if (isOfferActive && offerEndDate) {
          const endDate = new Date(offerEndDate);
          const now = new Date();
          isExpired = endDate < now;
          
          // If expired, show 0% discount
          if (isExpired) {
            displayDiscount = 0;
          }
        }
        
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            displayDiscount > 0
              ? 'bg-green-100 text-green-800'
              : isExpired
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {displayDiscount.toFixed(1)}%
            {isExpired && displayDiscount === 0 && (
              <span className="ml-1 text-xs">(expired)</span>
            )}
          </span>
        );
      }
    },
    {
      key: 'offer',
      header: 'Offer',
      width: '120px',
      sortable: true,
      render: (value: any, product: any) => {
        
        const isOfferActive = getProductData(product, 'isOfferActive');
        const offerEndDate = getProductData(product, 'offerEndDate');
        const discount = parseFloat(getProductData(product, 'discount') || '0');
        
        // Check if there's an active offer with end date
        if (isOfferActive && offerEndDate) {
          const endDate = new Date(offerEndDate);
          const now = new Date();
          const isExpired = endDate < now;
          
          if (isExpired) {
            return (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Expired
              </span>
            );
          }
          
          // Calculate time remaining
          const timeRemaining = endDate.getTime() - now.getTime();
          const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
          
          return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800" 
                  title={`Expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`}>
              {daysRemaining}d left
            </span>
          );
        }
        
        // Check if there's an active offer but no time limit set
        if (isOfferActive && !offerEndDate && discount > 0) {
          return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Time Not Set
            </span>
          );
        }
        
        // Check if there's a discount but no active offer (permanent discounts)
        if (discount > 0) {
          return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {discount}% OFF
            </span>
          );
        }
        
        // No offer or discount
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            No Offer
          </span>
        );
      }
    },
    {
      key: 'stock',
      header: 'Stock',
      width: '100px',
      sortable: true,
      render: (value: any, product: any) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          (getProductData(product, 'stock') || 0) === 0 
            ? 'bg-red-100 text-red-800'
            : (getProductData(product, 'stock') || 0) <= 5
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {getProductData(product, 'stock') || 0} units
        </span>
      )
    },
    {
      key: 'category',
      header: 'Category',
      width: '120px',
      sortable: true,
      render: (value: any, product: any) => {
        const categoryName = getCategoryName(product);
        const isCustomCategory = getProductData(product, 'customCategory');
        
        return (
          <div className="flex items-center space-x-1">
            <Badge variant={isCustomCategory ? "outline" : "secondary"}>
              {categoryName}
            </Badge>
            {isCustomCategory && (
              <span className="text-xs text-gray-500" title="Custom Category">
                ✏️
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      width: '150px',
      sortable: true,
      render: (value: any, product: any) => (
        <div className="flex items-center space-x-2">
          {getProductData(product, 'approvalStatus') === 'approved' ? (
            <div className="flex items-center space-x-2">
              <Switch
                checked={getProductData(product, 'isActive') !== false && getProductData(product, 'isActive') !== undefined}
                onCheckedChange={async (checked) => {
                  try {
                    await toggleProductActiveMutation.mutateAsync({
                      id: product.id,
                      isActive: checked
                    });
                    toast({
                      title: "Success",
                      description: `Product ${checked ? 'activated' : 'deactivated'} successfully`,
                    });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to update product status",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={toggleProductActiveMutation.isPending}
              />
              <span className="text-xs text-gray-600">
                {getProductData(product, 'isActive') !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
          ) : (
            <Badge variant={getStatusInfo(product).variant}>
              {getStatusInfo(product).text}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '200px',
      render: (value: any, product: any) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(product)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            disabled={updateProductMutation.isPending}
          >
            {updateProductMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                Updating...
              </>
            ) : (
              <>
                <i className="fas fa-edit mr-1"></i>
                Edit
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => confirmDelete(product)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={deleteProductMutation.isPending}
          >
            {deleteProductMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                Deleting...
              </>
            ) : (
              <>
                <i className="fas fa-trash mr-1"></i>
                Delete
              </>
            )}
          </Button>
        </div>
      )
    }
  ];

  const handleSubmit = async (data: ProductFormData) => {
    try {
      const effectiveVendorId = user?.vendorId;
      
      // Convert form data to Strapi format
      const productData: any = {
        name: data.name,
        description: data.description,
        mrp: parseFloat(data.mrp),
        price: parseFloat(data.price),
        discount: parseFloat(calculatedDiscount),
        stock: data.stock,
        vendor: effectiveVendorId ? { id: effectiveVendorId } : undefined, // Include vendor ID
      };
      
      // Handle offer fields if offer is active
      if (data.isOfferActive) {
        productData.isOfferActive = true;
        productData.offerStartDate = data.offerStartDate ? new Date(data.offerStartDate).toISOString() : new Date().toISOString();
        
        // Set default end date to 10 days from now if not provided
        if (data.offerEndDate) {
          productData.offerEndDate = new Date(data.offerEndDate).toISOString();
        } else {
          const defaultEndDate = new Date();
          defaultEndDate.setDate(defaultEndDate.getDate() + 10);
          productData.offerEndDate = defaultEndDate.toISOString();
        }
        
        // If this is a new offer, store the original price
        if (!editingProduct || !editingProduct.originalPrice) {
          productData.originalPrice = parseFloat(data.mrp);
        }
      } else {
        // If offer is being deactivated, clear offer fields
        productData.isOfferActive = false;
        productData.offerStartDate = null;
        productData.offerEndDate = null;
        productData.originalPrice = null;
      }
      
      // Handle category - if "Other" is selected, use custom category name
      if (data.categoryId === -1 && data.customCategory) {
        // For custom category, we'll store it as a string field
        productData.customCategory = data.customCategory.trim();
        productData.category = undefined; // Don't set category relation
      } else if (data.categoryId && data.categoryId > 0) {
        // For existing category, set the relation
        productData.category = { id: data.categoryId };
        productData.customCategory = undefined;
      }
      
      // Handle image upload if present
      if (data.image) {
        productData.image = data.image;
      }
      
      if (editingProduct) {
        await updateProductMutation.mutateAsync({ id: editingProduct.id, data: productData });
        // Force refresh the products data
        queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      } else {
        const result = await createProductMutation.mutateAsync(productData);
        // Force refresh the products data after creation
        queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      }
      setIsAddDialogOpen(false);
      clearForm();
    } catch (error) {
      console.error('Error submitting product:', error);
      // Show more detailed error information
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    
    const price = (getProductData(product, 'price') || 0).toString();
    const mrp = (getProductData(product, 'mrp') || price).toString(); // Use price as MRP if MRP is not set
    const discount = calculateDiscount(mrp, price);
    
    // Check if product has a custom category
    const customCategory = getProductData(product, 'customCategory');
    const categoryId = getProductNestedData(product, ['category', 'data', 'id']) || 
                      getProductNestedData(product, ['category', 'id']);
    
    // Get offer data
    const offerStartDate = getProductData(product, 'offerStartDate');
    const offerEndDate = getProductData(product, 'offerEndDate');
    const isOfferActive = getProductData(product, 'isOfferActive') || false;
    
    console.log('🔍 Editing product offer data:', {
      offerStartDate,
      offerEndDate,
      isOfferActive,
      productId: product.id
    });
    
    // Convert dates to datetime-local format (YYYY-MM-DDTHH:MM)
    const formatDateForInput = (dateString: string | null | undefined) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
      } catch (error) {
        console.error('Error formatting date:', error);
        return '';
      }
    };
    
    const formattedStartDate = formatDateForInput(offerStartDate);
    const formattedEndDate = formatDateForInput(offerEndDate);
    
    form.reset({
      name: getProductData(product, 'name') || '',
      description: getProductData(product, 'description') || '',
      mrp: mrp,
      price: price,
      discount: discount,
      stock: getProductData(product, 'stock') || 0,
      categoryId: customCategory ? -1 : (categoryId || undefined), // Set to -1 if custom category
      customCategory: customCategory || '', // Set custom category if exists
      image: undefined, // Reset image for edit
      offerStartDate: formattedStartDate,
      offerEndDate: formattedEndDate,
      isOfferActive: isOfferActive,
    });
    
    // Set offer fields visibility
    setShowOfferFields(isOfferActive);
    
    setCalculatedDiscount(discount);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProductMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const confirmDelete = (product: any) => {
    setDeleteProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (deleteProduct) {
      try {
        await deleteProductMutation.mutateAsync(deleteProduct.id);
        setIsDeleteDialogOpen(false);
        setDeleteProduct(null);
      } catch (error) {
        console.error('Error executing delete:', error);
      }
    }
  };

  const clearForm = () => {
    setEditingProduct(null);
    setCurrentImageUrl(null);
    setCalculatedDiscount('');
    setShowOfferFields(false);
    form.reset({
      name: '',
      description: '',
      mrp: '',
      price: '',
      discount: '',
      stock: 0,
      categoryId: undefined,
      image: undefined,
      customCategory: '',
      offerStartDate: '',
      offerEndDate: '',
      isOfferActive: false,
    });
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    clearForm();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <MobileNav />
        <main className="flex-1 lg:ml-64 p-4 lg:p-8 pb-20 lg:pb-8" style={{ paddingTop: '70px' }}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load products</h3>
              <p className="text-gray-600 mb-4">Unable to connect to the backend. Please try again later.</p>
              <Button onClick={() => window.location.reload()}>
                <i className="fas fa-refresh mr-2"></i>
                Retry
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <MobileNav />
      
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pb-20 lg:pb-8" style={{ paddingTop: '70px' }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900">
              {effectiveVendorId ? 'My Products' : 'All Seller Products'}
            </h2>
            <p className="text-gray-600 mt-2">
              {effectiveVendorId 
                ? 'Manage your product catalog and inventory' 
                : 'Review and manage products from all sellers'
              }
            </p>
          </div>
          {(effectiveVendorId || (user?.role && typeof user.role === 'object' && user.role.name === 'seller')) && (
            <div className="flex-shrink-0 flex space-x-2">
              <Button 
                variant="outline"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/products'] });
                  toast({
                    title: "Refreshed",
                    description: "Product data has been refreshed",
                  });
                }}
              >
                <i className="fas fa-refresh mr-2"></i>
                Refresh
              </Button>

              <Button onClick={() => {
                clearForm();
                setIsAddDialogOpen(true);
              }}>
                <i className="fas fa-plus mr-2"></i>
                Add Product
              </Button>

              <Button 
                variant="outline"
                onClick={cleanExpiredOffers}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <i className="fas fa-clock mr-2"></i>
                Clean Expired Offers
              </Button>


            </div>
          )}
        </div>

        {/* Status Summary */}
        {effectiveVendorId && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-gray-900">{products.filter((p: any) => getProductData(p, 'approvalStatus') === 'pending').length}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{products.filter((p: any) => getProductData(p, 'approvalStatus') === 'approved' && getProductData(p, 'isActive') !== false).length}</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-gray-600">{products.filter((p: any) => getProductData(p, 'approvalStatus') === 'approved' && getProductData(p, 'isActive') === false).length}</div>
              <div className="text-sm text-gray-600">Inactive</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-red-600">{products.filter((p: any) => getProductData(p, 'approvalStatus') === 'rejected').length}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-yellow-600">{products.filter((p: any) => (getProductData(p, 'stock') || 0) <= 5).length}</div>
              <div className="text-sm text-gray-600">Low Stock</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-gray-900">{products.length}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        )}



        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          {effectiveVendorId ? (
            <div className="flex-shrink-0 flex space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="low">Low Stock (≤5)</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                  <SelectItem value="normal">Normal Stock (&gt;5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Showing all products from all sellers
            </div>
          )}
        </div>

        {/* Add Product Dialog - Only show for sellers */}
        {(effectiveVendorId || (user?.role && typeof user.role === 'object' && user.role.name === 'seller')) && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct 
                    ? 'Update your product information. Old products will be updated with MRP and discount fields.'
                    : 'Create a new product for your store'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* Product Image Upload */}
                <div>
                  <Label htmlFor="image">Product Image</Label>
                  <div className="mt-2 flex items-center space-x-4">
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      {form.watch('image') ? (
                        <img
                          src={URL.createObjectURL(form.watch('image'))}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : currentImageUrl ? (
                        <img
                          src={currentImageUrl}
                          alt="Current"
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => console.log('🔍 Image failed to load:', currentImageUrl)}
                        />
                      ) : (
                        <i className="fas fa-image text-gray-400 text-2xl"></i>
                      )}
                    </div>
                    <div className="flex-1">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            form.setValue('image', file);
                          }
                        }}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {editingProduct ? 'Upload new image to replace current one' : 'Recommended: 800x600px, Max 2MB'}
                      </p>
                      {editingProduct && (
                        <p className="text-xs text-blue-600 mt-1">

                        </p>
                      )}
                      {editingProduct && currentImageUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentImageUrl(null);
                            form.setValue('image', null);
                          }}
                          className="mt-2 text-red-600 hover:text-red-700"
                        >
                          <i className="fas fa-trash mr-1"></i>
                          Remove Current Image
                        </Button>
                      )}
                    </div>
                  </div>
                </div>



                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="Enter product name"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    {...form.register('description')}
                    placeholder="Enter product description"
                    rows={3}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="mrp">MRP (₹) *</Label>
                    <Input
                      id="mrp"
                      type="number"
                      step="0.01"
                      {...form.register('mrp')}
                      placeholder="0.00"
                      onChange={(e) => {
                        const mrp = e.target.value;
                        const price = form.watch('price');
                        const discount = calculateDiscount(mrp, price);
                        setCalculatedDiscount(discount);
                        form.setValue('discount', discount);
                        
                        // Auto-enable time-limited offer if discount is created
                        if (parseFloat(discount) > 0 && !form.watch('isOfferActive')) {
                          form.setValue('isOfferActive', true);
                          setShowOfferFields(true);
                          
                          // Auto-set offer dates to next 10 days
                          const now = new Date();
                          const endDate = new Date();
                          endDate.setDate(endDate.getDate() + 10);
                          
                          form.setValue('offerStartDate', now.toISOString().slice(0, 16));
                          form.setValue('offerEndDate', endDate.toISOString().slice(0, 16));
                        }
                      }}
                    />
                    {form.formState.errors.mrp && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.mrp.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="price">Selling Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      {...form.register('price')}
                      placeholder="0.00"
                      onChange={(e) => {
                        const price = e.target.value;
                        const mrp = form.watch('mrp');
                        const discount = calculateDiscount(mrp, price);
                        setCalculatedDiscount(discount);
                        form.setValue('discount', discount);
                        
                        // Auto-enable time-limited offer if discount is created
                        if (parseFloat(discount) > 0 && !form.watch('isOfferActive')) {
                          form.setValue('isOfferActive', true);
                          setShowOfferFields(true);
                          
                          // Auto-set offer dates to next 10 days
                          const now = new Date();
                          const endDate = new Date();
                          endDate.setDate(endDate.getDate() + 10);
                          
                          form.setValue('offerStartDate', now.toISOString().slice(0, 16));
                          form.setValue('offerEndDate', endDate.toISOString().slice(0, 16));
                        }
                      }}
                    />
                    {form.formState.errors.price && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.price.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="discount">Discount (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      value={calculatedDiscount}
                      readOnly
                      className="bg-gray-50"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                  </div>
                </div>

                {/* Offer Time Limit Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isOfferActive"
                      {...form.register('isOfferActive')}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        form.setValue('isOfferActive', checked);
                        setShowOfferFields(checked);
                        
                        if (checked) {
                          // Auto-set offer dates when activating
                          const now = new Date();
                          const endDate = new Date();
                          endDate.setDate(endDate.getDate() + 10); // 10 days from now
                          
                          form.setValue('offerStartDate', now.toISOString().slice(0, 16));
                          form.setValue('offerEndDate', endDate.toISOString().slice(0, 16));
                        } else {
                          // Clear offer fields and revert price when deactivating
                          form.setValue('offerStartDate', '');
                          form.setValue('offerEndDate', '');
                          
                          // Revert price to MRP and clear discount
                          const mrp = form.getValues('mrp');
                          if (mrp) {
                            form.setValue('price', mrp);
                            form.setValue('discount', '0');
                            setCalculatedDiscount('0'); // Also update the calculated discount state
                          }
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="isOfferActive">Enable Time-Limited Offer</Label>
                  </div>
                  
                  {showOfferFields && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                      <div>
                        <Label htmlFor="offerStartDate">Offer Start Date</Label>
                        <Input
                          id="offerStartDate"
                          type="datetime-local"
                          {...form.register('offerStartDate')}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                        {form.formState.errors.offerStartDate && (
                          <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.offerStartDate.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="offerEndDate">Offer End Date *</Label>
                        <Input
                          id="offerEndDate"
                          type="datetime-local"
                          {...form.register('offerEndDate')}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                        {form.formState.errors.offerEndDate && (
                          <p className="text-sm text-destructive mt-1">
                            {form.formState.errors.offerEndDate.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="md:col-span-2">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800">
                            <strong>Offer Details:</strong> This product will be sold at the discounted price 
                            from {form.watch('offerStartDate') || 'start date'} until {form.watch('offerEndDate') || 'end date'}. 
                            After the offer expires, the price will automatically revert to ₹{form.watch('mrp') || 'MRP'}.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="stock">Stock Quantity *</Label>
                  <Input
                    id="stock"
                    type="number"
                    {...form.register('stock', { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {form.formState.errors.stock && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.stock.message}
                    </p>
                  )}
                </div>



                <div>
                  <Label htmlFor="categoryId">Category</Label>
                  <Select 
                    value={form.watch('categoryId') === -1 ? 'other' : form.watch('categoryId')?.toString()} 
                    onValueChange={(value) => {
                      if (value === 'other') {
                        form.setValue('categoryId', -1); // Use -1 to indicate "Other"
                      } else {
                        form.setValue('categoryId', parseInt(value));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(categories) && categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {getProductData(category, 'name')}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Custom category input when "Other" is selected */}
                  {form.watch('categoryId') === -1 && (
                    <div className="mt-2">
                      <Label htmlFor="customCategory">Custom Category Name</Label>
                      <Input
                        id="customCategory"
                        {...form.register('customCategory')}
                        placeholder="Enter custom category name"
                      />
                      {form.formState.errors.customCategory && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.customCategory.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* <Card> */}
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-box text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  {statusFilter === 'all' && !searchQuery
                    ? "No products available in the catalog. Add your first product to get started."
                    : `No products match the current filters.`
                  }
                </p>
               
                {statusFilter === 'all' && !searchQuery && (user?.vendorId || (user?.role && typeof user.role === 'object' && user.role.name === 'seller')) && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <i className="fas fa-plus mr-2"></i>
                    Add Your First Product
                  </Button>
                )}
              </div>
            ) : (
              <>
                
                <DataTable
                  data={filteredProducts}
                  columns={columns}
                  title={`Products (${filteredProducts.length})`}
                  searchable={true}
                  searchPlaceholder="Search products by name, description, or category..."
                  searchKeys={['name', 'description', 'category']}
                  pageSize={10}
                  emptyMessage="No products found"
                />
              </>
            )}
          </CardContent>
        {/* </Card> */}

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deleteProduct?.attributes?.name || deleteProduct?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={executeDelete}
                disabled={deleteProductMutation.isPending}
              >
                {deleteProductMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash mr-2"></i>
                    Delete Product
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
