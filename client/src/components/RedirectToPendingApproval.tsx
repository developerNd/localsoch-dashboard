import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function RedirectToPendingApproval() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    console.log('🔍 Redirecting from /pending-approval to /seller/pending-approval');
    setLocation('/seller/pending-approval');
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg">Redirecting to pending approval page...</p>
      </div>
    </div>
  );
} 