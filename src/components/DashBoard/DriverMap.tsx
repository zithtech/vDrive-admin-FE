import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { FiNavigation } from "react-icons/fi";
const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const center = { lat: 13.0827, lng: 80.2707 };

interface DriverMapProps {
  driverLocations?: { lat: number; lng: number; id: string }[];
  availableCount: number;
  onTripCount: number;
}

const DriverMap: React.FC<DriverMapProps> = ({
  driverLocations = [],
  availableCount = 0,
  onTripCount = 0,
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.GOOGLE_MAP_API,
  });

  if (loadError) return <div>Error loading map</div>;
  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <>
      <h1 className="text-xl font-bold">Driver Locations & Active Zones</h1>
      <p className="text-gray-600 text-md py-2">
        Interactive map showing real-time driver positions and demand hotspots. Drag to explore,
        click on drivers for details.
      </p>
      <div className="relative rounded-lg shadow-md">
        <GoogleMap mapContainerStyle={mapContainerStyle} zoom={10} center={center}>
          <Marker position={center} title="Driver Location" />

          {driverLocations.map((driver) => (
            <Marker
              key={driver.id}
              position={{ lat: driver.lat, lng: driver.lng }}
              title={`Driver ${driver.id}`}
            />
          ))}
        </GoogleMap>
        <div className="absolute top-4 left-4 bg-white p-2 rounded-lg shadow-md flex items-center space-x-3">
          <div>
            <div className="flex items-center space-x-2">
              <FiNavigation className="text-blue-500 text-md" />
              <span className="font-semibold text-gray-900">Live Driver Locations</span>
            </div>
            <div className="text-gray-500 text-xs">Drag to explore • Click drivers for details</div>
          </div>
        </div>
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            🟢 {availableCount} Available
          </span>
          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
            🚗 {onTripCount} On Trip
          </span>
        </div>
      </div>
    </>
  );
};

export default DriverMap;
