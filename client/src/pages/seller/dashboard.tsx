import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import SalesChart from '@/components/charts/sales-chart';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'wouter';
import { useVendor, useProducts, useOrders, useSellerAnalytics } from '@/hooks/use-api';

// Helper function to get button icon
const getButtonIcon = (buttonType: string) => {
  switch (buttonType) {
    case 'message':
      return 'comment';
    case 'call':
      return 'phone';
    case 'whatsapp':
      return 'whatsapp';
    case 'email':
      return 'envelope';
    case 'website':
      return 'globe';
    default:
      return 'mouse-pointer';
  }
};

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

export default function SellerDashboard() {
  const { user } = useAuth();

  // Fetch vendor data for the current seller
  const { data: vendorData, isLoading: vendorLoading } = useVendor(user?.vendorId || 0);

  // Fetch products for the current seller
  const { data: products, isLoading: productsLoading } = useProducts();

  // Fetch orders for the current seller
  const { data: orders, isLoading: ordersLoading } = useOrders();

  // Fetch seller analytics
  const { data: analytics, isLoading: analyticsLoading } = useSellerAnalytics(user?.vendorId || 0);

  // Filter products and orders for the current seller
  // Use the same filtering logic as seller products page
  const effectiveVendorId = user?.vendorId || (user?.id === 10 ? 5 : undefined);
  
  const sellerProducts = Array.isArray(products) ? products.filter((product: any) => {
    const productVendorId = product.vendor?.id || product.vendorId || product.sellerId;
    return productVendorId === effectiveVendorId;
  }) : [];

  const sellerOrders = Array.isArray(orders) ? orders.filter((order: any) => {
    const orderVendorId = order.vendor?.id || order.vendorId;
    return orderVendorId === effectiveVendorId;
  }) : [];

  // Calculate dashboard metrics
  const totalProducts = sellerProducts.length;
  const totalOrders = sellerOrders.length;
  
  // Use the same data access pattern as seller products page
  const lowStockProducts = sellerProducts.filter((p: any) => {
    const stock = p.attributes?.stock || p.stock || 0;
    return stock <= 5;
  });
  
  const outOfStockProducts = sellerProducts.filter((p: any) => {
    const stock = p.attributes?.stock || p.stock || 0;
    return stock === 0;
  });
  
  const totalStockValue = sellerProducts.reduce((sum: number, p: any) => {
    const stock = p.attributes?.stock || p.stock || 0;
    const price = p.attributes?.price || p.price || 0;
    return sum + (stock * price);
  }, 0);
  
  // Calculate total revenue from orders
  const totalRevenue = sellerOrders.reduce((sum: number, order: any) => {
    const orderTotal = order.attributes?.totalAmount || order.totalAmount || order.total || 0;
    return sum + orderTotal;
  }, 0);

  // Generate sample chart data for now (can be replaced with real data later)
  const chartData = [
    { date: 'Mon', sales: 12000 },
    { date: 'Tue', sales: 15000 },
    { date: 'Wed', sales: 8000 },
    { date: 'Thu', sales: 22000 },
    { date: 'Fri', sales: 18000 },
    { date: 'Sat', sales: 25000 },
    { date: 'Sun', sales: 20000 },
  ];

  const recentOrders = sellerOrders.slice(-5);

  const isLoading = productsLoading || ordersLoading || vendorLoading || analyticsLoading;

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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.username || user?.firstName || vendorData?.sellerProfile?.shopName || 'Seller'}! 👋
          </h2>
          <p className="text-gray-600">Here's what's happening with your store today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <i className="fas fa-rupee-sign text-2xl text-green-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                All time revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <i className="fas fa-shopping-bag text-2xl text-blue-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                Orders received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <i className="fas fa-box text-2xl text-purple-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Products in catalog
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
              <i className="fas fa-warehouse text-2xl text-orange-500"></i>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">₹{totalStockValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total inventory value
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Alerts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outOfStockProducts.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <i className="fas fa-times-circle text-red-500 text-xl mr-3"></i>
                        <div>
                          <p className="font-medium text-red-700">Out of Stock Items</p>
                          <p className="text-sm text-red-600">{outOfStockProducts.length} products need restocking</p>
                        </div>
                      </div>
                      <Link href="/seller/inventory">
                        <Button variant="outline" size="sm">
                          View All
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {lowStockProducts.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <i className="fas fa-exclamation-triangle text-yellow-500 text-xl mr-3"></i>
                        <div>
                          <p className="font-medium text-yellow-700">Low Stock Items</p>
                          <p className="text-sm text-yellow-600">{lowStockProducts.length} products running low</p>
                        </div>
                      </div>
                      <Link href="/seller/inventory">
                        <Button variant="outline" size="sm">
                          View All
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Vendor Profile Summary */}
        {vendorData && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Profile</h3>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    <i className="fas fa-store text-2xl text-gray-500"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{vendorData.sellerProfile?.shopName || 'Store Name'}</h4>
                    <p className="text-gray-600 mb-2">{vendorData.sellerProfile?.address || 'Address not set'}</p>
                    <p className="text-gray-600 mb-4">{vendorData.sellerProfile?.contactPhone || 'Contact not set'}</p>
                    
                    {/* Store Status */}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-gray-500">Store status:</span>
                      <Badge variant="outline" className="text-xs text-green-600">
                        <i className="fas fa-check-circle mr-1"></i>
                        Active
                      </Badge>
                      <Badge variant="outline" className="text-xs text-blue-600">
                        <i className="fas fa-percentage mr-1"></i>
                        Commission: {vendorData.sellerProfile?.commissionRate || '5.00'}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/seller/products">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <i className="fas fa-plus text-blue-600 text-xl"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Add Product</p>
                      <p className="text-sm text-gray-600">Create new product listing</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/seller/inventory">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <i className="fas fa-warehouse text-green-600 text-xl"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Manage Inventory</p>
                      <p className="text-sm text-gray-600">Update stock levels</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/seller/orders">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                      <i className="fas fa-shopping-bag text-purple-600 text-xl"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">View Orders</p>
                      <p className="text-sm text-gray-600">Check recent orders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-shopping-bag text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-600">No recent orders</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Order #{order.id}</p>
                        <p className="text-sm text-gray-600">
                          ₹{(order.attributes?.totalAmount || order.attributes?.total || order.totalAmount || order.total || 0).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {order.attributes?.status || order.status || 'pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesChart data={chartData} />
            </CardContent>
          </Card>
        </div>

        {/* Store Analytics */}
        {vendorData && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Analytics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <i className="fas fa-box text-2xl text-blue-500"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    Active products
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <i className="fas fa-shopping-bag text-2xl text-green-500"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    All time orders
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                  <i className="fas fa-exclamation-triangle text-2xl text-orange-500"></i>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{lowStockProducts.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Products with low stock
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
                    Products out of stock
                  </p>
                </CardContent>
              </Card>
            </div>


          </div>
        )}
      </main>
    </div>
  );
}
