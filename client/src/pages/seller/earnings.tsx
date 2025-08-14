import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import SalesChart from '@/components/charts/sales-chart';
import { useAuth } from '@/hooks/use-auth';

export default function SellerEarnings() {
  const { user } = useAuth();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics'],
  });

  const { data: orders } = useQuery({
    queryKey: ['/api/orders'],
  });

  const { data: products } = useQuery({
    queryKey: ['/api/products'],
  });

  // Generate sample chart data for earnings
  const earningsChartData = [
    { date: 'Mon', sales: 4500 },
    { date: 'Tue', sales: 5200 },
    { date: 'Wed', sales: 3800 },
    { date: 'Thu', sales: 6100 },
    { date: 'Fri', sales: 4800 },
    { date: 'Sat', sales: 7200 },
    { date: 'Sun', sales: 5500 },
  ];

  // Calculate additional metrics
  const totalRevenue = (analytics as any)?.totalRevenue || 0;
  const totalOrders = (analytics as any)?.totalOrders || 0;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalProducts = Array.isArray(products) ? products.length : 0;
  const activeProducts = Array.isArray(products) ? products.filter((p: any) => p.isActive).length : 0;

  // Recent orders for earnings breakdown
  const recentOrders = Array.isArray(orders) ? orders.slice(-10) : [];

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
            Earnings & Analytics 📊
          </h2>
          <p className="text-gray-600">Track your business performance and revenue insights.</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-success mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    +15.3% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-rupee-sign text-success text-xl"></i>
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
                    {totalOrders}
                  </p>
                  <p className="text-xs text-success mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    +8.7% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-shopping-cart text-primary text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{averageOrderValue.toFixed(0)}
                  </p>
                  <p className="text-xs text-success mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    +5.2% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-warning text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeProducts}/{totalProducts}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 0}% active
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-box text-secondary text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Earnings Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Weekly Earnings</CardTitle>
                  <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
                    <option value="7days">Last 7 days</option>
                    <option value="30days">Last 30 days</option>
                    <option value="3months">Last 3 months</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <SalesChart data={earningsChartData} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Order Completion Rate</span>
                    <span className="text-sm text-gray-600">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Customer Satisfaction</span>
                    <span className="text-sm text-gray-600">4.5/5</span>
                  </div>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i 
                        key={star}
                        className={`fas fa-star text-sm ${
                          star <= 4.5 
                            ? 'text-warning' 
                            : 'text-gray-300'
                        }`}
                      ></i>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Product Performance</span>
                    <span className="text-sm text-gray-600">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Revenue Growth</span>
                    <span className="text-sm text-success">+15.3%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Earnings Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Performing Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Earning Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(analytics as any)?.topProducts?.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No products found</p>
                ) : (
                  (analytics as any)?.topProducts?.slice(0, 5).map((product: any, index: number) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">
                            {product.salesCount || 0} units sold
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

          {/* Recent Orders Earnings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Order Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No recent orders</p>
                ) : (
                  recentOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                          <i className="fas fa-shopping-cart text-success"></i>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
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

        {/* Earnings Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-success/5 rounded-lg">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-calendar-day text-success text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Today's Earnings</h3>
                <p className="text-2xl font-bold text-success">₹{Math.floor(totalRevenue * 0.15).toLocaleString()}</p>
                <p className="text-sm text-gray-600">+12.5% from yesterday</p>
              </div>

              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-calendar-week text-primary text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">This Week</h3>
                <p className="text-2xl font-bold text-primary">₹{Math.floor(totalRevenue * 0.25).toLocaleString()}</p>
                <p className="text-sm text-gray-600">+8.3% from last week</p>
              </div>

              <div className="text-center p-4 bg-warning/5 rounded-lg">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-calendar-alt text-warning text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">This Month</h3>
                <p className="text-2xl font-bold text-warning">₹{Math.floor(totalRevenue * 0.85).toLocaleString()}</p>
                <p className="text-sm text-gray-600">+15.7% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
