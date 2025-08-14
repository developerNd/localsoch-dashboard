import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getAuthToken } from '@/lib/auth';
import { getApiUrl, getImageUrl, API_ENDPOINTS } from '@/lib/config';

interface Product {
  id: number;
  name: string;
  price: number;
  image?: {
    url: string;
  };
}

interface FeaturedProduct {
  id: number;
  product: Product;
  title: string;
  subtitle: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  featuredType: 'featured' | 'trending' | 'new_arrival' | 'best_seller' | 'flash_sale';
  startDate?: string;
  endDate?: string;
  discountPercentage?: number;
  highlightColor: string;
  targetAudience: 'all' | 'new_users' | 'returning_users' | 'premium_users';
  customImage?: {
    url: string;
  };
}

export default function AdminFeaturedProducts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFeaturedProduct, setEditingFeaturedProduct] = useState<FeaturedProduct | null>(null);
  const [formData, setFormData] = useState({
    product: null as number | null,
    title: '',
    subtitle: '',
    description: '',
    isActive: true,
    sortOrder: 0,
    featuredType: 'featured' as FeaturedProduct['featuredType'],
    discountPercentage: 0,
    highlightColor: '#ef4444',
    targetAudience: 'all' as FeaturedProduct['targetAudience'],
  });

  // Fetch featured products
  const { data: featuredProducts, isLoading, error } = useQuery({
    queryKey: ['/api/featured-products'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');
      
      const response = await fetch(getApiUrl(`${API_ENDPOINTS.FEATURED_PRODUCTS}?populate=product`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch featured products');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Fetch products for selection
  const { data: products } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');
      
      const response = await fetch(getApiUrl(`${API_ENDPOINTS.PRODUCTS}?populate=image`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Create featured product mutation
  const createFeaturedProduct = useMutation({
    mutationFn: async (featuredProductData: any) => {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');
      
      const response = await fetch(getApiUrl(API_ENDPOINTS.FEATURED_PRODUCTS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ data: featuredProductData }),
      });
      if (!response.ok) throw new Error('Failed to create featured product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/featured-products'] });
      toast({
        title: 'Success',
        description: 'Featured product created successfully',
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update featured product mutation
  const updateFeaturedProduct = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');
      
      const response = await fetch(getApiUrl(`${API_ENDPOINTS.FEATURED_PRODUCTS}/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ data }),
      });
      if (!response.ok) throw new Error('Failed to update featured product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/featured-products'] });
      toast({
        title: 'Success',
        description: 'Featured product updated successfully',
      });
      setEditingFeaturedProduct(null);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete featured product mutation
  const deleteFeaturedProduct = useMutation({
    mutationFn: async (id: number) => {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');
      
      const response = await fetch(getApiUrl(`${API_ENDPOINTS.FEATURED_PRODUCTS}/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete featured product');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/featured-products'] });
      toast({
        title: 'Success',
        description: 'Featured product deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      product: null,
      title: '',
      subtitle: '',
      description: '',
      isActive: true,
      sortOrder: 0,
      featuredType: 'featured',
      discountPercentage: 0,
      highlightColor: '#ef4444',
      targetAudience: 'all',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product) {
      toast({
        title: 'Error',
        description: 'Please select a product',
        variant: 'destructive',
      });
      return;
    }

    const submitData = {
      ...formData,
      product: formData.product,
    };

    if (editingFeaturedProduct) {
      updateFeaturedProduct.mutate({ id: editingFeaturedProduct.id, data: submitData });
    } else {
      createFeaturedProduct.mutate(submitData);
    }
  };

  const handleEdit = (featuredProduct: FeaturedProduct) => {
    setEditingFeaturedProduct(featuredProduct);
    setFormData({
      product: featuredProduct.product.id,
      title: featuredProduct.title,
      subtitle: featuredProduct.subtitle,
      description: featuredProduct.description,
      isActive: featuredProduct.isActive,
      sortOrder: featuredProduct.sortOrder,
      featuredType: featuredProduct.featuredType,
      discountPercentage: featuredProduct.discountPercentage || 0,
      highlightColor: featuredProduct.highlightColor,
      targetAudience: featuredProduct.targetAudience,
    });
  };

  // Check if user is admin
  if (user?.role?.name !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Featured Products</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <MobileNav />
      
      <main className="flex-1 lg:ml-64 pt-16 p-4 lg:p-8 pb-20 lg:pb-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Featured Products Management ⭐
              </h2>
              <p className="text-gray-600">Manage featured products for the home screen</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingFeaturedProduct(null)}>
                  <i className="fas fa-plus mr-2"></i>
                  Add Featured Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingFeaturedProduct ? 'Edit Featured Product' : 'Create New Featured Product'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="product">Product *</Label>
                    <Select
                      value={formData.product?.toString() || ''}
                      onValueChange={(value) => setFormData({ ...formData, product: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map((product: Product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name} - ₹{product.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subtitle">Subtitle</Label>
                      <Input
                        id="subtitle"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="featuredType">Featured Type</Label>
                      <Select
                        value={formData.featuredType}
                        onValueChange={(value: any) => setFormData({ ...formData, featuredType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="featured">Featured</SelectItem>
                          <SelectItem value="trending">Trending</SelectItem>
                          <SelectItem value="new_arrival">New Arrival</SelectItem>
                          <SelectItem value="best_seller">Best Seller</SelectItem>
                          <SelectItem value="flash_sale">Flash Sale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="highlightColor">Highlight Color</Label>
                      <Input
                        id="highlightColor"
                        type="color"
                        value={formData.highlightColor}
                        onChange={(e) => setFormData({ ...formData, highlightColor: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discountPercentage">Discount Percentage</Label>
                      <Input
                        id="discountPercentage"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discountPercentage}
                        onChange={(e) => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sortOrder">Sort Order</Label>
                      <Input
                        id="sortOrder"
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Select
                      value={formData.targetAudience}
                      onValueChange={(value: any) => setFormData({ ...formData, targetAudience: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="new_users">New Users</SelectItem>
                        <SelectItem value="returning_users">Returning Users</SelectItem>
                        <SelectItem value="premium_users">Premium Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setEditingFeaturedProduct(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createFeaturedProduct.isPending || updateFeaturedProduct.isPending}>
                      {createFeaturedProduct.isPending || updateFeaturedProduct.isPending ? 'Saving...' : 'Save Featured Product'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Featured Products ({featuredProducts?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading featured products...</p>
              </div>
            ) : featuredProducts?.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-star text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-600">No featured products found</p>
                <p className="text-sm text-gray-500">Create your first featured product to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sort Order</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featuredProducts?.map((featuredProduct: FeaturedProduct) => (
                    <TableRow key={featuredProduct.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            src={featuredProduct.product.image?.url ? getImageUrl(featuredProduct.product.image.url) : '/placeholder-product.jpg'}
                            alt={featuredProduct.product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium">{featuredProduct.product.name}</p>
                            <p className="text-sm text-gray-500">₹{featuredProduct.product.price}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{featuredProduct.title || featuredProduct.product.name}</p>
                          <p className="text-sm text-gray-500">{featuredProduct.subtitle}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          style={{ borderColor: featuredProduct.highlightColor, color: featuredProduct.highlightColor }}
                        >
                          {featuredProduct.featuredType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {featuredProduct.discountPercentage ? (
                          <Badge variant="destructive">
                            -{featuredProduct.discountPercentage}%
                          </Badge>
                        ) : (
                          <span className="text-gray-500">No discount</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={featuredProduct.isActive ? "default" : "secondary"}>
                          {featuredProduct.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{featuredProduct.sortOrder}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              handleEdit(featuredProduct);
                              setIsCreateDialogOpen(true);
                            }}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this featured product?')) {
                                deleteFeaturedProduct.mutate(featuredProduct.id);
                              }
                            }}
                            disabled={deleteFeaturedProduct.isPending}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 