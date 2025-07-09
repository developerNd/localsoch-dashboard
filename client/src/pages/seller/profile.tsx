import { useState } from 'react';
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

export default function SellerProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/profile'],
  });

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
      shopName: user?.sellerProfile?.shopName || '',
      shopDescription: user?.sellerProfile?.shopDescription || '',
      contactPhone: user?.sellerProfile?.contactPhone || '',
      address: user?.sellerProfile?.address || '',
      city: user?.sellerProfile?.city || '',
      state: user?.sellerProfile?.state || '',
      pincode: user?.sellerProfile?.pincode || '',
      gstNumber: user?.sellerProfile?.gstNumber || '',
      bankAccountNumber: user?.sellerProfile?.bankAccountNumber || '',
      ifscCode: user?.sellerProfile?.ifscCode || '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', '/api/profile', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
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
    await updateProfileMutation.mutateAsync({ user: data });
  };

  const handleShopUpdate = async (data: any) => {
    await updateProfileMutation.mutateAsync({ sellerProfile: data });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
                  <p className="text-gray-600">{user?.sellerProfile?.shopName}</p>
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
                        {updateProfileMutation.isPending ? 'Updating...' : 'Update Personal Info'}
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
                    <div>
                      <Label htmlFor="shopName">Shop Name</Label>
                      <Input
                        id="shopName"
                        {...shopForm.register('shopName')}
                        placeholder="Enter your shop name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="shopDescription">Shop Description</Label>
                      <Textarea
                        id="shopDescription"
                        {...shopForm.register('shopDescription')}
                        placeholder="Describe your shop and products"
                        rows={4}
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
                      </div>
                      <div>
                        <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                        <Input
                          id="gstNumber"
                          {...shopForm.register('gstNumber')}
                          placeholder="Enter GST number"
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
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? 'Updating...' : 'Update Shop Details'}
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
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? 'Updating...' : 'Update Banking Info'}
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
