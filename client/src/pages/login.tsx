import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema, type LoginData, type RegisterData } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function Login() {
  const { login, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if already authenticated
  if (user) {
    if (user.role === 'admin') {
      setLocation('/admin');
    } else if (user.role === 'seller') {
      setLocation('/seller');
    }
    return null;
  }

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      shopName: '',
      shopDescription: '',
      contactPhone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      role: 'seller',
      avatar: null,
      isActive: true,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest('POST', '/api/auth/register', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "Your account has been created and is pending admin approval.",
      });
      registerForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const handleLogin = async (data: LoginData) => {
    try {
      await login(data);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      
      // Redirect will be handled by ProtectedRoute
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (data: RegisterData) => {
    await registerMutation.mutateAsync(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <i className="fas fa-store text-primary text-5xl mb-4"></i>
          <h1 className="text-3xl font-bold text-gray-900">SellerHub</h1>
          <p className="text-gray-600 mt-2">Multivendor Ecommerce Portal</p>
        </div>

        <Card>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      {...loginForm.register('username')}
                      placeholder="Enter your username"
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-sm text-destructive mt-1">
                        {loginForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...loginForm.register('password')}
                      placeholder="Enter your password"
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive mt-1">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Sign In
                  </Button>
                </form>
                
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Demo Accounts:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Admin:</strong> admin / admin123</p>
                    <p><strong>Seller:</strong> johnseller / seller123</p>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="register">
              <CardHeader>
                <CardTitle>Create Seller Account</CardTitle>
                <CardDescription>
                  Join our marketplace and start selling your products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        {...registerForm.register('firstName')}
                        placeholder="John"
                      />
                      {registerForm.formState.errors.firstName && (
                        <p className="text-sm text-destructive mt-1">
                          {registerForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        {...registerForm.register('lastName')}
                        placeholder="Doe"
                      />
                      {registerForm.formState.errors.lastName && (
                        <p className="text-sm text-destructive mt-1">
                          {registerForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      {...registerForm.register('username')}
                      placeholder="johndoe"
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...registerForm.register('email')}
                      placeholder="john@example.com"
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="shopName">Shop Name</Label>
                    <Input
                      id="shopName"
                      {...registerForm.register('shopName')}
                      placeholder="John's Electronics Store"
                    />
                    {registerForm.formState.errors.shopName && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.shopName.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="contactPhone">Phone Number</Label>
                    <Input
                      id="contactPhone"
                      {...registerForm.register('contactPhone')}
                      placeholder="+91-9876543210"
                    />
                    {registerForm.formState.errors.contactPhone && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.contactPhone.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      {...registerForm.register('address')}
                      placeholder="123 Main Street"
                    />
                    {registerForm.formState.errors.address && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.address.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        {...registerForm.register('city')}
                        placeholder="Mumbai"
                      />
                      {registerForm.formState.errors.city && (
                        <p className="text-sm text-destructive mt-1">
                          {registerForm.formState.errors.city.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        {...registerForm.register('state')}
                        placeholder="Maharashtra"
                      />
                      {registerForm.formState.errors.state && (
                        <p className="text-sm text-destructive mt-1">
                          {registerForm.formState.errors.state.message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      {...registerForm.register('pincode')}
                      placeholder="400001"
                    />
                    {registerForm.formState.errors.pincode && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.pincode.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...registerForm.register('password')}
                      placeholder="Enter a strong password"
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...registerForm.register('confirmPassword')}
                      placeholder="Confirm your password"
                    />
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive mt-1">
                        {registerForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
