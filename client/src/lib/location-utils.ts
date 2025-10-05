// Utility functions for location-based calculations and operations

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface SellerLocation {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  distance?: number; // Distance in kilometers
  isActive: boolean;
  businessCategory?: string;
  phone?: string;
  email?: string;
  rating?: number;
  reviewCount?: number;
  isOpen?: boolean;
  openingHours?: string;
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

// Convert degrees to radians
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Find nearby sellers within a specified radius
export function findNearbySellers(
  userLocation: LocationCoordinates,
  sellers: SellerLocation[],
  radiusKm: number = 10
): SellerLocation[] {
  return sellers
    .filter(seller => seller.isActive && seller.latitude && seller.longitude)
    .map(seller => ({
      ...seller,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        seller.latitude,
        seller.longitude
      )
    }))
    .filter(seller => seller.distance! <= radiusKm)
    .sort((a, b) => a.distance! - b.distance!);
}

// Get sellers by city/state
export function getSellersByLocation(
  sellers: SellerLocation[],
  city?: string,
  state?: string
): SellerLocation[] {
  return sellers.filter(seller => {
    if (city && seller.city.toLowerCase() !== city.toLowerCase()) {
      return false;
    }
    if (state && seller.state.toLowerCase() !== state.toLowerCase()) {
      return false;
    }
    return seller.isActive;
  });
}

// Format distance for display
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

// Validate coordinates
export function isValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180 &&
    !isNaN(latitude) && !isNaN(longitude)
  );
}

// Get approximate city from coordinates (simplified)
export async function getCityFromCoordinates(
  latitude: number,
  longitude: number
): Promise<{ city: string; state: string; pincode: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      city: data.address?.city || data.address?.town || data.address?.village || '',
      state: data.address?.state || '',
      pincode: data.address?.postcode || ''
    };
  } catch (error) {
    console.error('Error getting city from coordinates:', error);
    return null;
  }
}

// Create a bounding box for search
export function createBoundingBox(
  centerLat: number,
  centerLon: number,
  radiusKm: number
): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  const latDelta = radiusKm / 111; // Approximate km per degree latitude
  const lonDelta = radiusKm / (111 * Math.cos(toRadians(centerLat))); // Adjust for longitude
  
  return {
    north: centerLat + latDelta,
    south: centerLat - latDelta,
    east: centerLon + lonDelta,
    west: centerLon - lonDelta
  };
}

// Check if coordinates are within bounding box
export function isWithinBounds(
  lat: number,
  lon: number,
  bounds: { north: number; south: number; east: number; west: number }
): boolean {
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lon >= bounds.west &&
    lon <= bounds.east
  );
}

// Get distance-based priority for search results
export function getSearchPriority(
  seller: SellerLocation,
  userLocation: LocationCoordinates,
  searchQuery?: string
): number {
  let priority = 0;
  
  // Distance priority (closer = higher priority)
  if (seller.distance !== undefined) {
    priority += Math.max(0, 100 - seller.distance * 10);
  }
  
  // Name match priority
  if (searchQuery && seller.name.toLowerCase().includes(searchQuery.toLowerCase())) {
    priority += 50;
  }
  
  // Business category match (if available)
  if (searchQuery && seller.businessCategory?.toLowerCase().includes(searchQuery.toLowerCase())) {
    priority += 30;
  }
  
  // City match
  if (searchQuery && seller.city.toLowerCase().includes(searchQuery.toLowerCase())) {
    priority += 20;
  }
  
  return priority;
}
