import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MapLocationSelectorProps {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    pincode: string;
  }) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  disabled?: boolean;
}

export function MapLocationSelector({ 
  onLocationSelect, 
  initialLocation, 
  disabled = false 
}: MapLocationSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    pincode: string;
  } | null>(initialLocation || null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDgdsLMV37MSAxvIscmfV0lozfDAInj188&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setMapLoaded(true);
      };
      script.onerror = () => {
        toast({
          title: "Map Loading Failed",
          description: "Unable to load Google Maps. Please try again or use GPS location instead.",
          variant: "destructive",
        });
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const initializeMap = () => {
      const defaultCenter = initialLocation 
        ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
        : { lat: 20.475675, lng: 82.076705 }; // Default to Chhattisgarh

      const map = new window.google.maps.Map(mapRef.current!, {
        zoom: 15,
        center: defaultCenter,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        zoomControl: true,
        clickableIcons: false,
      });

      mapInstanceRef.current = map;

      // Add click listener to map
      map.addListener('click', (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        // Remove existing marker
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }

        // Add new marker
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: 'Selected Location',
          draggable: true,
        });

        markerRef.current = marker;

        // Reverse geocode the selected location
        reverseGeocodeLocation(lat, lng);
      });

      // If we have an initial location, add a marker
      if (initialLocation) {
        const marker = new window.google.maps.Marker({
          position: { lat: initialLocation.latitude, lng: initialLocation.longitude },
          map: map,
          title: 'Current Location',
          draggable: true,
        });
        markerRef.current = marker;
      }
    };

    // Small delay to ensure map container is ready
    const timer = setTimeout(initializeMap, 100);
    return () => clearTimeout(timer);
  }, [mapLoaded, initialLocation]);

  const reverseGeocodeLocation = async (latitude: number, longitude: number) => {
    setIsLoading(true);
    
    try {
      // Try Google Maps Geocoding API first
      const GOOGLE_API_KEY = 'AIzaSyDgdsLMV37MSAxvIscmfV0lozfDAInj188';
      const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}&language=en&region=in`;
      
      let geocodingSuccess = false;
      
      try {
        const response = await fetch(googleUrl);
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const result = data.results[0];
            const addressComponents = result.address_components;
            
            let address = result.formatted_address || '';
            let city = '';
            let state = '';
            let pincode = '';
            
            addressComponents.forEach((component: any) => {
              const types = component.types;
              if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                city = component.long_name;
              } else if (types.includes('administrative_area_level_1')) {
                state = component.long_name;
              } else if (types.includes('postal_code')) {
                pincode = component.long_name;
              }
            });
            
            const locationData = {
              latitude,
              longitude,
              address,
              city,
              state,
              pincode
            };
            
            setSelectedLocation(locationData);
            onLocationSelect(locationData);
            
            toast({
              title: "Location Selected!",
              description: `Address: ${address}`,
            });
            
            geocodingSuccess = true;
          }
        }
      } catch (error) {
        console.log('Google Maps API failed, trying OpenStreetMap:', error);
      }
      
      // Fallback to OpenStreetMap if Google Maps failed
      if (!geocodingSuccess) {
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
            
            const address = data.display_name || '';
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.hamlet || '';
            const state = data.address?.state || '';
            const pincode = data.address?.postcode || '';
            
            const locationData = {
              latitude,
              longitude,
              address,
              city,
              state,
              pincode
            };
            
            setSelectedLocation(locationData);
            onLocationSelect(locationData);
            
            toast({
              title: "Location Selected!",
              description: `Address: ${address}`,
            });
            
            geocodingSuccess = true;
          }
        } catch (error) {
          console.error('OpenStreetMap geocoding failed:', error);
        }
      }
      
      // If both geocoding services failed, still save coordinates
      if (!geocodingSuccess) {
        const locationData = {
          latitude,
          longitude,
          address: `GPS Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`,
          city: '',
          state: '',
          pincode: ''
        };
        
        setSelectedLocation(locationData);
        onLocationSelect(locationData);
        
        toast({
          title: "Location Selected",
          description: "Coordinates saved, but address lookup failed.",
        });
      }
    } catch (error) {
      console.error('Location selection failed:', error);
      toast({
        title: "Location Selection Failed",
        description: "Unable to get address for selected location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      toast({
        title: "Location Confirmed!",
        description: "Location has been saved successfully.",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Select Location on Map
        </CardTitle>
        <p className="text-sm text-gray-600">
          Click anywhere on the map to select your location. The address will be automatically detected.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Map Container */}
          <div 
            ref={mapRef}
            className="w-full h-64 border rounded-lg bg-gray-100"
            style={{ minHeight: '256px' }}
          >
            {!mapLoaded && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
          </div>

          {/* Selected Location Info */}
          {selectedLocation && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center mt-0.5">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Location Selected</p>
                  <p className="text-xs text-green-600 mt-1">
                    <strong>Address:</strong> {selectedLocation.address}
                  </p>
                  {selectedLocation.city && (
                    <p className="text-xs text-green-600">
                      <strong>City:</strong> {selectedLocation.city}
                    </p>
                  )}
                  {selectedLocation.state && (
                    <p className="text-xs text-green-600">
                      <strong>State:</strong> {selectedLocation.state}
                    </p>
                  )}
                  {selectedLocation.pincode && (
                    <p className="text-xs text-green-600">
                      <strong>Pincode:</strong> {selectedLocation.pincode}
                    </p>
                  )}
                  <p className="text-xs text-green-600">
                    <strong>Coordinates:</strong> {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleConfirmLocation}
              disabled={!selectedLocation || isLoading || disabled}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Location
                </>
              )}
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Click anywhere on the map to select your location</p>
            <p>• The marker can be dragged to fine-tune your selection</p>
            <p>• Address will be automatically detected and filled</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
