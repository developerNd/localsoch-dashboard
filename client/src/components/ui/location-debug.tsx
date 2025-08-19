import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchLocations, getStates, getCitiesByState } from '@/lib/location-service';

export function LocationDebug() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const testSearch = async () => {
    if (!query.trim()) return;
    
    addDebugInfo(`Testing search for: "${query}"`);
    setLoading(true);
    
    try {
      const searchResults = await searchLocations(query);
      addDebugInfo(`Search returned ${searchResults.length} results`);
      setResults(searchResults);
    } catch (error) {
      addDebugInfo(`Search error: ${error}`);
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testStates = async () => {
    addDebugInfo('Testing getStates...');
    setLoading(true);
    
    try {
      const states = await getStates();
      addDebugInfo(`Found ${states.length} states: ${states.slice(0, 5).join(', ')}...`);
    } catch (error) {
      addDebugInfo(`States error: ${error}`);
      console.error('States error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testCities = async () => {
    addDebugInfo('Testing getCitiesByState for Maharashtra...');
    setLoading(true);
    
    try {
      const cities = await getCitiesByState('Maharashtra');
      addDebugInfo(`Found ${cities.length} cities in Maharashtra: ${cities.slice(0, 5).join(', ')}...`);
    } catch (error) {
      addDebugInfo(`Cities error: ${error}`);
      console.error('Cities error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Location Search Debug</h3>
      
      <div className="space-y-4">
        <div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search query..."
            className="mb-2"
          />
          <Button onClick={testSearch} disabled={loading || !query.trim()}>
            {loading ? 'Searching...' : 'Test Search'}
          </Button>
        </div>

        <div className="flex space-x-2">
          <Button onClick={testStates} disabled={loading} variant="outline">
            Test States API
          </Button>
          <Button onClick={testCities} disabled={loading} variant="outline">
            Test Cities API
          </Button>
        </div>

        {results.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Search Results:</h4>
            <div className="space-y-1">
              {results.map((result, index) => (
                <div key={index} className="text-sm p-2 bg-white border rounded">
                  {result.city}, {result.state} - {result.pincode}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="font-medium mb-2">Debug Log:</h4>
          <div className="bg-white border rounded p-2 max-h-40 overflow-y-auto">
            {debugInfo.map((info, index) => (
              <div key={index} className="text-xs font-mono">
                {info}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 