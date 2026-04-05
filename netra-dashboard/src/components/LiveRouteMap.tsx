import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firestore/firebaseClient';

// Fix typical Leaflet icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

type Props = {
  route: any; // RouteData
  onClose: () => void;
};

const LiveRouteMap: React.FC<Props> = ({ route, onClose }) => {
  const [positions, setPositions] = useState<[number, number][]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightIndices, setLightIndices] = useState<number[]>([]);

  useEffect(() => {
    if (route.optimizedPath && Array.isArray(route.optimizedPath)) {
      const coords = route.optimizedPath.map((p: any) => [
         p.latitude || p.lat, 
         p.longitude || p.lng
      ] as [number, number]);
      setPositions(coords);
      
      // Calculate indices for traffic lights to know when we pass them
      if (route.trafficLightsCoordinates) {
         const indices = route. यातायात || route.trafficLightsCoordinates.map((light: any) => {
            const lLat = light.latitude || light.lat;
            const lLng = light.longitude || light.lng;
            // Find closest index in path
            let minDist = Infinity;
            let closestIdx = 0;
            coords.forEach((c: [number, number], idx: number) => {
               const dist = Math.pow(c[0] - lLat, 2) + Math.pow(c[1] - lLng, 2);
               if (dist < minDist) {
                 minDist = dist;
                 closestIdx = idx;
               }
            });
            return closestIdx;
         });
         setLightIndices(indices);
      }
    }
  }, [route]);

  // GPS ENGINE - Simulate movement
  useEffect(() => {
    if (positions.length === 0) return;
    
    const interval = setInterval(async () => {
      setActiveIndex(prev => {
         const next = prev + 1;
         if (next >= positions.length - 1) {
             clearInterval(interval);
             // Auto-terminate when reaching destination
             deleteDoc(doc(db, "emergencyRoutes", route.id)).catch(e => console.error(e));
             onClose();
             return positions.length - 1;
         }
         return next;
      });
    }, 400); // adjust speed of simulation here
    
    return () => clearInterval(interval);
  }, [positions, route.id, onClose]);

  if (!route) return null;

  const accidentPos: [number, number] = [
    route.accidentLocation?.latitude,
    route.accidentLocation?.longitude
  ];

  // Start position dynamically advances!
  const ambulancePos: [number, number] = positions.length > 0 ? positions[activeIndex] : [0,0];

  const isVip = route.type === 'vip';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`bg-gray-800 rounded-xl overflow-hidden shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col border ${isVip ? 'border-yellow-600' : 'border-gray-600'}`}>
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-700">
          <div>
             <h2 className={`text-xl font-bold flex items-center ${isVip ? 'text-yellow-500' : 'text-white'}`}>
               <i className={`fas ${isVip ? 'fa-shield-halved text-yellow-400' : 'fa-satellite-dish text-blue-400'} mr-2 animate-pulse`} />
               Live Tracking: {isVip ? 'VIP Convoy' : 'Unit'} {route.ambulanceId}
             </h2>
             <p className="text-gray-400 text-sm mt-1">
               <span className={`font-bold mr-2 ${route.severity === 'CRITICAL' ? 'text-red-500' : 'text-yellow-400'}`}>
                 [{route.severity}]
               </span>
               Target: {route.address || 'Unknown Location'}
             </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-gray-700 hover:bg-red-600 rounded-full w-10 h-10 flex items-center justify-center transition-all"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-grow w-full relative bg-gray-900">
          {positions.length > 0 ? (
            <MapContainer 
               center={accidentPos} 
               zoom={15} 
               style={{ height: '100%', width: '100%' }}
               zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              />
              
              {/* Only show the remaining path ahead of the vehicle */}
              <Polyline 
                positions={positions.slice(activeIndex)} 
                pathOptions={{ color: isVip ? '#eab308' : '#3b82f6', weight: 5, opacity: 0.8 }} 
              />

              <Marker position={accidentPos}>
                 <Tooltip permanent direction="top" className={`bg-gray-800 font-bold border ${isVip ? 'text-yellow-500 border-yellow-500' : 'text-red-400 border-red-500'}`}>
                    {isVip ? 'Secure Destination' : 'Accident Site'}
                 </Tooltip>
              </Marker>

              <Marker position={ambulancePos}>
                 <Tooltip permanent direction="bottom" className={`${isVip ? 'bg-yellow-900 text-yellow-100 border-yellow-500' : 'bg-blue-900 text-blue-100 border-blue-500'} font-bold border`}>
                    {isVip ? `VIP Convoy Tracker` : `Unit ${route.ambulanceId} En Route`}
                 </Tooltip>
              </Marker>

              {/* Traffic Light Overlays - Only render if they are AHEAD of our activeIndex */}
              {route.trafficLightsCoordinates && Array.isArray(route.trafficLightsCoordinates) && 
                route.trafficLightsCoordinates.map((docPoint: any, index: number) => {
                  const targetIndex = lightIndices[index] || 0;
                  
                  // If convoy passed it, the traffic signal is "back to normal" and disappears!
                  if (targetIndex <= activeIndex) return null;

                  const lat = docPoint.latitude || docPoint.lat || 0;
                  const lng = docPoint.longitude || docPoint.lng || 0;
                  
                  const isHeavyTraffic = (index % 3 === 0); 

                  return (
                    <CircleMarker 
                      key={index}
                      center={[lat, lng]} 
                      radius={isHeavyTraffic ? 12 : 7}
                      pathOptions={{
                         color: isHeavyTraffic ? '#ef4444' : '#22c55e',
                         fillColor: isHeavyTraffic ? '#ef4444' : '#22c55e',
                         fillOpacity: 0.6,
                         weight: 2
                      }}
                    >
                      <Tooltip permanent direction="right" className="bg-transparent border-0 shadow-none text-xs text-white">
                         {isHeavyTraffic ? 'Heavy Flow' : ''}
                      </Tooltip>
                    </CircleMarker>
                  );
                })
              }
              
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
               <i className="fas fa-spinner fa-spin mr-2"></i> Loading satellite routing...
            </div>
          )}
        </div>
        
        {/* Footer info */}
        <div className="p-3 bg-gray-900 border-t border-gray-700 flex justify-between text-xs text-gray-400">
           <span>Assigned at: {route.startTime?.toDate().toLocaleString()}</span>
           <span>GPS engine tracking engaged. Signal override active until destination.</span>
        </div>
      </div>
    </div>
  );
};

export default LiveRouteMap;
