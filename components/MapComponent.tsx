import { useEffect, useRef, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

interface RecycleCenter {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface MapComponentProps {
  onDataLoaded?: (data: any[]) => void;
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function MapComponent({ onDataLoaded }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [centers, setCenters] = useState<RecycleCenter[]>([]);

  useEffect(() => {
    async function fetchCenters() {
      try {
        const snapshot = await getDocs(collection(db, "recycle_centres"));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RecycleCenter[];
        setCenters(data);
      } catch (err) { console.error(err); }
    }
    fetchCenters();
  }, []);

  useEffect(() => {
    const initMap = (center: { lat: number; lng: number }) => {
      if (!mapRef.current || !window.google) return;
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, { center, zoom: 13 });
      }
      const map = mapInstanceRef.current;

      const dynamicData = centers.map(rc => ({
        ...rc,
        distance: getDistance(center.lat, center.lng, Number(rc.latitude), Number(rc.longitude))
      })).sort((a, b) => a.distance - b.distance);

      if (onDataLoaded && dynamicData.length > 0) onDataLoaded(dynamicData);

      centers.forEach(rc => {
        new window.google.maps.Marker({
          position: { lat: Number(rc.latitude), lng: Number(rc.longitude) },
          map,
          title: rc.name,
          icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
        });
      });

      new window.google.maps.Marker({ position: center, map, title: "Your Location" });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => initMap({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => initMap({ lat: 3.1390, lng: 101.6869 })
      );
    }
  }, [centers]);

  return <div ref={mapRef} style={{ height: "250px", width: "100%" }} className="rounded-xl shadow-md" />;
}