import { Typography, Button } from "antd";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "16px",
};

const center = {
  lat: 13.0827,
  lng: 80.2707, // Chennai coordinates
};

const DashboardLiveMap = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "", // Placeholder, will show development mode map
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-200 dark:border-slate-700 flex flex-col h-full w-full relative">
      <div className="flex justify-between items-center mb-3 z-10">
        <Typography.Title level={5} className="!m-0 text-gray-800 dark:text-gray-200 font-bold">
          Live Map
        </Typography.Title>
        <Button type="link" className="text-blue-500 font-semibold p-0 h-auto">
          View All
        </Button>
      </div>
      
      <div className="flex-1 w-full rounded-2xl overflow-hidden relative border border-gray-100">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={12}
            center={center}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }],
                },
              ],
            }}
          >
            {/* Mock Markers */}
            <Marker position={{ lat: 13.0827, lng: 80.2707 }} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }} />
            <Marker position={{ lat: 13.09, lng: 80.26 }} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }} />
            <Marker position={{ lat: 13.07, lng: 80.28 }} icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }} />
          </GoogleMap>
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-slate-700 animate-pulse flex items-center justify-center text-gray-400">
            Loading Map...
          </div>
        )}

        {/* Floating Stats Card */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur shadow-lg rounded-xl p-4 min-w-[120px] border border-gray-100 z-10">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <span className="text-gray-500 text-[10px] font-semibold flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Live Drivers
              </span>
              <span className="text-lg font-bold text-gray-800 leading-tight">342</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500 text-[10px] font-semibold flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Active Rides
              </span>
              <span className="text-lg font-bold text-gray-800 leading-tight">128</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLiveMap;
