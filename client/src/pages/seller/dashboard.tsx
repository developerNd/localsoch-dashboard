import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useAuth } from '@/hooks/use-auth';
import { useSellerOrders, useSellerEarnings, useProducts, useVendors, useVendorSubscription, useVendorByUser } from '@/hooks/use-api';
import { useVendorApproval } from '@/hooks/use-vendor-approval';
import { Link } from 'wouter';
import { useEffect, useRef } from 'react';

export default function SellerDashboard() {
  const { user } = useAuth();
  const renderCount = useRef(0);
  const redirectAttempted = useRef(false);

  // Prevent infinite re-renders
  useEffect(() => {
    renderCount.current += 1;
    if (renderCount.current > 10) {
      console.error('Too many re-renders detected, stopping');
      return;
    }
  });

  // Check for incomplete registration - only for non-admin users
  useEffect(() => {
    const userRole = user?.role;
    const roleName = typeof userRole === 'object' ? userRole.name : userRole;
    
    if (roleName !== 'admin') {
      const pendingData = localStorage.getItem('pendingSellerData');
      if (pendingData) {
        window.location.href = '/incomplete-registration';
        return;
      }
    }
  }, [user]);

  // Get vendor approval status
  const { isApproved, isPending, isRejected, isSuspended, isLoading: approvalLoading } = useVendorApproval();

  // Check vendor approval status and redirect if not approved
  useEffect(() => {
    if (!approvalLoading && !redirectAttempted.current && user?.vendorId) {
      // Check if we're already on the pending approval page to prevent loops
      const currentPage = localStorage.getItem('currentPage');
      if (currentPage === 'pending-approval') {
        return; // Don't redirect if we're already on the pending approval page
      }
      
      // Only redirect if status is explicitly not approved
      if (isRejected || isSuspended) {
        redirectAttempted.current = true;
        // Use setTimeout to prevent immediate redirect loops
        setTimeout(() => {
          window.location.href = '/seller/pending-approval';
        }, 100);
        return;
      }
      
      // For pending status, only redirect if we're sure it's not approved
      if (isPending && !isApproved) {
        redirectAttempted.current = true;
        // Use setTimeout to prevent immediate redirect loops
        setTimeout(() => {
          window.location.href = '/seller/pending-approval';
        }, 100);
        return;
      }
    }
  }, [isApproved, isPending, isRejected, isSuspended, approvalLoading, user?.vendorId]);

  // Set current page in localStorage to prevent redirect loops
  useEffect(() => {
    localStorage.setItem('currentPage', 'seller-dashboard');
    return () => {
      localStorage.removeItem('currentPage');
    };
  }, []);

  // Get vendor record for the current user
  const { data: vendorRecord, isLoading: vendorLoading, error: vendorError } = useVendorByUser(user?.id);
  
  // Get vendor ID from vendor record
  const vendorId = vendorRecord?.id;

  // Fetch real data only if vendorId is available
  const { data: orders, isLoading: ordersLoading } = useSellerOrders(vendorId);
  const { data: earnings, isLoading: earningsLoading } = useSellerEarnings(vendorId);
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: vendors, isLoading: vendorsLoading } = useVendors();
  const { data: subscription, isLoading: subscriptionLoading } = useVendorSubscription(vendorId);

  const isLoading = vendorLoading || ordersLoading || earningsLoading || productsLoading || vendorsLoading || subscriptionLoading || approvalLoading;

  // Filter products for this seller
  const sellerProducts = Array.isArray(products) ? products.filter((product: any) => 
    product.vendorId === vendorId || product.sellerId === vendorId
  ) : [];

  // Calculate real data
  const totalProducts = sellerProducts.length;
  const totalOrders = orders?.length || 0;
  const totalRevenue = earnings?.totalRevenue || 0;
  
  // Calculate stock value and alerts
  const totalStockValue = sellerProducts.reduce((sum: number, product: any) => {
    const stock = product.stock || 0;
    const price = parseFloat(product.price) || 0;
    return sum + (stock * price);
  }, 0);

  const lowStockProducts = sellerProducts.filter((product: any) => 
    (product.stock || 0) <= 5 && (product.stock || 0) > 0
  ).length;

  const outOfStockProducts = sellerProducts.filter((product: any) => 
    (product.stock || 0) === 0
  ).length;

  // Get recent orders
  const recentOrders = orders?.slice(0, 5) || [];

  // Get vendor info
  const vendorInfo = Array.isArray(vendors) ? vendors.find((vendor: any) => 
    vendor.id === vendorId
  ) : null;

  // Check if user is seller
  const isSeller = user && typeof user.role === 'object' && user.role?.name === 'seller';
  
  // Show error if vendor data failed to load
  if (vendorError && !vendorLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <MobileNav />
        
        <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <i className="fas fa-exclamation-triangle text-6xl text-red-500 mb-6"></i>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Vendor Data Error</h2>
              <p className="text-gray-600 mb-6">
                Failed to load vendor information. Please try refreshing the page or contact support.
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <MobileNav />
        
        <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }
  
  if (!isSeller) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <MobileNav />
        
        <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <i className="fas fa-exclamation-triangle text-6xl text-yellow-500 mb-6"></i>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                You don't have permission to access the seller dashboard.
              </p>
              <Button 
                onClick={() => window.location.href = '/login'} 
                variant="outline"
              >
                Back to Login
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.username || 'Seller'}! 👋
          </h2>
          <p className="text-gray-600">Here's what's happening with your store today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription</CardTitle>
              <i className="fas fa-crown text-2xl text-yellow-500"></i>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <>
                  <div className="text-lg font-bold text-yellow-600">
                    {subscription.plan?.name || subscription.subscriptionPlan?.name || 'Active Plan'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {subscription.status === 'active' ? 'Active' : subscription.status}
                  </p>
                  {subscription.plan?.price && (
                    <p className="text-xs text-muted-foreground">
                      Price: ₹{subscription.plan.price}/{subscription.plan.durationType || 'month'}
                    </p>
                  )}
                  {subscription.amount && !subscription.plan?.price && (
                    <p className="text-xs text-muted-foreground">
                      Price: ₹{subscription.amount}/{subscription.plan?.durationType || 'month'}
                    </p>
                  )}
                  {subscription.endDate && (
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(subscription.endDate).toLocaleDateString()}
                    </p>
                  )}
                  {subscription.expiresAt && (
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(subscription.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                  {subscription.plan?.features && subscription.plan.features.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700">Features:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {subscription.plan.features.slice(0, 3).map((feature: string, index: number) => (
                          <li key={index} className="flex items-center">
                            <i className="fas fa-check text-green-500 mr-1 text-xs"></i>
                            {feature}
                          </li>
                        ))}
                        {subscription.plan.features.length > 3 && (
                          <li className="text-xs text-gray-500">
                            +{subscription.plan.features.length - 3} more features
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-lg font-bold text-gray-400">No Active Plan</div>
                  <p className="text-xs text-muted-foreground">
                    <Link href="/subscription-selection">
                      <span className="text-blue-600 hover:underline cursor-pointer">
                        Choose a plan
                      </span>
                    </Link>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {(lowStockProducts > 0 || outOfStockProducts > 0) && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Alerts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outOfStockProducts > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <i className="fas fa-times-circle text-red-500 text-xl mr-3"></i>
                        <div>
                          <p className="font-medium text-red-700">Out of Stock Items</p>
                          <p className="text-sm text-red-600">{outOfStockProducts} products need restocking</p>
                        </div>
                      </div>
                      <Link href="/seller/products">
                        <Button variant="outline" size="sm">
                          View All
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {lowStockProducts > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <i className="fas fa-exclamation-triangle text-yellow-500 text-xl mr-3"></i>
                        <div>
                          <p className="font-medium text-yellow-700">Low Stock Items</p>
                          <p className="text-sm text-yellow-600">{lowStockProducts} products running low</p>
                        </div>
                      </div>
                      <Link href="/seller/products">
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

        {/* Subscription Details Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Status</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {subscription ? (
              <>
                {/* Current Plan Details */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <i className="fas fa-crown text-yellow-500 mr-2"></i>
                      Current Plan: {subscription.plan?.name || subscription.subscriptionPlan?.name || 'Active Plan'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Plan:</span>
                        <span className="font-medium">
                          {subscription.plan?.name || subscription.subscriptionPlan?.name || 'Active Plan'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className="font-medium">
                          {subscription.status === 'active' ? 'Active' : subscription.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Price:</span>
                        <span className="font-medium">
                          ₹{subscription.plan?.price || subscription.amount || 0}/{subscription.plan?.durationType || 'month'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Started:</span>
                        <span className="font-medium">
                          {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      {subscription.endDate && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Expires:</span>
                          <span className="font-medium">
                            {new Date(subscription.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {subscription.expiresAt && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Expires:</span>
                          <span className="font-medium">
                            {new Date(subscription.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Plan Features */}
                <Card>
                  <CardHeader>
                    <CardTitle>Plan Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subscription.plan?.features && subscription.plan.features.length > 0 ? (
                      <ul className="space-y-2">
                        {subscription.plan.features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-center">
                            <i className="fas fa-check text-green-500 mr-2"></i>
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    ) : subscription.features && subscription.features.length > 0 ? (
                      <ul className="space-y-2">
                        {subscription.features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-center">
                            <i className="fas fa-check text-green-500 mr-2"></i>
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-4">
                        <i className="fas fa-info-circle text-gray-400 text-2xl mb-2"></i>
                        <p className="text-gray-500 text-sm">No specific features listed</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              /* No Active Subscription */
              <Card className="border-gray-200 bg-gray-50 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-exclamation-triangle text-orange-500 mr-2"></i>
                    No Active Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <i className="fas fa-crown text-gray-400 text-4xl mb-4"></i>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Choose a Subscription Plan</h4>
                    <p className="text-gray-600 mb-4">
                      Select a plan to unlock premium features and increase your selling potential.
                    </p>
                    <Link href="/subscription-selection">
                      <Button className="bg-yellow-500 hover:bg-yellow-600">
                        <i className="fas fa-crown mr-2"></i>
                        View Plans
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>



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
                        <p className="font-medium text-gray-900">Order #{order.orderNumber || order.id}</p>
                        <p className="text-sm text-gray-600">
                          ₹{parseFloat(order.totalAmount || 0).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Simple Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Products</span>
                  <span className="font-semibold">{totalProducts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Orders</span>
                  <span className="font-semibold">{totalOrders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Low Stock Items</span>
                  <span className="font-semibold text-orange-600">{lowStockProducts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Out of Stock</span>
                  <span className="font-semibold text-red-600">{outOfStockProducts}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
