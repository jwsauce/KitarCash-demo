import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { PickupRequest } from "../types";

// Haversine formula — calculates distance between 2 coordinates in km
const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const savePickupRequest = async (request: PickupRequest): Promise<string> => {
  const docRef = await addDoc(collection(db, "pickupRequests"), request);
  return docRef.id;
};

export const fetchPickupRequests = async (): Promise<PickupRequest[]> => {
  const snapshot = await getDocs(collection(db, "pickupRequests"));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PickupRequest[];
};

// Check how many waiting requests are within 2km of a given location
export const countNearbyRequests = async (lat: number, lng: number): Promise<number> => {
  const all = await fetchPickupRequests();
  return all.filter(
    (r) => r.status === 'waiting' && getDistanceKm(lat, lng, r.lat, r.lng) <= 2
  ).length;
};

export const runPoolingAlgorithm = async (lat: number, lng: number): Promise<string[]> => {
  const all = await fetchPickupRequests();

  // Get all waiting requests within 2km
  const nearby = all.filter(
    (r) => r.status === 'waiting' && r.id && getDistanceKm(lat, lng, r.lat, r.lng) <= 2
  );

  if (nearby.length < 5) return [];

  // Update all nearby requests to 'pooled'
  const pooledIds: string[] = [];
  await Promise.all(
    nearby.map(async (request) => {
      await updateDoc(doc(db, "pickupRequests", request.id!), {
        status: 'pooled',
        pooledAt: new Date().toISOString(),
      });
      pooledIds.push(request.id!);
    })
  );
  return pooledIds; // returns IDs of all pooled requests
};

export const setPickupTime = async (requestId: string, pickupTime: string): Promise<void> => {
  await updateDoc(doc(db, "pickupRequests", requestId), {
    pickupTime,
    status: 'assigned',
  });
};