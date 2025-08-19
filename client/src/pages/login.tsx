import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginStatus, setLoginStatus] = useState("");
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Auto-login effect for users coming from payment flow
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const autoLogin = urlParams.get('autoLogin');
    
    if (autoLogin === 'true') {
      const autoLoginData = localStorage.getItem('autoLoginData');
      if (autoLoginData) {
        try {
          const data = JSON.parse(autoLoginData);
          const now = Date.now();
          const timeDiff = now - data.timestamp;
          
          // Only auto-login if data is less than 5 minutes old
          if (timeDiff < 5 * 60 * 1000) {
            setUsername(data.username || data.email);
            toast({
              title: "Welcome!",
              description: "Please enter your password to complete login.",
            });
          } else {
            // Clear old auto-login data
            localStorage.removeItem('autoLoginData');
          }
        } catch (error) {
          console.error('Error parsing auto-login data:', error);
          localStorage.removeItem('autoLoginData');
        }
      }
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoginStatus("");

    try {
      if (username && password) {
        setLoginStatus("Logging in...");
        const result = await login({ username, password });
        
        // Manual redirect as backup
        if (result && result.user) {
          // Check user role first
          const userRole = result.user.role;
          const roleName = typeof userRole === 'object' ? userRole.name : userRole;
          
          // Check for incomplete registration - only for non-admin users
          if (roleName !== 'admin') {
            const pendingData = localStorage.getItem('pendingSellerData');
            if (pendingData) {
              setLocation('/incomplete-registration');
            } else if (result.user.vendorId) {
              setLocation('/seller');
            } else {
              setLocation('/admin');
            }
          } else {
            // Admin users always go to admin dashboard
            setLocation('/admin');
          }
        }
      } else {
        setError("Please enter both username and password");
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : "Invalid credentials. Please try again.");
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            LocalSoch Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
          {new URLSearchParams(window.location.search).get('autoLogin') === 'true' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 text-center">
                ✅ Payment successful! Your seller account is now active. Please login to continue.
              </p>
            </div>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {loginStatus && (
                <Alert>
                  <AlertDescription>{loginStatus}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-gray-600">
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Want to become a seller?{" "}
              <a href="/signup" className="text-blue-600 hover:underline font-medium">
                Register here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
