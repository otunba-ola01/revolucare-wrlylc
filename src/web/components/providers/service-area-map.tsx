import React, { useState, useEffect, useRef, useCallback } from 'react'; // react ^18.2.0
import {
  GoogleMap,
  useJsApiLoader,
  Circle,
  Marker,
  InfoWindow,
} from '@react-google-maps/api'; // @react-google-maps/api ^2.19.2
import { MapPin, Info } from 'lucide-react'; // lucide-react ^0.284.0

import { useServiceAreas } from '../../hooks/use-providers';
import { ServiceArea } from '../../types/provider';
import {
  calculateMapCenter,
  calculateZoomLevel,
  formatAddress,
} from '../../lib/utils/geo';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LoadingSpinner } from '../common/loading-spinner';
import { EmptyState } from '../common/empty-state';

interface ServiceAreaMapProps {
  providerId: string;
  serviceAreas?: ServiceArea[] | undefined;
  className?: string;
}

/**
 * Creates configuration options for the Google Map component
 * @returns {object} Google Maps options object with styling and controls configuration
 */
const getMapOptions = () => {
  // Define map style options for a clean, professional appearance
  const mapStyle = [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'transit',
      elementType: 'all',
      stylers: [{ visibility: 'off' }],
    },
  ];

  // Configure UI controls (zoom, streetView, mapType, etc.)
  const options = {
    styles: mapStyle,
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
  };

  // Set default map behavior options
  return options;
};

/**
 * Component for displaying provider service areas on a map
 * @param {object} { providerId, serviceAreas, className } - Props including provider ID, service areas, and CSS class name
 * @returns {JSX.Element} Rendered map component with service areas
 */
export const ServiceAreaMap: React.FC<ServiceAreaMapProps> = ({
  providerId,
  serviceAreas,
  className,
}) => {
  // Destructure props: providerId, serviceAreas, className
  // Set up state for selected service area and info window visibility
  const [selectedServiceArea, setSelectedServiceArea] = useState<ServiceArea | null>(null);
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);

  // Load Google Maps JavaScript API using useJsApiLoader hook
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '', // Ensure API key is available
  });

  // Fetch service areas using useServiceAreas hook if not provided in props
  const {
    serviceAreas: fetchedServiceAreas,
    isLoading,
    error,
  } = useServiceAreas(providerId);

  // Determine which service areas to use (props or fetched)
  const areas = serviceAreas || fetchedServiceAreas;

  // Calculate map center coordinates using calculateMapCenter utility
  const mapCenter = calculateMapCenter(areas);

  // Calculate appropriate zoom level using calculateZoomLevel utility
  const zoomLevel = calculateZoomLevel(areas);

  // Define map container style with responsive height
  const mapContainerStyle = {
    width: '100%',
    height: '400px', // Adjust as needed for responsiveness
  };

  // Define map options using getMapOptions function
  const mapOptions = getMapOptions();

  // Create a reference for the map instance
  const mapRef = useRef<google.maps.Map | null>(null);

  // Implement handler for clicking on a service area circle
  const onServiceAreaClick = useCallback((area: ServiceArea) => {
    setSelectedServiceArea(area);
    setInfoWindowOpen(true);
  }, []);

  // Implement handler for closing the info window
  const onCloseInfoWindow = useCallback(() => {
    setSelectedServiceArea(null);
    setInfoWindowOpen(false);
  }, []);

  // Handle loading state with LoadingSpinner component
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent>
          <LoadingSpinner text="Loading service areas..." />
        </CardContent>
      </Card>
    );
  }

  // Handle empty state with EmptyState component
  if (!isLoading && (!areas || areas.length === 0)) {
    return (
      <Card className={className}>
        <CardContent>
          <EmptyState
            title="No Service Areas"
            description="This provider has not defined any service areas yet."
          />
        </CardContent>
      </Card>
    );
  }

  // Render a Card component containing the map
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Service Areas</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={zoomLevel}
            options={mapOptions}
            onLoad={(map) => {
              mapRef.current = map;
            }}
          >
            {areas &&
              areas.map((area) => (
                <React.Fragment key={area.id}>
                  {/* For each service area, render a Circle component with radius and center */}
                  <Circle
                    center={{
                      lat: area.location.latitude,
                      lng: area.location.longitude,
                    }}
                    radius={area.radius * 1609.34} // Convert miles to meters
                    options={{
                      strokeColor: '#4F46E5',
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                      fillColor: '#4F46E5',
                      fillOpacity: 0.35,
                      clickable: true,
                    }}
                    onClick={() => onServiceAreaClick(area)}
                    ariaLabel={`Service area around ${area.location.address}`}
                  />
                  {/* For each service area, render a Marker component at the center */}
                  <Marker
                    position={{
                      lat: area.location.latitude,
                      lng: area.location.longitude,
                    }}
                    onClick={() => onServiceAreaClick(area)}
                    ariaLabel={`Marker for service area around ${area.location.address}`}
                  >
                    <MapPin size={20} aria-hidden="true" />
                  </Marker>
                  {/* Render InfoWindow component for the selected service area */}
                  {selectedServiceArea && selectedServiceArea.id === area.id && infoWindowOpen && (
                    <InfoWindow
                      position={{
                        lat: area.location.latitude,
                        lng: area.location.longitude,
                      }}
                      onCloseClick={onCloseInfoWindow}
                    >
                      <div>
                        <h3>{formatAddress(area.location)}</h3>
                        <p>Radius: {area.radius} miles</p>
                        <Info size={16} aria-hidden="true" />
                      </div>
                    </InfoWindow>
                  )}
                </React.Fragment>
              ))}
          </GoogleMap>
        ) : (
          <LoadingSpinner text="Loading Google Maps..." />
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceAreaMap;