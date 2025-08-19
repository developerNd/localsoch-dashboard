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
  const { isApproved, isPending, isRejected, isSuspended, isLoading: approvalLoading } = useVendorApproval();
  const [, setLocation] = useLocation();
  const redirectAttempted = useRef(false);

  useEffect(() => {
    // Add a small delay to give authentication time to load
    const timer = setTimeout(() => {
      if (!isLoading && !isAuthenticated) {
        setLocation('/login');
        return;
      }

      // Check user role first
      const userRole = user?.role;
      const roleName = typeof userRole === 'object' ? userRole.name : userRole;

      // Check for incomplete registration - only for non-admin users
      if (roleName !== 'admin') {
        const pendingData = localStorage.getItem('pendingSellerData');
        if (pendingData && user) {
          // User has registered but hasn't completed subscription purchase
          setLocation('/incomplete-registration');
          return;
        }
      }

      // Check seller approval status - only redirect once per status change
      if (user?.vendorId && !approvalLoading && !redirectAttempted.current) {
        // Check if we're already on the pending approval page to prevent loops
        const currentPage = localStorage.getItem('currentPage');
        if (currentPage === 'pending-approval') {
          return; // Don't redirect if we're already on the pending approval page
        }
        
        console.log('🔍 Protected Route Status Check:', {
          isApproved,
          isPending,
          isRejected,
          isSuspended,
          approvalLoading,
          vendorId: user?.vendorId
        });
        
        // Only redirect for explicitly non-approved statuses
        if (isRejected || isSuspended) {
          console.log('🔍 Protected Route: Redirecting due to rejected/suspended status');
          redirectAttempted.current = true;
          // Use setTimeout to prevent immediate redirect loops
          setTimeout(() => {
            setLocation('/seller/pending-approval');
          }, 100);
          return;
        }
        
        // For pending status, redirect
        if (isPending) {
          console.log('🔍 Protected Route: Redirecting due to pending status');
          redirectAttempted.current = true;
          // Use setTimeout to prevent immediate redirect loops
          setTimeout(() => {
            setLocation('/seller/pending-approval');
          }, 100);
          return;
        }
        
        // If not approved, also redirect
        if (!isApproved) {
          console.log('🔍 Protected Route: Redirecting due to not approved status');
          redirectAttempted.current = true;
          // Use setTimeout to prevent immediate redirect loops
          setTimeout(() => {
            setLocation('/seller/pending-approval');
          }, 100);
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
  }, [user, isLoading, isAuthenticated, allowedRoles, setLocation, isApproved, isPending, isRejected, isSuspended, approvalLoading]);

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
