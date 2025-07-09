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

export default function SellerDashboard() {
  const { user } = useAuth();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics'],
  });

  const { data: products } = useQuery({
    queryKey: ['/api/products'],
  });

  const { data: orders } = useQuery({
    queryKey: ['/api/orders'],
  });

  // Generate sample chart data
  const chartData = [
    { date: 'Mon', sales: 12000 },
    { date: 'Tue', sales: 15000 },
    { date: 'Wed', sales: 8000 },
    { date: 'Thu', sales: 22000 },
    { date: 'Fri', sales: 18000 },
    { date: 'Sat', sales: 25000 },
    { date: 'Sun', sales: 20000 },
  ];

  const lowStockProducts = products?.filter((p: any) => p.stock <= 5) || [];
  const recentOrders = orders?.slice(-5) || [];

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
            Welcome back, {user?.firstName}! 👋
          </h2>
          <p className="text-gray-600">Here's what's happening with your store today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{analytics?.totalRevenue?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-success mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    +12.5% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-rupee-sign text-primary text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics?.totalOrders || 0}
                  </p>
                  <p className="text-xs text-success mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    +8.2% from last week
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-shopping-cart text-success text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics?.totalProducts || 0}
                  </p>
                  <p className="text-xs text-warning mt-1">
                    <i className="fas fa-minus mr-1"></i>
                    Stock levels vary
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-box text-warning text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics?.averageRating?.toFixed(1) || '0.0'}
                  </p>
                  <div className="flex items-center mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i 
                        key={star}
                        className={`fas fa-star text-xs ${
                          star <= (analytics?.averageRating || 0) 
                            ? 'text-warning' 
                            : 'text-gray-300'
                        }`}
                      ></i>
                    ))}
                    <span className="text-xs text-gray-500 ml-2">
                      (Based on reviews)
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-star text-warning text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Sales Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Sales Overview</CardTitle>
                  <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
                    <option value="7days">Last 7 days</option>
                    <option value="30days">Last 30 days</option>
                    <option value="3months">Last 3 months</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <SalesChart data={chartData} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Link href="/seller/orders">
                  <Button variant="ghost" size="sm">View all</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No recent orders</p>
                ) : (
                  recentOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <i className="fas fa-shopping-cart text-primary"></i>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.customerName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ₹{parseFloat(order.totalAmount).toLocaleString()}
                        </p>
                        <Badge 
                          variant={
                            order.status === 'delivered' ? 'default' :
                            order.status === 'shipped' ? 'secondary' :
                            order.status === 'pending' ? 'destructive' : 'outline'
                          }
                          className="text-xs"
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Management Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top Performing Products</CardTitle>
                <Link href="/seller/products">
                  <Button variant="ghost" size="sm">Manage Products</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topProducts?.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No products found</p>
                ) : (
                  analytics?.topProducts?.slice(0, 3).map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between">
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
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">
                            Sales: {product.salesCount || 0} units
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          ₹{(product.revenue || 0).toLocaleString()}
                        </p>
                        <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-primary h-1.5 rounded-full" 
                            style={{ width: `${Math.min((product.revenue || 0) / 1000, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )) || []
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inventory Alerts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Inventory Alerts</CardTitle>
                <Badge variant="destructive" className="text-xs">
                  {lowStockProducts.length} Low Stock
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockProducts.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">All products in stock</p>
                ) : (
                  lowStockProducts.slice(0, 3).map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-error/5 border border-error/20 rounded-lg">
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
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-error">
                            {product.stock === 0 ? 'Out of stock' : `Only ${product.stock} left`}
                          </p>
                        </div>
                      </div>
                      <Link href="/seller/inventory">
                        <Button variant="ghost" size="sm">
                          Update Stock
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/seller/products">
                <Button variant="outline" className="flex flex-col items-center p-4 h-auto space-y-2 bg-primary/5 hover:bg-primary/10 border-primary/20">
                  <i className="fas fa-plus text-primary text-2xl"></i>
                  <span className="text-sm font-medium text-primary">Add Product</span>
                </Button>
              </Link>
              
              <Link href="/seller/orders">
                <Button variant="outline" className="flex flex-col items-center p-4 h-auto space-y-2 bg-success/5 hover:bg-success/10 border-success/20">
                  <i className="fas fa-truck text-success text-2xl"></i>
                  <span className="text-sm font-medium text-success">Process Orders</span>
                </Button>
              </Link>
              
              <Link href="/seller/inventory">
                <Button variant="outline" className="flex flex-col items-center p-4 h-auto space-y-2 bg-warning/5 hover:bg-warning/10 border-warning/20">
                  <i className="fas fa-boxes text-warning text-2xl"></i>
                  <span className="text-sm font-medium text-warning">Update Inventory</span>
                </Button>
              </Link>
              
              <Link href="/seller/earnings">
                <Button variant="outline" className="flex flex-col items-center p-4 h-auto space-y-2 bg-secondary/5 hover:bg-secondary/10 border-secondary/20">
                  <i className="fas fa-chart-bar text-gray-600 text-2xl"></i>
                  <span className="text-sm font-medium text-gray-600">View Analytics</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
