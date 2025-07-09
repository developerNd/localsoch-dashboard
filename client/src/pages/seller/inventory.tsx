import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function SellerInventory() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [stockUpdate, setStockUpdate] = useState<number>(0);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: number; stock: number }) => {
      const response = await apiRequest('PUT', `/api/products/${id}`, { stock });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsUpdateDialogOpen(false);
      setSelectedProduct(null);
      toast({
        title: "Stock Updated",
        description: "Product stock has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update stock",
        variant: "destructive",
      });
    },
  });

  const lowStockProducts = products?.filter((p: any) => p.stock <= 5) || [];
  const outOfStockProducts = products?.filter((p: any) => p.stock === 0) || [];
  const inStockProducts = products?.filter((p: any) => p.stock > 5) || [];

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (stock <= 5) return { label: 'Low Stock', variant: 'destructive' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  const handleUpdateStock = (product: any) => {
    setSelectedProduct(product);
    setStockUpdate(product.stock);
    setIsUpdateDialogOpen(true);
  };

  const handleStockSubmit = async () => {
    if (selectedProduct) {
      await updateStockMutation.mutateAsync({
        id: selectedProduct.id,
        stock: stockUpdate,
      });
    }
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
            <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
            <p className="text-gray-600">Monitor and update your product stock levels</p>
          </div>
        </div>

        {/* Alert for low stock */}
        {lowStockProducts.length > 0 && (
          <Alert className="mb-6 border-warning bg-warning/5">
            <i className="fas fa-exclamation-triangle text-warning"></i>
            <AlertDescription>
              You have {lowStockProducts.length} product(s) with low stock levels. Consider restocking soon.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-check-circle text-success text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">In Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{inStockProducts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-exclamation-triangle text-warning text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{lowStockProducts.length}</p>
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
                  <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{outOfStockProducts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            {products?.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-boxes text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">Add products to manage your inventory.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products?.map((product: any) => {
                      const stockStatus = getStockStatus(product.stock);
                      return (
                        <TableRow key={product.id} className={product.stock === 0 ? 'bg-red-50' : product.stock <= 5 ? 'bg-yellow-50' : ''}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              {product.images?.[0] ? (
                                <img 
                                  src={product.images[0]} 
                                  alt={product.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <i className="fas fa-image text-gray-400"></i>
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-900">{product.name}</p>
                                <p className="text-sm text-gray-500">{product.description?.slice(0, 50)}...</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell>
                            <span className="text-lg font-semibold">{product.stock}</span>
                            <span className="text-sm text-gray-500 ml-1">units</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.variant}>
                              {stockStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>₹{parseFloat(product.price).toLocaleString()}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStock(product)}
                            >
                              <i className="fas fa-edit mr-2"></i>
                              Update Stock
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Update Stock Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Stock</DialogTitle>
              <DialogDescription>
                Update the stock quantity for {selectedProduct?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                {selectedProduct?.images?.[0] ? (
                  <img 
                    src={selectedProduct.images[0]} 
                    alt={selectedProduct?.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <i className="fas fa-image text-gray-400"></i>
                  </div>
                )}
                <div>
                  <h4 className="font-medium">{selectedProduct?.name}</h4>
                  <p className="text-sm text-gray-500">SKU: {selectedProduct?.sku}</p>
                  <p className="text-sm text-gray-500">Current Stock: {selectedProduct?.stock} units</p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="stock">New Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={stockUpdate}
                  onChange={(e) => setStockUpdate(parseInt(e.target.value) || 0)}
                  placeholder="Enter new stock quantity"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleStockSubmit}
                disabled={updateStockMutation.isPending}
              >
                {updateStockMutation.isPending ? 'Updating...' : 'Update Stock'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
