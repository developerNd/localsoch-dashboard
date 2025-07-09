import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useState } from 'react';

export default function SellerReviews() {
  const [ratingFilter, setRatingFilter] = useState<string>('all');

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['/api/reviews'],
  });

  const filteredReviews = reviews?.filter((review: any) => {
    if (ratingFilter === 'all') return true;
    return review.rating.toString() === ratingFilter;
  }) || [];

  const averageRating = reviews?.length > 0 
    ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingDistribution = {
    5: reviews?.filter((r: any) => r.rating === 5).length || 0,
    4: reviews?.filter((r: any) => r.rating === 4).length || 0,
    3: reviews?.filter((r: any) => r.rating === 3).length || 0,
    2: reviews?.filter((r: any) => r.rating === 2).length || 0,
    1: reviews?.filter((r: any) => r.rating === 1).length || 0,
  };

  const totalReviews = reviews?.length || 0;

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
      
      <main className="flex-1 lg:ml-64 pt-16 p-4 lg:p-8 pb-20 lg:pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h2>
            <p className="text-gray-600">Customer feedback and product ratings</p>
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
                          className="bg-warning h-2 rounded-full"
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
        <Card>
          <CardHeader>
            <CardTitle>Customer Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredReviews.length === 0 ? (
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
            ) : (
              <div className="space-y-6">
                {filteredReviews.map((review: any) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {review.customerName.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{review.customerName}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex">
                                {renderStars(review.rating)}
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline">
                            Verified Purchase
                          </Badge>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex items-center space-x-2 mb-2">
                            {review.product?.images?.[0] ? (
                              <img 
                                src={review.product.images[0]} 
                                alt={review.product.name}
                                className="w-8 h-8 rounded object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                <i className="fas fa-image text-gray-400 text-xs"></i>
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-700">
                              {review.product?.name}
                            </span>
                          </div>
                        </div>
                        
                        {review.comment && (
                          <p className="text-gray-700 leading-relaxed">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
