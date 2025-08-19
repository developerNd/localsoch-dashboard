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
  const [justLoggedIn, setJustLoggedIn] = useState(false);
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
      // Reduce retry count to prevent infinite loops
      return failureCount < 1;
    },
    retryDelay: 3000,
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error('No token');

      try {
        // Always populate the role relation
        const res = await fetch(getApiUrl(`${API_ENDPOINTS.AUTH.ME}?populate=role`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errorText = await res.text();
          if (res.status === 401 || res.status === 403) {
            // For 403 errors, don't remove the token - it might be a permission issue
            // Instead, try to decode the JWT to get user info
            console.log('🔍 User/me endpoint failed, trying to decode JWT...');
            try {
              const tokenParts = token.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                console.log('🔍 JWT payload:', payload);
                // Return a basic user object from JWT payload and fetch vendor data
                const basicUser = {
                  id: payload.id,
                  username: payload.username,
                  email: payload.email,
                  // Add other fields as needed
                  role: { name: payload.role || 'admin' } // Use role from JWT or default to admin
                };
                
                // Try to fetch vendor data even with basic user info
                let vendorId = undefined;
                try {
                  const vendorRes = await fetch(getApiUrl(`${API_ENDPOINTS.VENDORS}?populate=user`), {
                    headers: { 
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                  });
                  
                  if (vendorRes.ok) {
                    const vendorData = await vendorRes.json();
                    console.log('🔍 Vendor API response (JWT fallback):', vendorData);
                    
                    // Look for vendor with matching user
                    const matchingVendor = vendorData.data.find((vendor: any) => 
                      vendor.user && vendor.user.id === basicUser.id
                    );
                    
                    if (matchingVendor) {
                      vendorId = matchingVendor.id;
                      console.log('🔍 Found matching vendor (JWT fallback)! ID:', vendorId);
                    }
                  }
                } catch (vendorErr) {
                  console.log('🔍 Vendor fetch error (JWT fallback):', vendorErr);
                }
                
                return { 
                  user: {
                    ...basicUser,
                    vendorId
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
        let vendorId = undefined;
        
        // Only fetch vendor if user is a seller
        if (user.role && typeof user.role === 'object' && 'name' in user.role && (user.role as any).name === 'seller') {
          
          try {
            // Fetch vendor data for this seller
            const vendorRes = await fetch(getApiUrl(`${API_ENDPOINTS.VENDORS}?populate=user`), {
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
            });
            
            if (vendorRes.ok) {
              const vendorData = await vendorRes.json();
              
              // Look for vendor with matching user
              const matchingVendor = vendorData.data.find((vendor: any) => 
                vendor.user && vendor.user.id === user.id
              );
              
              if (matchingVendor) {
                vendorId = matchingVendor.id;
              }
            }
          } catch (vendorErr) {
            // Handle vendor fetch error silently
          }
        }
        
        // Log the final user object with vendorId
        const finalUser = { ...user, vendorId };
        
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
    // If we just logged in, don't override the user data from the API
    if (justLoggedIn) {
      setJustLoggedIn(false);
      return;
    }
    
    if (userData?.user) {
      // Check for incomplete registration
      const pendingData = localStorage.getItem('pendingSellerData');
      const hasIncompleteRegistration = !!pendingData;
      
      // Preserve existing vendorId if the new user data doesn't have it
      if (user && user.vendorId && !userData.user.vendorId) {
        const userWithVendorId = { 
          ...userData.user, 
          vendorId: user.vendorId,
          hasIncompleteRegistration 
        };
        setUser(userWithVendorId);
      } else {
        setUser({ ...userData.user, hasIncompleteRegistration });
      }
    } else if (error) {
      // Only clear token if it's an authentication error, not a network error or permission error
      if (error instanceof Error && error.message === 'Invalid token') {
        removeAuthToken();
        setUser(null);
      } else if (error instanceof Error && error.message.includes('403')) {
        // For 403 errors (permission issues), don't clear the user
      } else {
        // For other network errors, don't clear the token
      }
    }
  }, [userData, error]);



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
      if (!response.ok) {
        // Handle specific error cases with better messages
        if (response.status === 400) {
          if (data.error?.message === 'Invalid identifier or password') {
            throw new Error('Invalid username or password. Please check your credentials and try again.');
          } else if (data.error?.message) {
            throw new Error(data.error.message);
          }
        }
        throw new Error(data.message || 'Login failed. Please try again.');
      }
      const jwt = data.jwt;
      const user = data.user;
      let vendorId = undefined;
      
      // Log user role information for debugging
      console.log('🔍 User role object:', user.role);
      console.log('🔍 User role type:', typeof user.role);
      if (user.role && typeof user.role === 'object') {
        console.log('🔍 User role name:', (user.role as any).name);
      }
      
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
      // Only set vendorId for seller users
      const userRole = user.role;
      const roleName = typeof userRole === 'object' ? userRole.name : userRole;
      
      if (vendorId && roleName === 'seller') {
        user.vendorId = vendorId;
        console.log('🔍 Set vendorId for seller user:', vendorId);
      } else if (vendorId && roleName !== 'seller') {
        console.log('🔍 Found vendorId but user is not seller, not setting vendorId');
        console.log('🔍 User role:', roleName);
      } else {
        console.log('🔍 No vendorId found for user');
      }
      return {
        token: jwt,
        user,
      };
    },
    onSuccess: (data) => {
      console.log('🔍 Login success - Setting user data:', data.user);
      console.log('🔍 Login success - User role:', data.user.role);
      console.log('🔍 Login success - Role name:', typeof data.user.role === 'object' ? data.user.role.name : data.user.role);
      
      setAuthToken(data.token);
      setUser(data.user);
      setJustLoggedIn(true);
      
      // Don't invalidate the query to prevent overwriting the user with vendorId
      // queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Navigate based on user role
      const userRole = data.user.role;
      const roleName = typeof userRole === 'object' ? userRole.name : userRole;
      
      console.log('🔍 User role for navigation:', roleName);
      
      if (roleName === 'seller') {
        window.location.href = '/seller';
      } else if (roleName === 'admin' || roleName === 'super-admin') {
        window.location.href = '/admin';
      } else {
        // Default to admin for unknown roles
        console.log('🔍 Unknown role, defaulting to admin dashboard');
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
