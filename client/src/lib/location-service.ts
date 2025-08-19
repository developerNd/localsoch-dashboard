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
    state: "Arunachal Pradesh",
    cities: [
      { city: "Itanagar", pincodes: ["791111", "791112", "791113", "791114", "791115"] },
      { city: "Naharlagun", pincodes: ["791110", "791111", "791112", "791113", "791114"] }
    ]
  },
  {
    state: "Assam",
    cities: [
      { city: "Guwahati", pincodes: ["781001", "781002", "781003", "781004", "781005"] },
      { city: "Dibrugarh", pincodes: ["786001", "786002", "786003", "786004", "786005"] },
      { city: "Silchar", pincodes: ["788001", "788002", "788003", "788004", "788005"] }
    ]
  },
  {
    state: "Bihar",
    cities: [
      { city: "Patna", pincodes: ["800001", "800002", "800003", "800004", "800005"] },
      { city: "Gaya", pincodes: ["823001", "823002", "823003", "823004", "823005"] },
      { city: "Bhagalpur", pincodes: ["812001", "812002", "812003", "812004", "812005"] }
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
      { city: "Dhamtari", pincodes: ["493773", "493774", "493775", "493776", "493777"] }
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
    state: "Goa",
    cities: [
      { city: "Panaji", pincodes: ["403001", "403002", "403003", "403004", "403005"] },
      { city: "Margao", pincodes: ["403601", "403602", "403603", "403604", "403605"] }
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
    state: "Haryana",
    cities: [
      { city: "Gurgaon", pincodes: ["122001", "122002", "122003", "122004", "122005"] },
      { city: "Faridabad", pincodes: ["121001", "121002", "121003", "121004", "121005"] },
      { city: "Panipat", pincodes: ["132103", "132104", "132105", "132106", "132107"] }
    ]
  },
  {
    state: "Himachal Pradesh",
    cities: [
      { city: "Shimla", pincodes: ["171001", "171002", "171003", "171004", "171005"] },
      { city: "Manali", pincodes: ["175131", "175132", "175133", "175134", "175135"] }
    ]
  },
  {
    state: "Jharkhand",
    cities: [
      { city: "Ranchi", pincodes: ["834001", "834002", "834003", "834004", "834005"] },
      { city: "Jamshedpur", pincodes: ["831001", "831002", "831003", "831004", "831005"] },
      { city: "Dhanbad", pincodes: ["826001", "826002", "826003", "826004", "826005"] }
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
    state: "Kerala",
    cities: [
      { city: "Thiruvananthapuram", pincodes: ["695001", "695002", "695003", "695004", "695005"] },
      { city: "Kochi", pincodes: ["682001", "682002", "682003", "682004", "682005"] },
      { city: "Kozhikode", pincodes: ["673001", "673002", "673003", "673004", "673005"] }
    ]
  },
  {
    state: "Madhya Pradesh",
    cities: [
      { city: "Bhopal", pincodes: ["462001", "462002", "462003", "462004", "462005"] },
      { city: "Indore", pincodes: ["452001", "452002", "452003", "452004", "452005"] },
      { city: "Jabalpur", pincodes: ["482001", "482002", "482003", "482004", "482005"] },
      { city: "Gwalior", pincodes: ["474001", "474002", "474003", "474004", "474005"] }
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
      { city: "Aurangabad", pincodes: ["431001", "431002", "431003", "431004", "431005"] }
    ]
  },
  {
    state: "Manipur",
    cities: [
      { city: "Imphal", pincodes: ["795001", "795002", "795003", "795004", "795005"] }
    ]
  },
  {
    state: "Meghalaya",
    cities: [
      { city: "Shillong", pincodes: ["793001", "793002", "793003", "793004", "793005"] }
    ]
  },
  {
    state: "Mizoram",
    cities: [
      { city: "Aizawl", pincodes: ["796001", "796002", "796003", "796004", "796005"] }
    ]
  },
  {
    state: "Nagaland",
    cities: [
      { city: "Kohima", pincodes: ["797001", "797002", "797003", "797004", "797005"] }
    ]
  },
  {
    state: "Odisha",
    cities: [
      { city: "Bhubaneswar", pincodes: ["751001", "751002", "751003", "751004", "751005"] },
      { city: "Cuttack", pincodes: ["753001", "753002", "753003", "753004", "753005"] },
      { city: "Rourkela", pincodes: ["769001", "769002", "769003", "769004", "769005"] }
    ]
  },
  {
    state: "Punjab",
    cities: [
      { city: "Chandigarh", pincodes: ["160001", "160002", "160003", "160004", "160005"] },
      { city: "Amritsar", pincodes: ["143001", "143002", "143003", "143004", "143005"] },
      { city: "Ludhiana", pincodes: ["141001", "141002", "141003", "141004", "141005"] }
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
    state: "Sikkim",
    cities: [
      { city: "Gangtok", pincodes: ["737101", "737102", "737103", "737104", "737105"] }
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
    state: "Tripura",
    cities: [
      { city: "Agartala", pincodes: ["799001", "799002", "799003", "799004", "799005"] }
    ]
  },
  {
    state: "Uttar Pradesh",
    cities: [
      { city: "Lucknow", pincodes: ["226001", "226002", "226003", "226004", "226005"] },
      { city: "Kanpur", pincodes: ["208001", "208002", "208003", "208004", "208005"] },
      { city: "Varanasi", pincodes: ["221001", "221002", "221003", "221004", "221005"] },
      { city: "Agra", pincodes: ["282001", "282002", "282003", "282004", "282005"] },
      { city: "Prayagraj", pincodes: ["211001", "211002", "211003", "211004", "211005"] }
    ]
  },
  {
    state: "Uttarakhand",
    cities: [
      { city: "Dehradun", pincodes: ["248001", "248002", "248003", "248004", "248005"] },
      { city: "Haridwar", pincodes: ["249401", "249402", "249403", "249404", "249405"] }
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

// API call with timeout and error handling
const apiCall = async (url: string, timeout = 5000): Promise<any> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; LocationService/1.0)'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn(`API call failed for ${url}:`, error);
    return null;
  }
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
  
  // Try to get additional states from API
  try {
    console.log('📍 Fetching additional states from API...');
    const apiData = await apiCall('https://api.postalpincode.in/pincode/110001');
    
    if (apiData && apiData[0] && apiData[0].Status === 'Success' && apiData[0].PostOffice) {
      const apiStates = Array.from(new Set(
        apiData[0].PostOffice.map((office: any) => office.State as string)
      )).sort();
      
      // Merge static and API states
      const allStates = Array.from(new Set([...staticStates, ...apiStates])).sort();
      console.log('📍 Combined states (static + API):', allStates);
      setCachedData(cacheKey, allStates);
      return allStates;
    }
  } catch (error) {
    console.warn('📍 API fallback failed, using static states only');
  }
  
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
  
  // Try API fallback for more cities
  try {
    console.log(`📍 Fetching additional cities for ${state} from API...`);
    const samplePincodes = {
      'Andhra Pradesh': '530001', 'Delhi': '110001', 'Gujarat': '380001',
      'Karnataka': '560001', 'Maharashtra': '400001', 'Tamil Nadu': '600001',
      'Telangana': '500001', 'Uttar Pradesh': '226001', 'West Bengal': '700001',
      'Chhattisgarh': '492001', 'Rajasthan': '302001'
    };
    
    const samplePincode = samplePincodes[state as keyof typeof samplePincodes] || '110001';
    const apiData = await apiCall(`https://api.postalpincode.in/pincode/${samplePincode}`);
    
    if (apiData && apiData[0] && apiData[0].Status === 'Success' && apiData[0].PostOffice) {
      const apiCities = Array.from(new Set(
        apiData[0].PostOffice
          .filter((office: any) => office.State === state)
          .map((office: any) => office.District as string)
      )).sort();
      
      // Merge static and API cities
      const allCities = Array.from(new Set([...staticCities, ...apiCities])).sort();
      console.log(`📍 Combined cities for ${state} (static + API):`, allCities);
      setCachedData(cacheKey, allCities);
      return allCities;
    }
  } catch (error) {
    console.warn(`📍 API fallback failed for ${state}, using static cities only`);
  }
  
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
  
  // Try API fallback for more pincodes
  try {
    console.log(`📍 Fetching additional pincodes for ${city}, ${state} from API...`);
    const apiData = await apiCall(`https://api.postalpincode.in/postoffice/${encodeURIComponent(city)}`);
    
    if (apiData && apiData[0] && apiData[0].Status === 'Success' && apiData[0].PostOffice) {
      const apiPincodes = Array.from(new Set(
        apiData[0].PostOffice
          .filter((office: any) => office.State === state && office.District === city)
          .map((office: any) => office.Pincode as string)
      )).sort();
      
      // Merge static and API pincodes
      const allPincodes = Array.from(new Set([...staticPincodes, ...apiPincodes])).sort();
      console.log(`📍 Combined pincodes for ${city}, ${state} (static + API):`, allPincodes);
      setCachedData(cacheKey, allPincodes);
      return allPincodes;
    }
  } catch (error) {
    console.warn(`📍 API fallback failed for ${city}, ${state}, using static pincodes only`);
  }
  
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
  comprehensiveLocationData.forEach(stateData => {
    if (stateData.state.toLowerCase().includes(query.toLowerCase())) {
      stateData.cities.forEach(cityData => {
        cityData.pincodes.forEach(pincode => {
          results.push({
            state: stateData.state,
            city: cityData.city,
            pincode
          });
        });
      });
    } else {
      stateData.cities.forEach(cityData => {
        if (cityData.city.toLowerCase().includes(query.toLowerCase())) {
          cityData.pincodes.forEach(pincode => {
            results.push({
              state: stateData.state,
              city: cityData.city,
              pincode
            });
          });
        } else {
          cityData.pincodes.forEach(pincode => {
            if (pincode.includes(query)) {
              results.push({
                state: stateData.state,
                city: cityData.city,
                pincode
              });
            }
          });
        }
      });
    }
  });
  
  // Try API fallback for additional results
  try {
    console.log('🔍 Fetching additional results from API...');
    const apiData = await apiCall(`https://api.postalpincode.in/postoffice/${encodeURIComponent(query)}`);
    
    if (apiData && apiData[0] && apiData[0].Status === 'Success' && apiData[0].PostOffice) {
      const apiResults: SearchResult[] = apiData[0].PostOffice
        .slice(0, 10)
        .map((office: any) => ({
          state: office.State,
          city: office.District,
          pincode: office.Pincode
        }));
      
      // Merge static and API results, removing duplicates
      const allResults = [...results, ...apiResults];
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => 
          r.state === result.state && 
          r.city === result.city && 
          r.pincode === result.pincode
        )
      );
      
      const limitedResults = uniqueResults.slice(0, 10);
      console.log('🔍 Combined search results (static + API):', limitedResults);
      setCachedData(cacheKey, limitedResults);
      return limitedResults;
    }
  } catch (error) {
    console.warn('🔍 API fallback failed, using static results only');
  }
  
  // Use static results only
  const limitedResults = results.slice(0, 10);
  console.log('🔍 Static search results:', limitedResults);
  setCachedData(cacheKey, limitedResults);
  return limitedResults;
}; 