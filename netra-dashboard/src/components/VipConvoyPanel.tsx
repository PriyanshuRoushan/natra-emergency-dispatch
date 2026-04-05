import React, { useState } from 'react';
import { db } from '../firestore/firebaseClient';
import { collection, addDoc, GeoPoint, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const PRESET_LOCATIONS = [
  { name: 'Jolly Grant Airport', lat: 30.1897, lng: 78.1802 },
  { name: 'City Secretariat', lat: 30.3245, lng: 78.0410 },
  { name: 'District Hospital', lat: 30.3165, lng: 78.0322 },
  { name: 'Safe House Alpha', lat: 30.2910, lng: 78.0050 }
];

const VipConvoyPanel: React.FC = () => {
  const [startIdx, setStartIdx] = useState<number>(0);
  const [endIdx, setEndIdx] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  const handleDeploy = async () => {
    if (startIdx === endIdx) {
      toast.error('Start and End destinations cannot be the same!');
      return;
    }

    setLoading(true);
    const startObj = PRESET_LOCATIONS[startIdx];
    const endObj = PRESET_LOCATIONS[endIdx];
    
    // Create Convoy identifier
    const convoyId = `VIP-${Math.floor(Math.random() * 900) + 100}`;
    toast.info(`Calculating secure corridor for ${convoyId}...`);

    try {
      // Call OSRM API directly to get the path
      const url = `https://router.project-osrm.org/route/v1/driving/${startObj.lng},${startObj.lat};${endObj.lng},${endObj.lat}?geometries=geojson&overview=full`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.routes || data.routes.length === 0) {
         throw new Error("No route found from routing engine");
      }

      // GeoJSON returns [lng, lat]
      const coords = data.routes[0].geometry.coordinates;
      
      const optimizedPath = coords.map((c: number[]) => new GeoPoint(c[1], c[0]));
      
      // Simulate Traffic Lights by intercepting points along the route
      const trafficLightsCoordinates: GeoPoint[] = [];
      const trafficLightsIds: string[] = [];
      
      // We take roughly every 15th coordinate to mark as a traffic light (just a visual/backend simulation)
      for(let i = 10; i < coords.length - 10; i += 15) {
          const pt = coords[i];
          trafficLightsCoordinates.push(new GeoPoint(pt[1], pt[0]));
          trafficLightsIds.push(`simulated-light-${Math.random().toString(36).substring(7)}`);
      }

      const routeData = {
        type: 'vip',
        ambulanceId: convoyId, // Hijacking the ambulanceId parameter for tracking uniformness
        accidentLocation: new GeoPoint(endObj.lat, endObj.lng), 
        address: `${startObj.name} to ${endObj.name}`,
        severity: 'PROTECTED',
        startTime: serverTimestamp(),
        status: 'active',
        trafficLights: trafficLightsIds,
        trafficLightsCoordinates,
        optimizedPath
      };

      // Write directly to emergencyRoutes to trigger backend Python traffic control hooks!
      const newRouteRef = doc(collection(db, 'emergencyRoutes'));
      await setDoc(newRouteRef, routeData);
      
      toast.success(`${convoyId} green corridor deployed successfully. Traffic signals overridden.`);
      
    } catch (err) {
      console.error(err);
      toast.error("Failed to calculate VIP Route. Ensure internet access to OSRM.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg mt-5 md:col-span-2 overflow-hidden border border-yellow-500/30">
      <div className="p-3 border-b border-gray-700 bg-gradient-to-r from-yellow-900/60 to-gray-800">
        <h2 className="text-xl font-semibold text-yellow-500 flex items-center">
           <i className="fas fa-shield-halved mr-2" /> 
           VIP Convoy & Green Corridor Control
        </h2>
      </div>
      <div className="p-4 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
           <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Departure Point</label>
           <select 
             value={startIdx} 
             onChange={(e) => setStartIdx(Number(e.target.value))}
             className="w-full bg-gray-700 text-white rounded px-3 py-2 outline-none border border-gray-600 focus:border-yellow-500 transition-colors"
           >
              {PRESET_LOCATIONS.map((loc, idx) => (
                 <option key={idx} value={idx}>{loc.name}</option>
              ))}
           </select>
        </div>
        
        <div className="flex items-center text-gray-500 px-2 pb-2">
           <i className="fas fa-arrow-right" />
        </div>

        <div className="flex-1 w-full">
           <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Secure Destination</label>
           <select 
             value={endIdx} 
             onChange={(e) => setEndIdx(Number(e.target.value))}
             className="w-full bg-gray-700 text-white rounded px-3 py-2 outline-none border border-gray-600 focus:border-yellow-500 transition-colors"
           >
              {PRESET_LOCATIONS.map((loc, idx) => (
                 <option key={idx} value={idx}>{loc.name}</option>
              ))}
           </select>
        </div>

        <button 
           onClick={handleDeploy}
           disabled={loading}
           className="w-full md:w-auto bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 text-black font-bold uppercase text-sm px-6 py-2 rounded transition-all flex items-center justify-center whitespace-nowrap h-[42px]"
        >
           {loading ? <i className="fas fa-spinner fa-spin mr-2" /> : <i className="fas fa-satellite-dish mr-2" />}
           Deploy Convoy
        </button>
      </div>
    </div>
  );
};

export default VipConvoyPanel;
