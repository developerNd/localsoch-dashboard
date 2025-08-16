import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { getApiUrl, API_ENDPOINTS } from '@/lib/config';
import { getAuthToken } from '@/lib/auth';
import { Plus, Edit, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';

interface ProductCategory {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  image?: {
    url: string;
    name: string;
  };
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminProductCategories() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    sortOrder: 0
  });

  const queryClient = useQueryClient();

  // Fetch product categories
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error('No token');
      
      const response = await fetch(getApiUrl(`${API_ENDPOINTS.CATEGORIES}?populate=*`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch product categories');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Create product category mutation
  const createCategory = useMutation({
    mutationFn: async (categoryData: any) => {
      const token = getAuthToken();
      if (!token) throw new Error('No token');
      
      const response = await fetch(getApiUrl(API_ENDPOINTS.CATEGORIES), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: categoryData }),
      });
      
      if (!response.ok) throw new Error('Failed to create product category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: 'Success',
        description: 'Product category created successfully',
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create product category',
        variant: 'destructive',
      });
    },
  });

  // Update product category mutation
  const updateCategory = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const token = getAuthToken();
      if (!token) throw new Error('No token');
      
      const response = await fetch(getApiUrl(`${API_ENDPOINTS.CATEGORIES}/${id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });
      
      if (!response.ok) throw new Error('Failed to update product category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: 'Success',
        description: 'Product category updated successfully',
      });
      setEditingCategory(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update product category',
        variant: 'destructive',
      });
    },
  });

  // Delete product category mutation
  const deleteCategory = useMutation({
    mutationFn: async (id: number) => {
      const token = getAuthToken();
      if (!token) throw new Error('No token');
      
      const response = await fetch(getApiUrl(`${API_ENDPOINTS.CATEGORIES}/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to delete product category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: 'Success',
        description: 'Product category deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product category',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
      sortOrder: 0
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, data: formData });
    } else {
      createCategory.mutate(formData);
    }
  };

  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      isActive: category.isActive ?? true,
      sortOrder: category.sortOrder ?? 0
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (categoryId: number) => {
    if (confirm('Are you sure you want to delete this product category? This action cannot be undone.')) {
      deleteCategory.mutate(categoryId);
    }
  };

  // Filter categories based on search term
  const filteredCategories = categories?.filter((category: ProductCategory) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <MobileNav />
        
        <main className="flex-1 lg:ml-64 pt-16 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
              <CardContent className="p-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Product Categories</h2>
                  <p className="text-gray-600 mb-4">Failed to load product categories. Please try again.</p>
                  <Button onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
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
      
      <main className="flex-1 lg:ml-64 pt-16 p-4 lg:p-8 pb-20 lg:pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Product Categories Management</h2>
            <p className="text-gray-600">Manage product categories for organizing products</p>
          </div>
        </div>

        {/* Search and Create */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search product categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingCategory(null);
                resetForm();
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Edit Product Category' : 'Create New Product Category'}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory 
                    ? 'Update the product category information below.'
                    : 'Add a new product category to organize products.'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Electronics, Fashion, Home & Garden"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this product category"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCategory.isPending || updateCategory.isPending}
                  >
                    {createCategory.isPending || updateCategory.isPending ? 'Saving...' : 'Save Category'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product Categories ({categories?.length || 0})</CardTitle>
            <CardDescription>
              Manage product categories for organizing and filtering products
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading product categories...</p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-tags text-gray-400 text-2xl"></i>
                </div>
                <p className="text-gray-600">No product categories found</p>
                <p className="text-sm text-gray-500">Create your first product category to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sort Order</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category: ProductCategory) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          {category.image ? (
                            <img
                              src={category.image.url}
                              alt={category.image.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{category.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600 max-w-xs truncate">
                          {category.description || 'No description'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {category.productCount ?? 0} products
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={(category.isActive ?? true) ? "default" : "secondary"}>
                          {(category.isActive ?? true) ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{category.sortOrder ?? 0}</TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                            disabled={deleteCategory.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
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