import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
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
import { Upload, X, Image as ImageIcon, Save, User, Store, CreditCard, AlertCircle, CheckCircle, Clock, Truck, MapPin, Loader2 } from 'lucide-react';
import { getApiUrl, getImageUrl, API_ENDPOINTS } from '@/lib/config';
import { LocationCoordinates } from '@/lib/location-utils';

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
  // GPS Location fields
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationAccuracy: z.number().optional(),
  gpsAddress: z.string().optional(),
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
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [gpsRequired, setGpsRequired] = useState(true);
  const [gpsAvailable, setGpsAvailable] = useState(true);
  const [gpsPermissionDenied, setGpsPermissionDenied] = useState(false);


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

  // Simple GPS capture function for profile
  const captureGPSLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setGpsAvailable(false);
      setGpsRequired(false);
      toast({
        title: "GPS Not Available",
        description: "Your device doesn't support GPS location services. Please enter your address manually.",
        variant: "destructive",
      });
      return;
    }

    setIsCapturingGPS(true);
    setGpsPermissionDenied(false);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            console.error('GPS Error:', error);
            if (error.code === error.PERMISSION_DENIED) {
              setGpsPermissionDenied(true);
              setGpsRequired(false);
              toast({
                title: "GPS Permission Denied",
                description: "Please allow location access or enter your address manually.",
                variant: "destructive",
              });
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              setGpsAvailable(false);
              setGpsRequired(false);
              toast({
                title: "GPS Unavailable",
                description: "Location services are unavailable. Please enter your address manually.",
                variant: "destructive",
              });
            } else if (error.code === error.TIMEOUT) {
              toast({
                title: "GPS Timeout",
                description: "Location request timed out. Please try again or enter your address manually.",
                variant: "destructive",
              });
            }
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000
          }
        );
      });

      const { latitude, longitude, accuracy } = position.coords;
      
      console.log('🎯 GPS Location Captured in Profile:', {
        latitude,
        longitude,
        accuracy,
        timestamp: new Date().toISOString()
      });

      // Reverse geocoding to get address
      let geocodingSuccess = false;
      
      // Try Google Maps API first (more reliable for pincode)
      const GOOGLE_API_KEY = 'AIzaSyDgdsLMV37MSAxvIscmfV0lozfDAInj188'; // Hardcoded from cityshopping
      if (GOOGLE_API_KEY) {
        try {
          console.log('🌍 Trying Google Maps API for reverse geocoding');
          const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}&language=en&region=in`;
          const googleResponse = await fetch(googleUrl);
          
          if (googleResponse.ok) {
            const googleData = await googleResponse.json();
            console.log('🌍 Google Maps API Response:', googleData);
            
            if (googleData.status === 'OK' && googleData.results && googleData.results.length > 0) {
              const result = googleData.results[0];
              const addressComponents = result.address_components;
              
              let address = result.formatted_address || '';
              let city = '';
              let state = '';
              let pincode = '';
              
              addressComponents.forEach((component: any) => {
                const types = component.types;
                if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                  city = component.long_name;
                } else if (types.includes('administrative_area_level_1')) {
                  state = component.long_name;
                } else if (types.includes('postal_code')) {
                  pincode = component.long_name;
                }
              });
              
              console.log('🏠 Google Maps Geocoding Result:', {
                address,
                city,
                state,
                pincode
              });

              // Update form with GPS location
              shopForm.setValue('latitude', latitude);
              shopForm.setValue('longitude', longitude);
              shopForm.setValue('locationAccuracy', accuracy);
              shopForm.setValue('gpsAddress', address); // Store GPS-derived address
              
              // Auto-populate address fields
              if (address) shopForm.setValue('address', address); // Set main address field
              if (city) shopForm.setValue('city', city);
              if (state) shopForm.setValue('state', state);
              if (pincode) shopForm.setValue('pincode', pincode);
              
              // Trigger form validation
              shopForm.trigger(['address', 'city', 'state', 'pincode']);

              toast({
                title: "Location Updated!",
                description: `GPS coordinates and address updated successfully.`,
              });
              
              geocodingSuccess = true;
            }
          }
        } catch (googleError) {
          console.log('Google Maps API failed, trying OpenStreetMap:', googleError);
        }
      }
      
      // Fallback to OpenStreetMap if Google Maps failed
      if (!geocodingSuccess) {
        try {
          console.log('🌍 Trying OpenStreetMap API for reverse geocoding');
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'LocalVendorHub/1.0'
              }
            }
          );
          
          console.log('🌍 OpenStreetMap response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('🌍 OpenStreetMap response:', data);
            
            const address = data.display_name || '';
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.hamlet || '';
            const state = data.address?.state || '';
            const pincode = data.address?.postcode || '';
            
            console.log('🏠 OpenStreetMap Geocoding Result:', {
              address,
              city,
              state,
              pincode,
              fullAddress: data.address
            });

            // Update form with GPS location
            shopForm.setValue('latitude', latitude);
            shopForm.setValue('longitude', longitude);
            shopForm.setValue('locationAccuracy', accuracy);
            shopForm.setValue('gpsAddress', address); // Store GPS-derived address
            
            // Auto-populate address fields
            if (address) shopForm.setValue('address', address); // Set main address field
            if (city) shopForm.setValue('city', city);
            if (state) shopForm.setValue('state', state);
            if (pincode) shopForm.setValue('pincode', pincode);
            
            // Trigger form validation
            shopForm.trigger(['address', 'city', 'state', 'pincode']);

            toast({
              title: "Location Updated!",
              description: `GPS coordinates and address updated successfully.`,
            });
            
            geocodingSuccess = true;
          } else {
            console.error('OpenStreetMap API error:', response.status, response.statusText);
            throw new Error(`OpenStreetMap API returned ${response.status}`);
          }
        } catch (osmError) {
          console.error('OpenStreetMap geocoding failed:', osmError);
        }
      }
      
      // If both geocoding services failed, still save GPS coordinates
      if (!geocodingSuccess) {
        console.log('🌍 Both geocoding services failed, saving GPS coordinates only');
        shopForm.setValue('latitude', latitude);
        shopForm.setValue('longitude', longitude);
        shopForm.setValue('locationAccuracy', accuracy);

        toast({
          title: "GPS Updated",
          description: "Location coordinates updated, but address lookup failed.",
        });
      }
    } catch (error) {
      console.error('GPS capture failed:', error);
      toast({
        title: "GPS Capture Failed",
        description: "Unable to get your location. Please try again or enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsCapturingGPS(false);
    }
  }, [toast, shopForm]);

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

    // GPS validation - required if GPS is available and not disabled
    if (gpsRequired && gpsAvailable && (!data.latitude || !data.longitude)) {
      toast({
        title: "GPS Location Required",
        description: "GPS location is required for accurate service delivery. Please capture your location or allow manual entry.",
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

                    {/* GPS Location Section - Required */}
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-medium text-blue-900 flex items-center gap-2">
                            GPS Location
                            {gpsRequired && gpsAvailable && (
                              <span className="text-red-500 text-xs">* Required</span>
                            )}
                          </h4>
                          <p className="text-xs text-blue-700">
                            {gpsRequired && gpsAvailable 
                              ? "GPS location is required for accurate service delivery"
                              : "Update your current location automatically"
                            }
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {gpsRequired && gpsAvailable && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setGpsRequired(false);
                                toast({
                                  title: "Manual Entry Enabled",
                                  description: "You can now enter your address manually.",
                                });
                              }}
                              className="bg-white border-orange-300 text-orange-700 hover:bg-orange-50"
                            >
                              Enter Manually
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={captureGPSLocation}
                            disabled={isCapturingGPS}
                            className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            {isCapturingGPS ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Capturing...
                              </>
                            ) : (
                              <>
                                <MapPin className="h-4 w-4 mr-2" />
                                Get GPS Location
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* GPS Error States */}
                      {gpsPermissionDenied && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">!</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-red-800">GPS Permission Denied</p>
                              <p className="text-xs text-red-600">
                                Please allow location access or use manual entry below.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!gpsAvailable && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-yellow-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">!</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-yellow-800">GPS Not Available</p>
                              <p className="text-xs text-yellow-600">
                                GPS services are not available. Please enter your address manually.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* GPS Data Status */}
                      {shopForm.watch('latitude') && shopForm.watch('longitude') && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-green-800">GPS Location Captured!</p>
                              <p className="text-xs text-green-600">
                                Coordinates: {shopForm.watch('latitude')?.toFixed(6)}, {shopForm.watch('longitude')?.toFixed(6)}
                                {shopForm.watch('locationAccuracy') && ` (Accuracy: ±${Math.round(shopForm.watch('locationAccuracy') || 0)}m)`}
                              </p>
                              {shopForm.watch('gpsAddress') && (
                                <p className="text-xs text-green-600 mt-1">
                                  Address: {shopForm.watch('gpsAddress')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Address Field */}
                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        {...shopForm.register('address')}
                        placeholder="Enter your business address"
                        onChange={(e) => {
                          const newAddress = e.target.value;
                          // Update gpsAddress to match the manually entered address
                          shopForm.setValue('gpsAddress', newAddress);
                        }}
                        readOnly={gpsRequired && gpsAvailable}
                        className={gpsRequired && gpsAvailable ? "bg-gray-50 cursor-not-allowed" : ""}
                      />
                      {gpsRequired && gpsAvailable && (
                        <p className="text-xs text-gray-500 mt-1">
                          Address will be auto-filled from GPS location. Click "Enter Manually" to edit.
                        </p>
                      )}
                      {shopForm.formState.errors.address && (
                        <p className="text-sm text-red-500 mt-1">
                          {shopForm.formState.errors.address.message}
                        </p>
                      )}
                    </div>
                    
                    {/* Manual Location Input Fields */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Enter your location details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            {...shopForm.register('state')}
                            value={shopForm.watch('state') || ''}
                            placeholder="Enter state"
                            onChange={(e) => {
                              const newState = e.target.value;
                              shopForm.setValue('state', newState);
                              // Update gpsAddress to reflect manual changes
                              const currentAddress = shopForm.getValues('address');
                              if (currentAddress) {
                                shopForm.setValue('gpsAddress', currentAddress);
                              }
                            }}
                            readOnly={gpsRequired && gpsAvailable}
                            className={gpsRequired && gpsAvailable ? "bg-gray-50 cursor-not-allowed" : ""}
                          />
                          {shopForm.formState.errors.state && (
                            <p className="text-sm text-red-500 mt-1">
                              {shopForm.formState.errors.state.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            {...shopForm.register('city')}
                            value={shopForm.watch('city') || ''}
                            placeholder="Enter city"
                            onChange={(e) => {
                              const newCity = e.target.value;
                              shopForm.setValue('city', newCity);
                              // Update gpsAddress to reflect manual changes
                              const currentAddress = shopForm.getValues('address');
                              if (currentAddress) {
                                shopForm.setValue('gpsAddress', currentAddress);
                              }
                            }}
                            readOnly={gpsRequired && gpsAvailable}
                            className={gpsRequired && gpsAvailable ? "bg-gray-50 cursor-not-allowed" : ""}
                          />
                          {shopForm.formState.errors.city && (
                            <p className="text-sm text-red-500 mt-1">
                              {shopForm.formState.errors.city.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="pincode">Pincode</Label>
                          <Input
                            id="pincode"
                            {...shopForm.register('pincode')}
                            value={shopForm.watch('pincode') || ''}
                            placeholder="Enter pincode"
                            onChange={(e) => {
                              const newPincode = e.target.value;
                              shopForm.setValue('pincode', newPincode);
                              // Update gpsAddress to reflect manual changes
                              const currentAddress = shopForm.getValues('address');
                              if (currentAddress) {
                                shopForm.setValue('gpsAddress', currentAddress);
                              }
                            }}
                            readOnly={gpsRequired && gpsAvailable}
                            className={gpsRequired && gpsAvailable ? "bg-gray-50 cursor-not-allowed" : ""}
                          />
                          {shopForm.formState.errors.pincode && (
                            <p className="text-sm text-red-500 mt-1">
                              {shopForm.formState.errors.pincode.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
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
