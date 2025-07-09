import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function AdminProducts() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/products/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Product Updated",
        description: "Product status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products?.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'approved' && product.isApproved) ||
                         (statusFilter === 'pending' && !product.isApproved) ||
                         (statusFilter === 'active' && product.isActive) ||
                         (statusFilter === 'inactive' && !product.isActive);
    
    return matchesSearch && matchesStatus;
  }) || [];

  const approvedProducts = products?.filter((p: any) => p.isApproved) || [];
  const pendingProducts = products?.filter((p: any) => !p.isApproved) || [];
  const activeProducts = products?.filter((p: any) => p.isActive) || [];

  const handleApproveProduct = async (productId: number) => {
    await updateProductMutation.mutateAsync({ 
      id: productId, 
      data: { isApproved: true } 
    });
  };

  const handleToggleActive = async (productId: number, isActive: boolean) => {
    await updateProductMutation.mutateAsync({ 
      id: productId, 
      data: { isActive: !isActive } 
    });
  };

  const getStatusBadge = (product: any) => {
    if (!product.isActive) return <Badge variant="destructive">Inactive</Badge>;
    if (!product.isApproved) return <Badge variant="destructive">Pending Approval</Badge>;
    return <Badge variant="default">Active</Badge>;
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
            <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
            <p className="text-gray-600">Oversee and manage all products on the platform</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-box text-primary text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{products?.length || 0}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{approvedProducts.length}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{pendingProducts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-eye text-error text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{activeProducts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Products</CardTitle>
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'No products match the selected filters.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Seller</TableHead>
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
                            {product.images?.[0] ? (
                              <img 
                                src={product.images[0]} 
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <i className="fas fa-image text-gray-400"></i>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-500 font-mono">{product.sku}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">Seller #{product.sellerId}</p>
                            <p className="text-xs text-gray-500">ID: {product.sellerId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          ₹{parseFloat(product.price).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            product.stock === 0 
                              ? 'bg-red-100 text-red-800'
                              : product.stock <= 5
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {product.stock} units
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(product)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedProduct(product)}
                                >
                                  <i className="fas fa-eye mr-2"></i>
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Product Details</DialogTitle>
                                  <DialogDescription>
                                    Detailed information about the product
                                  </DialogDescription>
                                </DialogHeader>
                                
                                {selectedProduct && (
                                  <div className="space-y-6">
                                    <div className="flex items-center space-x-4">
                                      {selectedProduct.images?.[0] ? (
                                        <img 
                                          src={selectedProduct.images[0]} 
                                          alt={selectedProduct.name}
                                          className="w-24 h-24 rounded-lg object-cover"
                                        />
                                      ) : (
                                        <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                                          <i className="fas fa-image text-gray-400 text-2xl"></i>
                                        </div>
                                      )}
                                      <div>
                                        <h3 className="text-lg font-medium">{selectedProduct.name}</h3>
                                        <p className="text-gray-600">{selectedProduct.description}</p>
                                        <p className="text-sm text-gray-500 font-mono">SKU: {selectedProduct.sku}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-medium mb-2">Pricing & Stock</h4>
                                        <p className="text-sm"><strong>Price:</strong> ₹{parseFloat(selectedProduct.price).toLocaleString()}</p>
                                        <p className="text-sm"><strong>Cost Price:</strong> ₹{selectedProduct.costPrice ? parseFloat(selectedProduct.costPrice).toLocaleString() : 'N/A'}</p>
                                        <p className="text-sm"><strong>Stock:</strong> {selectedProduct.stock} units</p>
                                      </div>
                                      <div>
                                        <h4 className="font-medium mb-2">Status</h4>
                                        <p className="text-sm"><strong>Active:</strong> {selectedProduct.isActive ? 'Yes' : 'No'}</p>
                                        <p className="text-sm"><strong>Approved:</strong> {selectedProduct.isApproved ? 'Yes' : 'No'}</p>
                                        <p className="text-sm"><strong>Created:</strong> {new Date(selectedProduct.createdAt).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex justify-end space-x-2">
                                      {!selectedProduct.isApproved && (
                                        <Button 
                                          onClick={() => handleApproveProduct(selectedProduct.id)}
                                          disabled={updateProductMutation.isPending}
                                        >
                                          Approve Product
                                        </Button>
                                      )}
                                      <Button 
                                        variant={selectedProduct.isActive ? "destructive" : "default"}
                                        onClick={() => handleToggleActive(selectedProduct.id, selectedProduct.isActive)}
                                        disabled={updateProductMutation.isPending}
                                      >
                                        {selectedProduct.isActive ? 'Deactivate' : 'Activate'}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            {!product.isApproved && (
                              <Button 
                                size="sm"
                                onClick={() => handleApproveProduct(product.id)}
                                disabled={updateProductMutation.isPending}
                              >
                                Approve
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
