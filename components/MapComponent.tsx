import { useEffect, useRef, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { getDistanceKm } from '../services/geoUtils';

// Global declaration for Google Maps API to satisfy TypeScript
declare const google: any;

interface RecyclingCenter {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
}

interface MapComponentProps {
  centers?: { id: string; name: string; lat: number; lng: number; address: string }[];
  height?: string;
  onDataLoaded?: (data: any[]) => void;
}


export default function MapComponent({ centers, height, onDataLoaded }: MapComponentProps) {

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [recyclingCenters, setRecyclingCenters] = useState<RecyclingCenter[]>([]);

  // 1. Use passed-in centers prop if available, otherwise fetch from Firebase
  useEffect(() => {
    if (centers && centers.length > 0) {
      setRecyclingCenters(centers as RecyclingCenter[]);
      return;
    }

    async function fetchCenters() {
      try {
        const snapshot = await getDocs(collection(db, "recyclingCenters"));

        const data = snapshot.docs.map(doc => {
          const raw = doc.data();
          return {
            id: doc.id,
            name: raw.name || "Unknown Center",
            address: raw.address || "No Address",
            lat: Number(raw.lat),
            lng: Number(raw.lng)
          } as RecyclingCenter;
        });
        setRecyclingCenters(data);
      } catch (err) {
        console.error("Firebase Permission or Fetch Error:", err);
      }
    }
    fetchCenters();
  }, [centers]);

  // 2. Initialize Map and Render Markers
  useEffect(() => {
    const initMap = (userLocation: { lat: number; lng: number }) => {
      if (!mapRef.current || !window.google) return;

      // Create Map Instance once
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: userLocation,
          zoom: 13,
          disableDefaultUI: true,
          clickableIcons: false
        });
      }
      const map = mapInstanceRef.current;

      // Calculate distances and sort for Sidebar/Parent component
      const sortedData = recyclingCenters.map(rc => ({
        ...rc,
        distance: getDistanceKm(userLocation.lat, userLocation.lng, rc.lat, rc.lng)
      })).sort((a, b) => a.distance - b.distance);

      if (onDataLoaded && sortedData.length > 0) {
        onDataLoaded(sortedData);
      }

      // Render BLUE Markers for Recycling Centers
      recyclingCenters.forEach(rc => {
        new window.google.maps.Marker({
          position: { lat: rc.lat, lng: rc.lng },
          map,
          title: rc.name,
          icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        });
      });

      // Render RED Marker for User's Current Position
      new window.google.maps.Marker({
        position: userLocation,
        map,
        title: "Your Location",
        icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
      });
    };

    // Geolocation handling
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => initMap({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => initMap({ lat: 3.1390, lng: 101.6869 }) // Fallback to KL
      );
    }
  }, [recyclingCenters]);

  return (
    <div
      ref={mapRef}
      style={{ height: height || "300px", width: "100%" }}
      className="rounded-2xl shadow-lg border-2 border-green-50"
    />
  );
}