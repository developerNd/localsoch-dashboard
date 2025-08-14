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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useProducts, useCategories, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/use-api';
import { z } from 'zod';

// Product form schema
const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.string().min(1, "Price is required"),
  stock: z.number().min(0, "Stock must be 0 or greater"),
  categoryId: z.number().optional(),
  image: z.any().optional(), // For single image upload
  images: z.array(z.any()).optional(), // For multiple images upload
});

type ProductFormData = z.infer<typeof productFormSchema>;

// Helper function to normalize Strapi product data
const normalizeProduct = (product: any) => {
  return {
    id: product.id,
    name: product.attributes?.name || product.name,
    description: product.attributes?.description || product.description,
    price: product.attributes?.price || product.price,
    stock: product.attributes?.stock || product.stock,
    image: product.attributes?.image?.data?.attributes?.url || product.image?.data?.attributes?.url,
    category: product.attributes?.category?.data?.attributes?.name || product.category?.data?.attributes?.name,
    vendor: product.attributes?.vendor?.data?.attributes?.name || product.vendor?.data?.attributes?.name,
    vendorId: product.attributes?.vendor?.data?.id || product.vendor?.data?.id || product.vendorId,
    createdAt: product.attributes?.createdAt || product.createdAt,
    updatedAt: product.attributes?.updatedAt || product.updatedAt,
  };
};

export default function SellerProducts() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deleteProduct, setDeleteProduct] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  // Helper function to safely access product data (handles both Strapi and normalized formats)
  const getProductData = (product: any, field: string) => {
    // Try Strapi format first
    if (product.attributes && product.attributes[field] !== undefined) {
      return product.attributes[field];
    }
    // Fallback to normalized format
    return product[field];
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
    // Try multiple paths for category name
    return getProductNestedData(product, ['category', 'data', 'attributes', 'name']) ||
           getProductNestedData(product, ['category', 'name']) ||
           getProductNestedData(product, ['category', 'attributes', 'name']) ||
           'Uncategorized';
  };

  // Helper function to get image URL from product
  const getImageUrl = (product: any) => {
    // Try multiple paths for image URL
    return getProductNestedData(product, ['image', 'data', 'attributes', 'url']) ||
           getProductNestedData(product, ['image', 'url']) ||
           getProductNestedData(product, ['image', 'attributes', 'url']) ||
           null;
  };

  // Fetch all products and filter by seller
  const { data: allProducts, isLoading, error } = useProducts();
  
  // Filter products for the current seller
  // Temporary fix: If vendorId is undefined, use hardcoded vendorId for known users
  const effectiveVendorId = user?.vendorId || (user?.id === 10 ? 5 : undefined);
  
  const products = Array.isArray(allProducts) ? allProducts.filter((product: any) => {
    // Check multiple possible vendor ID fields
    const productVendorId = product.vendor?.id || product.vendorId || product.sellerId;
    return productVendorId === effectiveVendorId;
  }) : [];

  // Set current image URL when editing product changes
  useEffect(() => {
    if (editingProduct) {
      const imageUrl = getProductNestedData(editingProduct, ['image', 'data', 'attributes', 'url']) || getProductNestedData(editingProduct, ['image', 'url']);
      setCurrentImageUrl(imageUrl ? `http://localhost:1337${imageUrl}` : null);
    } else {
      setCurrentImageUrl(null);
    }
  }, [editingProduct]);



  // Filter and search products
  const filteredProducts = products.filter((product: any) => {
    // Stock filter
    const stock = getProductData(product, 'stock') || 0;
    if (statusFilter === 'low') return stock <= 5;
    if (statusFilter === 'out') return stock === 0;
    if (statusFilter === 'normal') return stock > 5;
    
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

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      stock: 0,
      categoryId: undefined,
      image: undefined,
      images: [],
    },
  });

  const createProductMutation = useCreateProduct();

  const updateProductMutation = useUpdateProduct();

  const deleteProductMutation = useDeleteProduct();

  const handleSubmit = async (data: ProductFormData) => {
    try {
      const effectiveVendorId = user?.vendorId || (user?.id === 10 ? 5 : undefined);
      
      // Convert form data to Strapi format
      const productData: any = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        stock: data.stock,
        category: data.categoryId ? { id: data.categoryId } : undefined, // Relation format
        // Don't send vendor - backend will set it automatically
      };
      
      // Handle image upload if present
      if (data.image) {
        productData.image = data.image;
      }
      
      // Handle multiple images if present
      if (data.images && data.images.length > 0) {
        productData.images = data.images;
      }
      

      
      if (editingProduct) {
        await updateProductMutation.mutateAsync({ id: editingProduct.id, data: productData });
      } else {
        await createProductMutation.mutateAsync(productData);
      }
      setIsAddDialogOpen(false);
      clearForm();
    } catch (error) {
      console.error('Error submitting product:', error);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    
    form.reset({
      name: getProductData(product, 'name') || '',
      description: getProductData(product, 'description') || '',
      price: (getProductData(product, 'price') || 0).toString(),
      stock: getProductData(product, 'stock') || 0,
      categoryId: getProductNestedData(product, ['category', 'data', 'id']) || 
                  getProductNestedData(product, ['category', 'id']),
      image: undefined, // Reset image for edit
    });
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
    form.reset({
      name: '',
      description: '',
      price: '',
      stock: 0,
      categoryId: undefined,
      image: undefined,
      images: [],
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
          {effectiveVendorId && (
            <div className="flex-shrink-0">
              <Button onClick={() => {
                clearForm();
                setIsAddDialogOpen(true);
              }}>
                <i className="fas fa-plus mr-2"></i>
                Add Product
              </Button>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {effectiveVendorId ? (
            // Seller filters
            <div className="flex-shrink-0">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="low">Low Stock (≤5)</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                  <SelectItem value="normal">Normal Stock (&gt;5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            // Admin filters - can add seller filter here later
            <div className="flex-shrink-0 text-sm text-gray-500">
              Showing all products from all sellers
            </div>
          )}
        </div>

        {/* Add Product Dialog - Only show for sellers */}
        {effectiveVendorId && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct 
                    ? 'Update your product information'
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

                {/* Multiple Images Upload */}
                <div>
                  <Label htmlFor="images">Additional Images (Optional)</Label>
                  <div className="mt-2">
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          form.setValue('images', files);
                        }
                      }}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload multiple images for product gallery (Max 5 images)
                    </p>
                    {form.watch('images') && Array.isArray(form.watch('images')) && form.watch('images')!.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(form.watch('images') as File[]).map((file: File, index: number) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-16 h-16 rounded-lg object-cover border"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const currentImages = (form.watch('images') as File[]) || [];
                                const newImages = currentImages.filter((_, i) => i !== index);
                                form.setValue('images', newImages);
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Selling Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      {...form.register('price')}
                      placeholder="0.00"
                    />
                    {form.formState.errors.price && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.price.message}
                      </p>
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
                </div>



                <div>
                  <Label htmlFor="categoryId">Category</Label>
                  <Select 
                    value={form.watch('categoryId')?.toString()} 
                    onValueChange={(value) => form.setValue('categoryId', parseInt(value))}
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
                    </SelectContent>
                  </Select>
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

        <Card>
          <CardHeader>
            <CardTitle>
              {user?.vendorId ? 'My Products' : 'All Products'} ({filteredProducts.length})
            </CardTitle>
            {products && (
              <p className="text-sm text-gray-500">
                Showing {filteredProducts.length} of {products.length} products
              </p>
            )}
          </CardHeader>
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
               
                {statusFilter === 'all' && !searchQuery && (user?.vendorId || user?.id === 10) && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <i className="fas fa-plus mr-2"></i>
                    Add Your First Product
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {getImageUrl(product) ? (
                              <img 
                                src={`http://localhost:1337${getImageUrl(product)}`} 
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
                        </TableCell>
                        <TableCell>₹{parseFloat(getProductData(product, 'price') || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            (getProductData(product, 'stock') || 0) === 0 
                              ? 'bg-red-100 text-red-800'
                              : (getProductData(product, 'stock') || 0) <= 5
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {getProductData(product, 'stock') || 0} units
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getCategoryName(product)}
                          </Badge>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

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
