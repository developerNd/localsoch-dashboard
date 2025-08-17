import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useUpdateVendor, useUpdateUser, useCreateVendor } from '@/hooks/use-api';
import { Upload, X, Image as ImageIcon, Save, User, Store, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { getApiUrl, getImageUrl, API_ENDPOINTS } from '@/lib/config';

// Business category type
interface BusinessCategory {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

// Form validation schemas
const userFormSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

const shopFormSchema = z.object({
  name: z.string().min(1, 'Shop name is required'),
  description: z.string().optional(),
  contact: z.string().min(1, 'Contact number is required'),
  whatsapp: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(6, 'Pincode must be at least 6 characters'),
  gstNumber: z.string().optional(),
  businessType: z.string().optional(),
  businessCategoryId: z.number().optional(),
});

const bankingFormSchema = z.object({
  bankAccountNumber: z.string().min(1, 'Bank account number is required'),
  ifscCode: z.string().min(1, 'IFSC code is required'),
});

type UserFormData = z.infer<typeof userFormSchema>;
type ShopFormData = z.infer<typeof shopFormSchema>;
type BankingFormData = z.infer<typeof bankingFormSchema>;

export default function SellerProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('personal');

  // Get vendor ID from user object
  const getVendorId = () => {
    if (user?.vendorId) return user.vendorId;
    return null;
  };

  const vendorId = getVendorId();

  // Fetch vendor data
  const { data: vendorData, isLoading: vendorLoading, error: vendorError } = useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: async () => {
      if (!vendorId) return null;
      
      const response = await apiRequest('GET', `/api/vendors/${vendorId}?populate=*`);
        const data = await response.json();
        return data.data;
    },
    enabled: !!vendorId,
  });

  // Fetch business categories
  const { data: businessCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['business-categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', API_ENDPOINTS.BUSINESS_CATEGORIES);
      const data = await response.json();
      return data.data || [];
    },
  });

  // Form instances
  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      email: '',
      phone: '',
    },
  });

  const shopForm = useForm<ShopFormData>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      name: '',
      description: '',
      contact: '',
      whatsapp: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gstNumber: '',
      businessType: '',
      businessCategoryId: undefined,
    },
  });

  const bankingForm = useForm<BankingFormData>({
    resolver: zodResolver(bankingFormSchema),
    defaultValues: {
      bankAccountNumber: '',
      ifscCode: '',
    },
  });

  // Mutations
  const updateUserMutation = useUpdateUser();
  const updateVendorMutation = useUpdateVendor();
  const createVendorMutation = useCreateVendor();

  // Update form values when data loads
  useEffect(() => {
    if (user) {
      userForm.reset({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user, userForm]);

  // Update shop form when vendor data loads
  useEffect(() => {
    if (vendorData) {
      console.log('🔍 Populating shop form with vendor data:', vendorData);
      console.log('🔍 Business category from vendor data:', vendorData.businessCategory);
      
      const formData = {
        name: vendorData.name || '',
        description: vendorData.description || '',
        contact: vendorData.contact || '',
        whatsapp: vendorData.whatsapp || '',
        email: vendorData.email || '',
        address: vendorData.address || '',
        city: vendorData.city || '',
        state: vendorData.state || '',
        pincode: vendorData.pincode || '',
        gstNumber: vendorData.gstNumber || '',
        businessType: vendorData.businessType || '',
        businessCategoryId: vendorData.businessCategory?.id || undefined,
      };
      
      console.log('🔍 Form data being set:', formData);
      console.log('🔍 Business category ID being set:', formData.businessCategoryId);
      
      shopForm.reset(formData);

      bankingForm.reset({
        bankAccountNumber: vendorData.bankAccountNumber || '',
        ifscCode: vendorData.ifscCode || '',
      });
    }
  }, [vendorData, shopForm, bankingForm]);

  // Don't reset form during mutation to prevent clearing
  const isUpdatingUser = updateUserMutation.isPending;

  // Form submission handlers
  const handleUserUpdate = async (data: UserFormData) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User information not available",
        variant: "destructive",
      });
      return;
    }

    console.log('🔍 handleUserUpdate - form data:', data);
    console.log('🔍 handleUserUpdate - user.id:', user.id);

    try {
      const updateData = {
        id: user.id,
        ...data,
      };
      console.log('🔍 handleUserUpdate - updateData:', updateData);
      
      await updateUserMutation.mutateAsync(updateData);

      // Update the form with the new data immediately to prevent clearing
      userForm.reset(data);

      toast({
        title: "Success",
        description: "Personal information updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update personal information",
        variant: "destructive",
      });
    }
  };

  const handleShopUpdate = async (data: ShopFormData) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User information not available",
        variant: "destructive",
      });
      return;
    }

    try {
      let currentVendorId = vendorId;

      // If no vendor exists, create one first
      if (!currentVendorId) {
        toast({
          title: "Creating Shop Profile",
          description: "Setting up your shop profile...",
        });

        const vendorData = {
          name: data.name || 'My Shop',
          description: data.description || '',
          contact: data.contact || '',
          whatsapp: data.whatsapp || '',
          email: data.email || user.email,
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          gstNumber: data.gstNumber || '',
          businessType: data.businessType || '',
          businessCategoryId: data.businessCategoryId || undefined,
          bankAccountNumber: '',
          ifscCode: '',
          user: user.id,
          isActive: true,
          isApproved: false,
          status: 'pending'
        };

        const newVendor = await createVendorMutation.mutateAsync(vendorData);
        currentVendorId = newVendor.data.id;
        
        // Update the user context with the new vendor ID
        // This will trigger a re-fetch of user data
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      }

      // Now update the vendor with the form data
      console.log('🔍 Updating vendor with data:', data);
      console.log('🔍 Business Category ID in data:', data.businessCategoryId);
      console.log('🔍 Selected image:', selectedImage);
      
      if (selectedImage) {
        // If there's an image, use FormData
        const formData = new FormData();
        formData.append('data', JSON.stringify(data));
        formData.append('files.profileImage', selectedImage);
        
        console.log('🔍 Using FormData for update');
        console.log('🔍 FormData data field:', JSON.stringify(data));

        const response = await updateVendorMutation.mutateAsync({
          id: currentVendorId!,
          data: formData,
        });
        
        console.log('🔍 Update response:', response);
        console.log('🔍 Vendor data after update:', vendorData);
        console.log('🔍 Profile image data:', vendorData?.profileImage);
      } else {
        // If no image, send as regular JSON
        console.log('🔍 Using JSON for update');
        console.log('🔍 JSON data:', data);

        const response = await updateVendorMutation.mutateAsync({
          id: currentVendorId!,
          data: data,
        });
        
        console.log('🔍 Update response:', response);
        console.log('🔍 Vendor data after update:', vendorData);
        console.log('🔍 Profile image data:', vendorData?.profileImage);
      }

      // Clear selected image after successful upload
      setSelectedImage(null);
      setImagePreview(null);

      // Invalidate the vendor query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['vendor', currentVendorId] });

      toast({
        title: "Success",
        description: "Shop details updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update shop details",
        variant: "destructive",
      });
    }
  };

  const handleBankingUpdate = async (data: BankingFormData) => {
    if (!user?.id) {
    toast({
        title: "Error",
        description: "User information not available",
      variant: "destructive",
    });
      return;
    }

    try {
      let currentVendorId = vendorId;

      // If no vendor exists, create one first
      if (!currentVendorId) {
        toast({
          title: "Creating Shop Profile",
          description: "Setting up your shop profile...",
        });

        const vendorData = {
          name: 'My Shop',
          description: '',
          contact: '',
          whatsapp: '',
          email: user.email,
          address: '',
          city: '',
          state: '',
          pincode: '',
          gstNumber: '',
          businessType: '',
          businessCategoryId: undefined,
          bankAccountNumber: data.bankAccountNumber || '',
          ifscCode: data.ifscCode || '',
          user: user.id,
          isActive: true,
          isApproved: false,
          status: 'pending'
        };

        const newVendor = await createVendorMutation.mutateAsync(vendorData);
        currentVendorId = newVendor.data.id;
        
        // Update the user context with the new vendor ID
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      }

      await updateVendorMutation.mutateAsync({
        id: currentVendorId!,
        data,
      });

      // Update the form with the new data immediately to prevent clearing
      bankingForm.reset(data);

      toast({
        title: "Success",
        description: "Banking information updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update banking information",
        variant: "destructive",
      });
    }
  };

  // Image handling
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Error",
          description: "Image size must be less than 2MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };



  if (vendorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shop settings...</p>
        </div>
      </div>
    );
  }

  if (vendorError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600">Unable to load your shop settings. Please try again later.</p>
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Shop Settings</h2>
            <p className="text-gray-600">Manage your personal and shop information</p>
          </div>

          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage 
                    src={imagePreview || getImageUrl(vendorData?.profileImage?.url || vendorData?.profileImage?.data?.attributes?.url) || ""} 
                    alt="Profile" 
                  />
                  <AvatarFallback className="text-2xl">
                    {vendorData?.name?.[0] || user?.username?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {vendorData?.name || 'Shop Name'}
                  </h3>
                  <p className="text-gray-600">{user?.username}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <Badge variant={vendorData?.isApproved ? "default" : "secondary"}>
                      {vendorData?.isApproved ? "Approved" : "Pending Approval"}
                    </Badge>
                    <Badge variant={vendorData?.isActive ? "default" : "destructive"}>
                      {vendorData?.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Personal</span>
              </TabsTrigger>
              <TabsTrigger value="shop" className="flex items-center space-x-2">
                <Store className="w-4 h-4" />
                <span>Shop Details</span>
              </TabsTrigger>
              <TabsTrigger value="banking" className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Banking</span>
              </TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={userForm.handleSubmit(handleUserUpdate)} className="space-y-6">
                      <div>
                      <Label htmlFor="username">Username *</Label>
                        <Input
                        id="username"
                        {...userForm.register('username')}
                        placeholder="Enter your username"
                      />
                      {userForm.formState.errors.username && (
                        <p className="text-sm text-red-500 mt-1">
                          {userForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          {...userForm.register('email')}
                          placeholder="Enter your email"
                        />
                        {userForm.formState.errors.email && (
                          <p className="text-sm text-red-500 mt-1">
                            {userForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          {...userForm.register('phone')}
                          placeholder="Enter your phone number"
                        />
                        {userForm.formState.errors.phone && (
                          <p className="text-sm text-red-500 mt-1">
                            {userForm.formState.errors.phone.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        disabled={updateUserMutation.isPending}
                        className="flex items-center space-x-2"
                      >
                        {updateUserMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Update Personal Info</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shop Details Tab */}
            <TabsContent value="shop">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Store className="w-5 h-5" />
                    <span>Shop Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={shopForm.handleSubmit(handleShopUpdate)} className="space-y-6">
                    {/* Profile Image Upload */}
                    <div>
                      <Label>Shop Profile Image</Label>
                      <div className="mt-2 space-y-4">
                        {/* Current Image Display */}
                        {(vendorData?.profileImage || imagePreview) && (
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <img
                                src={imagePreview || getImageUrl(vendorData?.profileImage?.url || vendorData?.profileImage?.data?.attributes?.url)}
                                alt="Profile"
                                className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
                              />
                              {imagePreview && (
                                <button
                                  type="button"
                                  onClick={removeSelectedImage}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">
                                {imagePreview ? 'New image selected' : 'Current profile image'}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Upload Button */}
                        <div className="flex items-center space-x-4">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                            <div className="flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                              <Upload className="w-5 h-5 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {vendorData?.profileImage ? 'Change Image' : 'Upload Image'}
                              </span>
                            </div>
                          </label>
                          {!vendorData?.profileImage && !imagePreview && (
                            <div className="flex items-center space-x-2 text-gray-500">
                              <ImageIcon className="w-5 h-5" />
                              <span className="text-sm">No image uploaded</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Recommended: Square image, max 2MB. This will be displayed on your shop profile.
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="name">Shop Name *</Label>
                      <Input
                        id="name"
                        {...shopForm.register('name')}
                        placeholder="Enter your shop name"
                      />
                      {shopForm.formState.errors.name && (
                        <p className="text-sm text-red-500 mt-1">
                          {shopForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description">Shop Description</Label>
                      <Textarea
                        id="description"
                        {...shopForm.register('description')}
                        placeholder="Brief description of your shop and what you offer"
                        rows={3}
                      />
                      {shopForm.formState.errors.description && (
                        <p className="text-sm text-red-500 mt-1">
                          {shopForm.formState.errors.description.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="contact">Contact Phone *</Label>
                        <Input
                          id="contact"
                          {...shopForm.register('contact')}
                          placeholder="+91-9876543210"
                        />
                        <p className="text-xs text-gray-500 mt-1">Used for call button</p>
                        {shopForm.formState.errors.contact && (
                          <p className="text-sm text-red-500 mt-1">
                            {shopForm.formState.errors.contact.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="whatsapp">WhatsApp Number</Label>
                        <Input
                          id="whatsapp"
                          {...shopForm.register('whatsapp')}
                          placeholder="+91-9876543210"
                        />
                        <p className="text-xs text-gray-500 mt-1">Used for WhatsApp button (optional)</p>
                        {shopForm.formState.errors.whatsapp && (
                          <p className="text-sm text-red-500 mt-1">
                            {shopForm.formState.errors.whatsapp.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="email">Shop Email</Label>
                        <Input
                          id="email"
                          type="email"
                          {...shopForm.register('email')}
                          placeholder="shop@example.com"
                        />
                        {shopForm.formState.errors.email && (
                          <p className="text-sm text-red-500 mt-1">
                            {shopForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="gstNumber">GST Number</Label>
                        <Input
                          id="gstNumber"
                          {...shopForm.register('gstNumber')}
                          placeholder="Enter GST number"
                        />
                        {shopForm.formState.errors.gstNumber && (
                          <p className="text-sm text-red-500 mt-1">
                            {shopForm.formState.errors.gstNumber.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="businessType">Business Type</Label>
                        <Input
                          id="businessType"
                          {...shopForm.register('businessType')}
                          placeholder="e.g., Retail, Wholesale, Service"
                        />
                        {shopForm.formState.errors.businessType && (
                          <p className="text-sm text-red-500 mt-1">
                            {shopForm.formState.errors.businessType.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="businessCategory">Business Category</Label>
                        {/* Hidden input to register the field with react-hook-form */}
                        <input
                          type="hidden"
                          {...shopForm.register('businessCategoryId')}
                        />
                        <Select 
                          value={shopForm.watch('businessCategoryId')?.toString() || ""} 
                          onValueChange={(value) => {
                            console.log('🔍 Business category selected:', value);
                            shopForm.setValue('businessCategoryId', value ? parseInt(value) : undefined);
                            // Trigger form validation
                            shopForm.trigger('businessCategoryId');
                          }}
                          disabled={categoriesLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select business category"} />
                          </SelectTrigger>
                          <SelectContent>
                            {businessCategories?.map((category: BusinessCategory) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {businessCategories?.length === 0 && !categoriesLoading && (
                          <p className="text-sm text-gray-500 mt-1">No business categories available</p>
                        )}
                        {shopForm.formState.errors.businessCategoryId && (
                          <p className="text-sm text-red-500 mt-1">
                            {shopForm.formState.errors.businessCategoryId.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        {...shopForm.register('address')}
                        placeholder="Enter your business address"
                      />
                      {shopForm.formState.errors.address && (
                        <p className="text-sm text-red-500 mt-1">
                          {shopForm.formState.errors.address.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          {...shopForm.register('city')}
                          placeholder="Enter city"
                        />
                        {shopForm.formState.errors.city && (
                          <p className="text-sm text-red-500 mt-1">
                            {shopForm.formState.errors.city.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          {...shopForm.register('state')}
                          placeholder="Enter state"
                        />
                        {shopForm.formState.errors.state && (
                          <p className="text-sm text-red-500 mt-1">
                            {shopForm.formState.errors.state.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="pincode">Pincode *</Label>
                        <Input
                          id="pincode"
                          {...shopForm.register('pincode')}
                          placeholder="Enter pincode"
                        />
                        {shopForm.formState.errors.pincode && (
                          <p className="text-sm text-red-500 mt-1">
                            {shopForm.formState.errors.pincode.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        disabled={updateVendorMutation.isPending || createVendorMutation.isPending}
                        className="flex items-center space-x-2"
                      >
                        {updateVendorMutation.isPending || createVendorMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Update Shop Details</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Banking Information Tab */}
            <TabsContent value="banking">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Banking Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This information is used for payment processing and earnings withdrawal. 
                      Your data is encrypted and secure.
                    </AlertDescription>
                  </Alert>

                  <form onSubmit={bankingForm.handleSubmit(handleBankingUpdate)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="bankAccountNumber">Bank Account Number *</Label>
                        <Input
                          id="bankAccountNumber"
                          {...bankingForm.register('bankAccountNumber')}
                          placeholder="Enter account number"
                        />
                        {bankingForm.formState.errors.bankAccountNumber && (
                          <p className="text-sm text-red-500 mt-1">
                            {bankingForm.formState.errors.bankAccountNumber.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="ifscCode">IFSC Code *</Label>
                        <Input
                          id="ifscCode"
                          {...bankingForm.register('ifscCode')}
                          placeholder="Enter IFSC code"
                        />
                        {bankingForm.formState.errors.ifscCode && (
                          <p className="text-sm text-red-500 mt-1">
                            {bankingForm.formState.errors.ifscCode.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        disabled={updateVendorMutation.isPending || createVendorMutation.isPending}
                        className="flex items-center space-x-2"
                      >
                        {updateVendorMutation.isPending || createVendorMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Update Banking Info</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
