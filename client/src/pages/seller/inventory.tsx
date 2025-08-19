import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getImageUrl } from '@/lib/config';
import { DataTable } from '@/components/ui/data-table';

// Helper function to normalize Strapi product data
const normalizeProduct = (product: any) => {
  return {
    id: product.id,
    name: product.attributes?.name || product.name,
    description: product.attributes?.description || product.description,
    price: product.attributes?.price || product.price,
    stock: product.attributes?.stock || product.stock,
    image: product.attributes?.image?.data?.attributes?.url || product.image?.data?.attributes?.url,
    category: product.attributes?.category?.data?.attributes?.name || product.category?.data?.attributes?.name,
    vendor: product.attributes?.vendor?.data?.attributes?.name || product.vendor?.data?.attributes?.name,
    createdAt: product.attributes?.createdAt || product.createdAt,
    updatedAt: product.attributes?.updatedAt || product.updatedAt,
  };
};

export default function SellerInventory() {
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch products from Strapi - filter by vendor if seller
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['/api/products', user?.role, user?.vendorId],
    queryFn: async () => {
      let url = '/api/products?populate=*';
      if (user?.vendorId) {
        url = `/api/products?filters[vendor][id][$eq]=${user.vendorId}&populate=*`;
      }
      const response = await apiRequest('GET', url);
      const data = await response.json();
      const products = data.data || [];
      return products.map(normalizeProduct);
    },
    retry: false,
    enabled: !!user,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    staleTime: 15000,
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ id, stock }: { id: number; stock: number }) => {
      const response = await apiRequest('PUT', `/api/products/${id}`, {
        data: { stock }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setEditingProduct(null);
      setNewStock(0);
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

  // Filter products (search removed)
  const filteredProducts = Array.isArray(products) ? products.filter((product: any) => {
    if (stockFilter === 'low') return product.stock <= 5;
    if (stockFilter === 'out') return product.stock === 0;
    if (stockFilter === 'normal') return product.stock > 5;
    return true;
  }) : [];

  const lowStockProducts = Array.isArray(products) ? products.filter((p: any) => p.stock <= 5) : [];
  const outOfStockProducts = Array.isArray(products) ? products.filter((p: any) => p.stock === 0) : [];
  const totalProducts = Array.isArray(products) ? products.length : 0;
  const totalStockValue = Array.isArray(products) ? products.reduce((sum: number, p: any) => sum + (p.stock * (p.price || 0)), 0) : 0;

  const handleStockUpdate = async () => {
    if (editingProduct && newStock >= 0) {
      await updateStockMutation.mutateAsync({ 
        id: editingProduct.id, 
        stock: newStock 
      });
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: 'destructive', text: 'Out of Stock' };
    if (stock <= 5) return { color: 'warning', text: 'Low Stock' };
    return { color: 'default', text: 'In Stock' };
  };

  const getStockPercentage = (stock: number, maxStock: number = 100) => {
    return Math.min((stock / maxStock) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <MobileNav />
        <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load inventory</h3>
              <p className="text-gray-600 mb-4">Unable to connect to the backend. Please try again later.</p>
              <Button onClick={() => window.location.reload()}>
                <i className="fas fa-refresh mr-2"></i>
                Retry
              </Button>
            </div>
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
            <h2 className="text-2xl font-bold text-gray-900">
              {user?.vendorId ? 'My Inventory' : 'All Inventory'}
            </h2>
            <p className="text-gray-600">
              {user?.vendorId 
                ? 'Monitor and manage your product stock levels' 
                : 'Review inventory across all sellers'
              }
            </p>
          </div>
        </div>

        {/* Filters moved below stats, above table */}

        {/* Inventory Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <i className="fas fa-box text-2xl text-blue-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Active products in catalog
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <i className="fas fa-exclamation-triangle text-2xl text-yellow-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</div>
              <p className="text-xs text-muted-foreground">
                Products with ≤5 units
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <i className="fas fa-times-circle text-2xl text-red-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</div>
              <p className="text-xs text-muted-foreground">
                Products with 0 units
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <i className="fas fa-rupee-sign text-2xl text-green-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{totalStockValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total inventory value
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Filters above table */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="low">Low Stock (≤5)</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
                <SelectItem value="normal">Normal Stock (&gt;5)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-gray-500">Showing {filteredProducts.length} of {totalProducts} products</div>
        </div>

        {/* Inventory Table */}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-8">
                <i className="fas fa-box text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">{stockFilter === 'all' ? 'No products available in inventory.' : 'No products match the current filters.'}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <DataTable
            data={filteredProducts}
            columns={[
              {
                key: 'product',
                header: 'Product',
                render: (_: any, product: any) => (
                  <div className="flex items-center space-x-3">
                    {product.image ? (
                      <img src={getImageUrl(product.image)} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        <i className="fas fa-image text-gray-400"></i>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.category || 'Uncategorized'}</p>
                    </div>
                  </div>
                )
              },
              {
                key: 'stock',
                header: 'Current Stock',
                sortable: true,
                render: (_: any, product: any) => {
                  const stockStatus = getStockStatus(product.stock);
                  return (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{product.stock}</span>
                      <Badge variant={stockStatus.color as any}>{stockStatus.text}</Badge>
                    </div>
                  );
                }
              },
              {
                key: 'level',
                header: 'Stock Level',
                render: (_: any, product: any) => {
                  const stockPercentage = getStockPercentage(product.stock);
                  return (
                    <div className="space-y-2">
                      <Progress value={stockPercentage} className="w-24" />
                      <span className="text-xs text-gray-500">{stockPercentage.toFixed(0)}% of max</span>
                    </div>
                  );
                }
              },
              {
                key: 'value',
                header: 'Value',
                sortable: true,
                render: (_: any, product: any) => (
                  <span className="font-medium text-green-600">₹{((product.stock || 0) * (product.price || 0)).toLocaleString()}</span>
                )
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (_: any, product: any) => (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingProduct(product);
                      setNewStock(product.stock || 0);
                    }}
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Update
                  </Button>
                )
              }
            ]}
            title={`Inventory (${filteredProducts.length})`}
            searchable={false}
            pageSize={10}
            emptyMessage="No products found"
          />
        )}

        {/* Stock Update Dialog */}
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Stock Level</DialogTitle>
              <DialogDescription>
                Update the stock quantity for {editingProduct?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="stock">New Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                  placeholder="Enter new stock quantity"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProduct(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleStockUpdate}
                disabled={updateStockMutation.isPending}
              >
                Update Stock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
