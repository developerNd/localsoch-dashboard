import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Navigation, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { API_CONFIG } from '@/lib/config';

interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface GPSLocationSelectorProps {
  onLocationChange: (location: LocationCoordinates) => void;
  onAddressChange?: (address: string) => void;
  disabled?: boolean;
  showAddressInput?: boolean;
  className?: string;
}

export function GPSLocationSelector({
  onLocationChange,
  onAddressChange,
  disabled = false,
  showAddressInput = true,
  className = ""
}: GPSLocationSelectorProps) {
  const [coordinates, setCoordinates] = useState<LocationCoordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [manualAddress, setManualAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Check geolocation support
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setPermissionStatus('denied');
    }
  }, []);

  // Get current location using GPS
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    setError('');

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

      const { latitude, longitude, accuracy } = position.coords;
      
      const locationData: LocationCoordinates = {
        latitude,
        longitude,
        accuracy: accuracy || 0
      };

      console.log('🎯 GPS Location Captured:', {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: new Date().toISOString()
      });
      
      setCoordinates(locationData);
      if (locationData.latitude && locationData.longitude) {
        onLocationChange(locationData);
      }
      setPermissionStatus('granted');

      // Reverse geocode to get address
      await reverseGeocode(latitude, longitude);

    } catch (err: any) {
      console.error('Error getting location:', err);
      setPermissionStatus('denied');
      
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setError('Location access denied. Please enable location permissions and try again.');
          break;
        case err.POSITION_UNAVAILABLE:
          setError('Location information is unavailable. Please try again.');
          break;
        case err.TIMEOUT:
          setError('Location request timed out. Please try again.');
          break;
        default:
          setError('An error occurred while retrieving location. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [onLocationChange]);

  // Reverse geocode coordinates to get address
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      setIsGeocoding(true);
      
      // Try multiple geocoding APIs for better pincode capture
      let data;
      let response;
      
      // Option 1: Try Google Maps API first (if available)
      // Using Google Maps API key from environment for better pincode extraction
      const GOOGLE_API_KEY = API_CONFIG.GOOGLE_MAPS_API_KEY;
      if (GOOGLE_API_KEY) {
        try {
          console.log('🌍 Using Google Maps API for reverse geocoding');
          const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}&language=en&region=in`;
          response = await fetch(googleUrl);
          
          if (response.ok) {
            data = await response.json();
            
            if (data.status === 'OK' && data.results && data.results.length > 0) {
              const result = data.results[0];
              const addressComponents = result.address_components;
              
              console.log('🌍 Google Maps API Response:', {
                status: data.status,
                formatted_address: result.formatted_address,
                address_components: addressComponents
              });
              
              // Parse Google's address components for better pincode extraction
              const locationData = {
                city: '',
                state: '',
                area: '',
                pincode: '',
                fullAddress: result.formatted_address,
                country: 'India',
                latitude: latitude,
                longitude: longitude
              };
              
              // Extract address components from Google API
              addressComponents.forEach((component: any) => {
                const types = component.types;
                if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                  locationData.city = component.long_name;
                } else if (types.includes('administrative_area_level_1')) {
                  locationData.state = component.long_name;
                } else if (types.includes('sublocality') || types.includes('neighborhood')) {
                  locationData.area = component.long_name;
                } else if (types.includes('postal_code')) {
                  locationData.pincode = component.long_name;
                  console.log('📮 Pincode found in Google API:', component.long_name);
                }
              });
              
              // Use Google API data if we got good results
              if (locationData.city && locationData.state) {
                const address = locationData.fullAddress;
                const city = locationData.city;
                const state = locationData.state;
                const pincode = locationData.pincode;
                
                const updatedLocation: LocationCoordinates = {
                  latitude: latitude,
                  longitude: longitude,
                  accuracy: coordinates?.accuracy || 0,
                  address,
                  city,
                  state,
                  pincode
                };
                
                console.log('🏠 Google Geocoding Result:', {
                  address: address,
                  city: city,
                  state: state,
                  pincode: pincode,
                  fullLocation: updatedLocation
                });
                
                setCoordinates(updatedLocation);
                if (updatedLocation.latitude && updatedLocation.longitude) {
                  onLocationChange(updatedLocation);
                }
                
                if (onAddressChange) {
                  onAddressChange(address);
                }
                
                setIsGeocoding(false);
                return;
              }
            }
          }
        } catch (error) {
          console.log('Google API failed, trying fallback:', error);
        }
      }
      
      // Option 2: Fallback to OpenStreetMap Nominatim API
      console.log('🌍 Using OpenStreetMap Nominatim API for reverse geocoding');
      response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'LocalVendorHub/1.0'
          }
        }
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      data = await response.json();
      
      console.log('🌍 OpenStreetMap API Response:', {
        display_name: data.display_name,
        address: data.address,
        full_response: data
      });
      
      if (data && data.display_name) {
        const address = data.display_name;
        const addressParts = address.split(', ');
        
        // Extract city, state, pincode from address
        const city = data.address?.city || data.address?.town || data.address?.village || data.address?.hamlet || data.address?.suburb || '';
        const state = data.address?.state || '';
        let pincode = data.address?.postcode || '';
        
        console.log('🔍 Initial pincode extraction:', {
          postcode: data.address?.postcode,
          pincode: pincode,
          address_object: data.address
        });
        
        // Enhanced pincode extraction - try multiple fields
        if (!pincode) {
          pincode = data.address?.postal_code || data.address?.postalcode || data.address?.zip || '';
          if (pincode) {
            console.log('📮 Pincode found in alternative fields:', pincode);
          }
        }
        
        // If pincode is still empty, try to extract from display_name
        if (!pincode && data.display_name) {
          const parts = data.display_name.split(', ');
          // Look for pincode pattern (6 digits)
          for (const part of parts) {
            const trimmedPart = part.trim();
            // Check if it's a 6-digit number (Indian pincode format)
            if (/^\d{6}$/.test(trimmedPart)) {
              pincode = trimmedPart;
              break;
            }
          }
        }
        
        // Enhanced pincode extraction from display_name
        if (!pincode && data.display_name) {
          const displayName = data.display_name;
          console.log('🔍 Searching for pincode in display_name:', displayName);
          
          // Look for 6-digit pincode pattern in display name
          const pincodeMatch = displayName.match(/\b\d{6}\b/);
          if (pincodeMatch) {
            pincode = pincodeMatch[0];
            console.log('📮 Pincode extracted from display_name:', pincode);
          } else {
            console.log('⚠️ No 6-digit pincode found in display_name');
          }
        }
        
        // Note: Removed external pincode API due to CORS restrictions
        // The pincode should be extracted from OpenStreetMap response above
        
        // If city is still empty, try to extract from display_name
        let extractedCity = city;
        if (!extractedCity && data.display_name) {
          const parts = data.display_name.split(', ');
          // Look for city-like parts (usually the second or third part)
          for (let i = 1; i < Math.min(parts.length, 4); i++) {
            const part = parts[i].trim();
            if (part && !part.includes('India') && !part.includes('State') && !part.includes('District') && !/^\d{6}$/.test(part)) {
              extractedCity = part;
              break;
            }
          }
        }
        
        const updatedLocation: LocationCoordinates = {
          latitude: latitude,
          longitude: longitude,
          accuracy: coordinates?.accuracy || 0,
          address,
          city: extractedCity,
          state,
          pincode
        };
        
        // Log the final result with pincode status
        if (pincode) {
          console.log('📮 Pincode successfully captured:', pincode);
        } else {
          console.log('⚠️ Pincode not found in geocoding response');
        }
        
        console.log('🏠 Reverse Geocoding Result:', {
          address: address,
          city: extractedCity,
          state: state,
          pincode: pincode,
          fullLocation: updatedLocation
        });
        
        setCoordinates(updatedLocation);
        if (updatedLocation.latitude && updatedLocation.longitude) {
          onLocationChange(updatedLocation);
        }
        
        if (onAddressChange) {
          onAddressChange(address);
        }
      }
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      // Don't show error to user as coordinates are still valid
    } finally {
      setIsGeocoding(false);
    }
  };

  // Manual address geocoding
  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return;
    
    setIsGeocoding(true);
    setError('');
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        
        const locationData: LocationCoordinates = {
          latitude,
          longitude,
          accuracy: 0, // Unknown accuracy for geocoded addresses
          address: result.display_name,
          city: result.address?.city || result.address?.town || result.address?.village || '',
          state: result.address?.state || '',
          pincode: result.address?.postcode || ''
        };
        
        setCoordinates(locationData);
        if (locationData.latitude && locationData.longitude) {
          onLocationChange(locationData);
        }
        
        if (onAddressChange) {
          onAddressChange(result.display_name);
        }
      } else {
        setError('Address not found. Please try a different address.');
      }
    } catch (err) {
      console.error('Geocoding failed:', err);
      setError('Failed to find location for this address. Please try again.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleManualAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualAddress.trim()) {
      geocodeAddress(manualAddress.trim());
    }
  };

  const getStatusIcon = () => {
    if (isLoading || isGeocoding) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (coordinates) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (error) return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <MapPin className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Getting your location...';
    if (isGeocoding) return 'Finding address...';
    if (coordinates) return 'Location captured successfully';
    if (error) return 'Location error';
    return 'Get your current location';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            GPS Location
          </CardTitle>
          <CardDescription>
            Get your precise location using GPS for better seller discovery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GPS Location Button */}
          <div className="space-y-2">
            <Button
              onClick={getCurrentLocation}
              disabled={disabled || isLoading || isGeocoding}
              className="w-full"
              variant={coordinates ? "outline" : "default"}
            >
              {getStatusIcon()}
              <span className="ml-2">{getStatusText()}</span>
            </Button>
            
            {coordinates && (
              <Button
                onClick={getCurrentLocation}
                disabled={disabled || isLoading || isGeocoding}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Location
              </Button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Location Details */}
          {coordinates && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Location Captured</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  {coordinates.latitude && coordinates.longitude && (
                    <div><strong>Coordinates:</strong> {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}</div>
                  )}
                  {coordinates.accuracy && coordinates.accuracy > 0 && (
                    <div><strong>Accuracy:</strong> ±{Math.round(coordinates.accuracy)}m</div>
                  )}
                  {coordinates.address && (
                    <div><strong>Address:</strong> {coordinates.address}</div>
                  )}
                  {coordinates.city && (
                    <div><strong>City:</strong> {coordinates.city}</div>
                  )}
                  {coordinates.state && (
                    <div><strong>State:</strong> {coordinates.state}</div>
                  )}
                  {coordinates.pincode && (
                    <div><strong>Pincode:</strong> {coordinates.pincode}</div>
                  )}
                </div>
                
                {/* Pincode Input if not captured */}
                {!coordinates.pincode && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <Label htmlFor="pincode-input" className="text-sm font-medium text-green-800">
                      Pincode not detected. Please enter manually:
                    </Label>
                    <Input
                      id="pincode-input"
                      type="text"
                      placeholder="Enter 6-digit pincode"
                      maxLength={6}
                      className="mt-1"
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                        if (value.length <= 6) {
                          const updatedLocation = {
                            ...coordinates,
                            pincode: value
                          };
                          setCoordinates(updatedLocation);
                          if (updatedLocation.latitude && updatedLocation.longitude) {
                            onLocationChange(updatedLocation);
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manual Address Input */}
          {showAddressInput && (
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Or enter address manually</Label>
              <form onSubmit={handleManualAddressSubmit} className="flex gap-2 mt-2">
                <Input
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="Enter your address..."
                  disabled={disabled || isGeocoding}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={disabled || isGeocoding || !manualAddress.trim()}
                  size="sm"
                >
                  {isGeocoding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Find'
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Permission Status */}
          {permissionStatus === 'denied' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Location access is denied. Please enable location permissions in your browser settings to use GPS location.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
