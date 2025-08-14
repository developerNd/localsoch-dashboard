import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useAdminProducts, useUpdateProductStatus, useDeleteProduct, useProductStats } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

export default function AdminProducts() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalData, setApprovalData] = useState({ status: '', reason: '' });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch products using admin-specific hook
  const { data: products, isLoading: productsLoading } = useAdminProducts();
  const { data: productStats, isLoading: statsLoading } = useProductStats();

  const updateProductStatusMutation = useMutation({
    mutationFn: useUpdateProductStatus().mutateAsync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/admin/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/admin/stats'] });
      setApprovalDialog(false);
      setApprovalData({ status: '', reason: '' });
      toast({
        title: "Status Updated",
        description: "Product status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product status",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: useDeleteProduct().mutateAsync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/admin/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/admin/stats'] });
      toast({
        title: "Product Deleted",
        description: "Product has been deleted successfully.",
        variant: "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  // Filter products based on search and status
  const filteredProducts = Array.isArray(products) ? products.filter((product: any) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'approved') return matchesSearch && product.isApproved;
    if (statusFilter === 'pending') return matchesSearch && !product.isApproved;
    if (statusFilter === 'active') return matchesSearch && product.isActive;
    if (statusFilter === 'inactive') return matchesSearch && !product.isActive;
    
    return matchesSearch;
  }) : [];

  const approvedProducts = Array.isArray(products) ? products.filter((p: any) => p.isApproved) : [];
  const pendingProducts = Array.isArray(products) ? products.filter((p: any) => !p.isApproved) : [];
  const activeProducts = Array.isArray(products) ? products.filter((p: any) => p.isActive) : [];
  const inactiveProducts = Array.isArray(products) ? products.filter((p: any) => !p.isActive) : [];

  const handleApprovalUpdate = (product: any) => {
    setSelectedProduct(product);
    setApprovalDialog(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedProduct || !approvalData.status) return;
    
    await updateProductStatusMutation.mutateAsync({
      id: selectedProduct.id,
      status: approvalData.status,
      reason: approvalData.reason
    });
  };

  const handleDeleteProduct = async (productId: number) => {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      await deleteProductMutation.mutateAsync(productId);
    }
  };

  const getStatusBadge = (product: any) => {
    if (!product.isApproved) {
      return <Badge variant="secondary">Pending Approval</Badge>;
    }
    if (!product.isActive) {
      return <Badge variant="outline">Inactive</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const getPriceDisplay = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  if (productsLoading || statsLoading) {
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
            <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
            <p className="text-gray-600">Oversee and manage all products on the platform</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-box text-primary text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{productStats?.totalProducts || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-check-circle text-success text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{productStats?.approvedProducts || 0}</p>
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
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{productStats?.pendingProducts || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-toggle-on text-info text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{productStats?.activeProducts || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-toggle-off text-destructive text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900">{productStats?.inactiveProducts || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search products by name, description, vendor, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Products ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={product.image?.url} />
                            <AvatarFallback>{product.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.description?.substring(0, 50)}...</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.vendor?.name || 'No Vendor'}</div>
                          <div className="text-sm text-gray-500">{product.vendor?.user?.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category?.name || 'Uncategorized'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{getPriceDisplay(product.price)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{product.stock}</div>
                          <div className="text-sm text-gray-500">units</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(product)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprovalUpdate(product)}
                          >
                            {product.isApproved ? 'Update Status' : 'Approve/Reject'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Approval Dialog */}
        <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Product Status</DialogTitle>
              <DialogDescription>
                Update the status for {selectedProduct?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={approvalData.status} 
                  onValueChange={(value) => setApprovalData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Reason (Optional)</label>
                <Textarea
                  placeholder="Enter reason for status change..."
                  value={approvalData.reason}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setApprovalDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleApprovalSubmit}
                  disabled={updateProductStatusMutation.isPending}
                >
                  {updateProductStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

