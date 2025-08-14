import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  console.log('ProtectedRoute - user:', user, 'isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'allowedRoles:', allowedRoles);

  useEffect(() => {
    console.log('ProtectedRoute useEffect - user:', user, 'isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);
    
    // Add a small delay to give authentication time to load
    const timer = setTimeout(() => {
      if (!isLoading && !isAuthenticated) {
        console.log('ProtectedRoute - redirecting to login (not authenticated)');
        setLocation('/login');
        return;
      }

      if (user && allowedRoles) {
        // Check if user has vendorId (seller) or not (admin)
        const userType = user.vendorId ? 'seller' : 'admin';
        console.log('ProtectedRoute - userType:', userType, 'allowedRoles:', allowedRoles);
        if (!allowedRoles.includes(userType)) {
          console.log('ProtectedRoute - redirecting due to role mismatch');
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
  }, [user, isLoading, isAuthenticated, allowedRoles, setLocation]);

  if (isLoading) {
    console.log('ProtectedRoute - showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute - not authenticated, returning null');
    return null;
  }

  if (allowedRoles && user) {
    const userType = user.vendorId ? 'seller' : 'admin';
    if (!allowedRoles.includes(userType)) {
      console.log('ProtectedRoute - role mismatch, returning null');
      return null;
    }
  }

  console.log('ProtectedRoute - rendering children');
  return <>{children}</>;
}
