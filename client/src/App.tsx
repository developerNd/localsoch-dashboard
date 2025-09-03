import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/auth/protected-route";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Payment from "@/pages/payment";
import SellerDashboard from "@/pages/seller/dashboard";
import SellerProducts from "@/pages/seller/products";
import SellerOrders from "@/pages/seller/orders";
import SellerInventory from "@/pages/seller/inventory";
import SellerEarnings from "@/pages/seller/earnings";
import SellerButtonTracking from "@/pages/seller/button-tracking";
import SellerReviews from "@/pages/seller/reviews";
import SellerSubscriptions from "@/pages/seller/subscriptions";
import SellerProfile from "@/pages/seller/profile";
import PendingApproval from "@/pages/seller/pending-approval";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminSellers from "@/pages/admin/sellers";
import AdminProducts from "@/pages/admin/products";
import AdminOrders from "@/pages/admin/orders";
import AdminBanners from "@/pages/admin/banners";
import AdminNotifications from "@/pages/admin/notifications";
import AdminBusinessCategories from "@/pages/admin/business-categories";
import AdminProductCategories from "@/pages/admin/product-categories";
import AdminSubscriptionPlans from "@/pages/admin/subscription-plans";
import SubscriptionSelection from "@/pages/subscription-selection";
import IncompleteRegistration from "@/pages/incomplete-registration";
import RedirectToPendingApproval from "@/components/RedirectToPendingApproval";


// Root redirect component
function RootRedirect() {
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      // Check user role first
      const userRole = user.role;
      const roleName = typeof userRole === 'object' ? userRole.name : userRole;
      
      // Admin users should never see incomplete registration page
      if (roleName === 'admin') {
        window.location.href = '/admin';
        return;
      }
      
      // Check if user has pending registration data (incomplete registration)
      const pendingData = localStorage.getItem('pendingSellerData');
      
      if (pendingData) {
        // User has registered but hasn't completed subscription purchase
        window.location.href = '/incomplete-registration';
        return;
      }
      
      // Check user role and redirect accordingly
      if (roleName === 'seller' && user.vendorId) {
        // Seller with vendor profile - redirect to seller dashboard
        window.location.href = '/seller';
      } else if (roleName === 'seller' && !user.vendorId) {
        // Seller without vendor profile - might be incomplete registration
        window.location.href = '/incomplete-registration';
      } else {
        // Default fallback - redirect to admin (or could be login)
        window.location.href = '/admin';
      }
    }
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/payment" component={Payment} />
      
      {/* Seller Routes - Admin can also access for management */}
      <Route path="/seller">
        <ProtectedRoute allowedRoles={['seller', 'admin']}>
          <SellerDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/products">
        <ProtectedRoute allowedRoles={['seller', 'admin']}>
          <SellerProducts />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/orders">
        <ProtectedRoute allowedRoles={['seller', 'admin']}>
          <SellerOrders />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/inventory">
        <ProtectedRoute allowedRoles={['seller', 'admin']}>
          <SellerInventory />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/earnings">
        <ProtectedRoute allowedRoles={['seller', 'admin']}>
          <SellerEarnings />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/button-tracking">
        <ProtectedRoute allowedRoles={['seller', 'admin']}>
          <SellerButtonTracking />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/reviews">
        <ProtectedRoute allowedRoles={['seller', 'admin']}>
          <SellerReviews />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/subscriptions">
        <ProtectedRoute allowedRoles={['seller', 'admin']}>
          <SellerSubscriptions />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/profile">
        <ProtectedRoute allowedRoles={['seller', 'admin']}>
          <SellerProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/pending-approval">
        <ProtectedRoute allowedRoles={['seller', 'admin']}>
          <PendingApproval />
        </ProtectedRoute>
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminAnalytics />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/sellers">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminSellers />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/products">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminProducts />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/orders">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminOrders />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/banners">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminBanners />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/notifications">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminNotifications />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/business-categories">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminBusinessCategories />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/product-categories">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminProductCategories />
        </ProtectedRoute>
      </Route>
      
              <Route path="/admin/subscription-plans">
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSubscriptionPlans />
          </ProtectedRoute>
        </Route>
        
        <Route path="/subscription-selection">
          <SubscriptionSelection />
        </Route>
        
        <Route path="/incomplete-registration">
          <ProtectedRoute>
            <IncompleteRegistration />
          </ProtectedRoute>
        </Route>
        
        {/* Redirect /pending-approval to /seller/pending-approval to prevent loops */}
        <Route path="/pending-approval">
          <ProtectedRoute>
            <RedirectToPendingApproval />
          </ProtectedRoute>
        </Route>
      
      {/* Redirect root to appropriate dashboard */}
      <Route path="/">
        <ProtectedRoute>
          <RootRedirect />
        </ProtectedRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
