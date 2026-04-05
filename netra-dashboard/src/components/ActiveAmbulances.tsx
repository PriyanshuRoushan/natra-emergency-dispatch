import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firestore/firebaseClient';
import LiveRouteMap from './LiveRouteMap';

type RouteData = {
  id: string;
  ambulanceId: string;
  accidentLocation: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  severity?: string;
  optimizedPath?: any;
  startTime: any;
  status: string;
  type?: string;
};

const ActiveAmbulances: React.FC = () => {
  const [activeRoutes, setActiveRoutes] = useState<RouteData[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'emergencyRoutes'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const routes: RouteData[] = [];
      snapshot.forEach((doc) => {
        routes.push({ id: doc.id, ...doc.data() } as RouteData);
      });
      
      // Filter out past history by retaining only the most deeply recent dispatch per ambulance
      const uniqueRoutes = new Map<string, RouteData>();
      routes.forEach(route => {
        const existing = uniqueRoutes.get(route.ambulanceId);
        const routeTime = route.startTime?.toDate ? route.startTime.toDate().getTime() : 0;
        const existingTime = existing?.startTime?.toDate ? existing.startTime.toDate().getTime() : 0;
        
        if (!existing || routeTime > existingTime) {
          uniqueRoutes.set(route.ambulanceId, route);
        }
      });
      
      const uniqueArray = Array.from(uniqueRoutes.values());
      uniqueArray.sort((a, b) => {
         const tA = a.startTime?.toDate ? a.startTime.toDate().getTime() : 0;
         const tB = b.startTime?.toDate ? b.startTime.toDate().getTime() : 0;
         return tB - tA;
      });
      setActiveRoutes(uniqueArray);
    }, (error) => {
      console.error("Error fetching active ambulances:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleTerminate = async (routeId: string) => {
     try {
        await deleteDoc(doc(db, "emergencyRoutes", routeId));
     } catch (e) {
        console.error("Failed to terminate route", e);
     }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg mt-5 md:col-span-2">
      <div className="p-3 border-b border-gray-700 bg-blue-900/30 rounded-t-lg">
        <h2 className="text-xl font-semibold text-blue-100 flex items-center">
           <i className="fas fa-truck-medical text-blue-400 mr-2" /> 
           Active Operations
        </h2>
      </div>
      <div className="p-4 max-h-[350px] overflow-y-auto">
        {activeRoutes.length > 0 ? (
          <ul className="space-y-3">
            {activeRoutes.map((route) => {
              const isVip = route.type === 'vip';

              return (
              <li key={route.id} className={`p-4 border rounded flex justify-between items-center transition-all ${isVip ? 'bg-gray-800 border-yellow-500 hover:bg-gray-700' : 'bg-gray-700 border-blue-600 hover:bg-gray-600'}`}>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 flex items-center">
                    <span className={`${isVip ? 'bg-yellow-600' : 'bg-blue-600'} text-white text-xs px-2 py-1 rounded inline-block mr-2 uppercase`}>
                      {isVip ? 'VIP' : 'Unit'}
                    </span>
                    {route.ambulanceId}
                    {route.severity && (
                       <span className={`ml-3 text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                         route.severity === 'CRITICAL' 
                         ? 'border-red-500 text-red-500 bg-red-500/10' 
                         : route.severity === 'PROTECTED' 
                         ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                         : 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                       }`}>
                         {route.severity}
                       </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-300">
                    <i className={`fas ${isVip ? 'fa-shield-halved text-yellow-400' : 'fa-location-crosshairs text-red-400'} mr-1`}/>
                    {isVip ? 'Target: ' : 'Target: '} {route.address || `Lat ${route.accidentLocation?.latitude?.toFixed(4)}, Lng ${route.accidentLocation?.longitude?.toFixed(4)}`}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-2">
                     <button 
                        onClick={() => handleTerminate(route.id)}
                        className={`text-white text-xs px-2 py-1 rounded transition-colors bg-red-600 hover:bg-red-500`}
                        title="Terminate Operation"
                     >
                        <i className="fas fa-times"></i>
                     </button>
                     <button 
                        onClick={() => setSelectedRoute(route)}
                        className={`text-white text-xs px-3 py-1 rounded transition-colors ${isVip ? 'bg-gray-700 hover:bg-yellow-600' : 'bg-gray-600 hover:bg-blue-600'}`}
                     >
                        <i className="fas fa-map mr-1"></i> Track Live
                     </button>
                     <span className={`text-xs font-semibold px-2 py-1 rounded-full animate-pulse border ${isVip ? 'border-yellow-400 text-yellow-400' : 'border-green-400 text-green-400'}`}>
                       {isVip ? 'IN TRANSIT' : 'EN ROUTE'}
                     </span>
                   </div>
                   {route.startTime?.toDate && (
                     <span className="text-xs text-gray-400 mt-2">
                        {route.startTime.toDate().toLocaleTimeString()}
                     </span>
                   )}
                </div>
              </li>
            )})}
          </ul>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 py-10">
            <i className="fas fa-check-circle text-4xl mb-3 opacity-50"></i>
            <p>All units at station. No active emergency dispatches.</p>
          </div>
        )}
      </div>

      {/* Render Map Overlay */}
      {selectedRoute && (
        <LiveRouteMap 
          route={selectedRoute} 
          onClose={() => setSelectedRoute(null)} 
        />
      )}
    </div>
  );
};

export default ActiveAmbulances;
