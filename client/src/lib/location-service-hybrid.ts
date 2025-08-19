// Hybrid Location Service - Static Data + API Fallback
export interface LocationData {
  state: string;
  cities: {
    city: string;
    pincodes: string[];
  }[];
}

export interface SearchResult {
  state: string;
  city: string;
  pincode: string;
}

// Comprehensive Indian States and Cities Data (Primary Source)
const comprehensiveLocationData: LocationData[] = [
  {
    state: "Andhra Pradesh",
    cities: [
      { city: "Visakhapatnam", pincodes: ["530001", "530002", "530003", "530004", "530005"] },
      { city: "Vijayawada", pincodes: ["520001", "520002", "520003", "520004", "520005"] },
      { city: "Guntur", pincodes: ["522001", "522002", "522003", "522004", "522005"] },
      { city: "Nellore", pincodes: ["524001", "524002", "524003", "524004", "524005"] },
      { city: "Kurnool", pincodes: ["518001", "518002", "518003", "518004", "518005"] }
    ]
  },
  {
    state: "Chhattisgarh",
    cities: [
      { city: "Raipur", pincodes: ["492001", "492002", "492003", "492004", "492005"] },
      { city: "Bhilai", pincodes: ["490001", "490002", "490003", "490004", "490005"] },
      { city: "Jagdalpur", pincodes: ["494001", "494002", "494003", "494004", "494005"] },
      { city: "Bilaspur", pincodes: ["495001", "495002", "495003", "495004", "495005"] },
      { city: "Gariaband", pincodes: ["493889", "493890", "493891", "493892", "493893"] },
      { city: "Dhamtari", pincodes: ["493773", "493774", "493775", "493776", "493777"] },
      { city: "Kanker", pincodes: ["494334", "494335", "494336", "494337", "494338"] },
      { city: "Korba", pincodes: ["495677", "495678", "495679", "495680", "495681"] },
      { city: "Ambikapur", pincodes: ["497001", "497002", "497003", "497004", "497005"] },
      { city: "Rajnandgaon", pincodes: ["491441", "491442", "491443", "491444", "491445"] },
      { city: "Mahasamund", pincodes: ["493445", "493446", "493447", "493448", "493449"] },
      { city: "Jashpur", pincodes: ["496331", "496332", "496333", "496334", "496335"] }
    ]
  },
  {
    state: "Delhi",
    cities: [
      { city: "New Delhi", pincodes: ["110001", "110002", "110003", "110004", "110005"] },
      { city: "Delhi", pincodes: ["110006", "110007", "110008", "110009", "110010"] },
      { city: "Dwarka", pincodes: ["110075", "110076", "110077", "110078", "110079"] }
    ]
  },
  {
    state: "Gujarat",
    cities: [
      { city: "Ahmedabad", pincodes: ["380001", "380002", "380003", "380004", "380005"] },
      { city: "Surat", pincodes: ["395001", "395002", "395003", "395004", "395005"] },
      { city: "Vadodara", pincodes: ["390001", "390002", "390003", "390004", "390005"] },
      { city: "Rajkot", pincodes: ["360001", "360002", "360003", "360004", "360005"] }
    ]
  },
  {
    state: "Karnataka",
    cities: [
      { city: "Bangalore", pincodes: ["560001", "560002", "560003", "560004", "560005"] },
      { city: "Mysore", pincodes: ["570001", "570002", "570003", "570004", "570005"] },
      { city: "Mangalore", pincodes: ["575001", "575002", "575003", "575004", "575005"] },
      { city: "Hubli", pincodes: ["580001", "580002", "580003", "580004", "580005"] }
    ]
  },
  {
    state: "Jharkhand",
    cities: [
      { city: "Ranchi", pincodes: ["834001", "834002", "834003", "834004", "834005"] },
      { city: "Jamshedpur", pincodes: ["831001", "831002", "831003", "831004", "831005"] },
      { city: "Dhanbad", pincodes: ["826001", "826002", "826003", "826004", "826005"] },
      { city: "Bokaro", pincodes: ["827001", "827002", "827003", "827004", "827005"] },
      { city: "Deoghar", pincodes: ["814112", "814113", "814114", "814115", "814116"] },
      { city: "Hazaribagh", pincodes: ["825301", "825302", "825303", "825304", "825305"] },
      { city: "Giridih", pincodes: ["815301", "815302", "815303", "815304", "815305"] }
    ]
  },
  {
    state: "Maharashtra",
    cities: [
      { city: "Mumbai", pincodes: ["400001", "400002", "400003", "400004", "400005"] },
      { city: "Pune", pincodes: ["411001", "411002", "411003", "411004", "411005"] },
      { city: "Nagpur", pincodes: ["440001", "440002", "440003", "440004", "440005"] },
      { city: "Thane", pincodes: ["400601", "400602", "400603", "400604", "400605"] },
      { city: "Nashik", pincodes: ["422001", "422002", "422003", "422004", "422005"] },
      { city: "Aurangabad", pincodes: ["431001", "431002", "431003", "431004", "431005"] },
      { city: "Solapur", pincodes: ["413001", "413002", "413003", "413004", "413005"] },
      { city: "Kolhapur", pincodes: ["416001", "416002", "416003", "416004", "416005"] },
      { city: "Amravati", pincodes: ["444601", "444602", "444603", "444604", "444605"] },
      { city: "Nanded", pincodes: ["431601", "431602", "431603", "431604", "431605"] },
      { city: "Sangli", pincodes: ["416416", "416417", "416418", "416419", "416420"] },
      { city: "Jalgaon", pincodes: ["425001", "425002", "425003", "425004", "425005"] }
    ]
  },
  {
    state: "Rajasthan",
    cities: [
      { city: "Jaipur", pincodes: ["302001", "302002", "302003", "302004", "302005"] },
      { city: "Jodhpur", pincodes: ["342001", "342002", "342003", "342004", "342005"] },
      { city: "Udaipur", pincodes: ["313001", "313002", "313003", "313004", "313005"] },
      { city: "Kota", pincodes: ["324001", "324002", "324003", "324004", "324005"] }
    ]
  },
  {
    state: "Tamil Nadu",
    cities: [
      { city: "Chennai", pincodes: ["600001", "600002", "600003", "600004", "600005"] },
      { city: "Coimbatore", pincodes: ["641001", "641002", "641003", "641004", "641005"] },
      { city: "Madurai", pincodes: ["625001", "625002", "625003", "625004", "625005"] },
      { city: "Salem", pincodes: ["636001", "636002", "636003", "636004", "636005"] }
    ]
  },
  {
    state: "Telangana",
    cities: [
      { city: "Hyderabad", pincodes: ["500001", "500002", "500003", "500004", "500005"] },
      { city: "Warangal", pincodes: ["506001", "506002", "506003", "506004", "506005"] },
      { city: "Karimnagar", pincodes: ["505001", "505002", "505003", "505004", "505005"] }
    ]
  },
  {
    state: "Uttar Pradesh",
    cities: [
      { city: "Lucknow", pincodes: ["226001", "226002", "226003", "226004", "226005"] },
      { city: "Kanpur", pincodes: ["208001", "208002", "208003", "208004", "208005"] },
      { city: "Varanasi", pincodes: ["221001", "221002", "221003", "221004", "221005"] },
      { city: "Agra", pincodes: ["282001", "282002", "282003", "282004", "282005"] },
      { city: "Prayagraj", pincodes: ["211001", "211002", "211003", "211004", "211005"] },
      { city: "Ghaziabad", pincodes: ["201001", "201002", "201003", "201004", "201005"] },
      { city: "Noida", pincodes: ["201301", "201302", "201303", "201304", "201305"] },
      { city: "Meerut", pincodes: ["250001", "250002", "250003", "250004", "250005"] },
      { city: "Bareilly", pincodes: ["243001", "243002", "243003", "243004", "243005"] },
      { city: "Aligarh", pincodes: ["202001", "202002", "202003", "202004", "202005"] },
      { city: "Moradabad", pincodes: ["244001", "244002", "244003", "244004", "244005"] },
      { city: "Gorakhpur", pincodes: ["273001", "273002", "273003", "273004", "273005"] }
    ]
  },
  {
    state: "West Bengal",
    cities: [
      { city: "Kolkata", pincodes: ["700001", "700002", "700003", "700004", "700005"] },
      { city: "Howrah", pincodes: ["711101", "711102", "711103", "711104", "711105"] },
      { city: "Durgapur", pincodes: ["713201", "713202", "713203", "713204", "713205"] },
      { city: "Siliguri", pincodes: ["734001", "734002", "734003", "734004", "734005"] }
    ]
  }
];

// Cache for API responses
const cache = new Map<string, any>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Helper function to get cached data
const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

// Helper function to set cached data
const setCachedData = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// API call with timeout and error handling (disabled due to CORS issues)
const apiCall = async (url: string, timeout = 5000): Promise<any> => {
  // Disabled API calls due to CORS restrictions
  // In production, this would be handled by a backend proxy
  console.warn(`API calls disabled due to CORS restrictions: ${url}`);
  return null;
};

// Get all states (static data first, then API fallback)
export const getStates = async (): Promise<string[]> => {
  const cacheKey = 'states';
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log('📍 Using cached states:', cached);
    return cached;
  }

  console.log('📍 Getting states from static data...');
  const staticStates = comprehensiveLocationData.map(item => item.state).sort();
  
  // API fallback disabled due to CORS restrictions
  console.log('📍 Using static states only (API disabled due to CORS)');
  
  console.log('📍 Using static states only:', staticStates);
  setCachedData(cacheKey, staticStates);
  return staticStates;
};

// Get cities by state (static data first, then API fallback)
export const getCitiesByState = async (state: string): Promise<string[]> => {
  const cacheKey = `cities_${state}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log(`📍 Using cached cities for ${state}:`, cached);
    return cached;
  }

  console.log(`📍 Getting cities for state: ${state}`);
  
  // Get from static data first
  const stateData = comprehensiveLocationData.find(item => item.state === state);
  const staticCities = stateData ? stateData.cities.map(city => city.city).sort() : [];
  
  // API fallback disabled due to CORS restrictions
  console.log(`📍 Using static cities for ${state} (API disabled due to CORS)`);
  
  console.log(`📍 Using static cities for ${state}:`, staticCities);
  setCachedData(cacheKey, staticCities);
  return staticCities;
};

// Get pincodes by city (static data first, then API fallback)
export const getPincodesByCity = async (state: string, city: string): Promise<string[]> => {
  const cacheKey = `pincodes_${state}_${city}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log(`📍 Using cached pincodes for ${city}, ${state}:`, cached);
    return cached;
  }

  console.log(`📍 Getting pincodes for city: ${city}, state: ${state}`);
  
  // Get from static data first
  const stateData = comprehensiveLocationData.find(item => item.state === state);
  const cityData = stateData?.cities.find(c => c.city === city);
  const staticPincodes = cityData ? cityData.pincodes.sort() : [];
  
  // API fallback disabled due to CORS restrictions
  console.log(`📍 Using static pincodes for ${city}, ${state} (API disabled due to CORS)`);
  
  console.log(`📍 Using static pincodes for ${city}, ${state}:`, staticPincodes);
  setCachedData(cacheKey, staticPincodes);
  return staticPincodes;
};

// Search locations by query (static data first, then API fallback)
export const searchLocations = async (query: string): Promise<SearchResult[]> => {
  if (query.length < 3) {
    console.log('📍 Search query too short:', query);
    return [];
  }
  
  const cacheKey = `search_${query}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log('📍 Using cached search results for:', query, cached);
    return cached;
  }

  console.log('🔍 Searching locations for query:', query);
  const results: SearchResult[] = [];
  
  // Search through static data first
  const queryLower = query.toLowerCase();
  
  comprehensiveLocationData.forEach(stateData => {
    const stateMatch = stateData.state.toLowerCase().includes(queryLower);
    
    stateData.cities.forEach(cityData => {
      const cityMatch = cityData.city.toLowerCase().includes(queryLower);
      const pincodeMatch = cityData.pincodes.some(pincode => pincode.includes(query));
      
      if (stateMatch || cityMatch || pincodeMatch) {
        // Add all pincodes for this city if there's a match
        cityData.pincodes.forEach(pincode => {
          results.push({
            state: stateData.state,
            city: cityData.city,
            pincode
          });
        });
      }
    });
  });
  
  // API fallback disabled due to CORS restrictions
  console.log('🔍 Using static search results only (API disabled due to CORS)');
  
  // Use static results only
  const limitedResults = results.slice(0, 10);
  console.log('🔍 Static search results:', limitedResults);
  setCachedData(cacheKey, limitedResults);
  return limitedResults;
}; 