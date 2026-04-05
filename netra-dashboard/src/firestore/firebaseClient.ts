// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { addDoc, collection, getDocs, getFirestore, limit, orderBy, query } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBEnvJHTOFtd-jPiBaCu2nxgbLA5Ycr0cU",
  authDomain: "traffic-sim-6e506.firebaseapp.com",
  projectId: "traffic-sim-6e506",
  storageBucket: "traffic-sim-6e506.firebasestorage.app",
  messagingSenderId: "1017421602185",
  appId: "1:1017421602185:web:aeb2251728e43277135558",
  measurementId: "G-QH22HW4L1Q"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);


export const fetchLatestSession = async () => {
  try {
    const q = query(
      collection(db, 'traffic_sessions'),
      orderBy('start_time', 'desc'), // most recent first
      limit(1) // only get the top one
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() }; // return the document with its ID
    } else {
      console.warn('No sessions found in traffic_sessions.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching latest session:', error);
    return null;
  }
};

export const addDocument = async (collectionName: string, data : any) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    console.log("Document written with ID:", docRef.id);
    return docRef;
  } catch (error) {
    console.error("Error adding document:", error);
    throw error;
  }
};
