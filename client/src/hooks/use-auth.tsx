import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { getAuthToken, setAuthToken, removeAuthToken, type AuthUser } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const queryClient = useQueryClient();

  // Check if user is authenticated and fetch user data
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: !!getAuthToken(),
    retry: false,
  });

  useEffect(() => {
    console.log('AuthProvider: userData updated:', userData);
    console.log('AuthProvider: auth error:', error);
    console.log('AuthProvider: token exists:', !!getAuthToken());
    
    if (userData?.user) {
      setUser(userData.user);
    } else if (error) {
      // Clear invalid token
      removeAuthToken();
      setUser(null);
    }
  }, [userData, error]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return response.json();
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  const login = async (credentials: { username: string; password: string }) => {
    await loginMutation.mutateAsync(credentials);
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    queryClient.clear();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading: isLoading || loginMutation.isPending,
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
