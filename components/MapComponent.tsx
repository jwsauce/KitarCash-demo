import { useEffect, useRef } from "react";

export default function MapComponent() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initMap = (center: { lat: number; lng: number }) => {
      if (!mapRef.current) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 13,
        mapTypeId: "roadmap",
      });

      // User's location marker
      new window.google.maps.Marker({
        position: center,
        map,
        title: "You are here",
      });

      // Example recycling center markers (replace with your real data)
      const recyclingCenters = [
        { lat: 3.1569, lng: 101.7123, name: "KitarCash Center - Ampang" },
        { lat: 3.1478, lng: 101.6953, name: "KitarCash Center - KLCC" },
        { lat: 3.1073, lng: 101.6374, name: "KitarCash Center - Bangsar" },
      ];

      recyclingCenters.forEach((center) => {
        new window.google.maps.Marker({
          position: { lat: center.lat, lng: center.lng },
          map,
          title: center.name,
          icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png", // green for recycling centers
        });
      });
    };

    const loadMap = () => {
      // Try to get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            initMap({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          () => {
            // If user denies location, fall back to KL
            initMap({ lat: 3.1390, lng: 101.6869 });
          }
        );
      } else {
        // Browser doesn't support geolocation, fall back to KL
        initMap({ lat: 3.1390, lng: 101.6869 });
      }
    };

    // Handle async script loading
    if (window.google) {
      loadMap();
    } else {
      window.addEventListener("load", loadMap);
      return () => window.removeEventListener("load", loadMap);
    }
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ height: "250px", width: "100%" }}
      className="rounded-xl shadow-md"
    />
  );
}