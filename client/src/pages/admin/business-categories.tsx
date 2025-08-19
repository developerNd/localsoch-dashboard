import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { getApiUrl, API_ENDPOINTS, getImageUrl } from '@/lib/config';
import { getAuthToken } from '@/lib/auth';
import { Plus, Edit, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';

interface BusinessCategory {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  image?: {
    url: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminBusinessCategories() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BusinessCategory | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<BusinessCategory | null>(null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    sortOrder: 0
  });

  const queryClient = useQueryClient();

  // Fetch business categories
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['/api/business-categories'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error('No token');
      
      const response = await fetch(getApiUrl('/api/business-categories?populate=*'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch business categories');
      const data = await response.json();
      
      // Normalize the data to handle Strapi structure
      const normalizedCategories = (data.data || []).map((category: any) => {
        const normalizedCategory = {
          id: category.id,
          name: category.attributes?.name || category.name,
          description: category.attributes?.description || category.description,
          isActive: category.attributes?.isActive ?? category.isActive ?? true,
          sortOrder: category.attributes?.sortOrder ?? category.sortOrder ?? 0,
          image: category.attributes?.image?.data?.attributes || category.image,
          createdAt: category.attributes?.createdAt || category.createdAt,
          updatedAt: category.attributes?.updatedAt || category.updatedAt,
        };
        
        // Debug image data
        if (normalizedCategory.image) {
          console.log(`🔍 Business Category "${normalizedCategory.name}" image data:`, normalizedCategory.image);
          console.log(`🔍 Image URL: ${getImageUrl(normalizedCategory.image.url)}`);
        }
        
        return normalizedCategory;
      });
      
      console.log('🔍 Fetched business categories:', normalizedCategories);
      return normalizedCategories;
    },
  });

  // Create business category mutation
  const createCategory = useMutation({
    mutationFn: async (categoryData: any) => {
      const token = getAuthToken();
      if (!token) throw new Error('No token');
      
      let dataToSend = { ...categoryData };
      
      // If there's a selected image, upload it first
      if (selectedImage) {
        try {
          const uploadedImage = await uploadImage.mutateAsync(selectedImage);
          dataToSend.image = uploadedImage.id;
        } catch (error) {
          console.error('Image upload failed:', error);
          throw new Error('Failed to upload image');
        }
      }
      
      const response = await fetch(getApiUrl('/api/business-categories'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: dataToSend }),
      });
      
      if (!response.ok) throw new Error('Failed to create business category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-categories'] });
      toast({
        title: 'Success',
        description: 'Business category created successfully',
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create business category',
        variant: 'destructive',
      });
    },
  });

  // Update business category mutation
  const updateCategory = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const token = getAuthToken();
      if (!token) throw new Error('No token');
      
      let dataToSend = { ...data };
      
      // If there's a selected image, upload it first
      if (selectedImage) {
        try {
          const uploadedImage = await uploadImage.mutateAsync(selectedImage);
          dataToSend.image = uploadedImage.id;
        } catch (error) {
          console.error('Image upload failed:', error);
          throw new Error('Failed to upload image');
        }
      }
      
      // If user wants to remove the image, set image to null
      if (shouldRemoveImage) {
        dataToSend.image = null;
      }
      
      const response = await fetch(getApiUrl(`/api/business-categories/${id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: dataToSend }),
      });
      
      if (!response.ok) throw new Error('Failed to update business category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-categories'] });
      toast({
        title: 'Success',
        description: 'Business category updated successfully',
      });
      setIsCreateDialogOpen(false);
      setEditingCategory(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update business category',
        variant: 'destructive',
      });
    },
  });

  // Delete business category mutation
  const deleteCategory = useMutation({
    mutationFn: async (id: number) => {
      const token = getAuthToken();
      if (!token) throw new Error('No token');
      
      console.log('🔍 Deleting business category with ID:', id);
      console.log('🔍 API URL:', getApiUrl(`/api/business-categories/${id}`));
      
      try {
        const response = await fetch(getApiUrl(`/api/business-categories/${id}`), {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        
        console.log('🔍 Delete response status:', response.status);
        console.log('🔍 Delete response status text:', response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('🔍 Delete error response:', errorText);
          throw new Error(`Failed to delete business category: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('🔍 Delete success result:', result);
        return result;
      } catch (error) {
        console.error('🔍 Fetch error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-categories'] });
      toast({
        title: 'Success',
        description: 'Business category deleted successfully',
      });
    },
    onError: (error: any) => {
      console.error('🔍 Delete mutation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete business category',
        variant: 'destructive',
      });
    },
  });

  // Upload image mutation
  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');
      
      const formData = new FormData();
      formData.append('files', file);
      
      const response = await fetch(getApiUrl(API_ENDPOINTS.UPLOAD), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload image');
      const result = await response.json();
      return result[0]; // Return the first uploaded file
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
      sortOrder: 0
    });
    setSelectedImage(null);
    setImagePreview(null);
    setShouldRemoveImage(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setShouldRemoveImage(false); // Clear remove flag when new image is selected
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setShouldRemoveImage(true); // Mark that we want to remove the image
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  const handleEdit = (category: BusinessCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      sortOrder: category.sortOrder
    });
    
    // Set image preview if category has an image
    if (category.image?.url) {
      setImagePreview(getImageUrl(category.image.url));
      setSelectedImage(null); // Clear selected image since we're editing existing
    } else {
      setImagePreview(null);
      setSelectedImage(null);
    }
    
    setShouldRemoveImage(false); // Reset remove flag when editing
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (category: BusinessCategory) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    console.log('🔍 Confirming delete for category:', categoryToDelete);
    console.log('🔍 Category ID:', categoryToDelete.id, 'Type:', typeof categoryToDelete.id);
    
    try {
      // Ensure ID is a valid number
      const categoryId = parseInt(categoryToDelete.id.toString());
      if (isNaN(categoryId)) {
        throw new Error('Invalid category ID');
      }
      
      console.log('🔍 Parsed category ID:', categoryId);
      await deleteCategory.mutateAsync(categoryId);
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('🔍 Error in confirmDelete:', error);
      // Error handling is already done in the mutation
    }
  };



  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <MobileNav />
        
        <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
              <CardContent className="p-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Business Categories</h2>
                  <p className="text-gray-600 mb-4">Failed to load business categories. Please try again.</p>
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
      
      <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Business Categories Management</h2>
            <p className="text-gray-600">Manage business categories used in seller signup</p>
          </div>
        </div>

        {/* Create Button */}
        <div className="flex justify-end mb-6">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingCategory(null);
                resetForm();
              }} size="lg" className="shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Business Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Edit Business Category' : 'Create New Business Category'}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory 
                    ? 'Update the business category information below.'
                    : 'Add a new business category that sellers can choose during signup.'
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
                    placeholder="e.g., Electronics, Fashion, Food & Beverage"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this business category"
                    rows={3}
                  />
                </div>

                {/* Image Upload Section */}
                <div>
                  <Label htmlFor="image">Category Image</Label>
                  <div className="space-y-4">
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Category preview"
                          className={`w-full h-32 object-cover rounded-lg border ${
                            shouldRemoveImage && editingCategory ? 'opacity-50' : ''
                          }`}
                        />
                        {shouldRemoveImage && editingCategory && (
                          <div className="absolute inset-0 bg-red-100 bg-opacity-50 rounded-lg flex items-center justify-center">
                            <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                              Will be removed
                            </div>
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={handleImageRemove}
                        >
                          <i className="fas fa-times mr-1"></i>
                          Remove
                        </Button>
                      </div>
                    )}
                    
                    {/* File Input */}
                    <div className="flex items-center space-x-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <i className="fas fa-upload mr-2"></i>
                        Choose Image
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Recommended size: 400x400px. Max file size: 5MB
                    </p>
                  </div>
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
                    disabled={createCategory.isPending || updateCategory.isPending || uploadImage.isPending}
                  >
                    {createCategory.isPending || updateCategory.isPending || uploadImage.isPending ? 'Saving...' : 'Save Category'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>Business Categories ({categories?.length || 0})</CardTitle>
            <CardDescription>
              Manage business categories that appear in seller registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading business categories...</p>
              </div>
            ) : categories?.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-building text-gray-400 text-2xl"></i>
                </div>
                <p className="text-gray-600">No business categories found</p>
                <p className="text-sm text-gray-500">Create your first business category to get started</p>
              </div>
            ) : (
              <DataTable
                data={categories || []}
                columns={[
                  {
                    key: 'image',
                    header: 'Image',
                    width: '80px',
                    render: (_, category: BusinessCategory) => (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                        {category.image?.url ? (
                          <img
                            src={getImageUrl(category.image.url)}
                            alt={category.image.name || category.name}
                            className="w-12 h-12 rounded-lg object-cover"
                            onError={(e) => {
                              console.log('🔍 Image failed to load:', category.image?.url);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              // Show fallback icon when image fails
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                              }
                            }}
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'name',
                    header: 'Name',
                    render: (_, category: BusinessCategory) => (
                      <div>
                        <p className="font-medium">{category.name}</p>
                      </div>
                    )
                  },
                  {
                    key: 'description',
                    header: 'Description',
                    render: (_, category: BusinessCategory) => (
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {category.description || 'No description'}
                      </p>
                    )
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (_, category: BusinessCategory) => (
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    )
                  },
                  {
                    key: 'sortOrder',
                    header: 'Sort Order',
                    sortable: true
                  },
                  {
                    key: 'createdAt',
                    header: 'Created',
                    render: (_, category: BusinessCategory) => (
                      <p className="text-sm text-gray-600">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </p>
                    )
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    width: '200px',
                    render: (_, category: BusinessCategory) => (
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
                          onClick={() => handleDelete(category)}
                          disabled={deleteCategory.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )
                  }
                ]}
                searchable={true}
                searchPlaceholder="Search business categories..."
                searchKeys={['name', 'description']}
                pageSize={10}
                emptyMessage="No business categories found. Create your first business category to get started."
              />
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this business category? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {categoryToDelete && (
            <div className="space-y-4">
              {/* Category Header */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                  {categoryToDelete.image?.url ? (
                    <img
                      src={getImageUrl(categoryToDelete.image.url)}
                      alt={categoryToDelete.image.name || categoryToDelete.name}
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                        }
                      }}
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg">{categoryToDelete.name}</div>
                  <div className="text-sm text-gray-600">{categoryToDelete.description}</div>
                  <div className="text-xs text-gray-400">Category ID: {categoryToDelete.id}</div>
                </div>
              </div>

              {/* Category Information Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Category Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{categoryToDelete.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium">
                        <Badge variant={categoryToDelete.isActive ? "default" : "secondary"}>
                          {categoryToDelete.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sort Order:</span>
                      <span className="font-medium">{categoryToDelete.sortOrder}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Timestamps</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {new Date(categoryToDelete.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">
                        {new Date(categoryToDelete.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {categoryToDelete.description && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Description</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {categoryToDelete.description}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setCategoryToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending ? 'Deleting...' : 'Delete Category'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 