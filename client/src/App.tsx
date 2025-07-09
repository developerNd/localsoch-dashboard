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
      <Route path="/seller" nest>
        <ProtectedRoute allowedRoles={['seller']}>
          <Switch>
            <Route path="/" component={SellerDashboard} />
            <Route path="/products" component={SellerProducts} />
            <Route path="/orders" component={SellerOrders} />
            <Route path="/inventory" component={SellerInventory} />
            <Route path="/earnings" component={SellerEarnings} />
            <Route path="/reviews" component={SellerReviews} />
            <Route path="/profile" component={SellerProfile} />
          </Switch>
        </ProtectedRoute>
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin" nest>
        <ProtectedRoute allowedRoles={['admin']}>
          <Switch>
            <Route path="/" component={AdminDashboard} />
            <Route path="/sellers" component={AdminSellers} />
            <Route path="/products" component={AdminProducts} />
            <Route path="/orders" component={AdminOrders} />
            <Route path="/analytics" component={AdminAnalytics} />
          </Switch>
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
