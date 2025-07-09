import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function AdminSellers() {
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sellers, isLoading } = useQuery({
    queryKey: ['/api/admin/sellers'],
  });

  const approveMutation = useMutation({
    mutationFn: async (sellerId: number) => {
      const response = await apiRequest('PUT', `/api/admin/sellers/${sellerId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sellers'] });
      toast({
        title: "Seller Approved",
        description: "Seller has been approved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve seller",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (sellerId: number) => {
      const response = await apiRequest('PUT', `/api/admin/sellers/${sellerId}/reject`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sellers'] });
      toast({
        title: "Seller Rejected",
        description: "Seller application has been rejected.",
        variant: "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject seller",
        variant: "destructive",
      });
    },
  });

  const pendingSellers = sellers?.filter((s: any) => s.role === 'seller_pending') || [];
  const activeSellers = sellers?.filter((s: any) => s.role === 'seller') || [];
  const inactiveSellers = sellers?.filter((s: any) => !s.isActive) || [];

  const handleApprove = async (sellerId: number) => {
    if (confirm('Are you sure you want to approve this seller?')) {
      await approveMutation.mutateAsync(sellerId);
    }
  };

  const handleReject = async (sellerId: number) => {
    if (confirm('Are you sure you want to reject this seller? This action cannot be undone.')) {
      await rejectMutation.mutateAsync(sellerId);
    }
  };

  const getStatusBadge = (seller: any) => {
    if (!seller.isActive) return <Badge variant="destructive">Inactive</Badge>;
    if (seller.role === 'seller_pending') return <Badge variant="destructive">Pending</Badge>;
    if (seller.sellerProfile?.isApproved) return <Badge variant="default">Approved</Badge>;
    return <Badge variant="secondary">Active</Badge>;
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Seller Management</h2>
            <p className="text-gray-600">Manage seller accounts and approvals</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-check-circle text-success text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Sellers</p>
                  <p className="text-2xl font-bold text-gray-900">{activeSellers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-clock text-warning text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingSellers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-times-circle text-error text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900">{inactiveSellers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-users text-primary text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sellers</p>
                  <p className="text-2xl font-bold text-gray-900">{sellers?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Seller Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="space-y-6">
              <TabsList>
                <TabsTrigger value="pending">
                  Pending Approval ({pendingSellers.length})
                </TabsTrigger>
                <TabsTrigger value="active">
                  Active Sellers ({activeSellers.length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  All Sellers ({sellers?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                {pendingSellers.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-user-check text-4xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No pending approvals</h3>
                    <p className="text-gray-600">All seller applications have been reviewed.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Seller</TableHead>
                          <TableHead>Shop Details</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Applied</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingSellers.map((seller: any) => (
                          <TableRow key={seller.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {seller.firstName[0]}{seller.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{seller.firstName} {seller.lastName}</p>
                                  <p className="text-sm text-gray-500">{seller.username}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{seller.sellerProfile?.shopName}</p>
                                <p className="text-sm text-gray-500">{seller.sellerProfile?.city}, {seller.sellerProfile?.state}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{seller.email}</p>
                                <p className="text-sm text-gray-500">{seller.sellerProfile?.contactPhone}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(seller.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setSelectedSeller(seller)}
                                    >
                                      Review
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Seller Application Review</DialogTitle>
                                      <DialogDescription>
                                        Review the seller application details
                                      </DialogDescription>
                                    </DialogHeader>
                                    
                                    {selectedSeller && (
                                      <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <h4 className="font-medium mb-2">Personal Information</h4>
                                            <p className="text-sm"><strong>Name:</strong> {selectedSeller.firstName} {selectedSeller.lastName}</p>
                                            <p className="text-sm"><strong>Email:</strong> {selectedSeller.email}</p>
                                            <p className="text-sm"><strong>Username:</strong> {selectedSeller.username}</p>
                                          </div>
                                          <div>
                                            <h4 className="font-medium mb-2">Shop Information</h4>
                                            <p className="text-sm"><strong>Shop Name:</strong> {selectedSeller.sellerProfile?.shopName}</p>
                                            <p className="text-sm"><strong>Description:</strong> {selectedSeller.sellerProfile?.shopDescription || 'N/A'}</p>
                                            <p className="text-sm"><strong>Phone:</strong> {selectedSeller.sellerProfile?.contactPhone}</p>
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <h4 className="font-medium mb-2">Address</h4>
                                          <p className="text-sm">
                                            {selectedSeller.sellerProfile?.address}<br/>
                                            {selectedSeller.sellerProfile?.city}, {selectedSeller.sellerProfile?.state} - {selectedSeller.sellerProfile?.pincode}
                                          </p>
                                        </div>
                                        
                                        <div className="flex justify-end space-x-2">
                                          <Button 
                                            variant="destructive" 
                                            onClick={() => handleReject(selectedSeller.id)}
                                            disabled={rejectMutation.isPending}
                                          >
                                            Reject
                                          </Button>
                                          <Button 
                                            onClick={() => handleApprove(selectedSeller.id)}
                                            disabled={approveMutation.isPending}
                                          >
                                            Approve
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="active">
                {activeSellers.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-store text-4xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active sellers</h3>
                    <p className="text-gray-600">No sellers are currently active on the platform.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Seller</TableHead>
                          <TableHead>Shop Details</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeSellers.map((seller: any) => (
                          <TableRow key={seller.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {seller.firstName[0]}{seller.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{seller.firstName} {seller.lastName}</p>
                                  <p className="text-sm text-gray-500">{seller.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{seller.sellerProfile?.shopName}</p>
                                <p className="text-sm text-gray-500">{seller.sellerProfile?.city}, {seller.sellerProfile?.state}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(seller)}
                            </TableCell>
                            <TableCell>
                              {new Date(seller.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <i className="fas fa-eye mr-2"></i>
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Seller</TableHead>
                        <TableHead>Shop Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sellers?.map((seller: any) => (
                        <TableRow key={seller.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>
                                  {seller.firstName[0]}{seller.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{seller.firstName} {seller.lastName}</p>
                                <p className="text-sm text-gray-500">{seller.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{seller.sellerProfile?.shopName}</p>
                              <p className="text-sm text-gray-500">{seller.sellerProfile?.city}, {seller.sellerProfile?.state}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(seller)}
                          </TableCell>
                          <TableCell>
                            {new Date(seller.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <i className="fas fa-eye mr-2"></i>
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
