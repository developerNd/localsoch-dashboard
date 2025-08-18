import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DataTable } from '@/components/ui/data-table';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useAdminProducts, useUpdateProductStatus, useDeleteProduct, useProductStats } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { getImageUrl } from '@/lib/config';

export default function AdminProducts() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalData, setApprovalData] = useState({ status: '' });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
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
      setApprovalData({ status: '' });
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



  const handleApprovalUpdate = (product: any) => {
    setSelectedProduct(product);
    setApprovalData({ status: product.isApproved ? 'approved' : 'pending' });
    setApprovalDialog(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedProduct || !approvalData.status) return;
    
    await updateProductStatusMutation.mutateAsync({
      id: selectedProduct.id,
      status: approvalData.status
    });
  };

  const handleDeleteProduct = (product: any) => {
    setProductToDelete(product);
    setDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await deleteProductMutation.mutateAsync(productToDelete.id);
      toast({
        title: "Product Deleted",
        description: "Product has been deleted successfully.",
      });
      setDeleteDialog(false);
      setProductToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
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
      
              <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
            <p className="text-gray-600">Oversee and manage all products on the platform</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-times-circle text-destructive text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{productStats?.rejectedProducts || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <DataTable
          data={products || []}
          columns={[
            {
              key: 'product',
              header: 'Product',
              width: '350px',
              render: (_, product) => (
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={product.image ? getImageUrl(product.image.url || product.image.data?.attributes?.url) : undefined} 
                      alt={product.name}
                    />
                    <AvatarFallback className="bg-primary text-white">
                      {product.name?.charAt(0)?.toUpperCase() || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.description?.substring(0, 60)}...</div>
                  </div>
                </div>
              )
            },
            {
              key: 'vendor.name',
              header: 'Vendor',
              width: '200px',
              sortable: true,
              render: (_, product) => (
                <div>
                  <div className="font-medium">{product.vendor?.name || 'No Vendor'}</div>
                  <div className="text-sm text-gray-500">{product.vendor?.user?.username}</div>
                </div>
              )
            },
            {
              key: 'category.name',
              header: 'Category',
              width: '150px',
              sortable: true,
              render: (_, product) => (
                <Badge variant="outline">{product.category?.name || 'Uncategorized'}</Badge>
              )
            },
            {
              key: 'price',
              header: 'Price',
              width: '120px',
              sortable: true,
              render: (_, product) => (
                <div className="font-medium">{getPriceDisplay(product.price)}</div>
              )
            },
            {
              key: 'stock',
              header: 'Stock',
              width: '100px',
              sortable: true,
              render: (_, product) => (
                <div className="text-center">
                  <div className="font-medium">{product.stock}</div>
                  <div className="text-sm text-gray-500">units</div>
                </div>
              )
            },
            {
              key: 'status',
              header: 'Status',
              width: '150px',
              sortable: true,
              render: (_, product) => getStatusBadge(product)
            },
            {
              key: 'actions',
              header: 'Actions',
              width: '200px',
              render: (_, product) => (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprovalUpdate(product);
                    }}
                  >
                    {product.isApproved ? 'Update Status' : 'Approve/Reject'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProduct(product);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              )
            }
          ]}
          title={`Products (${products?.length || 0})`}
          searchable={true}
          searchPlaceholder="Search products by name, description, vendor, or category..."
          searchKeys={['name', 'description', 'vendor.name', 'category.name', 'vendor.user.username']}
          pageSize={10}
          emptyMessage="No products found"
        />

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
              {/* Product Details */}
              {selectedProduct && (
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Avatar className="h-16 w-16">
                    <AvatarImage 
                      src={selectedProduct.image ? getImageUrl(selectedProduct.image.url || selectedProduct.image.data?.attributes?.url) : undefined} 
                      alt={selectedProduct.name}
                    />
                    <AvatarFallback className="bg-primary text-white text-lg">
                      {selectedProduct.name?.charAt(0)?.toUpperCase() || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-lg">{selectedProduct.name}</div>
                    <div className="text-sm text-gray-600">{selectedProduct.description?.substring(0, 80)}...</div>
                    <div className="text-sm text-gray-500">{selectedProduct.vendor?.name}</div>
                    <div className="text-xs text-gray-400">Current Status: {selectedProduct.isApproved ? 'Approved' : 'Pending'}</div>
                  </div>
                </div>
              )}
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{productToDelete?.name}</strong>? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {/* Product Details in Delete Dialog */}
            {productToDelete && (
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg my-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={productToDelete.image ? getImageUrl(productToDelete.image.url || productToDelete.image.data?.attributes?.url) : undefined} 
                    alt={productToDelete.name}
                  />
                  <AvatarFallback className="bg-primary text-white text-lg">
                    {productToDelete.name?.charAt(0)?.toUpperCase() || 'P'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-lg">{productToDelete.name}</div>
                  <div className="text-sm text-gray-600">{productToDelete.description?.substring(0, 80)}...</div>
                  <div className="text-sm text-gray-500">{productToDelete.vendor?.name}</div>
                  <div className="text-xs text-gray-400">Price: {getPriceDisplay(productToDelete.price)}</div>
                </div>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteProductMutation.isPending}
              >
                {deleteProductMutation.isPending ? 'Deleting...' : 'Delete Product'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

