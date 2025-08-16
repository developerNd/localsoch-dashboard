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
    retry: 1,
    staleTime: 30000, // 30 seconds
  });

  // Check both status enum and isApproved boolean fields
  const statusApproved = vendorData?.status === 'approved';
  const booleanApproved = vendorData?.isApproved === true;
  const isApproved = statusApproved || booleanApproved;
  
  const statusPending = vendorData?.status === 'pending';
  const noStatus = !vendorData?.status && !vendorData?.isApproved;
  const isPending = statusPending || noStatus;
  
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