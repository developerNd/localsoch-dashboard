import { useState, useRef } from 'react';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DataTable } from '@/components/ui/data-table';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getAuthToken } from '@/lib/auth';
import { getApiUrl, getImageUrl, API_ENDPOINTS } from '@/lib/config';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  backgroundColor: string;
  textColor: string;
  actionText: string;
  actionType: 'external_link' | 'seller';
  actionData: any;
  externalLink?: string;
  sellerId?: number;
  isActive: boolean;
  sortOrder: number;
  startDate?: string;
  endDate?: string;
  targetAudience: 'all' | 'new_users' | 'returning_users' | 'premium_users';
  image?: {
    url: string;
  };
}

export default function AdminBanners() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSellerPopupOpen, setIsSellerPopupOpen] = useState(false);
  const [sellerSearchQuery, setSellerSearchQuery] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    backgroundColor: '#14b8a6',
    textColor: '#ffffff',
    actionText: 'Shop Now',
    actionType: 'external_link' as Banner['actionType'],
    actionData: {},
    externalLink: '',
    sellerId: undefined as number | undefined,
    isActive: true,
    sortOrder: 0,
    targetAudience: 'all' as Banner['targetAudience'],
  });

  // Fetch banners
  const { data: banners, isLoading, error } = useQuery({
    queryKey: ['/api/banners'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');
      
      console.log('🔍 Fetching banners with token:', token.substring(0, 20) + '...');
      
      const response = await fetch(getApiUrl(`${API_ENDPOINTS.BANNERS}?populate=image`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('🔍 Banners API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 Banners API error:', errorText);
        throw new Error(`Failed to fetch banners: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('🔍 Banners API response:', data);
      
      // Log banner IDs for debugging
      if (data.data && Array.isArray(data.data)) {
        console.log('🔍 Banner IDs:', data.data.map((banner: any) => banner.id));
      }
      
      return data.data || [];
    },
  });

  // Fetch vendors for seller dropdown
  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ['/api/vendors'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');
      
      const response = await fetch(getApiUrl(`${API_ENDPOINTS.VENDORS}?populate=*`), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }
      
      const data = await response.json();
      return data.data || [];
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

  // Create banner mutation
  const createBanner = useMutation({
    mutationFn: async (bannerData: any) => {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');
      
      let dataToSend = { ...bannerData };
      
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
      
      console.log('Creating banner with data:', dataToSend);
      
      const response = await fetch(getApiUrl(API_ENDPOINTS.BANNERS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ data: dataToSend }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Banner creation failed:', response.status, errorText);
        throw new Error(`Failed to create banner: ${response.status} ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      toast({
        title: 'Success',
        description: 'Banner created successfully',
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

  // Update banner mutation
  const updateBanner = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');
      
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
      
      console.log('Updating banner with data:', { id, dataToSend });
      
      const response = await fetch(getApiUrl(`${API_ENDPOINTS.BANNERS}/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ data: dataToSend }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Banner update failed:', response.status, errorText);
        throw new Error(`Failed to update banner: ${response.status} ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      toast({
        title: 'Success',
        description: 'Banner updated successfully',
      });
      setIsCreateDialogOpen(false);
      setEditingBanner(null);
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

  // Delete banner mutation
  const deleteBanner = useMutation({
    mutationFn: async (id: number) => {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token');
      
      console.log('🔍 Deleting banner with ID:', id);
      console.log('🔍 Using API URL:', getApiUrl(`${API_ENDPOINTS.BANNERS}/${id}`));
      
      const response = await fetch(getApiUrl(`${API_ENDPOINTS.BANNERS}/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🔍 Delete response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Delete banner failed:', response.status, errorText);
        throw new Error(`Failed to delete banner: ${response.status} ${errorText}`);
      }
      
      console.log('🔍 Banner deleted successfully');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banners'] });
      toast({
        title: 'Success',
        description: 'Banner deleted successfully',
      });
      setIsDeleteDialogOpen(false);
      setBannerToDelete(null);
    },
    onError: (error) => {
      console.error('🔍 Delete banner error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete banner',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      backgroundColor: '#14b8a6',
      textColor: '#ffffff',
      actionText: 'Shop Now',
      actionType: 'external_link',
      actionData: {},
      externalLink: '',
      sellerId: undefined,
      isActive: true,
      sortOrder: 0,
      targetAudience: 'all',
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const getSellerName = (sellerId: number) => {
    const vendor = vendors?.find((v: any) => v.id === sellerId);
    return vendor?.name || vendor?.attributes?.name || `Vendor ${sellerId}`;
  };

  const getFilteredVendors = () => {
    if (!vendors) return [];
    
    return vendors.filter((vendor: any) => {
      const name = vendor.name || vendor.attributes?.name || `Vendor ${vendor.id}`;
      const searchLower = sellerSearchQuery.toLowerCase();
      return name.toLowerCase().includes(searchLower) || 
             vendor.id.toString().includes(searchLower);
    });
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validate required fields based on action type
    if (formData.actionType === 'external_link' && !formData.externalLink) {
      toast({
        title: 'Error',
        description: 'External link URL is required for external link action type',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.actionType === 'seller' && !formData.sellerId) {
      toast({
        title: 'Error',
        description: 'Please select a seller for seller action type',
        variant: 'destructive',
      });
      return;
    }
    
    if (editingBanner) {
      updateBanner.mutate({ id: editingBanner.id, data: formData });
    } else {
      createBanner.mutate(formData);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      backgroundColor: banner.backgroundColor,
      textColor: banner.textColor,
      actionText: banner.actionText,
      actionType: banner.actionType,
      actionData: banner.actionData,
      externalLink: banner.externalLink || '',
      sellerId: banner.sellerId,
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
      targetAudience: banner.targetAudience,
    });
    
    // Set image preview if banner has an image
    if (banner.image?.url) {
              setImagePreview(getImageUrl(banner.image.url));
      setSelectedImage(null); // Clear selected image since we're editing existing
    } else {
      setImagePreview(null);
      setSelectedImage(null);
    }
  };

  // Check if user is admin
  if (user?.role && typeof user.role === 'object' && user.role.name !== 'admin') {
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
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Banners</h2>
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
      
      <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
        <div className="mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Banner Management 🎨
            </h2>
            <p className="text-gray-600 mb-6">Manage promotional banners with external links and seller navigation</p>
          </div>
          
          <div className="flex justify-end mb-6">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingBanner(null)} size="lg" className="shadow-lg">
                  <i className="fas fa-plus mr-2"></i>
                  Add New Banner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>
                    {editingBanner ? 'Edit Banner' : 'Create New Banner'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
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

                  {/* Image Upload Section */}
                  <div>
                    <Label htmlFor="image">Banner Image</Label>
                    <div className="space-y-4">
                      {/* Image Preview */}
                      {imagePreview && (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Banner preview"
                            className="w-full h-32 object-cover rounded-lg border"
                          />
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
                        Recommended size: 1200x400px. Max file size: 5MB
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="backgroundColor">Background Color</Label>
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={formData.backgroundColor}
                        onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="textColor">Text Color</Label>
                      <Input
                        id="textColor"
                        type="color"
                        value={formData.textColor}
                        onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="actionText">Action Text</Label>
                      <Input
                        id="actionText"
                        value={formData.actionText}
                        onChange={(e) => setFormData({ ...formData, actionText: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="actionType">Action Type</Label>
                      <Select
                        value={formData.actionType}
                        onValueChange={(value: any) => setFormData({ ...formData, actionType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="external_link">External Link</SelectItem>
                          <SelectItem value="seller">Seller</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Conditional fields based on action type */}
                  {formData.actionType === 'external_link' && (
                    <div>
                      <Label htmlFor="externalLink">External Link URL *</Label>
                      <Input
                        id="externalLink"
                        type="url"
                        placeholder="https://example.com"
                        value={formData.externalLink}
                        onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Enter the full URL including https://. This will open the link in the user's browser when the banner is clicked.
                      </p>
                    </div>
                  )}

                  {formData.actionType === 'seller' && (
                    <div>
                      <Label htmlFor="sellerId">Select Seller *</Label>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsSellerPopupOpen(true)}
                          className="flex-1 justify-start"
                        >
                          <i className="fas fa-search mr-2"></i>
                          {formData.sellerId ? getSellerName(formData.sellerId) : "Search and choose a seller"}
                        </Button>
                        {formData.sellerId && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setFormData({ ...formData, sellerId: undefined })}
                          >
                            <i className="fas fa-times"></i>
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Click to search and select a seller. Users will be taken to the seller's profile page when banner is clicked.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sortOrder">Sort Order</Label>
                      <Input
                        id="sortOrder"
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                      />
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
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  
                  {/* Spacer to ensure content doesn't get cut off */}
                  <div className="h-4"></div>
                </form>
                <div className="flex justify-end space-x-2 pt-4 border-t flex-shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingBanner(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button"
                    onClick={handleSubmit}
                    disabled={createBanner.isPending || updateBanner.isPending || uploadImage.isPending}
                  >
                    {createBanner.isPending || updateBanner.isPending || uploadImage.isPending ? 'Saving...' : 'Save Banner'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Seller Selection Popup */}
        <Dialog open={isSellerPopupOpen} onOpenChange={setIsSellerPopupOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Select Seller</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Search Input */}
              <div>
                <Label htmlFor="sellerSearch">Search Sellers</Label>
                <div className="relative mt-1">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <Input
                    id="sellerSearch"
                    placeholder="Search by name or ID..."
                    value={sellerSearchQuery}
                    onChange={(e) => setSellerSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Vendors List */}
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                {vendorsLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    Loading vendors...
                  </div>
                ) : getFilteredVendors().length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {sellerSearchQuery ? 'No vendors found matching your search.' : 'No vendors available.'}
                  </div>
                ) : (
                  <div className="divide-y">
                    {getFilteredVendors().map((vendor: any) => {
                      const name = vendor.name || vendor.attributes?.name || `Vendor ${vendor.id}`;
                      const isSelected = formData.sellerId === vendor.id;
                      
                      return (
                        <button
                          key={vendor.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, sellerId: vendor.id });
                            setIsSellerPopupOpen(false);
                            setSellerSearchQuery('');
                          }}
                          className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-primary/10 border-l-4 border-primary' : ''
                          }`}
                        >
                          <div className="font-medium">{name}</div>
                          <div className="text-sm text-gray-500">ID: {vendor.id}</div>
                          {isSelected && (
                            <div className="text-sm text-primary font-medium mt-1">
                              ✓ Selected
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSellerPopupOpen(false);
                    setSellerSearchQuery('');
                  }}
                >
                  Cancel
                </Button>
                {formData.sellerId && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setFormData({ ...formData, sellerId: undefined });
                      setIsSellerPopupOpen(false);
                      setSellerSearchQuery('');
                    }}
                  >
                    Clear Selection
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Banners ({banners?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading banners...</p>
              </div>
            ) : banners?.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-image text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-600">No banners found</p>
                <p className="text-sm text-gray-500">Create your first banner to get started</p>
              </div>
            ) : (
              <DataTable
                data={banners || []}
                columns={[
                  {
                    key: 'preview',
                    header: 'Preview',
                    width: '120px',
                    render: (_, banner: Banner) => (
                      banner.image?.url ? (
                        <img
                          src={getImageUrl(banner.image.url)}
                          alt={banner.title}
                          className="w-16 h-12 rounded-lg object-cover border"
                        />
                      ) : (
                        <div
                          className="w-16 h-12 rounded-lg flex items-center justify-center text-xs font-medium"
                          style={{
                            backgroundColor: banner.backgroundColor,
                            color: banner.textColor,
                          }}
                        >
                          {banner.title.slice(0, 10)}
                        </div>
                      )
                    )
                  },
                  {
                    key: 'title',
                    header: 'Title',
                    render: (_, banner: Banner) => (
                      <div>
                        <p className="font-medium">{banner.title}</p>
                        <p className="text-sm text-gray-500">{banner.subtitle}</p>
                      </div>
                    )
                  },
                  {
                    key: 'action',
                    header: 'Action',
                    render: (_, banner: Banner) => (
                      <div>
                        <Badge variant="outline">
                          {banner.actionText} ({banner.actionType})
                        </Badge>
                        {banner.actionType === 'external_link' && banner.externalLink && (
                          <div className="text-xs text-gray-500 mt-1">
                            Link: {banner.externalLink}
                          </div>
                        )}
                        {banner.actionType === 'seller' && banner.sellerId && (
                          <div className="text-xs text-gray-500 mt-1">
                            Seller: {getSellerName(banner.sellerId)}
                          </div>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (_, banner: Banner) => (
                      <Badge variant={banner.isActive ? "default" : "secondary"}>
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    )
                  },
                  {
                    key: 'sortOrder',
                    header: 'Sort Order',
                    sortable: true
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    width: '200px',
                    render: (_, banner: Banner) => (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleEdit(banner);
                            setIsCreateDialogOpen(true);
                          }}
                          disabled={updateBanner.isPending}
                        >
                          <i className="fas fa-edit mr-1"></i>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setBannerToDelete(banner);
                            setIsDeleteDialogOpen(true);
                          }}
                          disabled={deleteBanner.isPending}
                        >
                          <i className="fas fa-trash mr-1"></i>
                          Delete
                        </Button>
                      </div>
                    )
                  }
                ]}
                searchable={true}
                searchPlaceholder="Search banners..."
                searchKeys={['title', 'subtitle', 'description', 'actionText']}
                pageSize={10}
                emptyMessage="No banners found. Create your first banner to get started."
              />
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Banner</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{bannerToDelete?.title}</strong>? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {bannerToDelete && (
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg my-4">
                <div className="w-16 h-12 rounded-lg overflow-hidden">
                  {bannerToDelete.image?.url ? (
                    <img
                      src={getImageUrl(bannerToDelete.image.url)}
                      alt={bannerToDelete.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-xs font-medium"
                      style={{
                        backgroundColor: bannerToDelete.backgroundColor,
                        color: bannerToDelete.textColor,
                      }}
                    >
                      {bannerToDelete.title.slice(0, 8)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-lg">{bannerToDelete.title}</div>
                  <div className="text-sm text-gray-600">{bannerToDelete.subtitle}</div>
                  <div className="text-xs text-gray-400">Status: {bannerToDelete.isActive ? 'Active' : 'Inactive'}</div>
                  <div className="text-xs text-gray-400">ID: {bannerToDelete.id}</div>
                </div>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setBannerToDelete(null);
                }}
                disabled={deleteBanner.isPending}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (bannerToDelete) {
                    console.log('🔍 Starting delete process for banner:', bannerToDelete.id);
                    deleteBanner.mutate(bannerToDelete.id);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteBanner.isPending}
              >
                {deleteBanner.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash mr-2"></i>
                    Delete Banner
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
} 