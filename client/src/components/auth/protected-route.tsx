import { useAuth } from '@/hooks/use-auth';
import { useVendorApproval } from '@/hooks/use-vendor-approval';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { isApproved, isPending, isLoading: approvalLoading } = useVendorApproval();
  const [, setLocation] = useLocation();



  useEffect(() => {
    // Add a small delay to give authentication time to load
    const timer = setTimeout(() => {
      if (!isLoading && !isAuthenticated) {
        setLocation('/login');
        return;
      }

      // Check seller approval status
      if (user?.vendorId && !approvalLoading) {
        if (isPending || !isApproved) {
          setLocation('/seller/pending-approval');
          return;
        }
      }

      if (user && allowedRoles) {
        // Check if user has vendorId (seller) or not (admin)
        const userType = user.vendorId ? 'seller' : 'admin';
        if (!allowedRoles.includes(userType)) {
          // Redirect to appropriate dashboard based on user type
          if (user.vendorId) {
            setLocation('/seller');
          } else {
            setLocation('/admin');
          }
          return;
        }
      }
    }, 100); // 100ms delay

    return () => clearTimeout(timer);
  }, [user, isLoading, isAuthenticated, allowedRoles, setLocation, isApproved, isPending, approvalLoading]);

  if (isLoading || (user?.vendorId && approvalLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user) {
    const userType = user.vendorId ? 'seller' : 'admin';
    if (!allowedRoles.includes(userType)) {
      return null;
    }
  }

  return <>{children}</>;
}
