import { useAuth } from '@/hooks/use-auth';
import { useVendorApproval } from '@/hooks/use-vendor-approval';
import { useLocation } from 'wouter';
import { useEffect, useRef } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const location = useLocation()[0];
  const redirectAttempted = useRef(false);
  const lastPathRef = useRef(location);

  const { isApproved, isPending, isRejected, isSuspended, isLoading: approvalLoading } = useVendorApproval();

  // Reset redirect flag when path changes
  useEffect(() => {
    if (lastPathRef.current !== location) {
      redirectAttempted.current = false;
      lastPathRef.current = location;
    }
  }, [location]);

  useEffect(() => {
    // Add a small delay to give authentication time to load
    const timer = setTimeout(() => {
      if (!isLoading && !isAuthenticated) {
        setLocation('/login');
        return;
      }

      const onPendingPage = location === '/seller/pending-approval';
      const onSellerPage = location === '/seller' || location.startsWith('/seller/');

      // Check user role first
      const userRole = user?.role;
      const roleName = typeof userRole === 'object' ? userRole.name : userRole;

      // Check for incomplete registration - only for non-admin users
      if (roleName !== 'admin') {
        const pendingData = localStorage.getItem('pendingSellerData');
        if (pendingData && user) {
          if (location !== '/incomplete-registration') {
            setLocation('/incomplete-registration');
          }
          return;
        }
      }

      // Vendor status-based routing
      if (user?.vendorId && !approvalLoading && !redirectAttempted.current) {
        // If already on pending page: only leave if approved
        if (onPendingPage) {
          if (isApproved && !isPending && !isRejected && !isSuspended) {
            redirectAttempted.current = true;
            setLocation('/seller');
          }
          return; // Stay on pending page for pending/rejected/suspended
        }

        // If on seller-related pages and not approved → go to pending page
        if (onSellerPage) {
          const notApproved = isRejected || isSuspended || isPending || !isApproved;
          if (notApproved) {
            redirectAttempted.current = true;
            setLocation('/seller/pending-approval');
            return;
          }
        }
      }

      // Role-based route access control
      if (user && allowedRoles) {
        const userType = user.vendorId ? 'seller' : 'admin';
        if (!allowedRoles.includes(userType)) {
          // Redirect to appropriate dashboard based on user type
          if (user.vendorId) {
            if (location !== '/seller') setLocation('/seller');
          } else {
            if (location !== '/admin') setLocation('/admin');
          }
          return;
        }
      }
    }, 100); // 100ms delay

    return () => clearTimeout(timer);
  }, [user, isLoading, isAuthenticated, allowedRoles, setLocation, isApproved, isPending, isRejected, isSuspended, approvalLoading, location]);

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
