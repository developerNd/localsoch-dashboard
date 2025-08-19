import { useState, useEffect } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { getStates, getCitiesByState, getPincodesByCity } from '@/lib/location-service-hybrid';

interface LocationSelectorProps {
  selectedState: string;
  selectedCity: string;
  selectedPincode: string;
  onStateChange: (state: string) => void;
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
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [pincodes, setPincodes] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingPincodes, setLoadingPincodes] = useState(false);

  // Load states on component mount
  useEffect(() => {
    const loadStates = async () => {
      setLoadingStates(true);
      try {
        const statesData = await getStates();
        setStates(statesData);
      } catch (error) {
        console.error('Error loading states:', error);
      } finally {
        setLoadingStates(false);
      }
    };
    loadStates();
  }, []);

  // Update cities when state changes
  useEffect(() => {
    const loadCities = async () => {
      if (selectedState) {
        setLoadingCities(true);
        try {
          const stateCities = await getCitiesByState(selectedState);
          setCities(stateCities);
          // Reset city and pincode when state changes
          if (!stateCities.includes(selectedCity)) {
            onCityChange('');
            onPincodeChange('');
          }
        } catch (error) {
          console.error('Error loading cities:', error);
          setCities([]);
          onCityChange('');
          onPincodeChange('');
        } finally {
          setLoadingCities(false);
        }
      } else {
        setCities([]);
        onCityChange('');
        onPincodeChange('');
      }
    };
    loadCities();
  }, [selectedState]); // Removed onCityChange and onPincodeChange from dependencies

  // Update pincodes when city changes
  useEffect(() => {
    const loadPincodes = async () => {
      if (selectedState && selectedCity) {
        setLoadingPincodes(true);
        try {
          const cityPincodes = await getPincodesByCity(selectedState, selectedCity);
          setPincodes(cityPincodes);
          // Reset pincode when city changes
          if (!cityPincodes.includes(selectedPincode)) {
            onPincodeChange('');
          }
        } catch (error) {
          console.error('Error loading pincodes:', error);
          setPincodes([]);
          onPincodeChange('');
        } finally {
          setLoadingPincodes(false);
        }
      } else {
        setPincodes([]);
        onPincodeChange('');
      }
    };
    loadPincodes();
  }, [selectedState, selectedCity]); // Removed onPincodeChange from dependencies

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SearchableSelect
        value={selectedState}
        onValueChange={onStateChange}
        placeholder="Select state"
        options={states}
        label="State"
        disabled={disabled}
        loading={loadingStates}
        searchPlaceholder="Search states..."
        maxHeight="300px"
      />
      
      <SearchableSelect
        value={selectedCity}
        onValueChange={onCityChange}
        placeholder={!selectedState ? "Select state first" : "Select city"}
        options={cities}
        label="City"
        disabled={disabled || !selectedState || cities.length === 0}
        loading={loadingCities}
        searchPlaceholder="Search cities..."
        maxHeight="300px"
      />
      
      <SearchableSelect
        value={selectedPincode}
        onValueChange={onPincodeChange}
        placeholder={!selectedCity ? "Select city first" : "Select pincode"}
        options={pincodes}
        label="Pincode"
        disabled={disabled || !selectedCity || pincodes.length === 0}
        loading={loadingPincodes}
        searchPlaceholder="Search pincodes..."
        maxHeight="300px"
      />
    </div>
  );
} 