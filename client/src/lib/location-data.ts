// Indian States, Cities, and Pincodes Data
export interface LocationData {
  state: string;
  cities: {
    city: string;
    pincodes: string[];
  }[];
}

export const locationData: LocationData[] = [
  {
    state: "Andhra Pradesh",
    cities: [
      {
        city: "Visakhapatnam",
        pincodes: ["530001", "530002", "530003", "530004", "530005"]
      },
      {
        city: "Vijayawada",
        pincodes: ["520001", "520002", "520003", "520004", "520005"]
      },
      {
        city: "Guntur",
        pincodes: ["522001", "522002", "522003", "522004", "522005"]
      }
    ]
  },
  {
    state: "Delhi",
    cities: [
      {
        city: "New Delhi",
        pincodes: ["110001", "110002", "110003", "110004", "110005"]
      },
      {
        city: "Delhi",
        pincodes: ["110006", "110007", "110008", "110009", "110010"]
      }
    ]
  },
  {
    state: "Gujarat",
    cities: [
      {
        city: "Ahmedabad",
        pincodes: ["380001", "380002", "380003", "380004", "380005"]
      },
      {
        city: "Surat",
        pincodes: ["395001", "395002", "395003", "395004", "395005"]
      },
      {
        city: "Vadodara",
        pincodes: ["390001", "390002", "390003", "390004", "390005"]
      }
    ]
  },
  {
    state: "Karnataka",
    cities: [
      {
        city: "Bangalore",
        pincodes: ["560001", "560002", "560003", "560004", "560005"]
      },
      {
        city: "Mysore",
        pincodes: ["570001", "570002", "570003", "570004", "570005"]
      },
      {
        city: "Mangalore",
        pincodes: ["575001", "575002", "575003", "575004", "575005"]
      }
    ]
  },
  {
    state: "Maharashtra",
    cities: [
      {
        city: "Mumbai",
        pincodes: ["400001", "400002", "400003", "400004", "400005"]
      },
      {
        city: "Pune",
        pincodes: ["411001", "411002", "411003", "411004", "411005"]
      },
      {
        city: "Nagpur",
        pincodes: ["440001", "440002", "440003", "440004", "440005"]
      },
      {
        city: "Thane",
        pincodes: ["400601", "400602", "400603", "400604", "400605"]
      }
    ]
  },
  {
    state: "Tamil Nadu",
    cities: [
      {
        city: "Chennai",
        pincodes: ["600001", "600002", "600003", "600004", "600005"]
      },
      {
        city: "Coimbatore",
        pincodes: ["641001", "641002", "641003", "641004", "641005"]
      },
      {
        city: "Madurai",
        pincodes: ["625001", "625002", "625003", "625004", "625005"]
      }
    ]
  },
  {
    state: "Telangana",
    cities: [
      {
        city: "Hyderabad",
        pincodes: ["500001", "500002", "500003", "500004", "500005"]
      },
      {
        city: "Warangal",
        pincodes: ["506001", "506002", "506003", "506004", "506005"]
      }
    ]
  },
  {
    state: "Uttar Pradesh",
    cities: [
      {
        city: "Lucknow",
        pincodes: ["226001", "226002", "226003", "226004", "226005"]
      },
      {
        city: "Kanpur",
        pincodes: ["208001", "208002", "208003", "208004", "208005"]
      },
      {
        city: "Varanasi",
        pincodes: ["221001", "221002", "221003", "221004", "221005"]
      }
    ]
  },
  {
    state: "West Bengal",
    cities: [
      {
        city: "Kolkata",
        pincodes: ["700001", "700002", "700003", "700004", "700005"]
      },
      {
        city: "Howrah",
        pincodes: ["711101", "711102", "711103", "711104", "711105"]
      }
    ]
  }
];

// Helper functions
export const getStates = (): string[] => {
  return locationData.map(item => item.state).sort();
};

export const getCitiesByState = (state: string): string[] => {
  const stateData = locationData.find(item => item.state === state);
  return stateData ? stateData.cities.map(city => city.city).sort() : [];
};

export const getPincodesByCity = (state: string, city: string): string[] => {
  const stateData = locationData.find(item => item.state === state);
  if (!stateData) return [];
  
  const cityData = stateData.cities.find(c => c.city === city);
  return cityData ? cityData.pincodes.sort() : [];
};

export const searchLocations = (query: string): { state: string; city: string; pincode: string }[] => {
  const results: { state: string; city: string; pincode: string }[] = [];
  
  locationData.forEach(stateData => {
    stateData.cities.forEach(cityData => {
      cityData.pincodes.forEach(pincode => {
        if (
          stateData.state.toLowerCase().includes(query.toLowerCase()) ||
          cityData.city.toLowerCase().includes(query.toLowerCase()) ||
          pincode.includes(query)
        ) {
          results.push({
            state: stateData.state,
            city: cityData.city,
            pincode
          });
        }
      });
    });
  });
  
  return results.slice(0, 10); // Limit to 10 results
}; 