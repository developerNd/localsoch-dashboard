import { getApiUrl } from './config';

export interface LocationState {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface LocationDistrict {
  name: string;
  citiesCount: number;
}

export interface LocationCity {
  name: string;
  pincode: string;
}

export interface LocationSearchResult {
  name: string;
  pincode: string;
  district: string;
}

export interface LocationValidation {
  pincode: string;
  stateId: string;
  stateName: string;
  isValid: boolean;
  city?: string;
  district?: string;
  state?: string;
}

// API base URL for location endpoints
const LOCATION_API_BASE = '/api/location';

/**
 * Get all available states
 */
export const getStates = async (): Promise<LocationState[]> => {
  try {
    const response = await fetch(getApiUrl(`${LOCATION_API_BASE}/states`));
    if (!response.ok) {
      throw new Error(`Failed to fetch states: ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching states:', error);
    throw error;
  }
};

/**
 * Get districts for a specific state
 */
export const getDistricts = async (stateId: string): Promise<LocationDistrict[]> => {
  try {
    const response = await fetch(getApiUrl(`${LOCATION_API_BASE}/states/${stateId}/districts`));
    if (!response.ok) {
      throw new Error(`Failed to fetch districts: ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching districts:', error);
    throw error;
  }
};

/**
 * Get cities for a specific district in a state
 */
export const getCities = async (stateId: string, districtName: string): Promise<LocationCity[]> => {
  try {
    const encodedDistrictName = encodeURIComponent(districtName);
    const response = await fetch(getApiUrl(`${LOCATION_API_BASE}/states/${stateId}/districts/${encodedDistrictName}/cities`));
    if (!response.ok) {
      throw new Error(`Failed to fetch cities: ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw error;
  }
};

/**
 * Search cities in a state
 */
export const searchCities = async (stateId: string, query: string, limit: number = 50): Promise<LocationSearchResult[]> => {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(getApiUrl(`${LOCATION_API_BASE}/states/${stateId}/cities/search?q=${encodedQuery}&limit=${limit}`));
    if (!response.ok) {
      throw new Error(`Failed to search cities: ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error searching cities:', error);
    throw error;
  }
};

/**
 * Get city details by pincode
 */
export const getCityByPincode = async (pincode: string): Promise<{
  pincode: string;
  city: string;
  district: string;
  state: string;
  stateId: string;
} | null> => {
  try {
    const response = await fetch(getApiUrl(`${LOCATION_API_BASE}/pincode/${pincode}`));
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Pincode not found
      }
      throw new Error(`Failed to fetch city by pincode: ${response.status}`);
    }
    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Error fetching city by pincode:', error);
    throw error;
  }
};

/**
 * Validate pincode in a specific state
 */
export const validatePincode = async (stateId: string, pincode: string): Promise<LocationValidation> => {
  try {
    const response = await fetch(getApiUrl(`${LOCATION_API_BASE}/validate/states/${stateId}/pincode/${pincode}`));
    if (!response.ok) {
      throw new Error(`Failed to validate pincode: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error validating pincode:', error);
    throw error;
  }
};

/**
 * Search locations across all states
 */
export const searchLocations = async (query: string): Promise<{
  state: string;
  city: string;
  pincode: string;
}[]> => {
  try {
    // First, get all states
    const states = await getStates();
    const results: { state: string; city: string; pincode: string }[] = [];

    // Search in each state
    for (const state of states) {
      try {
        const cities = await searchCities(state.id, query, 10);
        cities.forEach(city => {
          results.push({
            state: state.name,
            city: city.name,
            pincode: city.pincode
          });
        });
      } catch (error) {
        console.warn(`Error searching in state ${state.name}:`, error);
        // Continue with other states
      }
    }

    return results.slice(0, 20); // Limit total results
  } catch (error) {
    console.error('Error in location search:', error);
    throw error;
  }
};

/**
 * Get all cities for a state (flattened list)
 */
export const getAllCitiesForState = async (stateId: string): Promise<string[]> => {
  try {
    const districts = await getDistricts(stateId);
    const allCities: string[] = [];

    for (const district of districts) {
      try {
        const cities = await getCities(stateId, district.name);
        cities.forEach(city => {
          allCities.push(city.name);
        });
      } catch (error) {
        console.warn(`Error fetching cities for district ${district.name}:`, error);
        // Continue with other districts
      }
    }

    return [...new Set(allCities)]; // Remove duplicates
  } catch (error) {
    console.error('Error fetching all cities for state:', error);
    throw error;
  }
};

/**
 * Get all pincodes for a city in a state
 */
export const getAllPincodesForCity = async (stateId: string, cityName: string): Promise<string[]> => {
  try {
    const districts = await getDistricts(stateId);
    const pincodes: string[] = [];

    for (const district of districts) {
      try {
        const cities = await getCities(stateId, district.name);
        const matchingCities = cities.filter(city => 
          city.name.toLowerCase().includes(cityName.toLowerCase())
        );
        matchingCities.forEach(city => {
          pincodes.push(city.pincode);
        });
      } catch (error) {
        console.warn(`Error fetching pincodes for district ${district.name}:`, error);
        // Continue with other districts
      }
    }

    return [...new Set(pincodes)]; // Remove duplicates
  } catch (error) {
    console.error('Error fetching pincodes for city:', error);
    throw error;
  }
}; 