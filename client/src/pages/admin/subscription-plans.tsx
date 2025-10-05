import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl, API_ENDPOINTS } from '@/lib/config';
import { getAuthToken } from '@/lib/auth';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { Plus, Edit, Trash2, Star, Package } from 'lucide-react';

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  durationType: string;
  isActive: boolean;
  isPopular: boolean;
  features: string[];
  maxProducts: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSubscriptionPlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    durationType: 'months', // Changed from 'days' to 'months' as default
    isActive: true,
    isPopular: false,
    features: [''],
    maxProducts: ''
  });

  // Fetch subscription plans
  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const token = getAuthToken();
      const response = await fetch(getApiUrl('/api/subscription-plans?populate=*'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      
      // Normalize the data to handle Strapi structure
      const normalizedPlans = (data.data || []).map((plan: any) => ({
        id: plan.id,
        name: plan.attributes?.name || plan.name,
        description: plan.attributes?.description || plan.description,
        price: plan.attributes?.price || plan.price,
        currency: plan.attributes?.currency || plan.currency || 'INR',
        duration: plan.attributes?.duration || plan.duration,
        durationType: plan.attributes?.durationType || plan.durationType || 'days',
        isActive: plan.attributes?.isActive ?? plan.isActive ?? true,
        isPopular: plan.attributes?.isPopular ?? plan.isPopular ?? false,
        features: plan.attributes?.features || plan.features || [],
        maxProducts: plan.attributes?.maxProducts || plan.maxProducts,
        createdAt: plan.attributes?.createdAt || plan.createdAt,
        updatedAt: plan.attributes?.updatedAt || plan.updatedAt,
      }));
      
      return normalizedPlans;
    }
  });

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (planData: any) => {
      const token = getAuthToken();
      const response = await fetch(getApiUrl('/api/subscription-plans'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ data: planData }),
      });
      if (!response.ok) throw new Error('Failed to create plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: "Success",
        description: "Subscription plan created successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, planData }: { id: number; planData: any }) => {
      const token = getAuthToken();
      const response = await fetch(getApiUrl(`/api/subscription-plans/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ data: planData }),
      });
      if (!response.ok) throw new Error('Failed to update plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: "Success",
        description: "Subscription plan updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingPlan(null);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = getAuthToken();
      
      console.log('🔍 Deleting subscription plan with ID:', id);
      console.log('🔍 API URL:', getApiUrl(`/api/subscription-plans/${id}`));
      
      try {
        const response = await fetch(getApiUrl(`/api/subscription-plans/${id}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        });
        
        console.log('🔍 Delete response status:', response.status);
        console.log('🔍 Delete response status text:', response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('🔍 Delete error response:', errorText);
          throw new Error(`Failed to delete subscription plan: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('🔍 Delete success result:', result);
        return result;
      } catch (error) {
        console.error('🔍 Fetch error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: "Success",
        description: "Subscription plan deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setPlanToDelete(null);
    },
    onError: (error: any) => {
      console.error('🔍 Delete mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete subscription plan",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      durationType: 'months', // Changed from 'days' to 'months' as default
      isActive: true,
      isPopular: false,
      features: [''],
      maxProducts: ''
    });
  };

  const handleCreate = () => {
    // Validate required fields
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Plan name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.price || isNaN(parseFloat(formData.price))) {
      toast({
        title: "Error",
        description: "Valid price is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.duration || isNaN(parseInt(formData.duration))) {
      toast({
        title: "Error",
        description: "Valid duration is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.durationType) {
      toast({
        title: "Error",
        description: "Duration type is required",
        variant: "destructive",
      });
      return;
    }

    const planData = {
      ...formData,
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration),
      maxProducts: formData.maxProducts && !isNaN(parseInt(formData.maxProducts)) ? parseInt(formData.maxProducts) : null,
      features: formData.features.filter(f => f.trim() !== '')
    };
    
    console.log('📤 Sending plan data:', planData);
    createPlanMutation.mutate(planData);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      duration: plan.duration.toString(),
      durationType: plan.durationType,
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      features: plan.features.length > 0 ? plan.features : [''],
      maxProducts: plan.maxProducts?.toString() || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingPlan) return;
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Plan name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.price || isNaN(parseFloat(formData.price))) {
      toast({
        title: "Error",
        description: "Valid price is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.duration || isNaN(parseInt(formData.duration))) {
      toast({
        title: "Error",
        description: "Valid duration is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.durationType) {
      toast({
        title: "Error",
        description: "Duration type is required",
        variant: "destructive",
      });
      return;
    }
    
    const planData = {
      ...formData,
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration),
      maxProducts: formData.maxProducts && !isNaN(parseInt(formData.maxProducts)) ? parseInt(formData.maxProducts) : null,
      features: formData.features.filter(f => f.trim() !== '')
    };
    
    console.log('📤 Updating plan data:', planData);
    updatePlanMutation.mutate({ id: editingPlan.id, planData });
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const handleDelete = (plan: SubscriptionPlan) => {
    setPlanToDelete(plan);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;
    
    console.log('🔍 Confirming delete for plan:', planToDelete);
    console.log('🔍 Plan ID:', planToDelete.id, 'Type:', typeof planToDelete.id);
    
    try {
      // Ensure ID is a valid number
      const planId = parseInt(planToDelete.id.toString());
      if (isNaN(planId)) {
        throw new Error('Invalid plan ID');
      }
      
      console.log('🔍 Parsed plan ID:', planId);
      await deletePlanMutation.mutateAsync(planId);
    } catch (error) {
      console.error('🔍 Error in confirmDelete:', error);
      // Error handling is already done in the mutation
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <MobileNav />
        <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading subscription plans...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <MobileNav />
        <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load subscription plans. Please try again.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <MobileNav />
      <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
              <p className="text-gray-600 mt-1">Manage subscription plans for sellers</p>
            </div>
            
            <div className="flex justify-end mt-6">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Plan
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Subscription Plan</DialogTitle>
                  <DialogDescription>
                    Add a new subscription plan for sellers
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Plan Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Basic Plan"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="999.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      required
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="durationType">Duration Type *</Label>
                    <select
                      id="durationType"
                      value={formData.durationType}
                      onChange={(e) => setFormData(prev => ({ ...prev, durationType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months (Recommended)</option>
                      <option value="years">Years</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Most subscription plans use months (e.g., 1 month, 3 months, 12 months)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="maxProducts">Max Products</Label>
                    <Input
                      id="maxProducts"
                      type="number"
                      value={formData.maxProducts}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxProducts: e.target.value }))}
                      placeholder="-1 for unlimited"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the plan features and benefits"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Features</Label>
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Enter feature"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFeature(index)}
                        disabled={formData.features.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFeature}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPopular"
                      checked={formData.isPopular}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPopular: checked }))}
                    />
                    <Label htmlFor="isPopular">Popular</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={createPlanMutation.isPending}>
                    {createPlanMutation.isPending ? 'Creating...' : 'Create Plan'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans?.map((plan: SubscriptionPlan) => (
              <Card key={plan.id} className="relative">
                {plan.isPopular && (
                  <div className="absolute -top-3 left-4">
                    <Badge className="bg-yellow-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Package className="h-5 w-5 mr-2" />
                        {plan.name}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(plan)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        ₹{plan.price}
                      </div>
                      <div className="text-sm text-gray-600">
                        per {plan.duration} {plan.durationType}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Max Products:</span>
                        <span className="font-medium">
                          {plan.maxProducts === -1 ? 'Unlimited' : plan.maxProducts}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Features:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {plan.features?.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant={plan.isPopular ? "default" : "secondary"}>
                        {plan.isPopular ? 'Popular' : 'Standard'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Subscription Plan</DialogTitle>
                <DialogDescription>
                  Update the subscription plan details
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Plan Name *</Label>
                  <Input
                    id="edit-name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Basic Plan"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-price">Price (₹) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="999.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-duration">Duration *</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    min="1"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-durationType">Duration Type</Label>
                  <select
                    id="edit-durationType"
                    value={formData.durationType}
                    onChange={(e) => setFormData(prev => ({ ...prev, durationType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-maxProducts">Max Products</Label>
                  <Input
                    id="edit-maxProducts"
                    type="number"
                    value={formData.maxProducts}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxProducts: e.target.value }))}
                    placeholder="-1 for unlimited"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the plan features and benefits"
                  rows={3}
                />
              </div>
              <div>
                <Label>Features</Label>
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2 mt-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="Enter feature"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFeature(index)}
                      disabled={formData.features.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFeature}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="edit-isActive">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isPopular"
                    checked={formData.isPopular}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPopular: checked }))}
                  />
                  <Label htmlFor="edit-isPopular">Popular</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={updatePlanMutation.isPending}>
                  {updatePlanMutation.isPending ? 'Updating...' : 'Update Plan'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Subscription Plan</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this subscription plan? This action cannot be undone and will affect any active subscriptions.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {planToDelete && (
                <div className="space-y-4">
                  {/* Plan Header */}
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{planToDelete.name}</div>
                      <div className="text-sm text-gray-600">{planToDelete.description}</div>
                      <div className="text-xs text-gray-400">Plan ID: {planToDelete.id}</div>
                    </div>
                  </div>

                  {/* Plan Information Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Plan Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium">{planToDelete.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Price:</span>
                          <span className="font-medium">₹{planToDelete.price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-medium">{planToDelete.duration} {planToDelete.durationType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Max Products:</span>
                          <span className="font-medium">
                            {planToDelete.maxProducts === -1 ? 'Unlimited' : planToDelete.maxProducts}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium">
                            <Badge variant={planToDelete.isActive ? "default" : "secondary"}>
                              {planToDelete.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Popular:</span>
                          <span className="font-medium">
                            <Badge variant={planToDelete.isPopular ? "default" : "secondary"}>
                              {planToDelete.isPopular ? 'Yes' : 'No'}
                            </Badge>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Timestamps</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created:</span>
                          <span className="font-medium">
                            {new Date(planToDelete.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Updated:</span>
                          <span className="font-medium">
                            {new Date(planToDelete.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  {planToDelete.features && planToDelete.features.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Features</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <ul className="text-sm text-gray-600 space-y-1">
                          {planToDelete.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {planToDelete.description && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Description</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {planToDelete.description}
                      </p>
                    </div>
                  )}
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setPlanToDelete(null);
                }}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deletePlanMutation.isPending}
                >
                  {deletePlanMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Plan
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
} 