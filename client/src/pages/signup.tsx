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
  state: string;
  pincode: string;
  businessCategoryId: number | null;
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
    pincode: "",
    businessCategoryId: null,
    acceptTerms: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [signupStatus, setSignupStatus] = useState("");
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
    if (!formData.businessCategoryId) {
      return "Please select a business category";
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
      // Step 1: Create user account
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
          businessCategoryId: formData.businessCategoryId,
          phone: formData.phone,
          email: formData.email,
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
                
                <div>
                  <Label htmlFor="businessCategory">Business Category</Label>
                  <Select 
                    value={formData.businessCategoryId?.toString() || ""} 
                    onValueChange={(value) => handleInputChange('businessCategoryId', value ? parseInt(value) : null)}
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
                </div>
                
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Enter city"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="Enter state"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      placeholder="Enter pincode"
                      required
                    />
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