import { API_CONFIG } from './config';

export interface ReverseGeocodeResult {
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

// Helper function to check if address contains a Plus Code
function isPlusCode(address: string): boolean {
  return /[A-Z0-9]{2,}\+[A-Z0-9]{2,}/i.test(address);
}

// Helper function to extract Plus Code from address
function extractPlusCode(address: string): string | null {
  const match = address.match(/([A-Z0-9]{2,}\+[A-Z0-9]{2,})/i);
  return match ? match[1] : null;
}

// Helper function to construct address from components
function constructAddressFromComponents(components: any[]): string {
  const parts: string[] = [];
  
  let streetNumber = '';
  let route = '';
  let sublocalityLevel2 = '';
  let sublocalityLevel1 = '';
  let sublocality = '';
  let locality = '';
  let administrativeArea2 = '';
  let administrativeArea1 = '';
  let postalCode = '';
  
  components.forEach((component: any) => {
    const types = component.types;
    if (types.includes('street_number')) {
      streetNumber = component.long_name;
    } else if (types.includes('route')) {
      route = component.long_name;
    } else if (types.includes('sublocality_level_2')) {
      sublocalityLevel2 = component.long_name;
    } else if (types.includes('sublocality_level_1')) {
      sublocalityLevel1 = component.long_name;
    } else if (types.includes('sublocality') || types.includes('neighborhood')) {
      sublocality = component.long_name;
    } else if (types.includes('locality')) {
      locality = component.long_name;
    } else if (types.includes('administrative_area_level_2')) {
      administrativeArea2 = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      administrativeArea1 = component.long_name;
    } else if (types.includes('postal_code')) {
      postalCode = component.long_name;
    }
  });
  
  // Build address in order: street, area, city, state, pincode
  if (streetNumber && route) {
    parts.push(`${streetNumber} ${route}`);
  } else if (route) {
    parts.push(route);
  }
  
  if (sublocalityLevel2) {
    parts.push(sublocalityLevel2);
  } else if (sublocalityLevel1) {
    parts.push(sublocalityLevel1);
  } else if (sublocality) {
    parts.push(sublocality);
  }
  
  if (locality) {
    parts.push(locality);
  } else if (administrativeArea2) {
    parts.push(administrativeArea2);
  }
  
  if (administrativeArea1) {
    parts.push(administrativeArea1);
  }
  
  if (postalCode) {
    parts.push(postalCode);
  }
  
  return parts.join(', ') || '';
}

// Parse Google Maps API response
function parseGoogleMapsResponse(data: any, latitude: number, longitude: number): ReverseGeocodeResult | null {
  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    return null;
  }

  // Find the best result - prefer ones with more address components
  let bestResult = data.results[0];
  for (const res of data.results) {
    const compCount = res.address_components?.length || 0;
    const bestCompCount = bestResult.address_components?.length || 0;
    if (compCount > bestCompCount && !isPlusCode(res.formatted_address || '')) {
      bestResult = res;
    }
  }

  const result = bestResult;
  const addressComponents = result.address_components || [];
  const formattedAddress = result.formatted_address || '';
  const hasPlusCode = isPlusCode(formattedAddress);
  const plusCode = extractPlusCode(formattedAddress);

  // Extract components from all results (check all for pincode)
  let streetNumber = '';
  let route = '';
  let sublocality = '';
  let sublocalityLevel1 = '';
  let sublocalityLevel2 = '';
  let locality = '';
  let administrativeArea2 = '';
  let administrativeArea1 = '';
  let pincode = '';

  // Check all results for pincode
  for (const res of data.results) {
    if (res.address_components) {
      res.address_components.forEach((component: any) => {
        const types = component.types;
        if (types.includes('postal_code') && !pincode) {
          pincode = component.long_name;
        }
      });
    }
  }

  // Extract other components from best result
  addressComponents.forEach((component: any) => {
    const types = component.types;
    if (types.includes('street_number')) {
      streetNumber = component.long_name;
    } else if (types.includes('route')) {
      route = component.long_name;
    } else if (types.includes('sublocality_level_2')) {
      sublocalityLevel2 = component.long_name;
    } else if (types.includes('sublocality_level_1')) {
      sublocalityLevel1 = component.long_name;
    } else if (types.includes('sublocality') || types.includes('neighborhood')) {
      sublocality = component.long_name;
    } else if (types.includes('locality')) {
      locality = component.long_name;
    } else if (types.includes('administrative_area_level_2')) {
      administrativeArea2 = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      administrativeArea1 = component.long_name;
    }
  });

  // Determine city (prefer locality, then administrative_area_level_2, then sublocality)
  let city = locality || administrativeArea2 || sublocalityLevel1 || sublocalityLevel2 || sublocality || '';
  let state = administrativeArea1 || '';

  // Construct address from components
  const constructedAddress = constructAddressFromComponents(addressComponents);

  // Determine final address
  let address = '';
  if (hasPlusCode) {
    if (constructedAddress) {
      address = constructedAddress;
      if (plusCode && city) {
        address += ` (${plusCode})`;
      }
    } else {
      const parts: string[] = [];
      if (sublocalityLevel2) parts.push(sublocalityLevel2);
      else if (sublocalityLevel1) parts.push(sublocalityLevel1);
      else if (sublocality) parts.push(sublocality);
      if (city) parts.push(city);
      if (state) parts.push(state);
      if (pincode) parts.push(pincode);

      if (parts.length > 0) {
        address = parts.join(', ');
        if (plusCode) {
          address += ` (${plusCode})`;
        }
      } else {
        address = formattedAddress;
      }
    }
  } else {
    if (formattedAddress && formattedAddress.length > 10) {
      address = formattedAddress;
    } else if (constructedAddress) {
      address = constructedAddress;
    } else {
      const parts: string[] = [];
      if (streetNumber && route) parts.push(`${streetNumber} ${route}`);
      else if (route) parts.push(route);
      if (sublocality) parts.push(sublocality);
      if (city) parts.push(city);
      if (state) parts.push(state);
      if (pincode) parts.push(pincode);
      address = parts.join(', ') || formattedAddress;
    }
  }

  // Fallback: extract city from address if still missing
  if (!city && address) {
    const addressParts = address.split(',').map((s: string) => s.trim());
    for (let i = 1; i < Math.min(addressParts.length - 1, 3); i++) {
      const part = addressParts[i];
      if (!part.includes('India') && !part.includes('State') && part.length > 2) {
        city = part;
        break;
      }
    }
  }

  return {
    address,
    city,
    state,
    pincode,
    latitude,
    longitude
  };
}

// Parse OpenStreetMap response
function parseOpenStreetMapResponse(data: any, latitude: number, longitude: number): ReverseGeocodeResult | null {
  const address = data.display_name || '';
  let city = data.address?.city || data.address?.town || data.address?.village || data.address?.hamlet || data.address?.county || '';
  const state = data.address?.state || '';
  let pincode = data.address?.postcode || '';

  // If city is still empty, try to extract from address string
  if (!city && address) {
    const addressParts = address.split(',').map((s: string) => s.trim());
    for (let i = 1; i < Math.min(addressParts.length - 2, 4); i++) {
      const part = addressParts[i];
      if (!part.includes('India') && 
          !part.match(/^\d{6}$/) && 
          part.length > 2 &&
          !part.toLowerCase().includes('tahsil') &&
          !part.toLowerCase().includes('district')) {
        city = part;
        break;
      }
    }
  }

  // If pincode is empty, try to extract from address string
  if (!pincode && address) {
    const pincodeMatch = address.match(/\b\d{6}\b/);
    if (pincodeMatch) {
      pincode = pincodeMatch[0];
    }
  }

  return {
    address,
    city,
    state,
    pincode,
    latitude,
    longitude
  };
}

/**
 * Reverse geocode coordinates to get address information
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Promise with address data or null if geocoding fails
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  try {
    // Try Google Maps API first
    const GOOGLE_API_KEY = API_CONFIG.GOOGLE_MAPS_API_KEY;
    
    if (GOOGLE_API_KEY) {
      try {
        const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}&language=en&region=in`;
        const response = await fetch(googleUrl);
        
        if (response.ok) {
          const data = await response.json();
          
          // Check for API errors
          if (data.status === 'REQUEST_DENIED' || data.status === 'INVALID_REQUEST') {
            console.warn('⚠️ Google Maps API Error:', data.error_message || data.status);
            // Fall through to OpenStreetMap
          } else {
            const result = parseGoogleMapsResponse(data, latitude, longitude);
            if (result) {
              return result;
            }
          }
        }
      } catch (error) {
        console.log('Google Maps API failed, trying OpenStreetMap:', error);
      }
    }

    // Fallback to OpenStreetMap
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'LocalVendorHub/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const result = parseOpenStreetMapResponse(data, latitude, longitude);
        if (result) {
          return result;
        }
      }
    } catch (error) {
      console.error('OpenStreetMap geocoding failed:', error);
    }

    // If both fail, return coordinates only
    return {
      address: `GPS Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`,
      city: '',
      state: '',
      pincode: '',
      latitude,
      longitude
    };
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
}

