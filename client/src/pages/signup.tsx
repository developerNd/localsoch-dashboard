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
import { getApiUrl, API_ENDPOINTS } from "@/lib/config";
import { LocationSelector } from "@/components/ui/location-selector";
// import { LocationQuickSearch } from "@/components/ui/location-quick-search"; // REMOVED
import { getStates } from "@/lib/location-api";
import { useCallback } from 'react';

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
  state: string; // This will store state ID
  stateName: string; // This will store state name for display
  pincode: string;
  businessCategoryId: number | null;
  otherBusinessCategory: string; // For custom business category
  gstNumber: string; // GST number field
  bankAccountName: string;
  ifscCode: string;
  bankAccountType: 'savings' | 'current';
  acceptTerms: boolean;
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
    stateName: "",
    pincode: "",
    businessCategoryId: null,
    otherBusinessCategory: "",
    gstNumber: "",
    bankAccountName: "",
    ifscCode: "",
    bankAccountType: 'savings',
    acceptTerms: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [signupStatus, setSignupStatus] = useState("");
  const [showOtherBusinessCategory, setShowOtherBusinessCategory] = useState(false);
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

  // New query for states to map names to IDs
  const { data: states } = useQuery({
    queryKey: ['location-states'],
    queryFn: getStates,
  });

  const handleInputChange = (field: keyof SignupFormData, value: string | boolean | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // New handler for state change to map name to ID
  const handleStateChange = useCallback((stateId: string) => {
    console.log('🔍 Signup: handleStateChange called with stateId:', stateId);
    console.log('🔍 Signup: Available states:', states);
    
    const state = states?.find(s => s.id === stateId);
    console.log('🔍 Signup: Found state:', state);
    
    setFormData(prev => {
      const newData = {
        ...prev,
        state: stateId,
        stateName: state?.name || ''
      };
      console.log('🔍 Signup: Updated formData:', newData);
      return newData;
    });
  }, [states]);

  const handleCityChange = useCallback((city: string) => {
    handleInputChange('city', city);
  }, []);

  const handlePincodeChange = useCallback((pincode: string) => {
    handleInputChange('pincode', pincode);
  }, []);

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
      return "Shop details are required";
    }
    if (!formData.businessCategoryId && !formData.otherBusinessCategory) {
      return "Please select a business category or specify a custom one";
    }
    // minimal banking validation optional at signup
    if (!formData.bankAccountName || !formData.ifscCode) {
      return "Please provide banking name and IFSC";
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
          stateName: formData.stateName,
          pincode: formData.pincode,
          businessCategoryId: finalBusinessCategoryId,
          otherBusinessCategory: formData.otherBusinessCategory,
          gstNumber: formData.gstNumber,
          phone: formData.phone,
          email: formData.email,
          bankAccountName: formData.bankAccountName,
          ifscCode: formData.ifscCode,
          bankAccountType: formData.bankAccountType,
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
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter your shop address"
                    rows={2}
                    required
                  />
                </div>
                
                {/* REMOVED: LocationQuickSearch component */}
                
                <LocationSelector
                  selectedState={formData.state}
                  selectedCity={formData.city}
                  selectedPincode={formData.pincode}
                  onStateChange={handleStateChange}
                  onCityChange={handleCityChange}
                  onPincodeChange={handlePincodeChange}
                />
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