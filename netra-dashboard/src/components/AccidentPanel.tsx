import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { addDocument } from '../firestore/firebaseClient';

export type AccidentData = {
  detections: number;
  consecutive_detections: number;
  accident_state: boolean;
  latitude: number;
  longitude: number;
  address: string;
  timestamp: string;
  frame?: string;
};



type Props = {
  liveData: AccidentData | null;
};

export const LOCAL_STORAGE_KEY = 'accident_history';

const AccidentPanel: React.FC<Props> = ({ liveData }) => {
  const [accidents, setAccidents] = useState<AccidentData[]>([]);
  const [latestAccident, setLatestAccident] = useState<AccidentData | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed: AccidentData[] = JSON.parse(saved);
      setAccidents(parsed);
      if (parsed.length > 0) {
        setLatestAccident(parsed[0]);
      }
    }
  }, []);

  useEffect(() => {
    if (liveData && liveData.accident_state) {
      setAccidents((prev) => {
        const latest = prev[0];

        // Avoid pushing if it's a duplicate address
        if (latest && latest.address === liveData.address) {
          return prev;
        }

        // Auto Dispatch to Firebase
        toast.info(`🚑 Auto-Dispatching Emergency Unit for ${liveData.address}`);
        addDocument('accidents_data', liveData)
          .then(() => console.log("Auto Dispatched Accident Data"))
          .catch((e) => console.error("Auto dispatch failed:", e));

        // New accident detected, prepend to the array
        const updated = [liveData, ...prev];

        // Keep only the latest 50 records
        const limited = updated.slice(0, 50);

        // Save to localStorage
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(limited));
        } catch (e) {
          console.error('❌ Failed to save accident history to localStorage:', e);
          toast.error('Storage limit exceeded. Some data may not be saved.');
        }

        return limited;
      });

      setLatestAccident(liveData);
    }
  }, [liveData]);


  const handleDispatch = async (accident: AccidentData) => {
    toast.success(`🚑 Notifying Emergency Dispatch Unit for ${accident.address}`);
    // Future placeholder for backend/Firestore integration
    const obj = await addDocument('accidents_data', latestAccident);

    console.log("Dispatched Accident Data:", obj);

    if (obj) {
      toast.info(`🚑 Emergency Dispatch Unit Notified`);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg md:col-span-2 mt-5">
      <div className="p-3 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Accident</h2>
      </div>
      <div className="p-4 min-h-[500px] space-y-3">

        {/* Show latest accident card if available */}
        {latestAccident ? (
          <div className="p-4 bg-red-900/30 border border-red-700 rounded text-red-100">
            <p><i className="fas fa-exclamation-triangle text-yellow-500 mr-2" /> <strong>Accident Detected</strong></p>
            <p><strong>Address:</strong> {latestAccident.address}</p>
            <p><strong>Time:</strong> {new Date(latestAccident.timestamp).toLocaleTimeString()}</p>
            <p><strong>Detections:</strong> {latestAccident.detections}</p>
            <button
              onClick={() => handleDispatch(latestAccident)}
              className="mt-3 bg-red-700 hover:bg-red-800 text-white py-1 px-3 rounded"
            >
              Dispatch Emergency
            </button>
          </div>
        ) : (
          <div className="text-gray-400">✅ Everything is fine. No accident detected.</div>
        )}

        {/* History Section */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-white mb-2">History</h3>
          {accidents.length > 0 ? (
            <ul className="space-y-2 max-h-[200px] overflow-y-auto">
              {accidents.map((item, index) => (
                <li key={index} className="p-3 bg-gray-700/50 border border-gray-600 rounded text-sm">
                  <p><strong>{item.address}</strong></p>
                  <p>
                    <span className="text-yellow-400">Detections:</span> {item.detections},{" "}
                    <span className="text-yellow-400">Consecutive:</span> {item.consecutive_detections}
                  </p>
                  <p><span className="text-gray-400">Time:</span> {new Date(item.timestamp).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No past accidents recorded</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccidentPanel;
