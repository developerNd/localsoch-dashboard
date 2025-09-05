import { useState, useEffect, useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useUpdateVendor, useUpdateUser, useCreateVendor } from '@/hooks/use-api';
import { Upload, X, Image as ImageIcon, Save, User, Store, CreditCard, AlertCircle, CheckCircle, Clock, Truck } from 'lucide-react';
import { getApiUrl, getImageUrl, API_ENDPOINTS } from '@/lib/config';
import { LocationSelector } from '@/components/ui/location-selector';

// Business category type
interface BusinessCategory {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

// Form validation schemas
const userFormSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

const shopFormSchema = z.object({
  name: z.string().min(1, 'Shop name is required'),
  description: z.string().optional(),
  contact: z.string().min(1, 'Contact number is required'),
  whatsapp: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(6, 'Pincode must be at least 6 characters'),
  gstNumber: z.string().optional(),
  businessType: z.string().optional(),
  businessCategoryId: z.number().optional(),
});

const shopHoursSchema = z.object({
  monday: z.object({
    isOpen: z.boolean().default(true),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }).optional(),
  tuesday: z.object({
    isOpen: z.boolean().default(true),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }).optional(),
  wednesday: z.object({
    isOpen: z.boolean().default(true),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }).optional(),
  thursday: z.object({
    isOpen: z.boolean().default(true),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }).optional(),
  friday: z.object({
    isOpen: z.boolean().default(true),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }).optional(),
  saturday: z.object({
    isOpen: z.boolean().default(true),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }).optional(),
  sunday: z.object({
    isOpen: z.boolean().default(true),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
  }).optional(),
  timezone: z.string().default('Asia/Kolkata'),
});

const deliveryFeesSchema = z.object({
  baseDeliveryFee: z.string().default('0.00'),
  freeDeliveryThreshold: z.string().default('0.00'),
  deliveryRadius: z.string().default('10.00'),
  deliveryTime: z.string().default('1-2 hours'),
  isDeliveryAvailable: z.boolean().default(true),
  distanceBasedFees: z.array(z.object({
    minDistance: z.string(),
    maxDistance: z.string(),
    fee: z.string(),
    description: z.string().optional(),
  })).optional(),
  orderValueBasedFees: z.array(z.object({
    minOrderValue: z.string(),
    maxOrderValue: z.string(),
    fee: z.string(),
    description: z.string().optional(),
  })).optional(),
});

const bankingFormSchema = z.object({
  bankAccountNumber: z.string().min(1, 'Bank account number is required'),
  ifscCode: z.string().min(1, 'IFSC code is required'),
  bankAccountName: z.string().min(1, 'Account holder name is required'),
  bankAccountType: z.enum(['savings', 'current']).default('savings'),
});

type UserFormData = z.infer<typeof userFormSchema>;
type ShopFormData = z.infer<typeof shopFormSchema>;
type ShopHoursData = z.infer<typeof shopHoursSchema>;
type DeliveryFeesData = z.infer<typeof deliveryFeesSchema>;
type BankingFormData = z.infer<typeof bankingFormSchema>;

// Helper functions for time formatting
function formatTimeForBackend(time?: string | null): string | undefined {
  if (!time) return undefined;
  // Expecting HH:mm from the form; convert to HH:mm:ss.SSS
  // If already includes seconds, leave as-is (ensure .SSS)
  const hhmm = /^(\d{2}):(\d{2})$/;
  const hhmmss = /^(\d{2}):(\d{2}):(\d{2})(\.\d{3})?$/;
  if (hhmm.test(time)) {
    return `${time}:00.000`;
  }
  if (hhmmss.test(time)) {
    const [, h, m, s, ms] = time.match(hhmmss)!;
    return `${h}:${m}:${s}${ms || '.000'}`;
  }
  return time;
}

function formatTimeForForm(time?: string | null): string | undefined {
  if (!time) return undefined;
  // Convert HH:mm:ss(.SSS) -> HH:mm for the select controls
  const hhmmss = /^(\d{2}):(\d{2}):(\d{2})(?:\.\d{3})?$/;
  const hhmm = /^(\d{2}):(\d{2})$/;
  if (hhmmss.test(time)) {
    const [, h, m] = time.match(hhmmss)!;
    return `${h}:${m}`;
  }
  if (hhmm.test(time)) return time;
  return undefined;
}

function formatShopHoursForBackend(data: any) {
  const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
  const result: any = { ...data };
  for (const day of days) {
    if (result[day]) {
      result[day] = {
        ...result[day],
        openTime: formatTimeForBackend(result[day].openTime),
        closeTime: formatTimeForBackend(result[day].closeTime),
      };
    }
  }
  return result;
}

function formatShopHoursForForm(data: any) {
  if (!data) return undefined;
  const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
  const result: any = { ...data };
  for (const day of days) {
    if (result[day]) {
      result[day] = {
        ...result[day],
        openTime: formatTimeForForm(result[day].openTime) || undefined,
        closeTime: formatTimeForForm(result[day].closeTime) || undefined,
      };
    }
  }
  return result;
}

export default function SellerProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['personal']));
  const [loadingTabs, setLoadingTabs] = useState<Set<string>>(new Set());
  const [distanceFees, setDistanceFees] = useState<Array<{minDistance: string, maxDistance: string, fee: string, description: string}>>([]);
  const [orderValueFees, setOrderValueFees] = useState<Array<{minOrderValue: string, maxOrderValue: string, fee: string, description: string}>>([]);

  // Handle tab change with immediate activation and async content loading
  const handleTabChange = (tabValue: string) => {
    console.log('🔍 Tab Change Start:', {
      tabValue,
      timestamp: Date.now(),
      currentActiveTab: activeTab,
      isAlreadyLoaded: loadedTabs.has(tabValue)
    });
    
    // Force immediate visual update using requestAnimationFrame
    requestAnimationFrame(() => {
      setActiveTab(tabValue);
      console.log('🔍 Tab Activated (requestAnimationFrame):', { tabValue, timestamp: Date.now() });
    });
    
    // Load content asynchronously if not already loaded
    if (!loadedTabs.has(tabValue)) {
      console.log('🔍 Starting Content Load:', { tabValue, timestamp: Date.now() });
      
      setLoadingTabs(prev => {
        const newSet = new Set(prev);
        newSet.add(tabValue);
        return newSet;
      });
      
      // Use setTimeout to make content loading truly async
      setTimeout(() => {
        console.log('🔍 Content Load Complete:', { tabValue, timestamp: Date.now() });
        
        setLoadedTabs(prev => {
          const newSet = new Set(prev);
          newSet.add(tabValue);
          return newSet;
        });
        setLoadingTabs(prev => {
          const newSet = new Set(prev);
          newSet.delete(tabValue);
          return newSet;
        });
      }, 0); // Even 0ms makes it async
    } else {
      console.log('🔍 Content Already Loaded:', { tabValue, timestamp: Date.now() });
    }
  };

  // Get vendor ID from user object
  const getVendorId = () => {
    if (user?.vendorId) return user.vendorId;
    return null;
  };

  const vendorId = getVendorId();

  // Fetch vendor data
  const { data: vendorData, isLoading: vendorLoading, error: vendorError } = useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: async () => {
      if (!vendorId) return null;
      
      const response = await apiRequest('GET', `/api/vendors/${vendorId}?populate=*`);
        const data = await response.json();
        return data.data;
    },
    enabled: !!vendorId,
  });

  // Fetch business categories
  const { data: businessCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['business-categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', API_ENDPOINTS.BUSINESS_CATEGORIES);
      const data = await response.json();
      return data.data || [];
    },
  });

  // Form instances
  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      email: '',
      phone: '',
    },
  });

  const shopForm = useForm<ShopFormData>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      name: '',
      description: '',
      contact: '',
      whatsapp: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gstNumber: '',
      businessType: '',
      businessCategoryId: undefined,
    },
  });

  const shopHoursForm = useForm<ShopHoursData>({
    resolver: zodResolver(shopHoursSchema),
    defaultValues: {
      monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      saturday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
      sunday: { isOpen: false, openTime: '10:00', closeTime: '16:00' },
      timezone: 'Asia/Kolkata',
    },
  });

  const deliveryFeesForm = useForm<DeliveryFeesData>({
    resolver: zodResolver(deliveryFeesSchema),
    defaultValues: {
      baseDeliveryFee: '0.00',
      freeDeliveryThreshold: '0.00',
      deliveryRadius: '10.00',
      deliveryTime: '1-2 hours',
      isDeliveryAvailable: true,
      distanceBasedFees: [],
      orderValueBasedFees: [],
    },
  });

  const bankingForm = useForm<BankingFormData>({
    resolver: zodResolver(bankingFormSchema),
    defaultValues: {
      bankAccountNumber: '',
      ifscCode: '',
      bankAccountName: '',
      bankAccountType: 'savings',
    },
  });

  // Mutations
  const updateUserMutation = useUpdateUser();
  const updateVendorMutation = useUpdateVendor();
  const createVendorMutation = useCreateVendor();

  // Update form values when data loads
  useEffect(() => {
    if (user) {
      userForm.reset({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user, userForm]);

  // Update shop form when vendor data loads
  useEffect(() => {
    if (vendorData) {
      const formData = {
        name: vendorData.name || '',
        description: vendorData.description || '',
        contact: vendorData.contact || '',
        whatsapp: vendorData.whatsapp || '',
        email: vendorData.email || '',
        address: vendorData.address || '',
        city: vendorData.city || '',
        state: vendorData.state || '',
        pincode: vendorData.pincode || '',
        gstNumber: vendorData.gstNumber || '',
        businessType: vendorData.businessType || '',
        businessCategoryId: vendorData.businessCategory?.id || undefined,
      };
      
      shopForm.reset(formData);

      bankingForm.reset({
        bankAccountNumber: vendorData.bankAccountNumber || '',
        ifscCode: vendorData.ifscCode || '',
        bankAccountName: vendorData.bankAccountName || '',
        bankAccountType: vendorData.bankAccountType || 'savings',
      });

      // Populate shop hours form
      if (vendorData.shopHours) {
        const normalized = formatShopHoursForForm(vendorData.shopHours);
        shopHoursForm.reset({
          monday: normalized?.monday || { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          tuesday: normalized?.tuesday || { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          wednesday: normalized?.wednesday || { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          thursday: normalized?.thursday || { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          friday: normalized?.friday || { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          saturday: normalized?.saturday || { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          sunday: normalized?.sunday || { isOpen: false, openTime: '10:00', closeTime: '16:00' },
          timezone: vendorData.shopHours.timezone || 'Asia/Kolkata',
        });
      }

      // Populate delivery fees form
      if (vendorData.deliveryFees) {
        deliveryFeesForm.reset({
          baseDeliveryFee: vendorData.deliveryFees.baseDeliveryFee || '0.00',
          freeDeliveryThreshold: vendorData.deliveryFees.freeDeliveryThreshold || '0.00',
          deliveryRadius: vendorData.deliveryFees.deliveryRadius || '10.00',
          deliveryTime: vendorData.deliveryFees.deliveryTime || '1-2 hours',
          isDeliveryAvailable: vendorData.deliveryFees.isDeliveryAvailable !== false,
          distanceBasedFees: vendorData.deliveryFees.distanceBasedFees || [],
          orderValueBasedFees: vendorData.deliveryFees.orderValueBasedFees || [],
        });

        // Set the arrays for dynamic fee management
        if (vendorData.deliveryFees.distanceBasedFees) {
          setDistanceFees(vendorData.deliveryFees.distanceBasedFees);
        }
        if (vendorData.deliveryFees.orderValueBasedFees) {
          setOrderValueFees(vendorData.deliveryFees.orderValueBasedFees);
        }
      }
    }
      }, [vendorData, shopForm, bankingForm, shopHoursForm, deliveryFeesForm]);

  // Don't reset form during mutation to prevent clearing
  const isUpdatingUser = updateUserMutation.isPending;

  // Form submission handlers
  const handleUserUpdate = async (data: UserFormData) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User information not available",
        variant: "destructive",
      });
      return;
    }

    try {
      const updateData = {
        id: user.id,
        ...data,
      };
      
      await updateUserMutation.mutateAsync(updateData);

      // Update the form with the new data immediately to prevent clearing
      userForm.reset(data);

      toast({
        title: "Success",
        description: "Personal information updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update personal information",
        variant: "destructive",
      });
    }
  };

  const handleShopUpdate = async (data: ShopFormData) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User information not available",
        variant: "destructive",
      });
      return;
    }

    try {
      let currentVendorId = vendorId;

      // If no vendor exists, create one first
      if (!currentVendorId) {
        toast({
          title: "Creating Shop Profile",
          description: "Setting up your shop profile...",
        });

        const vendorData = {
          name: data.name || 'My Shop',
          description: data.description || '',
          contact: data.contact || '',
          whatsapp: data.whatsapp || '',
          email: data.email || user.email,
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          gstNumber: data.gstNumber || '',
          businessType: data.businessType || '',
          businessCategoryId: data.businessCategoryId || undefined,
          bankAccountNumber: '',
          ifscCode: '',
          user: user.id,
          isActive: true,
          isApproved: false,
          status: 'pending'
        };

        const newVendor = await createVendorMutation.mutateAsync(vendorData);
        currentVendorId = newVendor.data.id;
        
        // Update the user context with the new vendor ID
        // This will trigger a re-fetch of user data
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      }

      // Now update the vendor with the form data
      if (selectedImage) {
        // If there's an image, use FormData
        const formData = new FormData();
        formData.append('data', JSON.stringify(data));
        formData.append('files.profileImage', selectedImage);
        
        const response = await updateVendorMutation.mutateAsync({
          id: currentVendorId!,
          data: formData,
        });
        
      } else {
        // If no image, send as regular JSON
        const response = await updateVendorMutation.mutateAsync({
          id: currentVendorId!,
          data: data,
        });
        
      }

      // Clear selected image after successful upload
      setSelectedImage(null);
      setImagePreview(null);

      // Invalidate the vendor query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['vendor', currentVendorId] });

      toast({
        title: "Success",
        description: "Shop details updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update shop details",
        variant: "destructive",
      });
    }
  };

  const handleShopHoursUpdate = async (data: ShopHoursData) => {
    // Use the data as is since we removed break times
    const cleanedData = data;
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User information not available",
        variant: "destructive",
      });
      return;
    }

    try {
      let currentVendorId = vendorId;

      // If no vendor exists, create one first
      if (!currentVendorId) {
        toast({
          title: "Creating Shop Profile",
          description: "Setting up your shop profile...",
        });

        const vendorData = {
          name: 'My Shop',
          description: '',
          contact: '',
          whatsapp: '',
          email: user.email,
          address: '',
          city: '',
          state: '',
          pincode: '',
          gstNumber: '',
          businessType: '',
          businessCategoryId: undefined,
          bankAccountNumber: '',
          ifscCode: '',
          user: user.id,
          isActive: true,
          isApproved: false,
          status: 'pending'
        };

        const newVendor = await createVendorMutation.mutateAsync(vendorData);
        currentVendorId = newVendor.data.id;
        
        // Update the user context with the new vendor ID
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      }

      // Update the vendor with shop hours data
      await updateVendorMutation.mutateAsync({
        id: currentVendorId!,
        data: {
          shopHours: formatShopHoursForBackend(cleanedData)
        },
      });

      // Invalidate the vendor query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['vendor', currentVendorId] });

      toast({
        title: "Success",
        description: "Shop hours updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update shop hours",
        variant: "destructive",
      });
    }
  };

  const handleDeliveryFeesUpdate = async (data: DeliveryFeesData) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User information not available",
        variant: "destructive",
      });
      return;
    }

    try {
      let currentVendorId = vendorId;

      // If no vendor exists, create one first
      if (!currentVendorId) {
        toast({
          title: "Creating Shop Profile",
          description: "Setting up your shop profile...",
        });

        const vendorData = {
          name: 'My Shop',
          description: '',
          contact: '',
          whatsapp: '',
          email: user.email,
          address: '',
          city: '',
          state: '',
          pincode: '',
          gstNumber: '',
          businessType: '',
          businessCategoryId: undefined,
          bankAccountNumber: '',
          ifscCode: '',
          user: user.id,
          isActive: true,
          isApproved: false,
          status: 'pending'
        };

        const newVendor = await createVendorMutation.mutateAsync(vendorData);
        currentVendorId = newVendor.data.id;
        
        // Update the user context with the new vendor ID
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      }

      // Prepare delivery fees data with arrays
      const deliveryFeesData = {
        ...data,
        distanceBasedFees: distanceFees,
        orderValueBasedFees: orderValueFees,
      };

      // Update the vendor with delivery fees data
      await updateVendorMutation.mutateAsync({
        id: currentVendorId!,
        data: {
          deliveryFees: deliveryFeesData
        },
      });

      // Invalidate the vendor query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['vendor', currentVendorId] });

      toast({
        title: "Success",
        description: "Delivery settings updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update delivery settings",
        variant: "destructive",
      });
    }
  };

  const handleBankingUpdate = async (data: BankingFormData) => {
    if (!user?.id) {
    toast({
        title: "Error",
        description: "User information not available",
      variant: "destructive",
    });
      return;
    }

    try {
      let currentVendorId = vendorId;

      // If no vendor exists, create one first
      if (!currentVendorId) {
        toast({
          title: "Creating Shop Profile",
          description: "Setting up your shop profile...",
        });

        const vendorData = {
          name: 'My Shop',
          description: '',
          contact: '',
          whatsapp: '',
          email: user.email,
          address: '',
          city: '',
          state: '',
          pincode: '',
          gstNumber: '',
          businessType: '',
          businessCategoryId: undefined,
          bankAccountNumber: data.bankAccountNumber || '',
          ifscCode: data.ifscCode || '',
          bankAccountName: data.bankAccountName || '',
          bankAccountType: data.bankAccountType || 'savings',
          user: user.id,
          isActive: true,
          isApproved: false,
          status: 'pending'
        };

        const newVendor = await createVendorMutation.mutateAsync(vendorData);
        currentVendorId = newVendor.data.id;
        
        // Update the user context with the new vendor ID
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      }

      await updateVendorMutation.mutateAsync({
        id: currentVendorId!,
        data,
      });

      // Update the form with the new data immediately to prevent clearing
      bankingForm.reset(data);

      toast({
        title: "Success",
        description: "Banking information updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update banking information",
        variant: "destructive",
      });
    }
  };

  // Image handling
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Error",
          description: "Image size must be less than 2MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };



  if (vendorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shop settings...</p>
        </div>
      </div>
    );
  }

  if (vendorError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600">Unable to load your shop settings. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <MobileNav />
      
              <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Shop Settings</h2>
            <p className="text-gray-600">Manage your personal and shop information</p>
          </div>

          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage 
                    src={imagePreview || getImageUrl(vendorData?.profileImage?.url || vendorData?.profileImage?.data?.attributes?.url) || ""} 
                    alt="Profile" 
                  />
                  <AvatarFallback className="text-2xl">
                    {vendorData?.name?.[0] || user?.username?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {vendorData?.name || 'Shop Name'}
                  </h3>
                  <p className="text-gray-600">{user?.username}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <Badge variant={vendorData?.isApproved ? "default" : "secondary"}>
                      {vendorData?.isApproved ? "Approved" : "Pending Approval"}
                    </Badge>
                    <Badge variant={vendorData?.isActive ? "default" : "destructive"}>
                      {vendorData?.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

                      {/* Settings Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Personal</span>
              </TabsTrigger>
              <TabsTrigger value="shop" className="flex items-center space-x-2">
                <Store className="w-4 h-4" />
                <span>Shop Details</span>
              </TabsTrigger>
              <TabsTrigger value="hours" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Shop Hours</span>
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex items-center space-x-2">
                <Truck className="w-4 h-4" />
                <span>Delivery</span>
              </TabsTrigger>
              <TabsTrigger value="banking" className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Banking</span>
              </TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={userForm.handleSubmit(handleUserUpdate)} className="space-y-6">
                      <div>
                      <Label htmlFor="username">Username *</Label>
                        <Input
                        id="username"
                        {...userForm.register('username')}
                        placeholder="Enter your username"
                      />
                      {userForm.formState.errors.username && (
                        <p className="text-sm text-red-500 mt-1">
                          {userForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          {...userForm.register('email')}
                          placeholder="Enter your email"
                        />
                        {userForm.formState.errors.email && (
                          <p className="text-sm text-red-500 mt-1">
                            {userForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          {...userForm.register('phone')}
                          placeholder="Enter your phone number"
                        />
                        {userForm.formState.errors.phone && (
                          <p className="text-sm text-red-500 mt-1">
                            {userForm.formState.errors.phone.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        disabled={updateUserMutation.isPending}
                        className="flex items-center space-x-2"
                      >
                        {updateUserMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Update Personal Info</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shop Details Tab */}
            <TabsContent value="shop">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Store className="w-5 h-5" />
                    <span>Shop Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={shopForm.handleSubmit(handleShopUpdate)} className="space-y-6">
                    {/* Profile Image Upload */}
                    <div>
                      <Label>Shop Profile Image</Label>
                      <div className="mt-2 space-y-4">
                        {/* Current Image Display */}
                        {(vendorData?.profileImage || imagePreview) && (
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <img
                                src={imagePreview || getImageUrl(vendorData?.profileImage?.url || vendorData?.profileImage?.data?.attributes?.url)}
                                alt="Profile"
                                className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
                              />
                              {imagePreview && (
                                <button
                                  type="button"
                                  onClick={removeSelectedImage}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">
                                {imagePreview ? 'New image selected' : 'Current profile image'}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Upload Button */}
                        <div className="flex items-center space-x-4">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                            <div className="flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                              <Upload className="w-5 h-5 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {vendorData?.profileImage ? 'Change Image' : 'Upload Image'}
                              </span>
                            </div>
                          </label>
                          {!vendorData?.profileImage && !imagePreview && (
                            <div className="flex items-center space-x-2 text-gray-500">
                              <ImageIcon className="w-5 h-5" />
                              <span className="text-sm">No image uploaded</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Recommended: Square image, max 2MB. This will be displayed on your shop profile.
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="name">Shop Name *</Label>
                      <Input
                        id="name"
                        {...shopForm.register('name')}
                        placeholder="Enter your shop name"
                      />
                      {shopForm.formState.errors.name && (
                        <p className="text-sm text-red-500 mt-1">
                          {shopForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description">Shop Description</Label>
                      <Textarea
                        id="description"
                        {...shopForm.register('description')}
                        placeholder="Brief description of your shop and what you offer"
                        rows={3}
                      />
                      {shopForm.formState.errors.description && (
                        <p className="text-sm text-red-500 mt-1">
                          {shopForm.formState.errors.description.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="contact">Contact Phone *</Label>
                        <Input
                          id="contact"
                          {...shopForm.register('contact')}
                          placeholder="+91-9876543210"
                        />
                        <p className="text-xs text-gray-500 mt-1">Used for call button</p>
                        {shopForm.formState.errors.contact && (
                          <p className="text-sm text-red-500 mt-1">
                            {shopForm.formState.errors.contact.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="whatsapp">WhatsApp Number</Label>
                        <Input
                          id="whatsapp"
                          {...shopForm.register('whatsapp')}
                          placeholder="+91-9876543210"
                        />
                        <p className="text-xs text-gray-500 mt-1">Used for WhatsApp button (optional)</p>
                        {shopForm.formState.errors.whatsapp && (
                          <p className="text-sm text-red-500 mt-1">
                            {shopForm.formState.errors.whatsapp.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="email">Shop Email</Label>
                        <Input
                          id="email"
                          type="email"
                          {...shopForm.register('email')}
                          placeholder="shop@example.com"
                        />
                        {shopForm.formState.errors.email && (
                          <p className="text-sm text-red-500 mt-1">
                            {shopForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="gstNumber">GST Number</Label>
                        <Input
                          id="gstNumber"
                          {...shopForm.register('gstNumber')}
                          placeholder="Enter GST number"
                        />
                        {shopForm.formState.errors.gstNumber && (
                          <p className="text-sm text-red-500 mt-1">
                            {shopForm.formState.errors.gstNumber.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="businessType">Business Type</Label>
                        <Input
                          id="businessType"
                          {...shopForm.register('businessType')}
                          placeholder="e.g., Retail, Wholesale, Service"
                        />
                        {shopForm.formState.errors.businessType && (
                          <p className="text-sm text-red-500 mt-1">
                            {shopForm.formState.errors.businessType.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="businessCategory">Business Category</Label>
                        {/* Hidden input to register the field with react-hook-form */}
                        <input
                          type="hidden"
                          {...shopForm.register('businessCategoryId')}
                        />
                        <Select 
                          value={shopForm.watch('businessCategoryId')?.toString() || ""} 
                          onValueChange={(value) => {
                            shopForm.setValue('businessCategoryId', value ? parseInt(value) : undefined);
                            // Trigger form validation
                            shopForm.trigger('businessCategoryId');
                          }}
                          disabled={categoriesLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select business category"} />
                          </SelectTrigger>
                          <SelectContent>
                            {businessCategories?.map((category: BusinessCategory) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {businessCategories?.length === 0 && !categoriesLoading && (
                          <p className="text-sm text-gray-500 mt-1">No business categories available</p>
                        )}
                        {shopForm.formState.errors.businessCategoryId && (
                          <p className="text-sm text-red-500 mt-1">
                            {shopForm.formState.errors.businessCategoryId.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        {...shopForm.register('address')}
                        placeholder="Enter your business address"
                      />
                      {shopForm.formState.errors.address && (
                        <p className="text-sm text-red-500 mt-1">
                          {shopForm.formState.errors.address.message}
                        </p>
                      )}
                    </div>

                    <LocationSelector
                      selectedState={shopForm.watch('state')}
                      selectedCity={shopForm.watch('city')}
                      selectedPincode={shopForm.watch('pincode')}
                      onStateChange={(state) => shopForm.setValue('state', state)}
                      onCityChange={(city) => shopForm.setValue('city', city)}
                      onPincodeChange={(pincode) => shopForm.setValue('pincode', pincode)}
                    />
                    {(shopForm.formState.errors.city || shopForm.formState.errors.state || shopForm.formState.errors.pincode) && (
                      <div className="space-y-1">
                        {shopForm.formState.errors.city && (
                          <p className="text-sm text-red-500">{shopForm.formState.errors.city.message}</p>
                        )}
                        {shopForm.formState.errors.state && (
                          <p className="text-sm text-red-500">{shopForm.formState.errors.state.message}</p>
                        )}
                        {shopForm.formState.errors.pincode && (
                          <p className="text-sm text-red-500">{shopForm.formState.errors.pincode.message}</p>
                        )}
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        disabled={updateVendorMutation.isPending || createVendorMutation.isPending}
                        className="flex items-center space-x-2"
                      >
                        {updateVendorMutation.isPending || createVendorMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Update Shop Details</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shop Hours Tab */}
            <TabsContent value="hours">
              {(() => {
                console.log('🔍 Shop Hours Tab Rendering:', {
                  isLoading: loadingTabs.has('hours'),
                  isLoaded: loadedTabs.has('hours'),
                  timestamp: Date.now()
                });
                return null;
              })()}
              {loadingTabs.has('hours') ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading shop hours...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : loadedTabs.has('hours') ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="w-5 h-5" />
                      <span>Shop Hours</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Set your shop's business hours for each day of the week. Customers will see these hours when viewing your shop.
                      </AlertDescription>
                    </Alert>

                  <form onSubmit={shopHoursForm.handleSubmit(handleShopHoursUpdate)} className="space-y-6">
                    {(() => {
                      console.log('🔍 Shop Hours Form Rendering Start:', { timestamp: Date.now() });
                      return null;
                    })()}
                    {/* 
                    ========================================
                    IMPROVED TIME SELECTION
                    ========================================
                    Time inputs now use dropdown selectors with 15-minute intervals
                    for better user experience and data consistency.
                    ========================================
                    */}
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                      console.log('🔍 Rendering Day:', { day, timestamp: Date.now() });
                      return (
                      <div key={day} className="border rounded-lg p-4">
                        {(() => { const path = (suffix: 'isOpen' | 'openTime' | 'closeTime') => `${day}.${suffix}` as any; return (
                        <>
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-lg font-medium capitalize">{day}</Label>
                          <div className="flex items-center space-x-3">
                            <Switch
                              id={`${day}-open`}
                              checked={Boolean(shopHoursForm.watch(path('isOpen')))}
                              onCheckedChange={(checked) => shopHoursForm.setValue(path('isOpen'), checked)}
                            />
                            <div className="flex flex-col">
                              <Label htmlFor={`${day}-open`} className="text-sm font-medium">
                                {Boolean(shopHoursForm.watch(path('isOpen'))) ? 'Open' : 'Closed'}
                              </Label>
                              <span className="text-xs text-gray-500">
                                {Boolean(shopHoursForm.watch(path('isOpen'))) ? 'Shop is open on this day' : 'Shop is closed on this day'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {Boolean(shopHoursForm.watch(path('isOpen'))) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`${day}-openTime`}>Open Time</Label>
                              <Select 
                                value={(shopHoursForm.watch(path('openTime')) as string | undefined) || '09:00'} 
                                onValueChange={(value) => shopHoursForm.setValue(path('openTime'), value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }, (_, hour) => 
                                    Array.from({ length: 4 }, (_, minute) => {
                                      const time = `${hour.toString().padStart(2, '0')}:${(minute * 15).toString().padStart(2, '0')}`;
                                      const hour12 = ((hour % 12) || 12).toString().padStart(2, '0');
                                      const minuteStr = (minute * 15).toString().padStart(2, '0');
                                      const ampm = hour < 12 ? 'AM' : 'PM';
                                      const label = `${hour12}:${minuteStr} ${ampm}`;
                                      return (
                                        <SelectItem key={time} value={time}>
                                          {label}
                                        </SelectItem>
                                      );
                                    })
                                  ).flat()}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`${day}-closeTime`}>Close Time</Label>
                              <Select 
                                value={(shopHoursForm.watch(path('closeTime')) as string | undefined) || '18:00'} 
                                onValueChange={(value) => shopHoursForm.setValue(path('closeTime'), value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }, (_, hour) => 
                                    Array.from({ length: 4 }, (_, minute) => {
                                      const time = `${hour.toString().padStart(2, '0')}:${(minute * 15).toString().padStart(2, '0')}`;
                                      const hour12 = ((hour % 12) || 12).toString().padStart(2, '0');
                                      const minuteStr = (minute * 15).toString().padStart(2, '0');
                                      const ampm = hour < 12 ? 'AM' : 'PM';
                                      const label = `${hour12}:${minuteStr} ${ampm}`;
                                      return (
                                        <SelectItem key={time} value={time}>
                                          {label}
                                        </SelectItem>
                                      );
                                    })
                                  ).flat()}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                        </>
                        ) })()}
                      </div>
                      );
                    })}

                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select 
                        value={shopHoursForm.watch('timezone')} 
                        onValueChange={(value) => shopHoursForm.setValue('timezone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                          <SelectItem value="Asia/Delhi">Asia/Delhi</SelectItem>
                          <SelectItem value="Asia/Mumbai">Asia/Mumbai</SelectItem>
                          <SelectItem value="Asia/Bangalore">Asia/Bangalore</SelectItem>
                          <SelectItem value="Asia/Chennai">Asia/Chennai</SelectItem>
                          <SelectItem value="Asia/Hyderabad">Asia/Hyderabad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        disabled={updateVendorMutation.isPending}
                        className="flex items-center space-x-2"
                      >
                        {updateVendorMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Update Shop Hours</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                  {(() => {
                    console.log('🔍 Shop Hours Form Rendering Complete:', { timestamp: Date.now() });
                    return null;
                  })()}
                </CardContent>
              </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading shop hours...</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Delivery Fees Tab */}
            <TabsContent value="delivery">
              {loadingTabs.has('delivery') ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading delivery settings...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : loadedTabs.has('delivery') ? (
                <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Truck className="w-5 h-5" />
                    <span>Delivery Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Configure your delivery fees and delivery options. This helps customers understand delivery costs.
                    </AlertDescription>
                  </Alert>

                  <form onSubmit={deliveryFeesForm.handleSubmit(handleDeliveryFeesUpdate)} className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="delivery-available"
                        checked={deliveryFeesForm.watch('isDeliveryAvailable')}
                        onChange={(e) => deliveryFeesForm.setValue('isDeliveryAvailable', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="delivery-available">Delivery Available</Label>
                    </div>

                    {deliveryFeesForm.watch('isDeliveryAvailable') && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="baseDeliveryFee">Base Delivery Fee (₹)</Label>
                            <Input
                              id="baseDeliveryFee"
                              type="number"
                              step="0.01"
                              {...deliveryFeesForm.register('baseDeliveryFee')}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="freeDeliveryThreshold">Free Delivery Threshold (₹)</Label>
                            <Input
                              id="freeDeliveryThreshold"
                              type="number"
                              step="0.01"
                              {...deliveryFeesForm.register('freeDeliveryThreshold')}
                              placeholder="0.00"
                            />
                            <p className="text-xs text-gray-500 mt-1">Orders above this amount get free delivery</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
                            <Input
                              id="deliveryRadius"
                              type="number"
                              step="0.1"
                              {...deliveryFeesForm.register('deliveryRadius')}
                              placeholder="10.0"
                            />
                          </div>
                          <div>
                            <Label htmlFor="deliveryTime">Estimated Delivery Time</Label>
                            <Input
                              id="deliveryTime"
                              {...deliveryFeesForm.register('deliveryTime')}
                              placeholder="1-2 hours"
                            />
                          </div>
                        </div>

                        <Separator />

                        {/* 
                        ========================================
                        ADVANCED DELIVERY FEE FEATURES
                        ========================================
                        These features are commented out for future use.
                        They will provide advanced delivery fee management
                        including distance-based and order value-based pricing.
                        ========================================
                        */}

                        {/* Distance-Based Fees - Commented out for future use
                        <div>
                          <Label className="text-lg font-medium">Distance-Based Fees</Label>
                          <p className="text-sm text-gray-500 mb-4">Set different fees for different distance ranges</p>
                          
                          {distanceFees.map((fee, index) => (
                            <div key={index} className="border rounded-lg p-4 mb-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label>Min Distance (km)</Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={fee.minDistance}
                                    onChange={(e) => {
                                      const newFees = [...distanceFees];
                                      newFees[index].minDistance = e.target.value;
                                      setDistanceFees(newFees);
                                    }}
                                    placeholder="0.0"
                                  />
                                </div>
                                <div>
                                  <Label>Max Distance (km)</Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={fee.maxDistance}
                                    onChange={(e) => {
                                      const newFees = [...distanceFees];
                                      newFees[index].maxDistance = e.target.value;
                                      setDistanceFees(newFees);
                                    }}
                                    placeholder="5.0"
                                  />
                                </div>
                                <div>
                                  <Label>Fee (₹)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={fee.fee}
                                    onChange={(e) => {
                                      const newFees = [...distanceFees];
                                      newFees[index].fee = e.target.value;
                                      setDistanceFees(newFees);
                                    }}
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                              <div className="mt-2">
                                <Label>Description (Optional)</Label>
                                <Input
                                  value={fee.description}
                                  onChange={(e) => {
                                    const newFees = [...distanceFees];
                                    newFees[index].description = e.target.value;
                                    setDistanceFees(newFees);
                                  }}
                                  placeholder="e.g., Local area delivery"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                  const newFees = distanceFees.filter((_, i) => i !== index);
                                  setDistanceFees(newFees);
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDistanceFees([...distanceFees, { minDistance: '', maxDistance: '', fee: '', description: '' }])}
                            className="w-full"
                          >
                            Add Distance Fee
                          </Button>
                        </div>
                        */}

                        <Separator />

                        {/* Order Value-Based Fees - Commented out for future use
                        <div>
                          <Label className="text-lg font-medium">Order Value-Based Fees</Label>
                          <p className="text-sm text-gray-500 mb-4">Set different fees for different order value ranges</p>
                          
                          {orderValueFees.map((fee, index) => (
                            <div key={index} className="border rounded-lg p-4 mb-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label>Min Order Value (₹)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={fee.minOrderValue}
                                    onChange={(e) => {
                                      const newFees = [...orderValueFees];
                                      newFees[index].minOrderValue = e.target.value;
                                      setOrderValueFees(newFees);
                                    }}
                                    placeholder="0.00"
                                  />
                                </div>
                                <div>
                                  <Label>Max Order Value (₹)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={fee.maxOrderValue}
                                    onChange={(e) => {
                                      const newFees = [...orderValueFees];
                                      newFees[index].maxOrderValue = e.target.value;
                                      setOrderValueFees(newFees);
                                    }}
                                    placeholder="500.00"
                                  />
                                </div>
                                <div>
                                  <Label>Fee (₹)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={fee.fee}
                                    onChange={(e) => {
                                      const newFees = [...orderValueFees];
                                      newFees[index].fee = e.target.value;
                                      setOrderValueFees(newFees);
                                    }}
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                              <div className="mt-2">
                                <Label>Description (Optional)</Label>
                                <Input
                                  value={fee.description}
                                  onChange={(e) => {
                                    const newFees = [...orderValueFees];
                                    newFees[index].description = e.target.value;
                                    setOrderValueFees(newFees);
                                  }}
                                  placeholder="e.g., Small order fee"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                  const newFees = orderValueFees.filter((_, i) => i !== index);
                                  setOrderValueFees(newFees);
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOrderValueFees([...orderValueFees, { minOrderValue: '', maxOrderValue: '', fee: '', description: '' }])}
                            className="w-full"
                          >
                            Add Order Value Fee
                          </Button>
                        </div>
                        */}
                      </>
                    )}

                    <Separator />

                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        disabled={updateVendorMutation.isPending}
                        className="flex items-center space-x-2"
                      >
                        {updateVendorMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Update Delivery Settings</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading delivery settings...</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Banking Information Tab */}
            <TabsContent value="banking">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Banking Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This information is used for payment processing and earnings withdrawal. 
                      Your data is encrypted and secure.
                    </AlertDescription>
                  </Alert>

                  <form onSubmit={bankingForm.handleSubmit(handleBankingUpdate)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="bankAccountNumber">Bank Account Number *</Label>
                        <Input
                          id="bankAccountNumber"
                          {...bankingForm.register('bankAccountNumber')}
                          placeholder="Enter account number"
                        />
                        {bankingForm.formState.errors.bankAccountNumber && (
                          <p className="text-sm text-red-500 mt-1">
                            {bankingForm.formState.errors.bankAccountNumber.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="ifscCode">IFSC Code *</Label>
                        <Input
                          id="ifscCode"
                          {...bankingForm.register('ifscCode')}
                          placeholder="Enter IFSC code"
                        />
                        {bankingForm.formState.errors.ifscCode && (
                          <p className="text-sm text-red-500 mt-1">
                            {bankingForm.formState.errors.ifscCode.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="bankAccountName">Account Holder Name *</Label>
                        <Input
                          id="bankAccountName"
                          {...bankingForm.register('bankAccountName')}
                          placeholder="Enter account holder name"
                        />
                        {bankingForm.formState.errors.bankAccountName && (
                          <p className="text-sm text-red-500 mt-1">
                            {bankingForm.formState.errors.bankAccountName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="bankAccountType">Account Type *</Label>
                        <Select
                          value={bankingForm.watch('bankAccountType')}
                          onValueChange={(value) => bankingForm.setValue('bankAccountType', value as 'savings' | 'current')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="savings">Savings</SelectItem>
                            <SelectItem value="current">Current</SelectItem>
                          </SelectContent>
                        </Select>
                        {bankingForm.formState.errors.bankAccountType && (
                          <p className="text-sm text-red-500 mt-1">
                            {bankingForm.formState.errors.bankAccountType.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        disabled={updateVendorMutation.isPending || createVendorMutation.isPending}
                        className="flex items-center space-x-2"
                      >
                        {updateVendorMutation.isPending || createVendorMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Update Banking Info</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
