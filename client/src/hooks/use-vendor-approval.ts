import { useQuery } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { getApiUrl, API_ENDPOINTS } from '@/lib/config';
import { getAuthToken } from '@/lib/auth';

export function useVendorApproval() {
  const { user } = useAuth();

  const { data: vendorData, isLoading, error } = useQuery({
    queryKey: ['/api/vendors/approval-status', user?.vendorId],
    enabled: !!user?.vendorId && !!getAuthToken(),
    queryFn: async () => {
      const token = getAuthToken();
      if (!token || !user?.vendorId) throw new Error('No token or vendor ID');
      
      const res = await fetch(getApiUrl(`${API_ENDPOINTS.VENDORS}/${user.vendorId}?populate=*`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error('Failed to fetch vendor data');
      const response = await res.json();
      
      // Handle different response structures
      const vendorData = response.data || response;
      return vendorData;
    },
    retry: (failureCount, error) => {
      // Don't retry for 403 errors (permission issues)
      if (error instanceof Error && error.message.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 2000,
    staleTime: 60000, // 1 minute - reduce polling frequency
    refetchInterval: 30000, // 30 seconds - reasonable polling interval
    refetchIntervalInBackground: false, // Don't poll in background
  });

  // Check both status enum and isApproved boolean fields
  const statusApproved = vendorData?.status === 'approved';
  const booleanApproved = vendorData?.isApproved === true;
  const isApproved = statusApproved || booleanApproved;
  
  // More explicit pending status detection
  const statusPending = vendorData?.status === 'pending';
  const noStatusSet = !vendorData?.status || vendorData?.status === '';
  const notApproved = !isApproved;
  const isPending = statusPending || (noStatusSet && notApproved);
  
  const isRejected = vendorData?.status === 'rejected';
  const isSuspended = vendorData?.status === 'suspended';
  const approvalStatus = vendorData?.status || (vendorData?.isApproved ? 'approved' : 'pending');
  const rejectionReason = vendorData?.statusReason || '';

  return {
    vendorData,
    isLoading,
    error,
    isApproved,
    isPending,
    isRejected,
    isSuspended,
    approvalStatus,
    rejectionReason,
  };
} 