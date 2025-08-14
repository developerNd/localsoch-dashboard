import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export default function SellerProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Get vendor ID from user object or vendor relationship
  const getVendorId = () => {
    if (user?.vendorId) return user.vendorId;
    if (user?.vendor?.id) return user.vendor.id;
    // Temporary workaround: hardcode vendor ID for user ID 3
    if (user?.id === 3) return 1; // FreshMart vendor ID
    return null;
  };

  // Find vendor by user ID if direct vendor ID is not available
  const findVendorByUserId = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:1337/api/vendors?filters[user][id][$eq]=${userId}`, {
        headers: {
          'Authorization': 'Bearer e84e26b9a4c2d8f27bde949afc61d52117e19563be11d5d9ebc8598313d72d1b49d230e28458cfcee1bccd7702ca542a929706c35cde1a62b8f0ab6f185ae74c9ce64c0d8782c15bf4186c29f4fc5c7fdd4cfdd00938a59a636a32cb243b9ca7c94242438ff5fcd2fadbf40a093ea593e96808af49ad97cbeaed977e319614b5',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          return data.data[0].id;
        }
      }
    } catch (error) {
      // Silently handle error
    }
    return null;
  };

  const vendorId = getVendorId();

  // Fetch vendor data for the current user
  const { data: vendorData, isLoading, error: vendorError } = useQuery({
    queryKey: ['/api/vendors/vendor-data', vendorId, user?.id],
    queryFn: async () => {
      let targetVendorId = vendorId;
      
      // If no direct vendor ID, try to find vendor by user ID
      if (!targetVendorId && user?.id) {
        console.log('No direct vendor ID, searching by user ID:', user.id);
        targetVendorId = await findVendorByUserId(user.id);
        if (targetVendorId) {
          console.log('Found vendor ID by user ID:', targetVendorId);
        }
      }
      
      if (!targetVendorId) {
        return null;
      }
      
      try {
        const response = await fetch(`http://localhost:1337/api/vendors/${targetVendorId}`, {
          headers: {
            'Authorization': 'Bearer e84e26b9a4c2d8f27bde949afc61d52117e19563be11d5d9ebc8598313d72d1b49d230e28458cfcee1bccd7702ca542a929706c35cde1a62b8f0ab6f185ae74c9ce64c0d8782c15bf4186c29f4fc5c7fdd4cfdd00938a59a636a32cb243b9ca7c94242438ff5fcd2fadbf40a093ea593e96808af49ad97cbeaed977e319614b5',
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch vendor data: ${response.status}`);
        }
        const data = await response.json();
        return data.data;
      } catch (error) {
        console.error('Error fetching vendor data:', error);
        return null;
      }
    },
    enabled: !!(vendorId || user?.id),
  });

  // Store the resolved vendor ID for use in mutations
  const [resolvedVendorId, setResolvedVendorId] = useState<number | null>(null);

  // Update resolved vendor ID when vendor data is loaded
  useEffect(() => {
    if (vendorData?.id) {
      setResolvedVendorId(vendorData.id);
    }
  }, [vendorData]);

  const userForm = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      username: user?.username || '',
    },
  });

  const shopForm = useForm({
    defaultValues: {
      shopName: '',
      shopDescription: '',
      contactPhone: '',
      whatsappNumber: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gstNumber: '',
      bankAccountNumber: '',
      ifscCode: '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      // Use resolved vendor ID from vendor data
      let currentVendorId = resolvedVendorId;
      
      // Fallback: Get vendor ID dynamically if not resolved yet
      if (!currentVendorId) {
        currentVendorId = getVendorId();
        
        // If no direct vendor ID, try to find vendor by user ID
        if (!currentVendorId && user?.id) {
          currentVendorId = await findVendorByUserId(user.id);
        }
      }
      
      if (!currentVendorId) {
        throw new Error('Vendor ID not found. Please try logging in again.');
      }
      
      // Prepare form data for file upload
      const formData = new FormData();
      
      // Add text fields
      formData.append('data', JSON.stringify({
        name: data.shopName,
        contact: data.contactPhone,
        whatsapp: data.whatsappNumber,
        address: data.address,
        description: data.shopDescription,
      }));
      
      // Add image file if selected
      if (selectedImage) {
        formData.append('files.profileImage', selectedImage);
      }
      
      // Custom request for file upload - use Strapi API token for vendor operations
      const headers: Record<string, string> = {
        'Authorization': 'Bearer e84e26b9a4c2d8f27bde949afc61d52117e19563be11d5d9ebc8598313d72d1b49d230e28458cfcee1bccd7702ca542a929706c35cde1a62b8f0ab6f185ae74c9ce64c0d8782c15bf4186c29f4fc5c7fdd4cfdd00938a59a636a32cb243b9ca7c94242438ff5fcd2fadbf40a093ea593e96808af49ad97cbeaed977e319614b5',
      };
      
      const response = await fetch(`http://localhost:1337/api/vendors/${currentVendorId}`, {
        method: 'PUT',
        headers,
        body: formData,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/vendor-data'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      // Clear selected image after successful upload
      setSelectedImage(null);
      setImagePreview(null);
      toast({
        title: "Profile Updated",
        description: "Your shop profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleUserUpdate = async (data: any) => {
    // For now, just show a message that user profile updates are not implemented
    toast({
      title: "Not Implemented",
      description: "User profile updates are not yet implemented.",
      variant: "destructive",
    });
  };

  const handleShopUpdate = async (data: any) => {
    await updateProfileMutation.mutateAsync(data);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const getImageUrl = (imageData: any) => {
    if (!imageData) return null;
    if (imageData.url) return imageData.url;
    if (imageData.data?.attributes?.url) return imageData.data.attributes.url;
    return null;
  };

  // Update form values when vendor data loads
  useEffect(() => {
    if (vendorData) {
      const formData = {
        shopName: vendorData.name || '',
        shopDescription: vendorData.description || '',
        contactPhone: vendorData.contact || '',
        whatsappNumber: vendorData.whatsapp || '',
        address: vendorData.address || '',
        city: user?.sellerProfile?.city || '',
        state: user?.sellerProfile?.state || '',
        pincode: user?.sellerProfile?.pincode || '',
        gstNumber: user?.sellerProfile?.gstNumber || '',
        bankAccountNumber: user?.sellerProfile?.bankAccountNumber || '',
        ifscCode: user?.sellerProfile?.ifscCode || '',
      };
      shopForm.reset(formData);
    }
  }, [vendorData, shopForm, user?.sellerProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shop settings...</p>
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
            <p className="text-gray-600">Manage your personal and shop information</p>
          </div>

          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.avatar || ""} alt="Profile" />
                  <AvatarFallback className="text-2xl">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-gray-600">{vendorData?.name || user?.sellerProfile?.shopName}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <div className="mt-2">
                    <Button variant="outline" size="sm">
                      <i className="fas fa-camera mr-2"></i>
                      Change Photo
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList>
              <TabsTrigger value="personal">Personal Information</TabsTrigger>
              <TabsTrigger value="shop">Shop Details</TabsTrigger>
              <TabsTrigger value="banking">Banking Information</TabsTrigger>
            </TabsList>





            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={userForm.handleSubmit(handleUserUpdate)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          {...userForm.register('firstName')}
                          placeholder="Enter your first name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          {...userForm.register('lastName')}
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          {...userForm.register('email')}
                          placeholder="Enter your email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          {...userForm.register('username')}
                          placeholder="Enter your username"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Updating...</span>
                          </div>
                        ) : (
                          'Update Personal Info'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shop">
              <Card>
                <CardHeader>
                  <CardTitle>Shop Details</CardTitle>
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
                                src={imagePreview || getImageUrl(vendorData?.profileImage)}
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
                      <Label htmlFor="shopName">Shop Name</Label>
                      <Input
                        id="shopName"
                        {...shopForm.register('shopName')}
                        placeholder="Enter your shop name"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="contactPhone">Contact Phone</Label>
                        <Input
                          id="contactPhone"
                          {...shopForm.register('contactPhone')}
                          placeholder="+91-9876543210"
                        />
                        <p className="text-xs text-gray-500 mt-1">Used for call button</p>
                      </div>
                      <div>
                        <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                        <Input
                          id="whatsappNumber"
                          {...shopForm.register('whatsappNumber')}
                          placeholder="+91-9876543210"
                        />
                        <p className="text-xs text-gray-500 mt-1">Used for WhatsApp button (optional)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                        <Input
                          id="gstNumber"
                          {...shopForm.register('gstNumber')}
                          placeholder="Enter GST number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="shopDescription">Shop Description</Label>
                        <Input
                          id="shopDescription"
                          {...shopForm.register('shopDescription')}
                          placeholder="Brief description of your shop"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        {...shopForm.register('address')}
                        placeholder="Enter your business address"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          {...shopForm.register('city')}
                          placeholder="Enter city"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          {...shopForm.register('state')}
                          placeholder="Enter state"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input
                          id="pincode"
                          {...shopForm.register('pincode')}
                          placeholder="Enter pincode"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        disabled={updateProfileMutation.isPending || !resolvedVendorId}
                      >
                        {updateProfileMutation.isPending ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Updating...</span>
                          </div>
                        ) : !resolvedVendorId ? (
                          'Loading Vendor Data...'
                        ) : (
                          'Update Shop Details'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="banking">
              <Card>
                <CardHeader>
                  <CardTitle>Banking Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={shopForm.handleSubmit(handleShopUpdate)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                        <Input
                          id="bankAccountNumber"
                          {...shopForm.register('bankAccountNumber')}
                          placeholder="Enter account number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ifscCode">IFSC Code</Label>
                        <Input
                          id="ifscCode"
                          {...shopForm.register('ifscCode')}
                          placeholder="Enter IFSC code"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex">
                        <i className="fas fa-info-circle text-blue-500 mt-0.5 mr-3"></i>
                        <div>
                          <h4 className="text-sm font-medium text-blue-900">Banking Information</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            This information is used for payment processing and earnings withdrawal. 
                            Your data is encrypted and secure.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        disabled={updateProfileMutation.isPending || !resolvedVendorId}
                      >
                        {updateProfileMutation.isPending ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Updating...</span>
                          </div>
                        ) : !resolvedVendorId ? (
                          'Loading Vendor Data...'
                        ) : (
                          'Update Banking Info'
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
