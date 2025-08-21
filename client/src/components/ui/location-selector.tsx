import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getStates, getDistricts, getCities, getAllCitiesOnlyForState, getAllCitiesForState } from '@/lib/location-api';

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
  
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Cache for API responses
  const citiesCache = useRef<Map<string, string[]>>(new Map());

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
      
      // Load districts for the selected state
      setLoadingCities(true);
      try {
        console.log('🔍 Loading districts for state:', selectedState);
        let allDistricts;
        try {
          allDistricts = await getAllCitiesOnlyForState(selectedState);
        } catch (error) {
          console.log('🔍 New API failed, falling back to old method');
          allDistricts = await getAllCitiesForState(selectedState);
        }
        console.log('🔍 Loaded districts:', allDistricts.length, allDistricts.slice(0, 5));
        setCities(allDistricts);
        citiesCache.current.set(selectedState, allDistricts);
      } catch (error) {
        console.error('Error loading initial districts:', error);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    
    loadInitialData();
  }, [selectedState, states.length]); // Run when states are loaded and selected values change

  // Update districts when state changes (with reduced API calls)
  useEffect(() => {
    const loadDistricts = async () => {
      if (!selectedState) {
        setDistricts([]);
        setCities([]);
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
        console.log('🔍 Loading districts for state (effect):', selectedState);
        let allDistricts;
        try {
          allDistricts = await getAllCitiesOnlyForState(selectedState);
        } catch (error) {
          console.log('🔍 New API failed, falling back to old method');
          allDistricts = await getAllCitiesForState(selectedState);
        }
        console.log('🔍 Loaded districts (effect):', allDistricts.length, allDistricts.slice(0, 5));
        setCities(allDistricts);
        
        // Cache the result
        citiesCache.current.set(cacheKey, allDistricts);
        
        // Only reset pincode if the current city is not in the new state's districts
        if (selectedPincode && selectedCity && !allDistricts.includes(selectedCity)) {
          onPincodeChange('');
        }
      } catch (error) {
        console.error('Error loading districts:', error);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    loadCities();
  }, [selectedState]); // Only depend on selectedState



  // Memoize options to prevent unnecessary re-renders
  const stateOptions = useMemo(() => states.map(s => s.name), [states]);
  const cityOptions = useMemo(() => cities, [cities]);

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
        <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
        <SearchableSelect
          value={selectedCity}
          onValueChange={handleCityChange}
          placeholder={loadingCities ? "Loading districts..." : "Select district"}
          options={cityOptions}
          disabled={disabled || loadingCities || !selectedState}
          loading={loadingCities}
        />
      </div>

      <div>
        <Label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-2">Pincode</Label>
        <Input
          id="pincode"
          type="text"
          value={selectedPincode}
          onChange={(e) => handlePincodeChange(e.target.value)}
          placeholder="Enter pincode"
          disabled={disabled}
          maxLength={6}
          pattern="[0-9]{6}"
        />
      </div>
    </div>
  );
} 