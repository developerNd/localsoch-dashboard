import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { getStates, getDistricts, getCities, getAllCitiesForState, getAllPincodesForCity } from '@/lib/location-api';

interface LocationSelectorProps {
  selectedState: string;
  selectedCity: string;
  selectedPincode: string;
  onStateChange: (stateId: string) => void;
  onCityChange: (city: string) => void;
  onPincodeChange: (pincode: string) => void;
  disabled?: boolean;
}

export function LocationSelector({
  selectedState,
  selectedCity,
  selectedPincode,
  onStateChange,
  onCityChange,
  onPincodeChange,
  disabled = false
}: LocationSelectorProps) {
  const [states, setStates] = useState<{ id: string; name: string }[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [pincodes, setPincodes] = useState<string[]>([]);
  
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingPincodes, setLoadingPincodes] = useState(false);

  // Cache for API responses
  const citiesCache = useRef<Map<string, string[]>>(new Map());
  const pincodesCache = useRef<Map<string, string[]>>(new Map());

  // Memoize callbacks to prevent unnecessary re-renders
  const handleStateChange = useCallback((stateName: string) => {
    console.log('🔍 LocationSelector: handleStateChange called with:', stateName);
    console.log('🔍 LocationSelector: Available states:', states);
    
    const state = states.find(s => s.name === stateName);
    console.log('🔍 LocationSelector: Found state:', state);
    
    if (state) {
      console.log('🔍 LocationSelector: Calling onStateChange with ID:', state.id);
      onStateChange(state.id);
    } else {
      console.log('🔍 LocationSelector: No state found, calling onStateChange with empty string');
      onStateChange('');
    }
  }, [states, onStateChange]);

  const handleCityChange = useCallback((city: string) => {
    onCityChange(city);
  }, [onCityChange]);

  const handlePincodeChange = useCallback((pincode: string) => {
    onPincodeChange(pincode);
  }, [onPincodeChange]);

  // Memoize state name lookup
  const getStateName = useCallback((stateId: string) => {
    const state = states.find(s => s.id === stateId);
    return state ? state.name : '';
  }, [states]);

  // Load states on component mount (only once)
  useEffect(() => {
    const loadStates = async () => {
      if (states.length > 0) return; // Already loaded
      
      setLoadingStates(true);
      try {
        const statesData = await getStates();
        setStates(statesData.map(state => ({ id: state.id, name: state.name })));
      } catch (error) {
        console.error('Error loading states:', error);
      } finally {
        setLoadingStates(false);
      }
    };
    loadStates();
  }, []); // Empty dependency array - only run once

  // Load initial data when component mounts with existing values
  useEffect(() => {
    const loadInitialData = async () => {
      if (!selectedState || states.length === 0) return;
      
      console.log('🔍 LocationSelector: Loading initial data for state:', selectedState);
      
      // Load cities for the selected state
      setLoadingCities(true);
      try {
        const allCities = await getAllCitiesForState(selectedState);
        setCities(allCities);
        citiesCache.current.set(selectedState, allCities);
        
        // If we have a selected city, load its pincodes
        if (selectedCity && allCities.includes(selectedCity)) {
          console.log('🔍 LocationSelector: Loading pincodes for city:', selectedCity);
          setLoadingPincodes(true);
          try {
            const cityPincodes = await getAllPincodesForCity(selectedState, selectedCity);
            setPincodes(cityPincodes);
            pincodesCache.current.set(`${selectedState}-${selectedCity}`, cityPincodes);
          } catch (error) {
            console.error('Error loading initial pincodes:', error);
            setPincodes([]);
          } finally {
            setLoadingPincodes(false);
          }
        }
      } catch (error) {
        console.error('Error loading initial cities:', error);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    
    loadInitialData();
  }, [selectedState, selectedCity, states.length]); // Run when states are loaded and selected values change

  // Update districts when state changes (with reduced API calls)
  useEffect(() => {
    const loadDistricts = async () => {
      if (!selectedState) {
        setDistricts([]);
        setCities([]);
        setPincodes([]);
        return;
      }

      // Only load districts if we don't already have them
      if (districts.length === 0) {
        setLoadingDistricts(true);
        try {
          const stateDistricts = await getDistricts(selectedState);
          setDistricts(stateDistricts.map(district => district.name));
        } catch (error) {
          console.error('Error loading districts:', error);
          setDistricts([]);
        } finally {
          setLoadingDistricts(false);
        }
      }
      
      // Only reset city and pincode if they're not valid for the new state
      // This will be handled by the cities effect
    };
    loadDistricts();
  }, [selectedState]); // Only depend on selectedState

  // Update cities when state changes (with caching)
  useEffect(() => {
    const loadCities = async () => {
      if (!selectedState) {
        setCities([]);
        setPincodes([]);
        return;
      }

      // Check cache first
      const cacheKey = selectedState;
      if (citiesCache.current.has(cacheKey)) {
        const cachedCities = citiesCache.current.get(cacheKey)!;
        setCities(cachedCities);
        
        // Only reset pincode if the current city is not in the new state's cities
        if (selectedPincode && selectedCity && !cachedCities.includes(selectedCity)) {
          onPincodeChange('');
        }
        return;
      }

      setLoadingCities(true);
      try {
        const allCities = await getAllCitiesForState(selectedState);
        setCities(allCities);
        
        // Cache the result
        citiesCache.current.set(cacheKey, allCities);
        
        // Only reset pincode if the current city is not in the new state's cities
        if (selectedPincode && selectedCity && !allCities.includes(selectedCity)) {
          onPincodeChange('');
        }
      } catch (error) {
        console.error('Error loading cities:', error);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    loadCities();
  }, [selectedState]); // Only depend on selectedState

  // Update pincodes when city changes (with caching)
  useEffect(() => {
    const loadPincodes = async () => {
      if (!selectedState || !selectedCity) {
        setPincodes([]);
        return;
      }

      // Check cache first
      const cacheKey = `${selectedState}-${selectedCity}`;
      if (pincodesCache.current.has(cacheKey)) {
        const cachedPincodes = pincodesCache.current.get(cacheKey)!;
        setPincodes(cachedPincodes);
        return;
      }

      setLoadingPincodes(true);
      try {
        const cityPincodes = await getAllPincodesForCity(selectedState, selectedCity);
        setPincodes(cityPincodes);
        
        // Cache the result
        pincodesCache.current.set(cacheKey, cityPincodes);
      } catch (error) {
        console.error('Error loading pincodes:', error);
        setPincodes([]);
      } finally {
        setLoadingPincodes(false);
      }
    };
    loadPincodes();
  }, [selectedState, selectedCity]); // Only depend on selectedState and selectedCity

  // Memoize options to prevent unnecessary re-renders
  const stateOptions = useMemo(() => states.map(s => s.name), [states]);
  const cityOptions = useMemo(() => cities, [cities]);
  const pincodeOptions = useMemo(() => pincodes, [pincodes]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
        <SearchableSelect
          value={getStateName(selectedState)}
          onValueChange={handleStateChange}
          placeholder={loadingStates ? "Loading states..." : "Select state"}
          options={stateOptions}
          disabled={disabled || loadingStates}
          loading={loadingStates}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
        <SearchableSelect
          value={selectedCity}
          onValueChange={handleCityChange}
          placeholder={loadingCities ? "Loading cities..." : "Select city"}
          options={cityOptions}
          disabled={disabled || loadingCities || !selectedState}
          loading={loadingCities}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
        <SearchableSelect
          value={selectedPincode}
          onValueChange={handlePincodeChange}
          placeholder={loadingPincodes ? "Loading pincodes..." : "Select pincode"}
          options={pincodeOptions}
          disabled={disabled || loadingPincodes || !selectedCity}
          loading={loadingPincodes}
        />
      </div>
    </div>
  );
} 