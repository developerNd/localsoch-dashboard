// Utility functions for authentication and role checking

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string | { id: number; name: string; description?: string };
  avatar?: string;
  sellerProfile?: any;
  vendorId?: number;
}

// Helper function to get role name safely
export const getRoleName = (role: any): string => {
  if (typeof role === 'string') return role;
  if (role?.name) return role.name;
  return 'Unknown';
};

// Helper function to check if user is admin
export const isAdmin = (user: AuthUser | null | undefined): boolean => {
  const roleName = getRoleName(user?.role);
  return roleName === 'admin' || roleName === 'super-admin';
};

// Helper function to check if user is seller
export const isSeller = (user: AuthUser | null | undefined): boolean => {
  const roleName = getRoleName(user?.role);
  return roleName === 'seller';
};

// Helper function to get user role display name
export const getRoleDisplayName = (user: AuthUser | null | undefined): string => {
  if (isAdmin(user)) return 'Administrator';
  if (isSeller(user)) return 'Seller Account';
  return 'User Account';
};

// Helper function to get vendor ID with fallback
export const getVendorId = (user: AuthUser | null | undefined): number | undefined => {
  return user?.vendorId;
}; 