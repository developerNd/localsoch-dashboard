import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getApiUrl, API_ENDPOINTS, API_CONFIG } from "@/lib/config";
// import { LocationQuickSearch } from "@/components/ui/location-quick-search"; // REMOVED
import { useCallback, useEffect } from 'react';
import { LocationCoordinates } from "@/lib/location-utils";
import { MapPin, Loader2, Map } from 'lucide-react';
import { MapLocationSelector } from "@/components/ui/map-location-selector";

interface BusinessCategory {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

interface SignupFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  shopName: string;
  shopDescription: string;
  address: string;
  city: string;
  state: string; // This will store state name
  pincode: string;
  businessCategoryId: number | null;
  otherBusinessCategory: string; // For custom business category
  gstNumber: string; // GST number field
  bankAccountName: string;
  bankAccountNumber: string;
  ifscCode: string;
  bankAccountType: 'savings' | 'current';
  acceptTerms: boolean;
  // GPS Location fields
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  gpsAddress?: string;
}

export default function Signup() {
  const [formData, setFormData] = useState<SignupFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    shopName: "",
    shopDescription: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    businessCategoryId: null,
    otherBusinessCategory: "",
    gstNumber: "",
    bankAccountName: "",
    bankAccountNumber: "",
    ifscCode: "",
    bankAccountType: 'savings',
    acceptTerms: false,
    // GPS Location fields
    latitude: undefined,
    longitude: undefined,
    locationAccuracy: undefined,
    gpsAddress: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [signupStatus, setSignupStatus] = useState("");
  const [showOtherBusinessCategory, setShowOtherBusinessCategory] = useState(false);
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [gpsRequired, setGpsRequired] = useState(true);
  const [gpsAvailable, setGpsAvailable] = useState(true);
  const [gpsPermissionDenied, setGpsPermissionDenied] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch business categories
  const { data: businessCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/business-categories'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/api/business-categories?populate=*'));
      if (!response.ok) throw new Error('Failed to fetch business categories');
      const data = await response.json();
      console.log(data);
      return data.data || [];
    },
  });

  const handleInputChange = (field: keyof SignupFormData, value: string | boolean | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCityChange = useCallback((city: string) => {
    handleInputChange('city', city);
  }, []);

  const handlePincodeChange = useCallback((pincode: string) => {
    handleInputChange('pincode', pincode);
  }, []);

  // GPS Location handlers
  const handleGPSLocationChange = useCallback((location: LocationCoordinates) => {
    console.log('🌍 GPS Location Captured in Signup:', {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      address: location.address,
      city: location.city,
      state: location.state,
      pincode: location.pincode,
      fullLocation: location
    });
    
    setFormData(prev => {
      const updatedData = {
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude,
        locationAccuracy: location.accuracy,
        gpsAddress: location.address || '',
        // Auto-fill address fields if GPS provides them
        ...(location.city && { city: location.city }),
        ...(location.state && { stateName: location.state }),
        ...(location.pincode && { pincode: location.pincode }),
        ...(location.address && { address: location.address }),
      };
      
      console.log('📝 Signup form data updated with GPS:', {
        latitude: updatedData.latitude,
        longitude: updatedData.longitude,
        locationAccuracy: updatedData.locationAccuracy,
        gpsAddress: updatedData.gpsAddress,
        city: updatedData.city,
        stateName: updatedData.stateName,
        pincode: updatedData.pincode,
        address: updatedData.address
      });
      
      return updatedData;
    });
  }, []);

  const handleGPSAddressChange = useCallback((address: string) => {
    console.log('📍 GPS Address Updated in Signup:', address);
    setFormData(prev => ({
      ...prev,
      gpsAddress: address,
    }));
  }, []);

  // Check GPS availability on component mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsAvailable(false);
      setGpsRequired(false);
    }
  }, []);

  // Simple GPS capture function
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
    setError("");
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
      
      console.log('🎯 GPS Location Captured:', {
        latitude,
        longitude,
        accuracy,
        timestamp: new Date().toISOString()
      });

      // Reverse geocoding to get address
      let geocodingSuccess = false;
      
      // Try Google Maps API first (more reliable for pincode)
      const GOOGLE_API_KEY = API_CONFIG.GOOGLE_MAPS_API_KEY; // From environment variable
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

              console.log('📝 Setting form data with GPS location:', {
                latitude,
                longitude,
                locationAccuracy: accuracy,
                gpsAddress: address,
                city: city || 'previous city',
                stateName: state || 'previous state',
                pincode: pincode || 'previous pincode',
                address: address || 'previous address'
              });

              // Update form data with GPS location
              setFormData(prev => {
                const updatedData = {
                  ...prev,
                  latitude,
                  longitude,
                  locationAccuracy: accuracy,
                  gpsAddress: address, // Store GPS-derived address
                  city: city || prev.city,
                  state: state || prev.state, // Set state field with state name
                  pincode: pincode || prev.pincode,
                  address: address, // Set the main address field to GPS address
                };
                
                console.log('📝 Form data updated with GPS location:', {
                  latitude: updatedData.latitude,
                  longitude: updatedData.longitude,
                  locationAccuracy: updatedData.locationAccuracy,
                  gpsAddress: updatedData.gpsAddress,
                  city: updatedData.city,
                  state: updatedData.state,
                  pincode: updatedData.pincode,
                  address: updatedData.address
                });
                
                return updatedData;
              });

              toast({
                title: "Location Captured!",
                description: `GPS coordinates and address captured successfully.`,
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

            // Update form data with GPS location
            setFormData(prev => ({
              ...prev,
              latitude,
              longitude,
              locationAccuracy: accuracy,
              gpsAddress: address, // Store GPS-derived address
              city: city || prev.city,
              state: state || prev.state, // Set state field with state name
              pincode: pincode || prev.pincode,
              address: address, // Set the main address field to GPS address
            }));

            toast({
              title: "Location Captured!",
              description: `GPS coordinates and address captured successfully.`,
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
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude,
          locationAccuracy: accuracy,
        }));

        toast({
          title: "GPS Captured",
          description: "Location coordinates captured, but address lookup failed.",
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
  }, [toast]);

  // Handle map location selection
  const handleMapLocationSelect = useCallback((location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    pincode: string;
  }) => {
    console.log('🗺️ Map Location Selected in Signup:', location);
    
    // Update form data with map-selected location
    setFormData(prev => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
      locationAccuracy: 0, // Map selection is considered accurate
      gpsAddress: location.address,
      address: location.address,
      city: location.city,
      state: location.state,
      pincode: location.pincode,
    }));

    // Hide map selector after selection
    setShowMapSelector(false);
    
    toast({
      title: "Location Selected!",
      description: `Address: ${location.address}`,
    });
  }, [toast]);

  // Function to create custom business category
  const createCustomBusinessCategory = async (categoryName: string) => {
    try {
      const response = await fetch(getApiUrl('/api/business-categories/custom'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: categoryName,
          description: `Custom business category: ${categoryName}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create custom business category');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating custom business category:', error);
      throw error;
    }
  };

  // REMOVED: handleLocationSelect function

  const validateForm = (): string | null => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      return "All fields are required";
    }
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    if (!formData.acceptTerms) {
      return "You must accept the terms and conditions";
    }
    if (!formData.shopName || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      console.log('🔍 Validation failed - missing fields:', {
        shopName: formData.shopName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      });
      return "Shop details are required";
    }
    
    // GPS validation - required if GPS is available and not disabled
    if (gpsRequired && gpsAvailable && (!formData.latitude || !formData.longitude)) {
      return "GPS location is required. Please capture your location or allow manual entry.";
    }
    
    if (!formData.businessCategoryId && !formData.otherBusinessCategory) {
      return "Please select a business category or specify a custom one";
    }
    // minimal banking validation optional at signup
    if (!formData.bankAccountName || !formData.bankAccountNumber || !formData.ifscCode) {
      return "Please provide all banking information (account holder name, account number, and IFSC code)";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSignupStatus("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setSignupStatus("Creating your account...");

    try {
      // Handle custom business category creation
      let finalBusinessCategoryId = formData.businessCategoryId;
      if (showOtherBusinessCategory && formData.otherBusinessCategory) {
        try {
          setSignupStatus("Creating custom business category...");
          const customCategory = await createCustomBusinessCategory(formData.otherBusinessCategory);
          finalBusinessCategoryId = customCategory.id;
        } catch (error) {
          setError('Failed to create custom business category. Please try again.');
          return;
        }
      }
      // Step 1: Create user account with basic credentials
      const userResponse = await fetch(getApiUrl(API_ENDPOINTS.AUTH.REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.error?.message || 'Failed to create account');
      }

      const userData = await userResponse.json();
      
      // Step 1.5: Update user with additional fields
      const updateResponse = await fetch(getApiUrl(`/api/users/${userData.user.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.jwt}`,
        },
        body: JSON.stringify({
          data: {
            phone: formData.phone,
            firstName: formData.firstName,
            lastName: formData.lastName,
          }
        }),
      });

      if (!updateResponse.ok) {
        console.warn('Failed to update user with additional fields, but account was created');
      }
      setSignupStatus("Account created! Assigning seller role...");

      // Step 2: Assign seller role (this will be done after payment)
      // For now, we'll store the user data and proceed to payment
      setSignupStatus("Account created! Redirecting to payment...");

      // Step 3: Redirect to payment screen
      toast({
        title: "Account Created Successfully!",
        description: "Please complete the payment to activate your seller account.",
      });

      // Store user data in localStorage for payment screen
      localStorage.setItem('pendingSellerData', JSON.stringify({
        user: userData.user,
        vendor: null, // Will be created after payment
        jwt: userData.jwt,
        formData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          shopName: formData.shopName,
          shopDescription: formData.shopDescription,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          businessCategoryId: finalBusinessCategoryId,
          otherBusinessCategory: formData.otherBusinessCategory,
          gstNumber: formData.gstNumber,
          phone: formData.phone,
          email: formData.email,
          bankAccountName: formData.bankAccountName,
          bankAccountNumber: formData.bankAccountNumber,
          ifscCode: formData.ifscCode,
          bankAccountType: formData.bankAccountType,
          // GPS Location data
          latitude: formData.latitude,
          longitude: formData.longitude,
          locationAccuracy: formData.locationAccuracy,
          gpsAddress: formData.gpsAddress,
        },
      }));

      // Redirect to subscription selection screen
      setLocation('/subscription-selection');

    } catch (error) {
      console.error('Signup error:', error);
      setError(error instanceof Error ? error.message : "Failed to create account");
      toast({
        title: "Signup Failed",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Become a Seller
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join LocalSoch as a seller and start selling your products
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Seller Registration</CardTitle>
            <CardDescription>
              Create your seller account and shop profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Create a password"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>

              {/* Shop Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Shop Information</h3>
                <div>
                  <Label htmlFor="shopName">Shop Name</Label>
                  <Input
                    id="shopName"
                    type="text"
                    value={formData.shopName}
                    onChange={(e) => handleInputChange('shopName', e.target.value)}
                    placeholder="Enter your shop name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="shopDescription">Shop Description</Label>
                  <Textarea
                    id="shopDescription"
                    value={formData.shopDescription}
                    onChange={(e) => handleInputChange('shopDescription', e.target.value)}
                    placeholder="Describe your shop and what you sell"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessCategory">Business Category</Label>
                    <Select 
                      value={showOtherBusinessCategory ? "other" : (formData.businessCategoryId?.toString() || "")} 
                      onValueChange={(value) => {
                        if (value === "other") {
                          setShowOtherBusinessCategory(true);
                          handleInputChange('businessCategoryId', null);
                        } else {
                          setShowOtherBusinessCategory(false);
                          handleInputChange('businessCategoryId', value ? parseInt(value) : null);
                        }
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
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {businessCategories?.length === 0 && !categoriesLoading && (
                      <p className="text-sm text-gray-500 mt-1">No business categories available</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                    <Input
                      id="gstNumber"
                      type="text"
                      value={formData.gstNumber}
                      onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                      placeholder="Enter GST number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccountName">Account Holder Name</Label>
                    <Input
                      id="bankAccountName"
                      type="text"
                      value={formData.bankAccountName}
                      onChange={(e) => handleInputChange('bankAccountName', e.target.value)}
                      placeholder="Enter account holder name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                    <Input
                      id="bankAccountNumber"
                      type="text"
                      value={formData.bankAccountNumber}
                      onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                      placeholder="Enter bank account number"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      type="text"
                      value={formData.ifscCode}
                      onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                      placeholder="Enter IFSC code"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccountType">Account Type</Label>
                    <Select 
                      value={formData.bankAccountType}
                      onValueChange={(value) => handleInputChange('bankAccountType', value as 'savings' | 'current')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="current">Current</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {showOtherBusinessCategory && (
                  <div>
                    <Label htmlFor="otherBusinessCategory">Specify Business Category</Label>
                    <Input
                      id="otherBusinessCategory"
                      type="text"
                      value={formData.otherBusinessCategory}
                      onChange={(e) => handleInputChange('otherBusinessCategory', e.target.value)}
                      placeholder="Enter your business category"
                      required
                    />
                  </div>
                )}
                
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
                          : "Capture your current location automatically"
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
                    onClick={() => setShowMapSelector(!showMapSelector)}
                    className="bg-white border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Map className="h-4 w-4 mr-2" />
                    {showMapSelector ? 'Hide Map' : 'Select on Map'}
                  </Button>
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
                  {formData.latitude && formData.longitude && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800">GPS Location Captured!</p>
                          <p className="text-xs text-green-600">
                            Coordinates: {formData.latitude?.toFixed(6)}, {formData.longitude?.toFixed(6)}
                            {formData.locationAccuracy && ` (Accuracy: ±${Math.round(formData.locationAccuracy)}m)`}
                          </p>
                          {formData.gpsAddress && (
                            <p className="text-xs text-green-600 mt-1">
                              Address: {formData.gpsAddress}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Map Location Selector */}
                {showMapSelector && (
                  <div className="mt-4">
                    <MapLocationSelector
                      onLocationSelect={handleMapLocationSelect}
                      initialLocation={formData.latitude && formData.longitude ? {
                        latitude: formData.latitude,
                        longitude: formData.longitude,
                        address: formData.gpsAddress || formData.address || '',
                        city: formData.city || '',
                        state: formData.state || '',
                        pincode: formData.pincode || ''
                      } : undefined}
                      disabled={isCapturingGPS}
                    />
                  </div>
                )}
                
                {/* Address Field */}
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => {
                      const newAddress = e.target.value;
                      handleInputChange('address', newAddress);
                      // Update gpsAddress to match the manually entered address
                      setFormData(prev => ({
                        ...prev,
                        gpsAddress: newAddress
                      }));
                    }}
                    placeholder="Enter your shop address"
                    rows={2}
                    required
                    readOnly={gpsRequired && gpsAvailable}
                    className={gpsRequired && gpsAvailable ? "bg-gray-50 cursor-not-allowed" : ""}
                  />
                  {gpsRequired && gpsAvailable && (
                    <p className="text-xs text-gray-500 mt-1">
                      Address will be auto-filled from GPS location. Click "Enter Manually" to edit.
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
                        value={formData.state}
                        onChange={(e) => {
                          const newState = e.target.value;
                          handleInputChange('state', newState);
                          // Update gpsAddress to reflect manual changes
                          setFormData(prev => ({
                            ...prev,
                            gpsAddress: prev.address // Keep current address as gpsAddress
                          }));
                        }}
                        placeholder="Enter state"
                        required
                        readOnly={gpsRequired && gpsAvailable}
                        className={gpsRequired && gpsAvailable ? "bg-gray-50 cursor-not-allowed" : ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => {
                          const newCity = e.target.value;
                          handleInputChange('city', newCity);
                          // Update gpsAddress to reflect manual changes
                          setFormData(prev => ({
                            ...prev,
                            gpsAddress: prev.address // Keep current address as gpsAddress
                          }));
                        }}
                        placeholder="Enter city"
                        required
                        readOnly={gpsRequired && gpsAvailable}
                        className={gpsRequired && gpsAvailable ? "bg-gray-50 cursor-not-allowed" : ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input
                        id="pincode"
                        value={formData.pincode}
                        onChange={(e) => {
                          const newPincode = e.target.value;
                          handleInputChange('pincode', newPincode);
                          // Update gpsAddress to reflect manual changes
                          setFormData(prev => ({
                            ...prev,
                            gpsAddress: prev.address // Keep current address as gpsAddress
                          }));
                        }}
                        placeholder="Enter pincode"
                        required
                        readOnly={gpsRequired && gpsAvailable}
                        className={gpsRequired && gpsAvailable ? "bg-gray-50 cursor-not-allowed" : ""}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
                />
                <Label htmlFor="acceptTerms" className="text-sm">
                  I agree to the{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    Terms and Conditions
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                </Label>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {signupStatus && (
                <Alert>
                  <AlertDescription>{signupStatus}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Seller Account"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <a href="/login" className="text-blue-600 hover:underline">
                  Sign in here
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 