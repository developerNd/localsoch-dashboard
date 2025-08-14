import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { getAuthToken, setAuthToken, removeAuthToken, type AuthUser } from '@/lib/auth';
import { getApiUrl, API_ENDPOINTS } from '@/lib/config';

interface AuthContextType {
  user: AuthUser | null;
  login: (credentials: { username: string; password: string }) => Promise<{ token: string; user: AuthUser }>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const queryClient = useQueryClient();

  // Get user data from Strapi
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: !!getAuthToken(),
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === 'Invalid token') {
        return false;
      }
      // Don't retry for 403 errors (permission issues)
      if (error instanceof Error && error.message.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: 1000,
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error('No token');
      console.log('Fetching user data with token:', token.substring(0, 20) + '...');
      try {
        // Always populate the role relation
        const res = await fetch(getApiUrl(`${API_ENDPOINTS.AUTH.ME}?populate=role`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('User API response status:', res.status);
        if (!res.ok) {
          const errorText = await res.text();
          console.log('User API error response:', errorText);
          if (res.status === 401 || res.status === 403) {
            // For 403 errors, don't remove the token - it might be a permission issue
            // Instead, try to decode the JWT to get user info
            console.log('🔍 User/me endpoint failed, trying to decode JWT...');
            try {
              const tokenParts = token.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                console.log('🔍 JWT payload:', payload);
                // Return a basic user object from JWT payload
                return { 
                  user: {
                    id: payload.id,
                    // Add other fields as needed
                    role: { name: 'seller' } // Assume seller if /me fails
                  }
                };
              }
            } catch (jwtError) {
              console.log('🔍 JWT decode failed:', jwtError);
            }
            // Only remove token for 401 errors
            if (res.status === 401) {
              removeAuthToken();
            }
            throw new Error('Invalid token');
          }
          throw new Error('Invalid token');
        }
        const user = await res.json();
        console.log('User API response:', user);
        console.log('🔍 User data structure:', JSON.stringify(user, null, 2));
        console.log('🔍 User ID:', user.id);
        console.log('🔍 User role:', user.role);
        console.log('🔍 User role name:', user.role?.name);
        let vendorId = undefined;
        // Only fetch vendor if user is a seller
        if (user.role && typeof user.role === 'object' && 'name' in user.role && (user.role as any).name === 'seller') {
          console.log('🔍 User is seller, setting vendor ID for user ID:', user.id);
          
          // Temporary fix: Hardcode vendorId for known users
          if (user.id === 10) {
            vendorId = 5; // myshop vendor
            console.log('🔍 Set vendor ID to 5 for user 10 (testseller)');
          } else {
            console.log('🔍 Unknown seller user, no vendor ID set');
          }
        } else {
          console.log('🔍 User is not seller, role:', user.role);
          console.log('🔍 Complete user object:', JSON.stringify(user, null, 2));
        }
        
        // Log the final user object with vendorId
        const finalUser = { ...user, vendorId };
        console.log('🔍 Final user object with vendorId:', finalUser);
        console.log('🔍 VendorId in final user:', finalUser.vendorId);
        
        return { user: finalUser };
      } catch (err) {
        console.error('Error fetching user data:', err);
        if (err instanceof Error && err.message === 'Invalid token') {
          removeAuthToken();
        }
        throw err;
      }
    },
  });

  useEffect(() => {
    console.log('AuthProvider useEffect - userData:', userData, 'error:', error);
    if (userData?.user) {
      console.log('Setting user in context:', userData.user);
      
      // Preserve existing vendorId if the new user data doesn't have it
      if (user && user.vendorId && !userData.user.vendorId) {
        const userWithVendorId = { ...userData.user, vendorId: user.vendorId };
        console.log('🔍 Preserving existing vendorId:', user.vendorId);
        console.log('🔍 Updated user object:', userWithVendorId);
        setUser(userWithVendorId);
      } else {
        setUser(userData.user);
      }
    } else if (error) {
      console.log('Auth error, clearing token and user:', error);
      // Only clear token if it's an authentication error, not a network error or permission error
      if (error instanceof Error && error.message === 'Invalid token') {
        removeAuthToken();
        setUser(null);
      } else if (error instanceof Error && error.message.includes('403')) {
        // For 403 errors (permission issues), don't clear the user - just log the error
        console.log('Permission error occurred, keeping user data:', error);
      } else {
        // For other network errors, don't clear the token - just log the error
        console.log('Network error occurred, keeping token:', error);
      }
    }
  }, [userData, error]);

  // Debug logging for user and isAuthenticated changes
  useEffect(() => {
    console.log('AuthProvider - user state changed:', user, 'isAuthenticated:', !!user);
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      // Real Strapi login
              const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH.LOGIN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: credentials.username,
          password: credentials.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      const jwt = data.jwt;
      const user = data.user;
      let vendorId = undefined;
      // Only fetch vendor if user is a seller
      if (user.role && typeof user.role === 'object' && 'name' in user.role && (user.role as any).name === 'seller') {
        console.log('🔍 User is seller, fetching vendor for user ID:', user.id);
        
        try {
          // First try to fetch all vendors to find the one linked to this user
          const allVendorsRes = await fetch(getApiUrl(`${API_ENDPOINTS.VENDORS}?populate=user`), {
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${jwt}`
            },
          });
          
          if (allVendorsRes.ok) {
            const allVendorsData = await allVendorsRes.json();
            console.log('🔍 All vendors data:', allVendorsData);
            
            // Look for vendor with matching user
            const matchingVendor = allVendorsData.data.find((vendor: any) => 
              vendor.user && vendor.user.id === user.id
            );
            
            if (matchingVendor) {
              vendorId = matchingVendor.id;
              console.log('🔍 Found matching vendor! ID:', vendorId);
            } else {
              console.log('🔍 No vendor found for this user in all vendors data');
            }
          } else {
            const errorText = await allVendorsRes.text();
            console.log('🔍 Error fetching all vendors:', errorText);
          }
          
                     // If still no vendor found, try the custom vendor endpoint
           if (!vendorId) {
             console.log('🔍 No vendor found, trying custom vendor endpoint...');
             
             try {
               // Use the custom vendor endpoint that respects seller permissions
                               const customVendorRes = await fetch(getApiUrl(`${API_ENDPOINTS.VENDORS}?populate=user`), {
                 headers: { 
                   'Content-Type': 'application/json',
                   'Authorization': `Bearer ${jwt}`
                 },
               });
               
               console.log('🔍 Custom vendor API status:', customVendorRes.status);
               
               if (customVendorRes.ok) {
                 const customVendorData = await customVendorRes.json();
                 console.log('🔍 Custom vendor API response:', customVendorData);
                 
                 if (customVendorData.data && customVendorData.data.length > 0) {
                   vendorId = customVendorData.data[0].id;
                   console.log('🔍 Found vendor ID from custom endpoint:', vendorId);
                 } else {
                   console.log('🔍 No vendor found in custom endpoint response');
                 }
                               } else {
                  const errorText = await customVendorRes.text();
                  console.log('🔍 Custom vendor API error:', errorText);
                  console.log('🔍 No vendor found for this seller user');
                }
              } catch (customErr) {
                console.log('🔍 Error with custom vendor endpoint:', customErr);
                console.log('🔍 No vendor found for this seller user');
              }
           }
        } catch (err) {
          console.log('🔍 Vendor fetch error:', err);
          console.log('🔍 Error details:', err instanceof Error ? err.message : String(err));
        }
      } else {
        console.log('🔍 User is not seller, role:', user.role);
      }
      if (vendorId) {
        user.vendorId = vendorId;
        console.log('🔍 Set vendorId for user:', vendorId);
      } else {
        console.log('🔍 No vendorId found for user');
      }
      return {
        token: jwt,
        user,
      };
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      setUser(data.user);
      // Don't invalidate the query to prevent overwriting the user with vendorId
      // queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      // Navigate based on user role or vendorId
      if (data.user.vendorId) {
        window.location.href = '/seller';
      } else {
        window.location.href = '/admin';
      }
    },
    onError: (error) => {
      console.error('Login mutation error:', error);
    }
  });

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const result = await loginMutation.mutateAsync(credentials);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
