import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import SalesChart from '@/components/charts/sales-chart';
import { Link } from 'wouter';

export default function AdminDashboard() {
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['/api/analytics'],
  });

  const { data: sellers, isLoading: sellersLoading, error: sellersError } = useQuery({
    queryKey: ['/api/admin/sellers'],
  });

  const { data: orders, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['/api/orders'],
  });

  const isLoading = analyticsLoading || sellersLoading || ordersLoading;
  
  // Data is loading successfully

  // Generate sample chart data for platform revenue
  const chartData = [
    { date: 'Mon', sales: 45000 },
    { date: 'Tue', sales: 52000 },
    { date: 'Wed', sales: 38000 },
    { date: 'Thu', sales: 67000 },
    { date: 'Fri', sales: 59000 },
    { date: 'Sat', sales: 78000 },
    { date: 'Sun', sales: 62000 },
  ];

  const pendingSellers = sellers?.filter((s: any) => s.role === 'seller_pending') || [];
  const activeSellers = sellers?.filter((s: any) => s.role === 'seller') || [];
  const recentOrders = orders?.slice(-5) || [];

  // Show error state if there are errors
  if (analyticsError || sellersError || ordersError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Dashboard Error</h2>
          <p className="text-gray-600">
            {analyticsError?.message || sellersError?.message || ordersError?.message}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
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

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Admin Dashboard 👑
          </h2>
          <p className="text-gray-600">Platform overview and management tools</p>
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
                    +15.3% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-primary text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Sellers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeSellers.length}
                  </p>
                  <p className="text-xs text-warning mt-1">
                    <i className="fas fa-clock mr-1"></i>
                    {pendingSellers.length} pending approval
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-success text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics?.totalOrders || 0}
                  </p>
                  <p className="text-xs text-success mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    +12.8% from last week
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-shopping-cart text-warning text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics?.totalProducts || 0}
                  </p>
                  <p className="text-xs text-primary mt-1">
                    <i className="fas fa-box mr-1"></i>
                    Across all sellers
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-box text-gray-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Platform Revenue</CardTitle>
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

          {/* Pending Approvals */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pending Approvals</CardTitle>
                <Link href="/admin/sellers">
                  <Badge variant="destructive">{pendingSellers.length}</Badge>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingSellers.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No pending approvals</p>
                ) : (
                  pendingSellers.slice(0, 3).map((seller: any) => (
                    <div key={seller.id} className="flex items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                          <i className="fas fa-user text-warning"></i>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {seller.firstName} {seller.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {seller.sellerProfile?.shopName}
                          </p>
                        </div>
                      </div>
                      <Link href="/admin/sellers">
                        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                          Review
                        </Badge>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Sellers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top Performing Sellers</CardTitle>
                <Link href="/admin/sellers">
                  <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                    View All
                  </Badge>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topSellers?.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No seller data available</p>
                ) : (
                  analytics?.topSellers?.slice(0, 5).map((seller: any) => (
                    <div key={seller.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <i className="fas fa-store text-primary"></i>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {seller.firstName} {seller.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {seller.orderCount} orders
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          ₹{(seller.revenue || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )) || []
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Link href="/admin/orders">
                  <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                    View All
                  </Badge>
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Link href="/admin/sellers">
                <div className="flex flex-col items-center p-4 bg-primary/5 hover:bg-primary/10 rounded-lg border border-primary/20 transition-colors cursor-pointer">
                  <i className="fas fa-users text-primary text-2xl mb-2"></i>
                  <span className="text-sm font-medium text-primary">Manage Sellers</span>
                </div>
              </Link>
              
              <Link href="/admin/products">
                <div className="flex flex-col items-center p-4 bg-success/5 hover:bg-success/10 rounded-lg border border-success/20 transition-colors cursor-pointer">
                  <i className="fas fa-box text-success text-2xl mb-2"></i>
                  <span className="text-sm font-medium text-success">Product Oversight</span>
                </div>
              </Link>
              
              <Link href="/admin/orders">
                <div className="flex flex-col items-center p-4 bg-warning/5 hover:bg-warning/10 rounded-lg border border-warning/20 transition-colors cursor-pointer">
                  <i className="fas fa-shopping-cart text-warning text-2xl mb-2"></i>
                  <span className="text-sm font-medium text-warning">Monitor Orders</span>
                </div>
              </Link>
              
              <Link href="/admin/analytics">
                <div className="flex flex-col items-center p-4 bg-secondary/5 hover:bg-secondary/10 rounded-lg border border-secondary/20 transition-colors cursor-pointer">
                  <i className="fas fa-chart-bar text-gray-600 text-2xl mb-2"></i>
                  <span className="text-sm font-medium text-gray-600">View Analytics</span>
                </div>
              </Link>

              <Link href="/admin/banners">
                <div className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors cursor-pointer">
                  <i className="fas fa-image text-purple-600 text-2xl mb-2"></i>
                  <span className="text-sm font-medium text-purple-600">Manage Banners</span>
                </div>
              </Link>

              <Link href="/admin/featured-products">
                <div className="flex flex-col items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 transition-colors cursor-pointer">
                  <i className="fas fa-star text-yellow-600 text-2xl mb-2"></i>
                  <span className="text-sm font-medium text-yellow-600">Featured Products</span>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
