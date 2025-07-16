import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/auth/protected-route";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import SellerDashboard from "@/pages/seller/dashboard";
import SellerProducts from "@/pages/seller/products";
import SellerOrders from "@/pages/seller/orders";
import SellerInventory from "@/pages/seller/inventory";
import SellerEarnings from "@/pages/seller/earnings";
import SellerReviews from "@/pages/seller/reviews";
import SellerProfile from "@/pages/seller/profile";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminSellers from "@/pages/admin/sellers";
import AdminProducts from "@/pages/admin/products";
import AdminOrders from "@/pages/admin/orders";
import AdminAnalytics from "@/pages/admin/analytics";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Seller Routes */}
      <Route path="/seller">
        <ProtectedRoute allowedRoles={['seller']}>
          <SellerDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/products">
        <ProtectedRoute allowedRoles={['seller']}>
          <SellerProducts />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/orders">
        <ProtectedRoute allowedRoles={['seller']}>
          <SellerOrders />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/inventory">
        <ProtectedRoute allowedRoles={['seller']}>
          <SellerInventory />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/earnings">
        <ProtectedRoute allowedRoles={['seller']}>
          <SellerEarnings />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/reviews">
        <ProtectedRoute allowedRoles={['seller']}>
          <SellerReviews />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/profile">
        <ProtectedRoute allowedRoles={['seller']}>
          <SellerProfile />
        </ProtectedRoute>
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
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
      <Route path="/admin/analytics">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminAnalytics />
        </ProtectedRoute>
      </Route>
      
      {/* Redirect root to appropriate dashboard */}
      <Route path="/">
        <ProtectedRoute>
          <div>Redirecting...</div>
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
