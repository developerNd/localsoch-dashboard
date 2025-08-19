import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSellerReviews, useSellerReviewStats, useVendors } from '@/hooks/use-api';
import { getImageUrl } from '@/lib/config';
import { DataTable } from '@/components/ui/data-table';

export default function SellerReviews() {
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const { user } = useAuth();

  // Get vendor ID from user
  const getVendorId = (user: any) => {
    console.log('🔍 Getting vendor ID from user:', user);
    // Try different possible locations for vendor ID
    const vendorId = user?.vendorId || user?.vendor?.id || user?.sellerProfile?.vendorId;
    console.log('🔍 Extracted vendor ID:', vendorId);
    return vendorId;
  };

  const vendorId = getVendorId(user);

  // If no vendor ID from user, try to fetch vendor data
  const { data: vendors } = useVendors();
  const vendor = Array.isArray(vendors) ? vendors.find((v: any) => 
    v.user?.id === user?.id || v.userId === user?.id
  ) : null;
  
  const finalVendorId = vendorId || vendor?.id;

  // Fetch seller-specific reviews and stats
  const { data: reviews, isLoading: reviewsLoading, error: reviewsError } = useSellerReviews(finalVendorId);
  const { data: reviewStats, isLoading: statsLoading, error: statsError } = useSellerReviewStats(finalVendorId);

  // Debug logging
  console.log('🔍 Seller Reviews Debug:', {
    vendorId,
    finalVendorId,
    vendor,
    vendors: vendors?.length || 0,
    reviews: reviews?.length || 0,
    reviewStats,
    reviewsError,
    statsError,
    user: {
      id: user?.id,
      username: user?.username,
      vendorId: user?.vendorId,
      role: typeof user?.role === 'object' ? user?.role?.name : user?.role
    }
  });

  // Test API call directly
  if (finalVendorId) {
    console.log('🔍 Testing direct API call for vendor:', finalVendorId);
    fetch(`http://192.168.1.102:1337/api/reviews/seller/${finalVendorId}?populate=*`)
      .then(res => res.json())
      .then(data => console.log('🔍 Direct API call result:', data))
      .catch(err => console.error('🔍 Direct API call error:', err));
  }

  const isLoading = reviewsLoading || statsLoading;

  // Helper function to normalize review data
  const normalizeReview = (review: any) => {
    if (review.attributes) {
      return {
        id: review.id,
        rating: review.attributes.rating,
        comment: review.attributes.comment,
        customerName: review.attributes.customerName,
        customerEmail: review.attributes.customerEmail,
        isVerified: review.attributes.isVerified,
        isApproved: review.attributes.isApproved,
        createdAt: review.attributes.createdAt,
        order: review.attributes.order?.data || review.attributes.order,
        vendor: review.attributes.vendor?.data || review.attributes.vendor
      };
    }
    return review;
  };

  // Normalize reviews data
  const normalizedReviews = reviews?.map(normalizeReview) || [];

  // Filter reviews by rating
  const filteredReviews = normalizedReviews.filter((review: any) => {
    if (ratingFilter === 'all') return true;
    return review.rating.toString() === ratingFilter;
  });

  // Use stats from API or calculate from reviews
  const averageRating = reviewStats?.averageRating || 
    (normalizedReviews.length > 0 
      ? normalizedReviews.reduce((sum: number, review: any) => sum + review.rating, 0) / normalizedReviews.length 
      : 0);

  const ratingDistribution = reviewStats?.ratingDistribution || {
    5: normalizedReviews.filter((r: any) => r.rating === 5).length || 0,
    4: normalizedReviews.filter((r: any) => r.rating === 4).length || 0,
    3: normalizedReviews.filter((r: any) => r.rating === 3).length || 0,
    2: normalizedReviews.filter((r: any) => r.rating === 2).length || 0,
    1: normalizedReviews.filter((r: any) => r.rating === 1).length || 0,
  };

  const totalReviews = reviewStats?.totalReviews || normalizedReviews.length || 0;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <i
        key={index}
        className={`fas fa-star text-sm ${
          index < rating ? 'text-warning' : 'text-gray-300'
        }`}
      ></i>
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <MobileNav />
      
              <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Seller Reviews & Ratings</h2>
            <p className="text-gray-600">Customer feedback about your shop and service</p>
          </div>
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Rating Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(averageRating))}
                </div>
                <p className="text-sm text-gray-500">
                  Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Rating Distribution */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                  const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  
                  return (
                    <div key={rating} className="flex items-center space-x-3">
                      <span className="text-sm font-medium w-8">{rating}</span>
                      <i className="fas fa-star text-warning text-sm"></i>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-8">
                <i className="fas fa-star text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {ratingFilter === 'all' ? 'No reviews yet' : `No ${ratingFilter}-star reviews`}
                </h3>
                <p className="text-gray-600">
                  {ratingFilter === 'all' 
                    ? "Customer reviews will appear here once you start receiving them."
                    : `No reviews with ${ratingFilter} star${ratingFilter !== '1' ? 's' : ''} rating.`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <DataTable
            data={filteredReviews}
            columns={[
              { key: 'customerName', header: 'Customer', render: (value: any, row: any) => (
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {value?.split(' ').map((n: string) => n[0]).join('') || 'CU'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{value || 'Anonymous'}</span>
                </div>
              ) },
              { key: 'rating', header: 'Rating', render: (value: any) => (
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {renderStars(value)}
                  </div>
                  <span className="text-sm font-medium text-gray-600">{value}/5</span>
                </div>
              ) },
              { key: 'comment', header: 'Comment', render: (value: any) => (
                <div className="max-w-md">
                  <p className="text-sm text-gray-700">{value || 'No comment'}</p>
                </div>
              ) },
              { key: 'createdAt', header: 'Date', render: (value: any) => (
                <div>
                  <div className="text-sm text-gray-600">{new Date(value).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500">{new Date(value).toLocaleTimeString()}</div>
                </div>
              ) },
            ]}
            title={`Shop Reviews (${filteredReviews.length})`}
            searchable={true}
            searchPlaceholder="Search by customer name or comment..."
            searchKeys={['customerName', 'comment']}
            pageSize={10}
            emptyMessage="No reviews found"
          />
        )}
      </main>
    </div>
  );
}
